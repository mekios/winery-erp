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
import { MasterDataService, VineyardBlock, GrowerDropdown, GrapeVarietyDropdown } from '../master-data.service';

@Component({
  selector: 'app-vineyards-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, FilterChipComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="vineyard" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Vineyard Blocks</h1>
            <span class="subtitle">Parcels & their attributes</span>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Vineyard
        </button>
      </header>
      
      <ng-template #filtersTemplate>
        <app-filter-chip
          label="Grower"
          [options]="growerOptions()"
          [value]="selectedGrower"
          (valueChange)="onGrowerChange($event)">
        </app-filter-chip>
        <app-filter-chip
          label="Status"
          [options]="statusOptions"
          [value]="selectedActive"
          (valueChange)="onStatusChange($event)">
        </app-filter-chip>
      </ng-template>
      
      <app-data-table
        [columns]="columns"
        [data]="vineyards()"
        [actions]="actions"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [filterTemplate]="filtersTemplate"
        searchPlaceholder="Search vineyards..."
        emptyIcon="vineyard"
        emptyTitle="No vineyards yet"
        emptyMessage="Add your first vineyard block."
        (search)="onSearch($event)"
        (sort)="onSort($event)"
        (page)="onPage($event)"
        (actionClick)="onAction($event)">
        
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Vineyard
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
export class VineyardsListComponent implements OnInit {
  private masterDataService = inject(MasterDataService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  vineyards = signal<VineyardBlock[]>([]);
  growers = signal<GrowerDropdown[]>([]);
  varieties = signal<GrapeVarietyDropdown[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'grower__name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedGrower: string | null = null;
  selectedActive: boolean | null = null;
  
  growerOptions = signal<FilterOption[]>([]);
  statusOptions: FilterOption[] = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];
  
  columns: TableColumn[] = [
    { key: 'grower_name', label: 'Grower', sortable: true },
    { key: 'name', label: 'Block Name', sortable: true },
    { key: 'code', label: 'Code', width: '80px' },
    { key: 'region', label: 'Region', sortable: true },
    { key: 'primary_variety_name', label: 'Primary Variety' },
    { key: 'area_ha', label: 'Area (ha)', type: 'number', width: '100px', align: 'right' },
    { key: 'is_active', label: 'Active', type: 'boolean', width: '80px', align: 'center' },
    { key: 'actions', label: '', type: 'actions', width: '90px', sortable: false },
  ];
  
  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];
  
  ngOnInit(): void {
    this.loadData();
    this.loadDropdowns();
  }
  
  loadData(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      grower: this.selectedGrower || undefined,
      is_active: this.selectedActive ?? undefined,
    };
    this.masterDataService.getVineyards(params).subscribe({
      next: (r) => { this.vineyards.set(r.results); this.totalItems.set(r.count); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load', 'Close', { duration: 3000 }); this.loading.set(false); }
    });
  }
  
  loadDropdowns(): void {
    this.masterDataService.getGrowersDropdown().subscribe(g => {
      this.growers.set(g);
      this.growerOptions.set(g.map(grower => ({ value: grower.id, label: grower.name })));
    });
    this.masterDataService.getVarietiesDropdown().subscribe(v => this.varieties.set(v));
  }
  
  onSearch(q: string): void { this.searchQuery = q; this.pageIndex = 0; this.loadData(); }
  onGrowerChange(v: string | boolean | null): void { this.selectedGrower = v as string | null; this.pageIndex = 0; this.loadData(); }
  onStatusChange(v: string | boolean | null): void { this.selectedActive = v as boolean | null; this.pageIndex = 0; this.loadData(); }
  onSort(s: Sort): void { this.sortField = s.active || 'grower__name'; this.sortDirection = s.direction || 'asc'; this.loadData(); }
  onPage(e: PageEvent): void { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.loadData(); }
  
  onAction(e: { action: string; row: unknown }): void {
    const vineyard = e.row as VineyardBlock;
    if (e.action === 'edit') this.navigateToEdit(vineyard);
    if (e.action === 'delete') this.confirmDelete(vineyard);
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/master-data/vineyards/new']);
  }
  
  navigateToEdit(vineyard: VineyardBlock): void {
    this.router.navigate(['/master-data/vineyards', vineyard.id, 'edit']);
  }
  
  confirmDelete(vineyard: VineyardBlock): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { title: 'Delete Vineyard', message: `Delete "${vineyard.name}"?`, confirmText: 'Delete', confirmColor: 'warn', icon: 'delete' } });
    ref.afterClosed().subscribe(c => {
      if (c) this.masterDataService.deleteVineyard(vineyard.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.loadData(); },
        error: () => this.snackBar.open('Failed', 'Close', { duration: 3000 })
      });
    });
  }
}
