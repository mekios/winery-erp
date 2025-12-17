import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Barrel, BarrelCreate, WOOD_TYPE_LABELS } from '../equipment.service';

export interface BarrelDialogData {
  barrel?: Barrel;
  mode: 'create' | 'edit';
}

const TOAST_LEVELS = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'MEDIUM_PLUS', label: 'Medium Plus' },
  { value: 'HEAVY', label: 'Heavy' },
];

const STATUSES = [
  { value: 'EMPTY', label: 'Empty' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'CONDITIONING', label: 'Conditioning' },
  { value: 'RETIRED', label: 'Retired' },
];

@Component({
  selector: 'app-barrel-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add Barrel' : 'Edit Barrel' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="barrel-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="e.g., B001">
            @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
              <mat-error>Code is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Volume (L)</mat-label>
            <input matInput type="number" formControlName="volume_l" min="0">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Wood Type</mat-label>
            <mat-select formControlName="wood_type">
              @for (w of woodTypes; track w.value) {
                <mat-option [value]="w.value">{{ w.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Toast Level</mat-label>
            <mat-select formControlName="toast_level">
              @for (t of toastLevels; track t.value) {
                <mat-option [value]="t.value">{{ t.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Cooper</mat-label>
            <input matInput formControlName="cooper" placeholder="Manufacturer">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Vintage Year</mat-label>
            <input matInput type="number" formControlName="vintage_year" min="1900" max="2100">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Location</mat-label>
            <input matInput formControlName="location">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (s of statuses; track s.value) {
                <mat-option [value]="s.value">{{ s.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
        <mat-checkbox formControlName="is_active">Active</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="onSave()">
        {{ data.mode === 'create' ? 'Create' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .barrel-form { display: flex; flex-direction: column; gap: 0.25rem; min-width: 400px; padding-top: 0.5rem; }
    mat-form-field { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class BarrelDialogComponent {
  form: FormGroup;
  woodTypes = Object.entries(WOOD_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  toastLevels = TOAST_LEVELS;
  statuses = STATUSES;
  
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<BarrelDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: BarrelDialogData) {
    this.form = this.fb.group({
      code: [data.barrel?.code || '', Validators.required],
      volume_l: [data.barrel?.volume_l || 225],
      wood_type: [data.barrel?.wood_type || 'FRENCH_OAK'],
      toast_level: [data.barrel?.toast_level || 'MEDIUM'],
      cooper: [data.barrel?.cooper || ''],
      vintage_year: [data.barrel?.vintage_year || new Date().getFullYear()],
      location: [data.barrel?.location || ''],
      status: [data.barrel?.status || 'EMPTY'],
      notes: [data.barrel?.notes || ''],
      is_active: [data.barrel?.is_active ?? true],
    });
  }
  
  onCancel(): void { this.dialogRef.close(); }
  onSave(): void { if (this.form.valid) this.dialogRef.close(this.form.value as BarrelCreate); }
}



