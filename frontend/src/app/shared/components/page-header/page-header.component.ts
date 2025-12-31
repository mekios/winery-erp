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
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() headerIcon?: string;
}

