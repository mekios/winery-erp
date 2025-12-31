import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DataTableComponent, TableColumn, TableAction } from '@shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { InventoryService, Material } from '../inventory.service';

@Component({
  selector: 'app-materials-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="flask" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Materials & Supplies</h1>
            <span class="subtitle">Manage inventory of winemaking materials</span>
          </div>
        </div>
        
        <button mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Material
        </button>
      </header>
      
      <app-data-table
        [columns]="columns"
        [data]="filteredMaterials()"
        [actions]="actions"
        [loading]="loading()"
        searchPlaceholder="Search materials..."
        emptyIcon="flask"
        emptyTitle="No materials yet"
        emptyMessage="Add your first winemaking material to get started."
        (search)="onSearch($event)"
        (actionClick)="onAction($event)">
        
        <button empty-action mat-raised-button color="primary" (click)="navigateToCreate()">
          <mat-icon>add</mat-icon>
          Add Material
        </button>
      </app-data-table>
      
      <button class="mobile-fab" mat-fab color="primary" (click)="navigateToCreate()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./materials-list.component.scss']
})
export class MaterialsListComponent implements OnInit {
  router = inject(Router);
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  materials = signal<Material[]>([]);
  filteredMaterials = signal<Material[]>([]);
  loading = signal(true);
  searchTerm = '';

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code' },
    { key: 'category_display', label: 'Category', sortable: true },
    { 
      key: 'current_stock', 
      label: 'Stock', 
      sortable: true,
      format: (value: any, row: any) => {
        const stock = typeof value === 'number' ? value : 0;
        return `${stock.toFixed(2)} ${row.unit_display || ''}`;
      }
    },
    { key: 'supplier', label: 'Supplier' },
    { 
      key: 'is_low_stock', 
      label: 'Status', 
      type: 'badge',
      badgeMap: {
        'true': { label: 'Low Stock', class: 'status-low' },
        'false_zero': { label: 'Out of Stock', class: 'status-out' },
        'false': { label: 'In Stock', class: 'status-ok' }
      },
      format: (value: any, row: any) => {
        const material = row as Material;
        if (material.is_low_stock) return 'true';
        if (material.current_stock === 0) return 'false_zero';
        return 'false';
      }
    },
  ];

  actions: TableAction[] = [
    { icon: 'edit', label: 'Edit', action: 'edit' },
    { icon: 'delete', label: 'Delete', action: 'delete', color: 'warn' },
  ];

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading.set(true);

    this.inventoryService.getMaterials({ is_active: true }).subscribe({
      next: (data) => {
        this.materials.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading materials:', err);
        this.loading.set(false);
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.materials()];

    if (this.searchTerm) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(this.searchTerm) ||
        m.code?.toLowerCase().includes(this.searchTerm) ||
        m.category_display.toLowerCase().includes(this.searchTerm) ||
        m.supplier?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredMaterials.set(filtered);
  }

  navigateToCreate(): void {
    this.router.navigate(['/inventory/materials/new']);
  }

  onAction(event: { action: string; row: unknown }): void {
    const material = event.row as Material;
    if (event.action === 'edit') {
      this.router.navigate(['/inventory/materials', material.id]);
    } else if (event.action === 'delete') {
      this.deleteMaterial(material);
    }
  }

  deleteMaterial(material: Material): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Material',
        message: `Are you sure you want to delete "${material.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.inventoryService.deleteMaterial(material.id).subscribe({
          next: () => {
            this.snackBar.open('Material deleted successfully', 'Close', { duration: 3000 });
            this.loadMaterials();
          },
          error: (err: any) => {
            console.error('Error deleting material:', err);
            this.snackBar.open('Failed to delete material', 'Close', { duration: 3000 });
          },
        });
      }
    });
  }
}
