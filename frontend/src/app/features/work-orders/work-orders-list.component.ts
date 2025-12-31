import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { DataTableComponent, TableColumn, TableAction } from '@shared/components/data-table/data-table.component';
import { FilterChipComponent, FilterOption } from '@shared/components/filter-chip/filter-chip.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import {
  WorkOrdersService,
  WorkOrder,
  WorkOrderSummary,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS
} from './work-orders.service';

@Component({
  selector: 'app-work-orders-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, DatePipe,
    MatButtonModule, MatIconModule, MatMenuModule, MatSnackBarModule,
    DataTableComponent, FilterChipComponent, IconComponent,
    SkeletonComponent, ErrorStateComponent
  ],
  template: `
    <div class="list-page">
      <header class="list-header">
        <div class="header-title">
          <div class="title-icon">
            <app-icon name="clipboard-list" [size]="24"></app-icon>
          </div>
          <div>
            <h1>Work Orders</h1>
            <span class="subtitle">Plan & track production tasks</span>
          </div>
        </div>
        
        <!-- Summary Stats -->
        @if (summary()) {
          <div class="summary-pills">
            <div class="stat-pill" [class.active]="selectedStatus === 'IN_PROGRESS'" (click)="filterByStatus('IN_PROGRESS')">
              <span class="stat-value">{{ summary()!.by_status['IN_PROGRESS'] || 0 }}</span>
              <span class="stat-label">In Progress</span>
            </div>
            <div class="stat-pill" [class.active]="selectedStatus === 'PLANNED'" (click)="filterByStatus('PLANNED')">
              <span class="stat-value">{{ summary()!.by_status['PLANNED'] || 0 }}</span>
              <span class="stat-label">Planned</span>
            </div>
            @if (summary()!.overdue > 0) {
              <div class="stat-pill danger">
                <span class="stat-value">{{ summary()!.overdue }}</span>
                <span class="stat-label">Overdue</span>
              </div>
            }
            @if (summary()!.my_assigned > 0) {
              <div class="stat-pill accent">
                <span class="stat-value">{{ summary()!.my_assigned }}</span>
                <span class="stat-label">My Tasks</span>
              </div>
            }
          </div>
        }
        
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          New Work Order
        </button>
      </header>
      
      <ng-template #filtersTemplate>
        <app-filter-chip
          label="Status"
          [options]="statusOptions"
          [value]="selectedStatus"
          (valueChange)="onStatusChange($event)">
        </app-filter-chip>
        <app-filter-chip
          label="Priority"
          [options]="priorityOptions"
          [value]="selectedPriority"
          (valueChange)="onPriorityChange($event)">
        </app-filter-chip>
      </ng-template>
      
      @if (error()) {
        <app-error-state
          title="Failed to load work orders"
          message="We couldn't retrieve the work orders."
          (retry)="loadData()">
        </app-error-state>
      } @else {
        <app-data-table
          [columns]="columns"
          [data]="workOrders()"
          [actions]="actions"
          [loading]="loading()"
          [totalItems]="totalItems()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [filterTemplate]="filtersTemplate"
          searchPlaceholder="Search work orders..."
          emptyIcon="clipboard-list"
          emptyTitle="No work orders yet"
          emptyMessage="Create your first work order to start planning tasks."
          (search)="onSearch($event)"
          (sort)="onSort($event)"
          (page)="onPage($event)"
          (rowClick)="onRowClick($event)"
          (actionClick)="onAction($event)">
          
          <button empty-action mat-raised-button color="primary" routerLink="new">
            <mat-icon>add</mat-icon>
            New Work Order
          </button>
        </app-data-table>
      }
      
      <button class="mobile-fab" mat-fab color="primary" routerLink="new">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./work-orders-list.component.scss']
})
export class WorkOrdersListComponent implements OnInit {
  private workOrdersService = inject(WorkOrdersService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  workOrders = signal<WorkOrder[]>([]);
  summary = signal<WorkOrderSummary | null>(null);
  loading = signal(false);
  error = signal(false);
  totalItems = signal(0);
  pageSize = 25;
  pageIndex = 0;
  searchQuery = '';
  sortField = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;
  
  statusOptions: FilterOption[] = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PLANNED', label: 'Planned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];
  
  priorityOptions: FilterOption[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];
  
  columns: TableColumn[] = [
    { key: 'code', label: 'Code', sortable: true, width: '110px' },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', badgeMap: {
      'DRAFT': { label: 'Draft', class: 'badge-secondary' },
      'PLANNED': { label: 'Planned', class: 'badge-info' },
      'IN_PROGRESS': { label: 'In Progress', class: 'badge-warning' },
      'DONE': { label: 'Done', class: 'badge-success' },
      'VERIFIED': { label: 'Verified', class: 'badge-primary' },
      'CANCELLED': { label: 'Cancelled', class: 'badge-danger' },
    }},
    { key: 'priority', label: 'Priority', type: 'badge', badgeMap: {
      'LOW': { label: 'Low', class: 'badge-secondary' },
      'NORMAL': { label: 'Normal', class: 'badge-info' },
      'HIGH': { label: 'High', class: 'badge-warning' },
      'URGENT': { label: 'Urgent', class: 'badge-danger' },
    }},
    { key: 'progress_percentage', label: 'Progress', align: 'center', format: (v) => `${v}%` },
    { key: 'assigned_to_name', label: 'Assigned To' },
    { key: 'scheduled_for', label: 'Scheduled', type: 'date', sortable: true },
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
  }
  
  loadData(): void {
    this.loading.set(true);
    this.error.set(false);
    
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.pageIndex + 1,
      page_size: this.pageSize,
      search: this.searchQuery || undefined,
      ordering: this.sortDirection === 'desc' ? `-${this.sortField}` : this.sortField,
      status: this.selectedStatus || undefined,
      priority: this.selectedPriority || undefined,
    };
    
    this.workOrdersService.getWorkOrders(params).subscribe({
      next: (r) => {
        this.workOrders.set(r.results);
        this.totalItems.set(r.count);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.snackBar.open('Failed to load work orders', 'Close', { duration: 3000 });
      }
    });
  }
  
  loadSummary(): void {
    this.workOrdersService.getSummary().subscribe({
      next: (s) => this.summary.set(s)
    });
  }
  
  filterByStatus(status: string): void {
    if (this.selectedStatus === status) {
      this.selectedStatus = null;
    } else {
      this.selectedStatus = status;
    }
    this.pageIndex = 0;
    this.loadData();
  }
  
  onSearch(q: string): void {
    this.searchQuery = q;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onStatusChange(v: string | boolean | null): void {
    this.selectedStatus = v as string | null;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onPriorityChange(v: string | boolean | null): void {
    this.selectedPriority = v as string | null;
    this.pageIndex = 0;
    this.loadData();
  }
  
  onSort(s: Sort): void {
    this.sortField = s.active || 'created_at';
    this.sortDirection = s.direction || 'desc';
    this.loadData();
  }
  
  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadData();
  }
  
  onRowClick(row: unknown): void {
    const wo = row as WorkOrder;
    this.router.navigate(['/work-orders', wo.id]);
  }
  
  onAction(e: { action: string; row: unknown }): void {
    const wo = e.row as WorkOrder;
    if (e.action === 'view') this.router.navigate(['/work-orders', wo.id]);
    if (e.action === 'edit') this.router.navigate(['/work-orders', wo.id, 'edit']);
    if (e.action === 'delete') this.confirmDelete(wo);
  }
  
  confirmDelete(wo: WorkOrder): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Work Order',
        message: `Delete "${wo.code}: ${wo.title}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete'
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.workOrdersService.deleteWorkOrder(wo.id).subscribe({
          next: () => {
            this.snackBar.open('Work order deleted', 'Close', { duration: 3000 });
            this.loadData();
            this.loadSummary();
          },
          error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
        });
      }
    });
  }
}





