import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-form-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, IconComponent],
  template: `
    <div class="form-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" (click)="onBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          
          <div class="header-icon" [class]="iconClass">
            <app-icon [name]="icon" [size]="24"></app-icon>
          </div>
          
          <div class="header-text">
            <h1>{{ title }}</h1>
            @if (subtitle) {
              <p>{{ subtitle }}</p>
            }
          </div>
        </div>
        
        <div class="header-actions">
          <button class="btn btn-secondary" type="button" (click)="onBack()" [disabled]="saving">
            Cancel
          </button>
          <button class="btn btn-primary" 
                  type="submit" 
                  [disabled]="!canSave || saving"
                  (click)="save.emit()">
            @if (saving) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              <mat-icon>check</mat-icon>
              {{ saveLabel }}
            }
          </button>
        </div>
      </header>
      
      <!-- Form Content - Full Width -->
      <main class="page-content">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styles: [`
    .form-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-body);
    }
    
    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      gap: 1rem;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      mat-icon {
        color: var(--text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      
      &:hover {
        background: var(--gray-100);
        border-color: var(--gray-300);
        transform: translateX(-2px);
        
        mat-icon {
          color: var(--text-primary);
        }
      }
    }
    
    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      background: linear-gradient(135deg, #7c4dff 0%, #b47cff 100%);
      
      &.green { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }
      &.amber { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
      &.blue { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); }
      &.rose { background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%); }
    }
    
    .header-text {
      h1 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
      }
      
      p {
        margin: 0.125rem 0 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }
    }
    
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    
    /* Buttons - matching design system */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0 1.25rem;
      height: 40px;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      
      mat-spinner {
        margin: 0;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      
      &:hover:not(:disabled) {
        background: var(--gray-100);
        border-color: var(--gray-300);
        color: var(--text-primary);
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #7c4dff 0%, #9d7cff 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(124, 77, 255, 0.25);
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(124, 77, 255, 0.35);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }
    
    /* Content - Full Width */
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }
    
    /* Responsive - Tablet */
    @media (max-width: 768px) {
      .page-header {
        padding: 0.875rem 1rem;
        gap: 0.75rem;
      }
      
      .header-left {
        gap: 0.75rem;
      }
      
      .back-btn {
        width: 36px;
        height: 36px;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
      
      .header-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
      }
      
      .header-text h1 {
        font-size: 1.125rem;
      }
      
      .header-text p {
        font-size: 0.75rem;
      }
      
      .btn {
        padding: 0 1rem;
        height: 38px;
        font-size: 0.8125rem;
      }
      
      .page-content {
        padding: 1rem;
      }
    }
    
    /* Responsive - Mobile */
    @media (max-width: 480px) {
      .page-header {
        flex-wrap: wrap;
        padding: 0.75rem;
        gap: 0.5rem;
      }
      
      .header-left {
        flex: 1;
        min-width: 0;
        gap: 0.5rem;
      }
      
      .back-btn {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }
      
      .header-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        flex-shrink: 0;
        
        app-icon {
          transform: scale(0.85);
        }
      }
      
      .header-text {
        min-width: 0;
        
        h1 {
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        p {
          display: none;
        }
      }
      
      .header-actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }
      
      .btn {
        height: 40px;
        width: 100%;
        border-radius: 8px;
      }
      
      .page-content {
        padding: 0.75rem;
      }
    }
  `]
})
export class FormPageComponent {
  @Input() title = 'Form';
  @Input() subtitle?: string;
  @Input() icon = 'edit';
  @Input() iconClass = '';
  @Input() saveLabel = 'Save';
  @Input() saving = false;
  @Input() canSave = true;
  
  @Output() save = new EventEmitter<void>();
  
  constructor(private location: Location) {}
  
  onBack(): void {
    this.location.back();
  }
}
