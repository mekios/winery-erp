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
  styleUrls: ['./skeleton.component.scss']
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





