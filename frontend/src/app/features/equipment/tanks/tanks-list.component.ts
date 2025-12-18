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
import { EquipmentService, Tank, TankSummary, TANK_TYPE_LABELS } from '../equipment.service';

@Component({
  selector: 'app-tanks-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, FilterChipComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="tank" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Tanks</h1>
            <span class="subtitle">Fermentation & storage</span>
          </div>
        </div>
        
        <!-- Summary Stats -->
        @if (summary()) {
          <div class="summary-pills">
            <div class="stat-pill">
              <span class="stat-value">{{ summary()!.total_tanks }}</span>
              <span class="stat-label">tanks</span>
            </div>
            <div class="stat-pill">
              <span class="stat-value">{{ formatK(summary()!.total_capacity_l) }}</span>
              <span class="stat-label">capacity</span>
            </div>
            <div class="stat-pill accent">
              <span class="stat-value">{{ summary()!.utilization_percentage }}%</span>
              <span class="stat-label">used</span>
            </div>
          </div>
        }
        
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Tank
        </button>
      </header>
      
      <app-data-table
        [columns]="columns"
        [data]="tanks()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        searchPlaceholder="Search tanks..."
        emptyIcon="tank"
        emptyTitle="No tanks yet"
        emptyMessage="Add your first tank to get started."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)">
        
        <ng-container filters>
          <app-filter-chip
            label="Type"
            [options]="typeOptions"
            [value]="selectedType"
            (valueChange)="onTypeChange($event)">
          </app-filter-chip>
          
          <app-filter-chip
            label="Status"
            [options]="statusOptions"
            [value]="selectedStatus"
            (valueChange)="onStatusChange($event)">
          </app-filter-chip>
        </ng-container>
        
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Tank
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
    .stat-pill.accent { background: linear-gradient(135deg, #10b981, #34d399); .stat-value, .stat-label { color: #fff; } }
    .stat-value { font-weight: 700; font-size: 14px; color: #374151; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
    
    app-data-table { flex: 1; min-height: 0; }
    
    .mobile-fab { display: none; }
    @media screen and (max-width: 768px) { .mobile-fab { display: flex !important; } }
  `]
})
export class TanksListComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  tanks = signal<Tank[]>([]);
  summary = signal<TankSummary | null>(null);
  loading = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'code';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedType: string | null = null;
  selectedStatus: string | null = null;
  
  typeOptions: FilterOption[] = Object.entries(TANK_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  statusOptions: FilterOption[] = [
    { value: 'EMPTY', label: 'Empty' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'CLEANING', label: 'Cleaning' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ];
  
  columns: TableColumn[] = [
    { key: 'code', label: 'Code', sortable: true, width: '90px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'tank_type', label: 'Type', sortable: true, format: (v) => TANK_TYPE_LABELS[v as keyof typeof TANK_TYPE_LABELS] || String(v) },
    { key: 'capacity_l', label: 'Capacity', type: 'number', sortable: true, align: 'right', format: (v) => `${Number(v).toLocaleString()} L` },
    { key: 'fill_percentage', label: 'Fill', sortable: true, align: 'center', format: (v) => `${String(v)}%` },
    { key: 'status', label: 'Status', type: 'badge', badgeMap: {
      'EMPTY': { label: 'Empty', class: 'badge-secondary' },
      'IN_USE': { label: 'In Use', class: 'badge-success' },
      'CLEANING': { label: 'Cleaning', class: 'badge-info' },
      'MAINTENANCE': { label: 'Maint.', class: 'badge-warning' },
      'OUT_OF_SERVICE': { label: 'Out', class: 'badge-danger' },
    }},
    { key: 'location', label: 'Location', sortable: true },
    { key: 'actions', label: '', type: 'actions', width: '90px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];
  
  ngOnInit(): void { this.loadData(); this.loadSummary(); }
  
  formatK(val: number): string {
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
      tank_type: this.selectedType || undefined,
      status: this.selectedStatus || undefined,
    };
    this.equipmentService.getTanks(params).subscribe({
      next: (r) => { this.tanks.set(r.results); this.totalItems.set(r.count); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load', 'Close', { duration: 3000 }); this.loading.set(false); }
    });
  }
  
  loadSummary(): void {
    this.equipmentService.getTanksSummary().subscribe({ next: (s) => this.summary.set(s) });
  }
  
  onSearch(q: string): void { this.searchQuery = q; this.pageIndex = 0; this.loadData(); }
  onTypeChange(v: string | boolean | null): void { this.selectedType = v as string | null; this.pageIndex = 0; this.loadData(); }
  onStatusChange(v: string | boolean | null): void { this.selectedStatus = v as string | null; this.pageIndex = 0; this.loadData(); }
  onSort(s: Sort): void { this.sortField = s.active || 'code'; this.sortDirection = s.direction || 'asc'; this.loadData(); }
  onPage(e: PageEvent): void { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.loadData(); }
  
  onAction(e: { action: string; row: unknown }): void {
    const tank = e.row as Tank;
    if (e.action === 'edit') this.navigateToEdit(tank);
    if (e.action === 'delete') this.confirmDelete(tank);
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/equipment/tanks/new']);
  }
  
  navigateToEdit(tank: Tank): void {
    this.router.navigate(['/equipment/tanks', tank.id, 'edit']);
  }
  
  confirmDelete(tank: Tank): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete Tank', message: `Delete "${tank.code}"?`, confirmText: 'Delete', confirmColor: 'warn', icon: 'delete' } });
    ref.afterClosed().subscribe(c => {
      if (c) this.equipmentService.deleteTank(tank.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.loadData(); this.loadSummary(); },
        error: () => this.snackBar.open('Failed', 'Close', { duration: 3000 })
      });
    });
  }
}
