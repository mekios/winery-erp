import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { DataTableComponent, TableColumn, TableAction } from '@shared/components/data-table/data-table.component';
import { FilterChipComponent, FilterOption } from '@shared/components/filter-chip/filter-chip.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { HarvestService, BatchList, HarvestSeasonDropdown, BATCH_STAGE_LABELS } from '../harvest.service';

@Component({
  selector: 'app-batches-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DataTableComponent,
    FilterChipComponent,
    IconComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="batch" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Batches</h1>
            <span class="subtitle">Grape intake tracking</span>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Batch
        </button>
      </header>
      
      @if (error()) {
        <app-error-state
          [title]="error()!"
          message="We couldn't load the batches. Please check your connection and try again."
          variant="network"
          (retry)="loadData()">
        </app-error-state>
      } @else if (initialLoading()) {
        <div class="skeleton-container">
          <div class="skeleton-stats">
            @for (i of [1,2,3,4]; track i) {
              <app-skeleton type="stat-card"></app-skeleton>
            }
          </div>
          <app-skeleton type="table" [rows]="8" [cols]="6"></app-skeleton>
        </div>
      } @else {
        <ng-template #filtersTemplate>
          <app-filter-chip
            label="Season"
            [options]="seasonOptions()"
            [value]="selectedSeason"
            (valueChange)="onSeasonChange($event)">
          </app-filter-chip>
          <app-filter-chip
            label="Stage"
            [options]="stageOptions"
            [value]="selectedStage"
            (valueChange)="onStageChange($event)">
          </app-filter-chip>
        </ng-template>
        
        <app-data-table
          [columns]="columns"
          [data]="batches()"
          [actions]="actions"
          [loading]="loading()"
          [totalItems]="totalItems()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [rowClickable]="true"
          [filterTemplate]="filtersTemplate"
          searchPlaceholder="Search batches..."
          emptyIcon="batch"
          emptyTitle="No batches yet"
          emptyMessage="Create your first batch to start tracking."
          (search)="onSearch($event)"
          (sort)="onSort($event)"
          (page)="onPage($event)"
          (actionClick)="onAction($event)"
          (rowClick)="onRowClick($event)">
          
          <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
            <mat-icon>add</mat-icon>
            New Batch
          </button>
        </app-data-table>
      }
      
      <button class="mobile-fab" mat-fab color="primary" (click)="navigateToCreate()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./batches-list.component.scss']
})
export class BatchesListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private harvestService = inject(HarvestService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  batches = signal<BatchList[]>([]);
  seasons = signal<HarvestSeasonDropdown[]>([]);
  loading = signal(false);
  initialLoading = signal(true);
  error = signal<string | null>(null);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'intake_date';
  sortDirection: 'asc' | 'desc' = 'desc';
  selectedSeason: string | null = null;
  selectedStage: string | null = null;
  
  stageOptions: FilterOption[] = Object.entries(BATCH_STAGE_LABELS).map(([value, label]) => ({ value, label }));
  
  seasonOptions = signal<FilterOption[]>([]);
  
  columns: TableColumn[] = [
    { key: 'batch_code', label: 'Batch', sortable: true, width: '110px' },
    { key: 'season_year', label: 'Year', sortable: true, width: '70px', align: 'center' },
    { key: 'intake_date', label: 'Intake Date', type: 'date', sortable: true },
    { key: 'primary_variety_name', label: 'Primary Variety' },
    { key: 'grape_weight_kg', label: 'Weight', type: 'number', sortable: true, align: 'right', format: (v) => `${Number(v).toLocaleString()} kg` },
    { key: 'must_volume_l', label: 'Must Volume', type: 'number', align: 'right', format: (v) => `${Number(v).toLocaleString()} L` },
    { key: 'tank_code', label: 'Tank', width: '70px', align: 'center' },
    { key: 'stage', label: 'Stage', type: 'badge', badgeMap: {
      'INTAKE': { label: 'Intake', class: 'badge-info' },
      'CRUSHING': { label: 'Crushing', class: 'badge-info' },
      'FERMENTATION': { label: 'Ferment', class: 'badge-warning' },
      'POST_FERMENT': { label: 'Post-Ferm', class: 'badge-warning' },
      'AGING': { label: 'Aging', class: 'badge-secondary' },
      'BLENDING': { label: 'Blending', class: 'badge-secondary' },
      'BOTTLING': { label: 'Bottling', class: 'badge-primary' },
      'COMPLETE': { label: 'Complete', class: 'badge-success' },
    }},
    { key: 'actions', label: '', type: 'actions', width: '80px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['season']) {
        this.selectedSeason = params['season'];
      }
      this.loadData();
    });
    
    this.loadSeasons();
  }
  
  loadData(): void {
    const isInitial = this.initialLoading();
    if (!isInitial) {
      this.loading.set(true);
    }
    this.error.set(null);
    
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      harvest_season: this.selectedSeason || undefined,
      stage: this.selectedStage || undefined,
    };
    
    this.harvestService.getBatches(params).subscribe({
      next: (response) => {
        this.batches.set(response.results);
        this.totalItems.set(response.count);
        this.loading.set(false);
        this.initialLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load batches:', err);
        this.loading.set(false);
        this.initialLoading.set(false);
        
        if (isInitial) {
          // Show error state for initial load failures
          this.error.set('Failed to load batches');
        } else {
          // Show snackbar for subsequent failures (filtering, pagination)
          this.snackBar.open('Failed to load', 'Close', { duration: 3000 });
        }
      }
    });
  }
  
  loadSeasons(): void {
    this.harvestService.getSeasonsDropdown().subscribe(s => {
      this.seasons.set(s);
      this.seasonOptions.set(s.map(season => ({
        value: season.id,
        label: season.display_name
      })));
    });
  }
  
  onSearch(query: string): void {
    this.searchQuery = query;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onSeasonChange(value: string | boolean | null): void {
    this.selectedSeason = value as string | null;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onStageChange(value: string | boolean | null): void {
    this.selectedStage = value as string | null;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onSort(sort: Sort): void {
    this.sortField = sort.active || 'intake_date';
    this.sortDirection = sort.direction || 'desc';
    this.loadData();
  }
  
  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }
  
  onAction(event: { action: string; row: unknown }): void {
    const batch = event.row as BatchList;
    
    switch (event.action) {
      case 'edit':
        this.viewBatch(batch);
        break;
      case 'delete':
        this.confirmDelete(batch);
        break;
    }
  }
  
  onRowClick(row: unknown): void {
    this.viewBatch(row as BatchList);
  }
  
  viewBatch(batch: BatchList): void {
    this.router.navigate(['/harvest/batches', batch.id, 'edit']);
  }
  
  navigateToCreate(): void {
    if (this.selectedSeason) {
      this.router.navigate(['/harvest/batches/new'], { queryParams: { season: this.selectedSeason } });
    } else {
      this.router.navigate(['/harvest/batches/new']);
    }
  }
  
  confirmDelete(batch: BatchList): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Batch',
        message: `Delete "${batch.batch_code}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete',
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.harvestService.deleteBatch(batch.id).subscribe({
          next: () => {
            this.snackBar.open('Deleted', 'Close', { duration: 3000 });
            this.loadData();
          },
          error: () => {
            this.snackBar.open('Failed to delete', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
