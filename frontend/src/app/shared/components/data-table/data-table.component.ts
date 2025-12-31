import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { IconComponent } from '../icon/icon.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'actions';
  badgeMap?: Record<string, { label: string; class: string }>;
  format?: (value: unknown, row: unknown) => string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction {
  icon: string;
  label: string;
  action: string;
  color?: string;
  condition?: (row: unknown) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatRippleModule,
    IconComponent,
  ],
  template: `
    <div class="fresh-grid">
      <!-- Toolbar -->
      <div class="toolbar" [class.mobile]="isMobile()">
        <!-- Search -->
        @if (searchable) {
          <div class="search-wrap" [class.focused]="searchFocused">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text"
                   [(ngModel)]="searchValue"
                   (input)="onSearchInput()"
                   (focus)="searchFocused = true"
                   (blur)="searchFocused = false"
                   [placeholder]="isMobile() ? 'Search...' : searchPlaceholder">
            @if (searchValue) {
              <button class="search-clear" (click)="clearSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        }
        
        <!-- Desktop: Inline filters -->
        @if (!isMobile() && filterTemplate) {
          <div class="filters-row">
            <ng-container *ngTemplateOutlet="filterTemplate"></ng-container>
          </div>
        }
        
        <!-- Mobile Filter Button -->
        @if (isMobile() && filterTemplate) {
          <button class="filter-btn" [class.active]="filterPanelOpen()" (click)="toggleFilterPanel()">
            <mat-icon>tune</mat-icon>
          </button>
        }
        
        <!-- Count -->
        <div class="count-badge">{{ totalItems }}</div>
      </div>
      
      <!-- Mobile: Filter drawer -->
      @if (isMobile() && filterTemplate) {
        <div class="filter-backdrop" [class.visible]="filterPanelOpen()" (click)="closeFilterPanel()"></div>
        <div class="filter-drawer" [class.open]="filterPanelOpen()">
          <div class="filter-drawer-handle"></div>
          <div class="filter-drawer-header">
            <span class="filter-drawer-title">Filters</span>
            <button class="filter-drawer-close" (click)="closeFilterPanel()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="filter-drawer-content">
            <ng-container *ngTemplateOutlet="filterTemplate"></ng-container>
          </div>
          <div class="filter-drawer-footer">
            <button class="filter-done-btn" (click)="closeFilterPanel()">Done</button>
          </div>
        </div>
      }
      
      <!-- Loading -->
      @if (loading) {
        <div class="loading-strip"></div>
      }
      
      <!-- Table Area (Desktop) - Only rendered on larger screens -->
      @if (!isMobile()) {
        <div class="table-area" [class.loading]="loading">
          <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSort($event)">
            @for (column of columns; track column.key) {
              <ng-container [matColumnDef]="column.key">
                <th mat-header-cell *matHeaderCellDef 
                    [mat-sort-header]="column.sortable !== false ? column.key : ''"
                    [disabled]="column.sortable === false"
                    [style.width]="column.width"
                    [class.text-right]="column.align === 'right'"
                    [class.text-center]="column.align === 'center'">
                  {{ column.label }}
                </th>
                
                <td mat-cell *matCellDef="let row" 
                    [style.width]="column.width"
                    [class.text-right]="column.align === 'right'"
                    [class.text-center]="column.align === 'center'">
                  <ng-container *ngTemplateOutlet="cellContent; context: { column: column, row: row }"></ng-container>
                </td>
              </ng-container>
            }
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"
                [class.clickable]="rowClickable"
                matRipple
                [matRippleDisabled]="!rowClickable"
                (click)="onRowClick(row)"></tr>
          </table>
        </div>
      }
      
      <!-- Card View (Mobile) - Only rendered on smaller screens -->
      @if (isMobile()) {
        <div class="mobile-list" [class.loading]="loading">
          @for (row of dataSource.data; track $index) {
            <div class="list-item" 
                 [class.clickable]="rowClickable"
                 matRipple
                 [matRippleDisabled]="!rowClickable"
                 (click)="onRowClick(row)">
              <!-- Left: Main content -->
              <div class="item-content">
                <!-- Row 1: Title + Badge -->
                <div class="item-header">
                  @if (getPrimaryColumn(); as primaryCol) {
                    <span class="item-title">
                      <ng-container *ngTemplateOutlet="cellContent; context: { column: primaryCol, row: row }"></ng-container>
                    </span>
                  }
                  @if (getBadgeColumn(); as badgeCol) {
                    <ng-container *ngTemplateOutlet="cellContent; context: { column: badgeCol, row: row }"></ng-container>
                  }
                </div>
                <!-- Row 2: Key values as chips -->
                <div class="item-meta">
                  @for (column of getMetricColumns(); track column.key; let i = $index) {
                    @if (i < 4) {
                      <span class="meta-chip">
                        <span class="meta-label">{{ column.label }}:</span>
                        <span class="meta-value">
                          <ng-container *ngTemplateOutlet="cellContentSimple; context: { column: column, row: row }"></ng-container>
                        </span>
                      </span>
                    }
                  }
                </div>
              </div>
              <!-- Right: Actions -->
              @if (actions.length > 0) {
                <div class="item-actions">
                  @for (action of actions; track action.action) {
                    @if (!action.condition || action.condition(row)) {
                      <button class="item-action-btn" 
                              [class.danger]="action.color === 'warn'"
                              (click)="onAction(action.action, row); $event.stopPropagation()">
                        <mat-icon>{{ action.icon }}</mat-icon>
                      </button>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      }
      
      <!-- Simple cell content for mobile (no wrappers) -->
      <ng-template #cellContentSimple let-column="column" let-row="row">
        @switch (column.type) {
          @case ('date') {
            {{ row[column.key] | date:'MMM d' }}
          }
          @case ('number') {
            @if (column.format) {
              {{ column.format(row[column.key], row) }}
            } @else {
              {{ row[column.key] | number }}
            }
          }
          @case ('boolean') {
            {{ row[column.key] ? '✓' : '—' }}
          }
          @default {
            @if (column.format) {
              {{ column.format(row[column.key], row) }}
            } @else {
              {{ row[column.key] ?? '—' }}
            }
          }
        }
      </ng-template>
      
      <!-- Empty State -->
      @if (!loading && dataSource.data.length === 0) {
        <div class="empty-box">
          <div class="empty-visual">
            <div class="empty-circle">
              <app-icon [name]="emptyIcon" [size]="32"></app-icon>
            </div>
            <div class="empty-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
          <h3>{{ emptyTitle }}</h3>
          <p>{{ emptyMessage }}</p>
          <ng-content select="[empty-action]"></ng-content>
        </div>
      }
      
      <!-- Reusable Cell Content Template -->
      <ng-template #cellContent let-column="column" let-row="row">
        @switch (column.type) {
          @case ('boolean') {
            @if (row[column.key]) {
              <div class="bool-chip yes">
                <mat-icon>check</mat-icon>
              </div>
            } @else {
              <div class="bool-chip no">
                <mat-icon>remove</mat-icon>
              </div>
            }
          }
          @case ('badge') {
            @if (column.badgeMap && column.badgeMap[row[column.key]]) {
              <span class="tag" [class]="column.badgeMap[row[column.key]].class">
                {{ column.badgeMap[row[column.key]].label }}
              </span>
            } @else {
              <span class="tag tag-gray">{{ row[column.key] }}</span>
            }
          }
          @case ('date') {
            <span class="date-text">{{ row[column.key] | date:'MMM d' }}</span>
          }
          @case ('number') {
            <span class="num-text">
              @if (column.format) {
                {{ column.format(row[column.key], row) }}
              } @else {
                {{ row[column.key] | number }}
              }
            </span>
          }
          @case ('actions') {
            <div class="action-btns always-visible">
              @for (action of actions; track action.action) {
                @if (!action.condition || action.condition(row)) {
                  <button class="action-btn" 
                          [class.danger]="action.color === 'warn'"
                          [matTooltip]="action.label"
                          matRipple
                          (click)="onAction(action.action, row); $event.stopPropagation()">
                    <mat-icon>{{ action.icon }}</mat-icon>
                  </button>
                }
              }
            </div>
          }
          @default {
            @if (column.format) {
              {{ column.format(row[column.key], row) }}
            } @else {
              <span class="cell-text">{{ row[column.key] ?? '—' }}</span>
            }
          }
        }
      </ng-template>
      
      <!-- Desktop Paginator -->
      @if (paginate && totalItems > 0 && !isMobile()) {
        <mat-paginator
          [length]="totalItems"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="pageSizeOptions"
          (page)="onPage($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
      
      <!-- Mobile Paginator -->
      @if (paginate && totalItems > 0 && isMobile()) {
        <div class="mobile-pagination">
          <button class="page-btn" 
                  [disabled]="pageIndex === 0"
                  (click)="goToPage(pageIndex - 1)">
            <mat-icon>chevron_left</mat-icon>
          </button>
          
          <div class="page-info">
            <span class="page-current">{{ pageIndex + 1 }}</span>
            <span class="page-sep">/</span>
            <span class="page-total">{{ totalPages }}</span>
          </div>
          
          <button class="page-btn"
                  [disabled]="pageIndex >= totalPages - 1"
                  (click)="goToPage(pageIndex + 1)">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit, OnChanges, OnDestroy {
  private breakpointObserver: BreakpointObserver;
  private destroy$ = new Subject<void>();
  
  @Input() columns: TableColumn[] = [];
  @Input() data: unknown[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading = false;
  @Input() searchable = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() paginate = true;
  @Input() totalItems = 0;
  @Input() pageSize = 25;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [10, 25, 50, 100];
  @Input() rowClickable = false;
  @Input() emptyIcon = 'inbox';
  @Input() emptyTitle = 'Nothing here yet';
  @Input() emptyMessage = 'Get started by adding your first item.';
  @Input() filterTemplate?: TemplateRef<unknown>;
  
  @Output() search = new EventEmitter<string>();
  @Output() sort = new EventEmitter<Sort>();
  @Output() page = new EventEmitter<PageEvent>();
  @Output() actionClick = new EventEmitter<{ action: string; row: unknown }>();
  @Output() rowClick = new EventEmitter<unknown>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) matSort!: MatSort;
  
  dataSource = new MatTableDataSource<unknown>();
  displayedColumns: string[] = [];
  searchValue = '';
  searchFocused = false;
  isMobile = signal(false);
  filterPanelOpen = signal(false);
  private searchTimeout?: ReturnType<typeof setTimeout>;
  
  /** Calculate total pages */
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }
  
  constructor(breakpointObserver: BreakpointObserver) {
    this.breakpointObserver = breakpointObserver;
  }
  
  ngOnInit(): void {
    this.updateDisplayedColumns();
    
    // Watch for screen size changes
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.updateDisplayedColumns();
    }
    if (changes['data']) {
      this.dataSource.data = this.data;
    }
  }
  
  private updateDisplayedColumns(): void {
    this.displayedColumns = this.columns.map(c => c.key);
  }
  
  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.search.emit(this.searchValue);
    }, 300);
  }
  
  clearSearch(): void {
    this.searchValue = '';
    this.search.emit('');
  }
  
  onSort(sortState: Sort): void {
    this.sort.emit(sortState);
  }
  
  onPage(event: PageEvent): void {
    this.page.emit(event);
  }
  
  /** Navigate to specific page (for mobile pagination) */
  goToPage(index: number): void {
    if (index < 0 || index >= this.totalPages) return;
    this.page.emit({
      pageIndex: index,
      pageSize: this.pageSize,
      length: this.totalItems,
      previousPageIndex: this.pageIndex
    });
  }
  
  toggleFilterPanel(): void {
    this.filterPanelOpen.set(!this.filterPanelOpen());
  }
  
  closeFilterPanel(): void {
    this.filterPanelOpen.set(false);
  }
  
  onAction(action: string, row: unknown): void {
    this.actionClick.emit({ action, row });
  }
  
  onRowClick(row: unknown): void {
    if (this.rowClickable) {
      this.rowClick.emit(row);
    }
  }
  
  /** Get the primary column (first non-actions, non-badge column) for card title */
  getPrimaryColumn(): TableColumn | null {
    return this.columns.find(c => c.type !== 'actions' && c.type !== 'badge') ?? null;
  }
  
  /** Get the badge column if any */
  getBadgeColumn(): TableColumn | null {
    return this.columns.find(c => c.type === 'badge') ?? null;
  }
  
  /** Get metric columns (non-primary, non-badge, non-actions) for compact display */
  getMetricColumns(): TableColumn[] {
    const primaryKey = this.getPrimaryColumn()?.key;
    return this.columns.filter(c => 
      c.type !== 'actions' && 
      c.type !== 'badge' && 
      c.key !== primaryKey
    );
  }
  
  /** Get secondary columns (all except first and actions) for card body - legacy */
  getSecondaryColumns(): TableColumn[] {
    const nonActionColumns = this.columns.filter(c => c.type !== 'actions');
    return nonActionColumns.slice(1);
  }
}
