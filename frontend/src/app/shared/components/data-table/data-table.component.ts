import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';
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
        
        <!-- Filters - horizontal scroll on mobile -->
        <div class="filters-row">
          <ng-content select="[filters]"></ng-content>
        </div>
        
        <!-- Count -->
        <div class="count-badge">{{ totalItems }}</div>
      </div>
      
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
  styles: [`
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    
    @keyframes pulse-dot {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .fresh-grid {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
      overflow: hidden;
    }
    
    /* ===== Toolbar ===== */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #fafbfc;
      border-bottom: 1px solid #eef0f3;
    }
    
    /* Search */
    .search-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 7px 10px;
      min-width: 180px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      
      &:hover { border-color: #d1d5db; }
      
      &.focused {
        border-color: #7c4dff;
        box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.1);
      }
      
      .search-icon {
        color: #9ca3af;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      
      input {
        border: none;
        outline: none;
        font-size: 13px;
        flex: 1;
        min-width: 60px;
        background: transparent;
        color: #1f2937;
        
        &::placeholder { color: #b0b0b0; }
      }
      
      .search-clear {
        background: #f3f4f6;
        border: none;
        border-radius: 4px;
        padding: 2px;
        cursor: pointer;
        display: flex;
        transition: all 0.15s;
        
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: #6b7280;
        }
        
        &:hover { background: #e5e7eb; }
      }
    }
    
    /* Filters Row */
    .filters-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
      
      &::-webkit-scrollbar { display: none; }
    }
    
    /* Count Badge */
    .count-badge {
      background: #7c4dff;
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      flex-shrink: 0;
    }
    
    /* Mobile Toolbar */
    .toolbar.mobile {
      padding: 8px 10px;
      gap: 8px;
      
      .search-wrap {
        min-width: 0;
        flex: 1;
        max-width: 140px;
        padding: 6px 8px;
        
        input { font-size: 12px; }
      }
      
      .filters-row {
        flex: unset;
      }
      
      .count-badge {
        font-size: 11px;
        padding: 3px 8px;
      }
    }
    
    /* ===== Loading ===== */
    .loading-strip {
      height: 3px;
      background: linear-gradient(90deg, #7c4dff, #19d895, #ffaf00, #7c4dff);
      background-size: 300% 100%;
      animation: shimmer 1.5s infinite;
    }
    
    /* ===== Table ===== */
    .table-area {
      flex: 1;
      overflow: auto;
      min-height: 0;
      
      &.loading { opacity: 0.5; }
    }
    
    table { width: 100%; }
    
    th.mat-header-cell {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #6b7280;
      background: #f9fafb;
      padding: 14px 16px;
      border-bottom: 2px solid #eef0f3;
    }
    
    td.mat-cell {
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      color: #374151;
      font-size: 14px;
    }
    
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    tr.mat-row {
      transition: background 0.15s ease;
      
      &:last-child td { border-bottom: none; }
      &:hover { background: #fafafb; }
      &.clickable { cursor: pointer; }
    }
    
    .cell-text {
      color: #111827;
      font-weight: 500;
    }
    
    .date-text {
      color: #6b7280;
      font-size: 13px;
      font-weight: 500;
    }
    
    .num-text {
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 13px;
      color: #374151;
    }
    
    /* Bool chips */
    .bool-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      
      &.yes {
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        color: #fff;
      }
      
      &.no {
        background: #f3f4f6;
        color: #9ca3af;
      }
    }
    
    /* Tags */
    .tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    
    .tag-gray, .tag.gray { background: #f3f4f6; color: #6b7280; }
    .tag.blue { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
    .tag.amber { background: rgba(245, 158, 11, 0.12); color: #d97706; }
    .tag.purple { background: rgba(139, 92, 246, 0.12); color: #7c3aed; }
    .tag.pink { background: rgba(236, 72, 153, 0.12); color: #db2777; }
    .tag.green { background: rgba(16, 185, 129, 0.12); color: #059669; }
    .tag.cyan { background: rgba(6, 182, 212, 0.12); color: #0891b2; }
    .badge-primary { background: linear-gradient(135deg, rgba(124,77,255,0.15), rgba(124,77,255,0.08)); color: #7c4dff; }
    .badge-success { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08)); color: #059669; }
    .badge-warning { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08)); color: #b45309; }
    .badge-danger { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08)); color: #dc2626; }
    .badge-info { background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.08)); color: #2563eb; }
    .badge-secondary { background: #f3f4f6; color: #6b7280; }
    
    /* Actions */
    .action-btns {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    tr:hover .action-btns { opacity: 1; }
    
    .action-btn {
      background: #f3f4f6;
      border: none;
      padding: 6px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      transition: all 0.15s;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #6b7280;
      }
      
      &:hover {
        background: #7c4dff;
        transform: scale(1.05);
        mat-icon { color: #fff; }
      }
      
      &.danger:hover {
        background: #ef4444;
      }
    }
    
    /* ===== Empty ===== */
    .empty-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 24px;
      text-align: center;
    }
    
    .empty-visual {
      position: relative;
      margin-bottom: 20px;
    }
    
    .empty-circle {
      width: 80px;
      height: 80px;
      border-radius: 24px;
      background: linear-gradient(135deg, #7c4dff 0%, #b47cff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: float 3s ease-in-out infinite;
      box-shadow: 0 8px 24px rgba(124, 77, 255, 0.3);
      
      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #fff;
      }
    }
    
    .empty-dots {
      display: flex;
      gap: 6px;
      justify-content: center;
      margin-top: 12px;
      
      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #7c4dff;
        animation: pulse-dot 1.4s infinite;
        
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    
    .empty-box h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .empty-box p {
      margin: 0 0 20px;
      font-size: 14px;
      color: #6b7280;
      max-width: 280px;
    }
    
    /* ===== Paginator ===== */
    mat-paginator {
      border-top: 1px solid #f3f4f6;
      background: #fafbfc;
    }
    
    /* ===== Mobile Pagination ===== */
    .mobile-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px 16px;
      background: #fafbfc;
      border-top: 1px solid #f0f0f0;
    }
    
    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.15s;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #374151;
      }
      
      &:active:not(:disabled) {
        background: #7c4dff;
        transform: scale(0.95);
        
        mat-icon { color: #fff; }
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        box-shadow: none;
      }
    }
    
    .page-info {
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 60px;
      justify-content: center;
    }
    
    .page-current {
      font-size: 18px;
      font-weight: 700;
      color: #7c4dff;
    }
    
    .page-sep {
      font-size: 14px;
      color: #9ca3af;
    }
    
    .page-total {
      font-size: 14px;
      color: #6b7280;
    }
    
    /* ===== Mobile List View ===== */
    .mobile-list {
      flex: 1;
      overflow: auto;
      background: #fff;
      
      &.loading { opacity: 0.5; }
    }
    
    .list-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      gap: 12px;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background: #f9fafb;
      }
      
      &.clickable {
        cursor: pointer;
      }
    }
    
    .item-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .item-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .item-title {
      font-weight: 600;
      font-size: 15px;
      color: #111827;
      
      .cell-text {
        font-weight: 600;
      }
    }
    
    .item-header .tag {
      font-size: 9px;
      padding: 2px 8px;
    }
    
    .item-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
    }
    
    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
    }
    
    .meta-label {
      color: #9ca3af;
    }
    
    .meta-value {
      color: #374151;
      font-weight: 500;
    }
    
    .item-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .item-action-btn {
      background: transparent;
      border: none;
      padding: 6px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      transition: all 0.15s;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #9ca3af;
      }
      
      &:active {
        background: #f3f4f6;
        mat-icon { color: #7c4dff; }
      }
      
      &.danger:active {
        mat-icon { color: #ef4444; }
      }
    }
    
    /* Always visible action buttons (for card view) */
    .action-btns.always-visible {
      opacity: 1;
    }
    
  `]
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
