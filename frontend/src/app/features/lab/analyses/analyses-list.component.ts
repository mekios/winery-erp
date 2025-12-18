import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
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
import { LabService, AnalysisList, SAMPLE_TYPE_LABELS, SampleType } from '../lab.service';

@Component({
  selector: 'app-analyses-list',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    DataTableComponent, FilterChipComponent, IconComponent
  ],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="flask-conical" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Lab Analyses</h1>
            <span class="subtitle">Wine quality tracking</span>
          </div>
        </div>
        
        <!-- Summary Stats Pills -->
        @if (summary()) {
          <div class="summary-pills">
            <div class="stat-pill">
              <span class="stat-value">{{ totalCount() }}</span>
              <span class="stat-label">total</span>
            </div>
            @if (summary()?.averages?.ph) {
              <div class="stat-pill">
                <span class="stat-value">{{ summary()?.averages?.ph | number:'1.2-2' }}</span>
                <span class="stat-label">avg pH</span>
              </div>
            }
            @if (summary()?.averages?.va_gl) {
              <div class="stat-pill" [class.warning]="(summary()?.averages?.va_gl ?? 0) > 0.6">
                <span class="stat-value">{{ summary()?.averages?.va_gl | number:'1.2-2' }}</span>
                <span class="stat-label">avg VA</span>
              </div>
            }
          </div>
        }
        
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Analysis
        </button>
      </header>
      
      <ng-template #filtersTemplate>
        <app-filter-chip
          label="Type"
          [options]="sampleTypeOptions"
          [value]="selectedSampleType"
          (valueChange)="onSampleTypeChange($event)">
        </app-filter-chip>
      </ng-template>
      
      <app-data-table
        [columns]="columns"
        [data]="analyses()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalCount()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [rowClickable]="true"
        [filterTemplate]="filtersTemplate"
        searchPlaceholder="Search analyses..."
        emptyIcon="flask-conical"
        emptyTitle="No analyses yet"
        emptyMessage="Add your first lab analysis to start tracking."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onActionClick($event)"
        (rowClick)="onRowClick($any($event))">
        
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Analysis
        </button>
      </app-data-table>
      
      <!-- Mobile FAB -->
      <button class="mobile-fab" mat-fab color="primary" (click)="navigateToCreate()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .list-page { display: flex; flex-direction: column; height: 100%; padding: 16px 20px; }
    .list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; flex-shrink: 0; flex-wrap: wrap; }
    .header-title { display: flex; align-items: center; gap: 14px; }
    .title-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #7c4dff, #b47cff); display: flex; align-items: center; justify-content: center; color: #fff; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .subtitle { color: #6b7280; font-size: 13px; }
    
    .summary-pills { display: flex; gap: 8px; margin-left: auto; margin-right: 16px; }
    .stat-pill { display: flex; align-items: center; gap: 6px; background: #f3f4f6; padding: 8px 14px; border-radius: 20px; }
    .stat-pill.warning { background: linear-gradient(135deg, #f59e0b, #fbbf24); .stat-value, .stat-label { color: #fff; } }
    .stat-value { font-weight: 700; font-size: 14px; color: #374151; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
    
    app-data-table { flex: 1; min-height: 0; }
    
    /* Mobile FAB - hidden on desktop */
    .mobile-fab { display: none; }
    @media screen and (max-width: 768px) {
      .mobile-fab { display: flex !important; }
    }
  `]
})
export class AnalysesListComponent implements OnInit {
  private router = inject(Router);
  private labService = inject(LabService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  analyses = signal<AnalysisList[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  summary = signal<any>(null);
  
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'analysis_date';
  sortDirection: 'asc' | 'desc' = 'desc';
  selectedSampleType: string | null = null;

  sampleTypeOptions: FilterOption[] = Object.entries(SAMPLE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  sampleTypeBadgeMap: Record<string, { label: string; class: string }> = {
    'TANK': { label: 'Tank', class: 'badge-info' },
    'BARREL': { label: 'Barrel', class: 'badge-warning' },
    'WINE_LOT': { label: 'Wine Lot', class: 'badge-primary' },
    'BATCH': { label: 'Batch', class: 'badge-secondary' },
    'BLEND': { label: 'Blend', class: 'badge-success' },
    'BOTTLE': { label: 'Bottle', class: 'badge-info' },
    'OTHER': { label: 'Other', class: 'badge-secondary' }
  };

  columns: TableColumn[] = [
    { key: 'analysis_date', label: 'Date', type: 'date', sortable: true, width: '110px' },
    { key: 'sample_type', label: 'Type', sortable: true, width: '90px', type: 'badge', badgeMap: this.sampleTypeBadgeMap },
    { key: 'source_display', label: 'Source', sortable: false },
    { key: 'ph', label: 'pH', sortable: true, width: '70px', align: 'right', format: (v) => v != null ? Number(v).toFixed(2) : '—' },
    { key: 'va_gl', label: 'VA', sortable: true, width: '70px', align: 'right', format: (v) => v != null ? Number(v).toFixed(2) : '—' },
    { key: 'free_so2_mgl', label: 'SO₂', sortable: true, width: '70px', align: 'right', format: (v) => v != null ? Number(v).toFixed(0) : '—' },
    { key: 'brix', label: 'Brix', sortable: true, width: '70px', align: 'right', format: (v) => v != null ? `${Number(v).toFixed(1)}°` : '—' },
    { key: 'alcohol_abv', label: 'Alc %', sortable: true, width: '70px', align: 'right', format: (v) => v != null ? `${Number(v).toFixed(1)}%` : '—' },
    { key: 'actions', label: '', type: 'actions', width: '80px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' }
  ];

  ngOnInit(): void {
    this.loadData();
    this.loadSummary();
  }

  loadData(): void {
    this.loading.set(true);
    
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      sample_type: this.selectedSampleType || undefined,
    };

    this.labService.getAnalyses(params).subscribe({
      next: (response) => {
        this.analyses.set(response.results);
        this.totalCount.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load analyses', 'Close', { duration: 3000 });
      }
    });
  }

  loadSummary(): void {
    this.labService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => console.error('Failed to load summary')
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onSort(sort: Sort): void {
    this.sortField = sort.active || 'analysis_date';
    this.sortDirection = sort.direction || 'desc';
    this.loadData();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSampleTypeChange(value: string | boolean | null): void {
    this.selectedSampleType = value as string | null;
    this.pageIndex = 0;
    this.loadData();
  }

  onRowClick(row: AnalysisList): void {
    this.router.navigate(['/lab/analyses', row.id, 'edit']);
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/lab/analyses/new']);
  }

  onActionClick(event: { action: string; row: unknown }): void {
    const row = event.row as AnalysisList;
    if (event.action === 'edit') {
      this.router.navigate(['/lab/analyses', row.id, 'edit']);
    } else if (event.action === 'delete') {
      this.confirmDelete(row);
    }
  }
  
  confirmDelete(analysis: AnalysisList): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Analysis',
        message: `Delete analysis from ${this.formatDate(analysis.analysis_date)}?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete',
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.labService.deleteAnalysis(analysis.id).subscribe({
          next: () => {
            this.snackBar.open('Deleted', 'Close', { duration: 3000 });
            this.loadData();
            this.loadSummary();
          },
          error: () => {
            this.snackBar.open('Failed to delete', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  getSampleTypeLabel(type: SampleType): string {
    return SAMPLE_TYPE_LABELS[type] || type;
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

