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
      
      <app-data-table
        [columns]="columns"
        [data]="batches()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [rowClickable]="true"
        searchPlaceholder="Search batches..."
        emptyIcon="batch"
        emptyTitle="No batches yet"
        emptyMessage="Create your first batch to start tracking."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)"
        (rowClick)="onRowClick($event)">
        
        <!-- Inline Filters -->
        <ng-container filters>
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
        </ng-container>
        
        <!-- Empty Action -->
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Batch
        </button>
      </app-data-table>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .list-page { display: flex; flex-direction: column; height: 100%; padding: 16px 20px; }
    .list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; flex-shrink: 0; }
    .header-title { display: flex; align-items: center; gap: 14px; }
    .title-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #7c4dff, #b47cff); display: flex; align-items: center; justify-content: center; color: #fff; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .subtitle { color: #6b7280; font-size: 13px; }
    app-data-table { flex: 1; min-height: 0; }
  `]
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
    { key: 'must_volume_l', label: 'Must', type: 'number', align: 'right', format: (v) => `${Number(v).toLocaleString()} L` },
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
    { icon: 'visibility', label: 'View', action: 'view' },
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
    this.loading.set(true);
    
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
      },
      error: () => {
        this.snackBar.open('Failed to load', 'Close', { duration: 3000 });
        this.loading.set(false);
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
      case 'view':
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
