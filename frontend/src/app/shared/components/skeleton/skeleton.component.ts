import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable skeleton loader component for loading states.
 * 
 * Usage:
 * - <app-skeleton type="text" /> - Single line text
 * - <app-skeleton type="text" [lines]="3" /> - Multiple text lines
 * - <app-skeleton type="card" /> - Card placeholder
 * - <app-skeleton type="table" [rows]="5" /> - Table rows
 * - <app-skeleton type="avatar" /> - Circular avatar
 * - <app-skeleton type="stat-card" /> - Dashboard stat card
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('text') {
        <div class="skeleton-text-block">
          @for (line of lineArray; track $index) {
            <div class="skeleton-line" 
                 [style.width]="getLineWidth($index)"
                 [style.animationDelay]="$index * 0.1 + 's'"></div>
          }
        </div>
      }
      
      @case ('avatar') {
        <div class="skeleton-avatar" [class.small]="size === 'sm'" [class.large]="size === 'lg'"></div>
      }
      
      @case ('card') {
        <div class="skeleton-card">
          <div class="skeleton-card-header">
            <div class="skeleton-avatar small"></div>
            <div class="skeleton-card-title">
              <div class="skeleton-line" style="width: 60%"></div>
              <div class="skeleton-line short" style="width: 40%"></div>
            </div>
          </div>
          <div class="skeleton-card-body">
            <div class="skeleton-line"></div>
            <div class="skeleton-line" style="width: 90%"></div>
            <div class="skeleton-line" style="width: 75%"></div>
          </div>
        </div>
      }
      
      @case ('stat-card') {
        <div class="skeleton-stat-card">
          <div class="skeleton-stat-icon"></div>
          <div class="skeleton-stat-content">
            <div class="skeleton-line large" style="width: 50%"></div>
            <div class="skeleton-line short" style="width: 70%"></div>
          </div>
        </div>
      }
      
      @case ('table') {
        <div class="skeleton-table">
          <div class="skeleton-table-header">
            @for (col of colArray; track $index) {
              <div class="skeleton-line" [style.width]="getColWidth($index)"></div>
            }
          </div>
          @for (row of rowArray; track $index) {
            <div class="skeleton-table-row" [style.animationDelay]="$index * 0.05 + 's'">
              @for (col of colArray; track $index) {
                <div class="skeleton-line" [style.width]="getColWidth($index)"></div>
              }
            </div>
          }
        </div>
      }
      
      @case ('list') {
        <div class="skeleton-list">
          @for (row of rowArray; track $index) {
            <div class="skeleton-list-item" [style.animationDelay]="$index * 0.05 + 's'">
              <div class="skeleton-avatar small"></div>
              <div class="skeleton-list-content">
                <div class="skeleton-line" style="width: 60%"></div>
                <div class="skeleton-line short" style="width: 40%"></div>
              </div>
              <div class="skeleton-line badge" style="width: 60px"></div>
            </div>
          }
        </div>
      }
      
      @default {
        <div class="skeleton-line"></div>
      }
    }
  `,
  styles: [`
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    
    :host {
      display: block;
    }
    
    /* Base skeleton style */
    .skeleton-line,
    .skeleton-avatar,
    .skeleton-stat-icon {
      background: linear-gradient(
        90deg,
        #f0f0f0 0px,
        #e8e8e8 40px,
        #f0f0f0 80px
      );
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 4px;
    }
    
    /* Text lines */
    .skeleton-text-block {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .skeleton-line {
      height: 14px;
      width: 100%;
      
      &.short { height: 12px; }
      &.large { height: 28px; border-radius: 6px; }
      &.badge { height: 24px; border-radius: 12px; }
    }
    
    /* Avatar */
    .skeleton-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      flex-shrink: 0;
      
      &.small { width: 36px; height: 36px; }
      &.large { width: 64px; height: 64px; }
    }
    
    /* Card */
    .skeleton-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 16px;
    }
    
    .skeleton-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .skeleton-card-title {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .skeleton-card-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    /* Stat Card */
    .skeleton-stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
    }
    
    .skeleton-stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
    }
    
    .skeleton-stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    /* Table */
    .skeleton-table {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .skeleton-table-header {
      display: flex;
      gap: 16px;
      padding: 14px 16px;
      background: #f9fafb;
      border-bottom: 2px solid #e8e8e8;
      
      .skeleton-line { height: 12px; }
    }
    
    .skeleton-table-row {
      display: flex;
      gap: 16px;
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child { border-bottom: none; }
    }
    
    /* List */
    .skeleton-list {
      display: flex;
      flex-direction: column;
    }
    
    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child { border-bottom: none; }
    }
    
    .skeleton-list-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'text' | 'avatar' | 'card' | 'stat-card' | 'table' | 'list' = 'text';
  @Input() lines = 1;
  @Input() rows = 5;
  @Input() cols = 5;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  
  get lineArray(): number[] {
    return Array(this.lines).fill(0);
  }
  
  get rowArray(): number[] {
    return Array(this.rows).fill(0);
  }
  
  get colArray(): number[] {
    return Array(this.cols).fill(0);
  }
  
  getLineWidth(index: number): string {
    // Vary line widths for more natural look
    const widths = ['100%', '90%', '85%', '95%', '75%'];
    return widths[index % widths.length];
  }
  
  getColWidth(index: number): string {
    // Vary column widths
    const widths = ['15%', '20%', '25%', '15%', '10%'];
    return widths[index % widths.length];
  }
}

