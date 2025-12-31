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
      </header>
      
      <!-- Form Content - Full Width -->
      <main class="page-content">
        <ng-content></ng-content>
      </main>
      
      <!-- Sticky Footer Actions -->
      <footer class="form-footer">
        <div class="footer-content">
          <button class="btn btn-secondary" type="button" (click)="onBack()" [disabled]="saving">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
          <button class="btn btn-primary" 
                  type="submit" 
                  [disabled]="!canSave || saving"
                  (click)="save.emit()">
            @if (saving) {
              <mat-spinner diameter="18"></mat-spinner>
              <span>Saving...</span>
            } @else {
              <mat-icon>check</mat-icon>
              {{ saveLabel }}
            }
          </button>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./form-page.component.scss']
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
