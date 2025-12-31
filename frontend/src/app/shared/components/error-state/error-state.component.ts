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
  styleUrls: ['./error-state.component.scss']
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





