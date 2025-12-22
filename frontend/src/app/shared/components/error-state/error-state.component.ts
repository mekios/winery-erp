import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IconComponent } from '../icon/icon.component';

/**
 * Reusable error state component for displaying API errors.
 * 
 * Usage:
 * <app-error-state 
 *   title="Failed to load data"
 *   message="Please check your connection and try again."
 *   (retry)="loadData()">
 * </app-error-state>
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, IconComponent],
  template: `
    <div class="error-state" [class.compact]="compact" [class]="variant">
      <div class="error-visual">
        <div class="error-icon-wrapper">
          @switch (variant) {
            @case ('network') {
              <mat-icon>wifi_off</mat-icon>
            }
            @case ('forbidden') {
              <mat-icon>lock</mat-icon>
            }
            @case ('not-found') {
              <mat-icon>search_off</mat-icon>
            }
            @case ('server') {
              <mat-icon>cloud_off</mat-icon>
            }
            @default {
              <mat-icon>{{ icon }}</mat-icon>
            }
          }
        </div>
      </div>
      
      <h3 class="error-title">{{ title }}</h3>
      <p class="error-message">{{ message }}</p>
      
      @if (showRetry) {
        <button class="retry-btn" (click)="onRetry()">
          <mat-icon>refresh</mat-icon>
          {{ retryLabel }}
        </button>
      }
      
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 300px;
      
      &.compact {
        min-height: 200px;
        padding: 32px 20px;
        
        .error-icon-wrapper {
          width: 64px;
          height: 64px;
          
          mat-icon {
            font-size: 28px;
            width: 28px;
            height: 28px;
          }
        }
        
        .error-title { font-size: 16px; }
        .error-message { font-size: 13px; }
      }
    }
    
    .error-visual {
      margin-bottom: 20px;
    }
    
    .error-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
      
      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #ef4444;
      }
    }
    
    /* Variant styles */
    .error-state.network .error-icon-wrapper {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
      mat-icon { color: #f59e0b; }
    }
    
    .error-state.forbidden .error-icon-wrapper {
      background: linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(124, 77, 255, 0.05));
      mat-icon { color: #7c4dff; }
    }
    
    .error-state.not-found .error-icon-wrapper {
      background: linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0.05));
      mat-icon { color: #6b7280; }
    }
    
    .error-state.server .error-icon-wrapper {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
      mat-icon { color: #ef4444; }
    }
    
    .error-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .error-message {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #6b7280;
      max-width: 320px;
      line-height: 1.5;
    }
    
    .retry-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #7c4dff, #9d7aff);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(124, 77, 255, 0.25);
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        box-shadow: 0 6px 20px rgba(124, 77, 255, 0.35);
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'We couldn\'t load this content. Please try again.';
  @Input() icon = 'error_outline';
  @Input() variant: 'default' | 'network' | 'forbidden' | 'not-found' | 'server' = 'default';
  @Input() showRetry = true;
  @Input() retryLabel = 'Try again';
  @Input() compact = false;
  
  @Output() retry = new EventEmitter<void>();
  
  onRetry(): void {
    this.retry.emit();
  }
}

