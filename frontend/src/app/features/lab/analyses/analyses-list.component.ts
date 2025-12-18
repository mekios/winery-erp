import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PageEvent } from '@angular/material/paginator';
import { DataTableComponent, TableColumn, TableAction } from '@shared/components/data-table/data-table.component';
import { FilterChipComponent } from '@shared/components/filter-chip/filter-chip.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { LabService, AnalysisList, SAMPLE_TYPE_LABELS, SampleType } from '../lab.service';

@Component({
  selector: 'app-analyses-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, DecimalPipe, DatePipe,
    MatButtonModule, MatMenuModule, MatIconModule, MatDialogModule, MatSnackBarModule,
    DataTableComponent, FilterChipComponent, ConfirmDialogComponent, IconComponent
  ],
  template: `
    <div class="list-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <app-icon name="flask-conical" [size]="32"></app-icon>
          </div>
          <div class="header-text">
            <h1>Lab Analyses</h1>
            <p>Track wine quality parameters and fermentation progress</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-flat-button class="primary-btn" routerLink="new">
            <mat-icon>add</mat-icon>
            New Analysis
          </button>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ totalCount() }}</span>
          <span class="stat-label">Total</span>
        </div>
        @if (summary()?.averages?.ph) {
          <div class="stat-item">
            <span class="stat-value">{{ summary()?.averages?.ph | number:'1.2-2' }}</span>
            <span class="stat-label">Avg pH</span>
          </div>
        }
        @if (summary()?.averages?.va_gl) {
          <div class="stat-item" [class.warning]="(summary()?.averages?.va_gl ?? 0) > 0.6">
            <span class="stat-value">{{ summary()?.averages?.va_gl | number:'1.2-2' }}</span>
            <span class="stat-label">Avg VA</span>
          </div>
        }
        @if (summary()?.averages?.free_so2_mgl) {
          <div class="stat-item">
            <span class="stat-value">{{ summary()?.averages?.free_so2_mgl | number:'1.0-1' }}</span>
            <span class="stat-label">Avg Free SO₂</span>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <app-filter-chip
          label="All Types"
          [options]="sampleTypeOptions"
          [value]="selectedSampleType()"
          (valueChange)="onSampleTypeChange($any($event))">
        </app-filter-chip>
      </div>

      <!-- Data Table -->
      <app-data-table
        [columns]="columns"
        [data]="analyses()"
        [loading]="loading()"
        [totalItems]="totalCount()"
        [pageSize]="pageSize"
        [pageIndex]="currentPage() - 1"
        [rowClickable]="true"
        [actions]="actions"
        emptyIcon="flask-conical"
        emptyTitle="No analyses found"
        emptyMessage="Start tracking wine quality by adding your first analysis"
        (page)="onPageEvent($event)"
        (rowClick)="onRowClick($any($event))"
        (actionClick)="onActionClick($event)">
      </app-data-table>
    </div>
  `,
  styles: [`
    .list-page {
      padding: 1.5rem 2rem;
      min-height: 100%;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1));
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .header-text h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-text p {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    .primary-btn {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      font-weight: 600;
      padding: 0 1.5rem;
      height: 44px;
      border-radius: 12px;
    }

    .stats-bar {
      display: flex;
      gap: 2rem;
      margin-bottom: 1.5rem;
      padding: 1rem 1.5rem;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      
      &.warning .stat-value {
        color: var(--warning);
      }
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .filters-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .type-badge {
      display: inline-flex;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      
      &.tank { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.barrel { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.wine_lot { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
      &.batch { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
      &.blend { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.bottle { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
      &.other { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
    }

    .date-cell {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .param-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      
      &.warning { color: var(--warning); }
      &.danger { color: var(--danger); }
      &.good { color: var(--success); }
      
      &.molecular {
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        background: var(--gray-100);
      }
    }

    .empty-value {
      color: var(--text-muted);
    }
  `]
})
export class AnalysesListComponent implements OnInit {
  private router = inject(Router);
  private labService = inject(LabService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  analyses = signal<AnalysisList[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 20;
  
  selectedSampleType = signal<string>('');
  summary = signal<any>(null);

  sampleTypeOptions = [
    { value: '', label: 'All Types' },
    ...Object.entries(SAMPLE_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  ];

  sampleTypeBadgeMap: Record<string, { label: string; class: string }> = {
    'TANK': { label: 'Tank', class: 'blue' },
    'BARREL': { label: 'Barrel', class: 'amber' },
    'WINE_LOT': { label: 'Wine Lot', class: 'purple' },
    'BATCH': { label: 'Batch', class: 'pink' },
    'BLEND': { label: 'Blend', class: 'green' },
    'BOTTLE': { label: 'Bottle', class: 'cyan' },
    'OTHER': { label: 'Other', class: 'gray' }
  };

  columns: TableColumn[] = [
    { key: 'analysis_date', label: 'Date', sortable: true, width: '110px', format: (v) => this.formatDate(v as string) },
    { key: 'sample_type', label: 'Type', sortable: true, width: '80px', type: 'badge', badgeMap: this.sampleTypeBadgeMap },
    { key: 'source_display', label: 'Source', sortable: false, width: '120px' },
    { key: 'ph', label: 'pH', sortable: true, width: '60px', format: (v) => v != null ? Number(v).toFixed(2) : '—' },
    { key: 'va_gl', label: 'VA', sortable: true, width: '60px', format: (v) => v != null ? Number(v).toFixed(2) : '—' },
    { key: 'free_so2_mgl', label: 'SO₂', sortable: true, width: '60px', format: (v) => v != null ? Number(v).toFixed(0) : '—' },
    { key: 'brix', label: 'Brix', sortable: true, width: '60px', format: (v) => v != null ? `${Number(v).toFixed(1)}°` : '—' },
    { key: 'alcohol_abv', label: 'Alc', sortable: true, width: '60px', format: (v) => v != null ? `${Number(v).toFixed(1)}%` : '—' },
    { key: 'actions', label: '', sortable: false, width: '90px', type: 'actions' },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' }
  ];

  ngOnInit(): void {
    this.loadAnalyses();
    this.loadSummary();
  }

  loadAnalyses(): void {
    this.loading.set(true);
    
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      page_size: this.pageSize,
    };
    
    if (this.selectedSampleType()) {
      params['sample_type'] = this.selectedSampleType();
    }

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

  onPageEvent(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.loadAnalyses();
  }

  onSampleTypeChange(type: string): void {
    this.selectedSampleType.set(type);
    this.currentPage.set(1);
    this.loadAnalyses();
  }

  onRowClick(row: AnalysisList): void {
    this.router.navigate(['/lab/analyses', row.id]);
  }

  onDelete(analysis: AnalysisList): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Analysis',
        message: `Are you sure you want to delete this analysis from ${analysis.analysis_date}?`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.labService.deleteAnalysis(analysis.id).subscribe({
          next: () => {
            this.snackBar.open('Analysis deleted', 'Close', { duration: 3000 });
            this.loadAnalyses();
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
  
  
  onActionClick(event: { action: string; row: unknown }): void {
    const row = event.row as AnalysisList;
    if (event.action === 'edit') {
      this.router.navigate(['/lab/analyses', row.id, 'edit']);
    } else if (event.action === 'delete') {
      this.onDelete(row);
    }
  }
}

