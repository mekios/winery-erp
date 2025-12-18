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
  WineLot, 
  WineLotSummary, 
  WINE_LOT_STATUS_LABELS, 
  WineLotStatus 
} from '../production.service';

@Component({
  selector: 'app-wine-lots-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, FilterChipComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="wine" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Wine Lots</h1>
            <span class="subtitle">Production tracking</span>
          </div>
        </div>
        
        <!-- Summary Stats -->
        @if (summary()) {
          <div class="summary-pills">
            <div class="stat-pill">
              <span class="stat-value">{{ summary()!.total_lots }}</span>
              <span class="stat-label">lots</span>
            </div>
            <div class="stat-pill accent">
              <span class="stat-value">{{ formatVolume(summary()!.total_volume_l) }}</span>
              <span class="stat-label">total</span>
            </div>
          </div>
        }
        
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Wine Lot
        </button>
      </header>
      
      <app-data-table
        [columns]="columns"
        [data]="wineLots()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        searchPlaceholder="Search wine lots..."
        emptyIcon="wine"
        emptyTitle="No wine lots yet"
        emptyMessage="Create your first wine lot to start tracking production."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)">
        
        <ng-container filters>
          <app-filter-chip
            label="Status"
            [options]="statusOptions"
            [value]="selectedStatus"
            (valueChange)="onStatusChange($event)">
          </app-filter-chip>
          
          <app-filter-chip
            label="Vintage"
            [options]="vintageOptions()"
            [value]="selectedVintage"
            (valueChange)="onVintageChange($event)">
          </app-filter-chip>
        </ng-container>
        
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          New Wine Lot
        </button>
      </app-data-table>
      
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
    .stat-pill.accent { background: linear-gradient(135deg, #7c4dff, #b47cff); .stat-value, .stat-label { color: #fff; } }
    .stat-value { font-weight: 700; font-size: 14px; color: #374151; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
    
    app-data-table { flex: 1; min-height: 0; }
    
    .mobile-fab { display: none; }
    @media screen and (max-width: 768px) { .mobile-fab { display: flex !important; } }
  `]
})
export class WineLotsListComponent implements OnInit {
  private productionService = inject(ProductionService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  wineLots = signal<WineLot[]>([]);
  summary = signal<WineLotSummary | null>(null);
  loading = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'vintage';
  sortDirection: 'asc' | 'desc' = 'desc';
  selectedStatus: string | null = null;
  selectedVintage: string | null = null;
  
  statusOptions: FilterOption[] = Object.entries(WINE_LOT_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  
  vintageOptions = signal<FilterOption[]>([]);
  
  columns: TableColumn[] = [
    { key: 'lot_code', label: 'Lot Code', sortable: true, width: '120px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'vintage', label: 'Vintage', sortable: true, width: '100px', align: 'center' },
    { key: 'wine_type', label: 'Wine Type', sortable: true },
    { key: 'current_volume_l', label: 'Volume', type: 'number', sortable: true, align: 'right', format: (v) => `${Number(v).toLocaleString()} L` },
    { key: 'status', label: 'Status', type: 'badge', badgeMap: {
      'IN_PROGRESS': { label: 'In Progress', class: 'badge-info' },
      'AGING': { label: 'Aging', class: 'badge-warning' },
      'READY': { label: 'Ready', class: 'badge-success' },
      'BOTTLED': { label: 'Bottled', class: 'badge-primary' },
      'SOLD': { label: 'Sold', class: 'badge-secondary' },
    }},
    { key: 'current_tank_code', label: 'Location', sortable: false, format: (v, row) => {
      const lot = row as WineLot;
      return lot.current_tank_code || lot.current_barrel_code || '—';
    }},
    { key: 'actions', label: '', type: 'actions', width: '90px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'visibility', label: 'View', action: 'view' },
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];
  
  ngOnInit(): void { 
    this.loadData(); 
    this.loadSummary(); 
    this.buildVintageOptions();
  }
  
  formatVolume(val: number): string {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K L`;
    return `${val} L`;
  }
  
  buildVintageOptions(): void {
    const currentYear = new Date().getFullYear();
    const options: FilterOption[] = [];
    for (let y = currentYear; y >= currentYear - 10; y--) {
      options.push({ value: String(y), label: String(y) });
    }
    this.vintageOptions.set(options);
  }
  
  loadData(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      status: this.selectedStatus || undefined,
      vintage: this.selectedVintage || undefined,
    };
    this.productionService.getWineLots(params).subscribe({
      next: (r) => { this.wineLots.set(r.results); this.totalItems.set(r.count); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load', 'Close', { duration: 3000 }); this.loading.set(false); }
    });
  }
  
  loadSummary(): void {
    this.productionService.getWineLotSummary().subscribe({ next: (s) => this.summary.set(s) });
  }
  
  onSearch(q: string): void { this.searchQuery = q; this.pageIndex = 0; this.loadData(); }
  onStatusChange(v: string | boolean | null): void { this.selectedStatus = v as string | null; this.pageIndex = 0; this.loadData(); }
  onVintageChange(v: string | boolean | null): void { this.selectedVintage = v as string | null; this.pageIndex = 0; this.loadData(); }
  onSort(s: Sort): void { this.sortField = s.active || 'vintage'; this.sortDirection = s.direction || 'desc'; this.loadData(); }
  onPage(e: PageEvent): void { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.loadData(); }
  
  onAction(e: { action: string; row: unknown }): void {
    const lot = e.row as WineLot;
    if (e.action === 'view') this.navigateToDetail(lot);
    if (e.action === 'edit') this.navigateToEdit(lot);
    if (e.action === 'delete') this.confirmDelete(lot);
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/production/wine-lots/new']);
  }
  
  navigateToDetail(lot: WineLot): void {
    this.router.navigate(['/production/wine-lots', lot.id]);
  }
  
  navigateToEdit(lot: WineLot): void {
    this.router.navigate(['/production/wine-lots', lot.id, 'edit']);
  }
  
  confirmDelete(lot: WineLot): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { 
      data: { 
        title: 'Delete Wine Lot', 
        message: `Delete "${lot.lot_code} - ${lot.name}"?`, 
        confirmText: 'Delete', 
        confirmColor: 'warn', 
        icon: 'delete' 
      } 
    });
    ref.afterClosed().subscribe(c => {
      if (c) this.productionService.deleteWineLot(lot.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.loadData(); this.loadSummary(); },
        error: () => this.snackBar.open('Failed', 'Close', { duration: 3000 })
      });
    });
  }
}



