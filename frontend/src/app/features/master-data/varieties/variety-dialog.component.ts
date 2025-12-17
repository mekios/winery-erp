import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { GrapeVariety, GrapeVarietyCreate } from '../master-data.service';

export interface VarietyDialogData {
  variety?: GrapeVariety;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-variety-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Add Grape Variety' : 'Edit Grape Variety' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="variety-form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Cabernet Sauvignon">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g., CAB" maxlength="20">
          <mat-hint>Short code for quick reference</mat-hint>
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <mat-select formControlName="color">
            <mat-option value="RED">Red</mat-option>
            <mat-option value="WHITE">White</mat-option>
            <mat-option value="ROSE">Rosé</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3" 
                    placeholder="Additional notes..."></textarea>
        </mat-form-field>
        
        <mat-checkbox formControlName="is_active">Active</mat-checkbox>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="form.invalid"
              (click)="onSave()">
        {{ data.mode === 'create' ? 'Create' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .variety-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 400px;
      padding-top: 0.5rem;
    }
    
    mat-form-field {
      width: 100%;
    }
    
    mat-checkbox {
      margin-top: 0.5rem;
    }
  `]
})
export class VarietyDialogComponent {
  form: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VarietyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VarietyDialogData
  ) {
    this.form = this.fb.group({
      name: [data.variety?.name || '', Validators.required],
      code: [data.variety?.code || ''],
      color: [data.variety?.color || 'RED', Validators.required],
      notes: [data.variety?.notes || ''],
      is_active: [data.variety?.is_active ?? true],
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSave(): void {
    if (this.form.valid) {
      const result: GrapeVarietyCreate = this.form.value;
      this.dialogRef.close(result);
    }
  }
}



