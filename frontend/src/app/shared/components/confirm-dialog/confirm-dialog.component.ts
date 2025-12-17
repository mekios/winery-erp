import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        @if (data.icon) {
          <mat-icon [class]="'dialog-icon ' + (data.confirmColor || 'primary')">
            {{ data.icon }}
          </mat-icon>
        }
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button 
                [color]="data.confirmColor || 'primary'"
                (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 320px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem 0;
    }
    
    .dialog-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      
      &.primary { color: var(--primary); }
      &.warn { color: var(--danger); }
      &.accent { color: var(--warning); }
    }
    
    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    mat-dialog-content {
      padding: 1rem 1.5rem;
      
      p {
        margin: 0;
        color: var(--text-secondary);
      }
    }
    
    mat-dialog-actions {
      padding: 0.5rem 1.5rem 1rem;
      gap: 0.5rem;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
  
  onCancel(): void {
    this.dialogRef.close(false);
  }
  
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}



