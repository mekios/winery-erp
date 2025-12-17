import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Grower, GrowerCreate } from '../master-data.service';

export interface GrowerDialogData {
  grower?: Grower;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-grower-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add Grower' : 'Edit Grower' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grower-form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Papadopoulos Vineyards">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Contact Name</mat-label>
          <input matInput formControlName="contact_name" placeholder="Primary contact person">
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" type="tel">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Address</mat-label>
          <textarea matInput formControlName="address" rows="2"></textarea>
        </mat-form-field>
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
    .grower-form { display: flex; flex-direction: column; gap: 0.25rem; min-width: 400px; padding-top: 0.5rem; }
    mat-form-field { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class GrowerDialogComponent {
  form: FormGroup;
  
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<GrowerDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: GrowerDialogData) {
    this.form = this.fb.group({
      name: [data.grower?.name || '', Validators.required],
      contact_name: [data.grower?.contact_name || ''],
      phone: [data.grower?.phone || ''],
      email: [data.grower?.email || '', Validators.email],
      address: [data.grower?.address || ''],
      notes: [data.grower?.notes || ''],
      is_active: [data.grower?.is_active ?? true],
    });
  }
  
  onCancel(): void { this.dialogRef.close(); }
  onSave(): void { if (this.form.valid) this.dialogRef.close(this.form.value as GrowerCreate); }
}




