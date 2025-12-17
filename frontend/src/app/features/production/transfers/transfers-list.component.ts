import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { 
  ProductionService, 
  Transfer, 
  TransferSummary, 
  TRANSFER_ACTION_LABELS, 
  TransferActionType 
} from '../production.service';

@Component({
  selector: 'app-transfers-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, FilterChipComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="arrow-right-left" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Transfers</h1>
            <span class="subtitle">Volume movements</span>
          </div>
        </div>
        
        <!-- Summary Stats -->
        @if (summary()) {
          <div class="summary-pills">
            <div class="stat-pill">
              <span class="stat-value">{{ summary()!.total_transfers }}</span>
              <span class="stat-label">transfers</span>
            </div>
            <div class="stat-pill accent">
              <span class="stat-value">{{ formatVolume(summary()!.total_volume_l) }}</span>
              <span class="stat-label">30 days</span>
            </div>
          </div>
        }
        
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Transfer
        </button>
      </header>
      
      <app-data-table
        [columns]="columns"
        [data]="transfers()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        searchPlaceholder="Search transfers..."
        emptyIcon="arrow-right-left"
        emptyTitle="No transfers yet"
        emptyMessage="Record your first wine transfer to get started."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)">
        
        <ng-container filters>
          <app-filter-chip
            label="Action Type"
            [options]="actionTypeOptions"
            [value]="selectedActionType"
            (valueChange)="onActionTypeChange($event)">
          </app-filter-chip>
        </ng-container>
        
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Transfer
        </button>
      </app-data-table>
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
    .stat-pill.accent { background: linear-gradient(135deg, #7c4dff, #b47cff); .stat-value, .stat-label { color: #fff; } }
    .stat-value { font-weight: 700; font-size: 14px; color: #374151; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
    
    app-data-table { flex: 1; min-height: 0; }
  `]
})
export class TransfersListComponent implements OnInit {
  private productionService = inject(ProductionService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  transfers = signal<Transfer[]>([]);
  summary = signal<TransferSummary | null>(null);
  loading = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'transfer_date';
  sortDirection: 'asc' | 'desc' = 'desc';
  selectedActionType: string | null = null;
  
  actionTypeOptions: FilterOption[] = Object.entries(TRANSFER_ACTION_LABELS).map(([value, label]) => ({ value, label }));
  
  columns: TableColumn[] = [
    { key: 'transfer_date', label: 'Date', type: 'date', sortable: true, width: '120px' },
    { key: 'action_type', label: 'Action', sortable: true, format: (v) => TRANSFER_ACTION_LABELS[v as TransferActionType] || String(v) },
    { key: 'source', label: 'From', sortable: false, format: (_, row) => {
      const t = row as Transfer;
      return t.source_tank_code || t.source_barrel_code || '—';
    }},
    { key: 'destination', label: 'To', sortable: false, format: (_, row) => {
      const t = row as Transfer;
      return t.destination_tank_code || t.destination_barrel_code || '—';
    }},
    { key: 'volume_l', label: 'Volume', type: 'number', sortable: true, align: 'right', format: (v) => `${Number(v).toLocaleString()} L` },
    { key: 'batch_code', label: 'Batch', sortable: false },
    { key: 'wine_lot_code', label: 'Wine Lot', sortable: false },
    { key: 'performed_by_name', label: 'By', sortable: false },
    { key: 'actions', label: '', type: 'actions', width: '90px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];
  
  ngOnInit(): void { this.loadData(); this.loadSummary(); }
  
  formatVolume(val: number): string {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K L`;
    return `${val} L`;
  }
  
  loadData(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      action_type: this.selectedActionType || undefined,
    };
    this.productionService.getTransfers(params).subscribe({
      next: (r) => { this.transfers.set(r.results); this.totalItems.set(r.count); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load', 'Close', { duration: 3000 }); this.loading.set(false); }
    });
  }
  
  loadSummary(): void {
    this.productionService.getTransferSummary().subscribe({ next: (s) => this.summary.set(s) });
  }
  
  onSearch(q: string): void { this.searchQuery = q; this.pageIndex = 0; this.loadData(); }
  onActionTypeChange(v: string | boolean | null): void { this.selectedActionType = v as string | null; this.pageIndex = 0; this.loadData(); }
  onSort(s: Sort): void { this.sortField = s.active || 'transfer_date'; this.sortDirection = s.direction || 'desc'; this.loadData(); }
  onPage(e: PageEvent): void { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.loadData(); }
  
  onAction(e: { action: string; row: unknown }): void {
    const transfer = e.row as Transfer;
    if (e.action === 'edit') this.navigateToEdit(transfer);
    if (e.action === 'delete') this.confirmDelete(transfer);
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/production/transfers/new']);
  }
  
  navigateToEdit(transfer: Transfer): void {
    this.router.navigate(['/production/transfers', transfer.id, 'edit']);
  }
  
  confirmDelete(transfer: Transfer): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { 
      data: { 
        title: 'Delete Transfer', 
        message: `Delete transfer from ${new Date(transfer.transfer_date).toLocaleDateString()}?`, 
        confirmText: 'Delete', 
        confirmColor: 'warn', 
        icon: 'delete' 
      } 
    });
    ref.afterClosed().subscribe(c => {
      if (c) this.productionService.deleteTransfer(transfer.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.loadData(); this.loadSummary(); },
        error: () => this.snackBar.open('Failed', 'Close', { duration: 3000 })
      });
    });
  }
}

