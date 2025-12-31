import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { DataTableComponent, TableColumn, TableAction } from '@shared/components/data-table/data-table.component';
import { FilterChipComponent, FilterOption } from '@shared/components/filter-chip/filter-chip.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { InventoryService, MaterialMovement } from '../inventory.service';
import { MovementFormDialogComponent } from './movement-form-dialog.component';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatTabsModule, DataTableComponent, FilterChipComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="truck" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Stock Movements</h1>
            <span class="subtitle">Track inventory purchases, adjustments, and usage</span>
          </div>
        </div>
        
        <button mat-raised-button color="primary" (click)="openMovementDialog()">
          <mat-icon>add</mat-icon>
          Record Movement
        </button>
      </header>
      
      <mat-tab-group class="inventory-tabs" [selectedIndex]="1" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Materials">
        </mat-tab>
        <mat-tab label="Movements">
          <ng-template matTabContent>
            <ng-template #filtersTemplate>
              <app-filter-chip
                label="Type"
                [options]="typeOptions"
                [value]="selectedType"
                (valueChange)="onTypeChange($event)">
              </app-filter-chip>
            </ng-template>
            
            <app-data-table
              [columns]="columns"
              [data]="filteredMovements()"
              [loading]="loading()"
              [filterTemplate]="filtersTemplate"
              searchPlaceholder="Search movements..."
              emptyIcon="truck"
              emptyTitle="No movements yet"
              emptyMessage="Record purchases, adjustments, or transfers to track inventory."
              (search)="onSearch($event)">
              
              <button empty-action mat-raised-button color="primary" (click)="openMovementDialog()">
                <mat-icon>add</mat-icon>
                Record Movement
              </button>
            </app-data-table>
          </ng-template>
        </mat-tab>
        <mat-tab label="Additions">
        </mat-tab>
      </mat-tab-group>
      
      <button class="mobile-fab" mat-fab color="primary" (click)="openMovementDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./movements-list.component.scss']
})
export class MovementsListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  movements = signal<MaterialMovement[]>([]);
  filteredMovements = signal<MaterialMovement[]>([]);
  loading = signal(true);
  searchTerm = '';
  selectedType: string | null = null;

  typeOptions: FilterOption[] = [
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'TRANSFER', label: 'Transfer' },
    { value: 'USAGE', label: 'Usage' },
    { value: 'WASTE', label: 'Waste' },
    { value: 'RETURN', label: 'Return' },
  ];

  columns: TableColumn[] = [
    { key: 'material_name', label: 'Material', sortable: true },
    { key: 'movement_type_display', label: 'Type', sortable: true, type: 'badge', badgeMap: {
      'Purchase': { label: 'Purchase', class: 'badge-success' },
      'Adjustment': { label: 'Adjustment', class: 'badge-info' },
      'Transfer': { label: 'Transfer', class: 'badge-warning' },
      'Usage': { label: 'Usage', class: 'badge-secondary' },
      'Waste': { label: 'Waste', class: 'badge-danger' },
      'Return': { label: 'Return', class: 'badge-info' },
    }},
    { 
      key: 'quantity', 
      label: 'Quantity', 
      align: 'right',
      format: (value: any, row: any) => `${Number(value).toFixed(2)} ${row.unit_display || ''}`
    },
    { key: 'location_display', label: 'Location', sortable: true },
    { key: 'reference_number', label: 'Reference' },
    { 
      key: 'movement_date', 
      label: 'Date', 
      sortable: true,
      format: (value: any) => new Date(value).toLocaleDateString()
    },
  ];

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading.set(true);

    this.inventoryService.getMovements().subscribe({
      next: (data) => {
        this.movements.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading movements:', err);
        this.snackBar.open('Failed to load movements', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }

  onTypeChange(value: string | boolean | null): void {
    this.selectedType = typeof value === 'string' ? value : null;
    this.applyFilters();
  }

  onTabChange(event: any): void {
    const tabIndex = event.index;
    if (tabIndex === 0) {
      this.router.navigate(['/inventory/materials']);
    } else if (tabIndex === 2) {
      this.router.navigate(['/inventory/additions']);
    }
  }

  applyFilters(): void {
    let filtered = [...this.movements()];

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(m => m.movement_type === this.selectedType);
    }

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(m =>
        m.material_name.toLowerCase().includes(this.searchTerm) ||
        m.reference_number?.toLowerCase().includes(this.searchTerm) ||
        m.location_display.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredMovements.set(filtered);
  }

  openMovementDialog(): void {
    const dialogRef = this.dialog.open(MovementFormDialogComponent, {
      width: '600px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMovements();
      }
    });
  }
}
