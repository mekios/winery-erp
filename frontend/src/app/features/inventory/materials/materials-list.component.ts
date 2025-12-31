import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

import { DataTableComponent, TableColumn, TableAction } from '@shared/components/data-table/data-table.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { InventoryService, Material } from '../inventory.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-materials-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatChipsModule,
    DataTableComponent,
    PageHeaderComponent,
    IconComponent,
  ],
  templateUrl: './materials-list.component.html',
  styleUrl: './materials-list.component.scss'
})
export class MaterialsListComponent implements OnInit {
  materials = signal<Material[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

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

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inventoryService.getMaterials({ is_active: true }).subscribe({
      next: (data) => {
        this.materials.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading materials:', err);
        this.error.set('Failed to load materials');
        this.loading.set(false);
      },
    });
  }

  onAction(event: { action: string; row: unknown }): void {
    const material = event.row as Material;
    if (event.action === 'edit') {
      // Navigation is handled by the data table component
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
          error: (err) => {
            console.error('Error deleting material:', err);
            this.snackBar.open('Failed to delete material', 'Close', { duration: 3000 });
          },
        });
      }
    });
  }
}

