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
import { EquipmentService, Barrel, WOOD_TYPE_LABELS } from '../equipment.service';

@Component({
  selector: 'app-barrels-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, FilterChipComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="barrel" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Barrels</h1>
            <span class="subtitle">Oak barrels for aging</span>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Barrel
        </button>
      </header>
      
      <app-data-table
        [columns]="columns"
        [data]="barrels()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        searchPlaceholder="Search barrels..."
        emptyIcon="barrel"
        emptyTitle="No barrels yet"
        emptyMessage="Add your first barrel to start tracking."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)">
        
        <ng-container filters>
          <app-filter-chip
            label="Wood"
            [options]="woodOptions"
            [value]="selectedWood"
            (valueChange)="onWoodChange($event)">
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
          Add Barrel
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
    .list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; flex-shrink: 0; }
    .header-title { display: flex; align-items: center; gap: 14px; }
    .title-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #7c4dff, #b47cff); display: flex; align-items: center; justify-content: center; color: #fff; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .subtitle { color: #6b7280; font-size: 13px; }
    app-data-table { flex: 1; min-height: 0; }
    
    .mobile-fab { display: none; }
    @media screen and (max-width: 768px) { .mobile-fab { display: flex !important; } }
  `]
})
export class BarrelsListComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  barrels = signal<Barrel[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'code';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedWood: string | null = null;
  selectedStatus: string | null = null;
  
  woodOptions: FilterOption[] = Object.entries(WOOD_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  statusOptions: FilterOption[] = [
    { value: 'EMPTY', label: 'Empty' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'CONDITIONING', label: 'Conditioning' },
    { value: 'RETIRED', label: 'Retired' },
  ];
  
  columns: TableColumn[] = [
    { key: 'code', label: 'Code', sortable: true, width: '90px' },
    { key: 'wood_type', label: 'Wood', sortable: true, format: (v) => WOOD_TYPE_LABELS[v as keyof typeof WOOD_TYPE_LABELS] || String(v) },
    { key: 'toast_level', label: 'Toast', sortable: true },
    { key: 'volume_l', label: 'Volume', type: 'number', width: '100px', align: 'right', format: (v) => `${Number(v)} L` },
    { key: 'vintage_year', label: 'Vintage', width: '90px', align: 'center' },
    { key: 'age_years', label: 'Age', width: '70px', align: 'center', format: (v) => v ? `${String(v)}y` : '—' },
    { key: 'use_count', label: 'Uses', width: '70px', align: 'center' },
    { key: 'status', label: 'Status', type: 'badge', badgeMap: {
      'EMPTY': { label: 'Empty', class: 'badge-secondary' },
      'IN_USE': { label: 'In Use', class: 'badge-success' },
      'CONDITIONING': { label: 'Cond.', class: 'badge-info' },
      'RETIRED': { label: 'Retired', class: 'badge-danger' },
    }},
    { key: 'actions', label: '', type: 'actions', width: '90px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];
  
  ngOnInit(): void { this.loadData(); }
  
  loadData(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      wood_type: this.selectedWood || undefined,
      status: this.selectedStatus || undefined,
    };
    this.equipmentService.getBarrels(params).subscribe({
      next: (r) => { this.barrels.set(r.results); this.totalItems.set(r.count); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load', 'Close', { duration: 3000 }); this.loading.set(false); }
    });
  }
  
  onSearch(q: string): void { this.searchQuery = q; this.pageIndex = 0; this.loadData(); }
  onWoodChange(v: string | boolean | null): void { this.selectedWood = v as string | null; this.pageIndex = 0; this.loadData(); }
  onStatusChange(v: string | boolean | null): void { this.selectedStatus = v as string | null; this.pageIndex = 0; this.loadData(); }
  onSort(s: Sort): void { this.sortField = s.active || 'code'; this.sortDirection = s.direction || 'asc'; this.loadData(); }
  onPage(e: PageEvent): void { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.loadData(); }
  
  onAction(e: { action: string; row: unknown }): void {
    const barrel = e.row as Barrel;
    if (e.action === 'edit') this.navigateToEdit(barrel);
    if (e.action === 'delete') this.confirmDelete(barrel);
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/equipment/barrels/new']);
  }
  
  navigateToEdit(barrel: Barrel): void {
    this.router.navigate(['/equipment/barrels', barrel.id, 'edit']);
  }
  
  confirmDelete(barrel: Barrel): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete Barrel', message: `Delete "${barrel.code}"?`, confirmText: 'Delete', confirmColor: 'warn', icon: 'delete' } });
    ref.afterClosed().subscribe(c => {
      if (c) this.equipmentService.deleteBarrel(barrel.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.loadData(); },
        error: () => this.snackBar.open('Failed', 'Close', { duration: 3000 })
      });
    });
  }
}
