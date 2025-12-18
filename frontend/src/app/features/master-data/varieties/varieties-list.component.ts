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
import { MasterDataService, GrapeVariety } from '../master-data.service';

@Component({
  selector: 'app-varieties-list',
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
            <app-icon name="grape" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Grape Varieties</h1>
            <span class="subtitle">Manage your catalog</span>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Variety
        </button>
      </header>
      
      <app-data-table
        [columns]="columns"
        [data]="varieties()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        searchPlaceholder="Search varieties..."
        emptyIcon="grape"
        emptyTitle="No varieties yet"
        emptyMessage="Add your first grape variety to get started."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)">
        
        <!-- Inline Filters -->
        <ng-container filters>
          <app-filter-chip
            label="Color"
            [options]="colorOptions"
            [value]="selectedColor"
            (valueChange)="onColorChange($event)">
          </app-filter-chip>
          
          <app-filter-chip
            label="Status"
            [options]="statusOptions"
            [value]="selectedActive"
            (valueChange)="onStatusChange($event)">
          </app-filter-chip>
        </ng-container>
        
        <!-- Empty Action -->
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Variety
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
export class VarietiesListComponent implements OnInit {
  private masterDataService = inject(MasterDataService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  varieties = signal<GrapeVariety[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedColor: string | null = null;
  selectedActive: boolean | null = null;
  
  colorOptions: FilterOption[] = [
    { value: 'RED', label: 'Red' },
    { value: 'WHITE', label: 'White' },
    { value: 'ROSE', label: 'Rosé' },
  ];
  
  statusOptions: FilterOption[] = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];
  
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true, width: '100px' },
    { 
      key: 'color', 
      label: 'Color', 
      type: 'badge',
      width: '100px',
      badgeMap: {
        'RED': { label: 'Red', class: 'badge-danger' },
        'WHITE': { label: 'White', class: 'badge-warning' },
        'ROSE': { label: 'Rosé', class: 'badge-info' },
      }
    },
    { key: 'is_active', label: 'Active', type: 'boolean', width: '80px', align: 'center' },
    { key: 'actions', label: '', type: 'actions', width: '90px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    this.loading.set(true);
    
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      color: this.selectedColor || undefined,
      is_active: this.selectedActive ?? undefined,
    };
    
    this.masterDataService.getVarieties(params).subscribe({
      next: (response) => {
        this.varieties.set(response.results);
        this.totalItems.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
  
  onSearch(query: string): void {
    this.searchQuery = query;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onColorChange(value: string | boolean | null): void {
    this.selectedColor = value as string | null;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onStatusChange(value: string | boolean | null): void {
    this.selectedActive = value as boolean | null;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onSort(sort: Sort): void {
    this.sortField = sort.active || 'name';
    this.sortDirection = sort.direction || 'asc';
    this.loadData();
  }
  
  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }
  
  onAction(event: { action: string; row: unknown }): void {
    const variety = event.row as GrapeVariety;
    
    switch (event.action) {
      case 'edit':
        this.navigateToEdit(variety);
        break;
      case 'delete':
        this.confirmDelete(variety);
        break;
    }
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/master-data/varieties/new']);
  }
  
  navigateToEdit(variety: GrapeVariety): void {
    this.router.navigate(['/master-data/varieties', variety.id, 'edit']);
  }
  
  confirmDelete(variety: GrapeVariety): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Variety',
        message: `Delete "${variety.name}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete',
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.masterDataService.deleteVariety(variety.id).subscribe({
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
