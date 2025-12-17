import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Tank, TankCreate, TANK_TYPE_LABELS, TANK_MATERIAL_LABELS, TANK_STATUS_LABELS } from '../equipment.service';

export interface TankDialogData {
  tank?: Tank;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-tank-dialog',
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
      {{ data.mode === 'create' ? 'Add Tank' : 'Edit Tank' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="tank-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="e.g., A01" maxlength="20">
            @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
              <mat-error>Code is required</mat-error>
            }
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g., Fermentation Tank 1">
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select formControlName="tank_type">
              @for (type of tankTypes; track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Material</mat-label>
            <mat-select formControlName="material">
              @for (material of materials; track material.value) {
                <mat-option [value]="material.value">{{ material.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Capacity (L)</mat-label>
            <input matInput type="number" formControlName="capacity_l" min="0">
            @if (form.get('capacity_l')?.hasError('required') && form.get('capacity_l')?.touched) {
              <mat-error>Capacity is required</mat-error>
            }
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Current Volume (L)</mat-label>
            <input matInput type="number" formControlName="current_volume_l" min="0">
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Location</mat-label>
            <input matInput formControlName="location" placeholder="e.g., Cellar A">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (status of statuses; track status.value) {
                <mat-option [value]="status.value">{{ status.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        
        <div class="form-checkboxes">
          <mat-checkbox formControlName="has_cooling">Has Cooling</mat-checkbox>
          <mat-checkbox formControlName="has_heating">Has Heating</mat-checkbox>
          <mat-checkbox formControlName="is_active">Active</mat-checkbox>
        </div>
        
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3" 
                    placeholder="Additional notes..."></textarea>
        </mat-form-field>
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
    .tank-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 500px;
      padding-top: 0.5rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    mat-form-field {
      width: 100%;
    }
    
    .form-checkboxes {
      display: flex;
      gap: 1.5rem;
      margin: 0.5rem 0;
    }
  `]
})
export class TankDialogComponent {
  form: FormGroup;
  
  tankTypes = Object.entries(TANK_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  materials = Object.entries(TANK_MATERIAL_LABELS).map(([value, label]) => ({ value, label }));
  statuses = Object.entries(TANK_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TankDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TankDialogData
  ) {
    this.form = this.fb.group({
      code: [data.tank?.code || '', Validators.required],
      name: [data.tank?.name || ''],
      tank_type: [data.tank?.tank_type || 'STORAGE'],
      material: [data.tank?.material || 'STAINLESS'],
      capacity_l: [data.tank?.capacity_l || 0, [Validators.required, Validators.min(0)]],
      current_volume_l: [data.tank?.current_volume_l || 0, Validators.min(0)],
      location: [data.tank?.location || ''],
      status: [data.tank?.status || 'EMPTY'],
      has_cooling: [data.tank?.has_cooling || false],
      has_heating: [data.tank?.has_heating || false],
      is_active: [data.tank?.is_active ?? true],
      notes: [data.tank?.notes || ''],
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSave(): void {
    if (this.form.valid) {
      const result: TankCreate = this.form.value;
      this.dialogRef.close(result);
    }
  }
}



