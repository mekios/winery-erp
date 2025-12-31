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
import { MasterDataService, Grower } from '../master-data.service';

@Component({
  selector: 'app-growers-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, FilterChipComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="farmer" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Growers</h1>
            <span class="subtitle">Grape growers & suppliers</span>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Grower
        </button>
      </header>
      
      <ng-template #filtersTemplate>
        <app-filter-chip
          label="Status"
          [options]="statusOptions"
          [value]="selectedActive"
          (valueChange)="onStatusChange($event)">
        </app-filter-chip>
      </ng-template>
      
      <app-data-table
        [columns]="columns"
        [data]="growers()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [filterTemplate]="filtersTemplate"
        searchPlaceholder="Search growers..."
        emptyIcon="farmer"
        emptyTitle="No growers yet"
        emptyMessage="Add your first grape grower or supplier."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)">
        
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Grower
        </button>
      </app-data-table>
      
      <button class="mobile-fab" mat-fab color="primary" (click)="navigateToCreate()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./growers-list.component.scss']
})
export class GrowersListComponent implements OnInit {
  private masterDataService = inject(MasterDataService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  growers = signal<Grower[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedActive: boolean | null = null;
  
  statusOptions: FilterOption[] = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];
  
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'contact_name', label: 'Contact', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'vineyard_count', label: 'Vineyards', type: 'number', width: '100px', align: 'center' },
    { key: 'is_active', label: 'Active', type: 'boolean', width: '80px', align: 'center' },
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
      is_active: this.selectedActive ?? undefined,
    };
    this.masterDataService.getGrowers(params).subscribe({
      next: (r) => { this.growers.set(r.results); this.totalItems.set(r.count); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load', 'Close', { duration: 3000 }); this.loading.set(false); }
    });
  }
  
  onSearch(q: string): void { this.searchQuery = q; this.pageIndex = 0; this.loadData(); }
  onStatusChange(v: string | boolean | null): void { this.selectedActive = v as boolean | null; this.pageIndex = 0; this.loadData(); }
  onSort(s: Sort): void { this.sortField = s.active || 'name'; this.sortDirection = s.direction || 'asc'; this.loadData(); }
  onPage(e: PageEvent): void { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.loadData(); }
  
  onAction(e: { action: string; row: unknown }): void {
    const grower = e.row as Grower;
    if (e.action === 'edit') this.navigateToEdit(grower);
    if (e.action === 'delete') this.confirmDelete(grower);
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/master-data/growers/new']);
  }
  
  navigateToEdit(grower: Grower): void {
    this.router.navigate(['/master-data/growers', grower.id, 'edit']);
  }
  
  confirmDelete(grower: Grower): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete Grower', message: `Delete "${grower.name}"?`, confirmText: 'Delete', confirmColor: 'warn', icon: 'delete' } });
    ref.afterClosed().subscribe(c => {
      if (c) this.masterDataService.deleteGrower(grower.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.loadData(); },
        error: () => this.snackBar.open('Failed', 'Close', { duration: 3000 })
      });
    });
  }
}
