import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, IconComponent],
  template: `
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          @if (headerIcon) {
            <div class="header-icon">
              <app-icon [name]="headerIcon" [size]="28"></app-icon>
            </div>
          }
          <div class="header-text">
            <h1>{{ title }}</h1>
            @if (subtitle) {
              <p class="subtitle">{{ subtitle }}</p>
            }
          </div>
        </div>
        <div class="header-actions">
          <ng-content></ng-content>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .page-header {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 1.5rem;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(124, 77, 255, 0.1) 0%, rgba(180, 124, 255, 0.1) 100%);
      color: var(--primary);
      
      app-icon {
        color: var(--primary);
      }
    }
    
    .header-text {
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .subtitle {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  `]
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() headerIcon?: string;
}

