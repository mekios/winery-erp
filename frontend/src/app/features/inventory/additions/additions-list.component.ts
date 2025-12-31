import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { DataTableComponent, TableColumn } from '@shared/components/data-table/data-table.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { InventoryService, Addition } from '../inventory.service';

@Component({
  selector: 'app-additions-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatTabsModule, DataTableComponent, IconComponent],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="flask" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Material Additions</h1>
            <span class="subtitle">Track materials added to tanks, barrels, and batches</span>
          </div>
        </div>
      </header>
      
      <mat-tab-group class="inventory-tabs" [selectedIndex]="2" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Materials">
        </mat-tab>
        <mat-tab label="Movements">
        </mat-tab>
        <mat-tab label="Additions">
          <ng-template matTabContent>
            <app-data-table
              [columns]="columns"
              [data]="filteredAdditions()"
              [loading]="loading()"
              searchPlaceholder="Search additions..."
              emptyIcon="flask"
              emptyTitle="No additions yet"
              emptyMessage="Material additions are created when you add SO₂, yeast, or other materials to tanks or barrels from their detail pages."
              (search)="onSearch($event)">
            </app-data-table>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./additions-list.component.scss']
})
export class AdditionsListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  additions = signal<Addition[]>([]);
  filteredAdditions = signal<Addition[]>([]);
  loading = signal(true);
  searchTerm = '';

  columns: TableColumn[] = [
    { key: 'material_name', label: 'Material', sortable: true },
    { key: 'material_category_display', label: 'Category', sortable: true },
    { 
      key: 'quantity', 
      label: 'Quantity', 
      align: 'right',
      format: (value: any, row: any) => `${Number(value).toFixed(2)} ${row.unit_display || ''}`
    },
    { key: 'target_display', label: 'Target' },
    { key: 'purpose', label: 'Purpose' },
    { 
      key: 'addition_date', 
      label: 'Date', 
      sortable: true,
      format: (value: any) => new Date(value).toLocaleDateString()
    },
  ];

  ngOnInit(): void {
    this.loadAdditions();
  }

  loadAdditions(): void {
    this.loading.set(true);

    this.inventoryService.getAdditions().subscribe({
      next: (data) => {
        this.additions.set(data);
        this.filteredAdditions.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading additions:', err);
        this.snackBar.open('Failed to load additions', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term.toLowerCase();
    let filtered = [...this.additions()];

    if (this.searchTerm) {
      filtered = filtered.filter(a =>
        a.material_name.toLowerCase().includes(this.searchTerm) ||
        a.target_display.toLowerCase().includes(this.searchTerm) ||
        a.purpose?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredAdditions.set(filtered);
  }

  onTabChange(event: any): void {
    const tabIndex = event.index;
    if (tabIndex === 0) {
      this.router.navigate(['/inventory/materials']);
    } else if (tabIndex === 1) {
      this.router.navigate(['/inventory/movements']);
    }
  }
}
