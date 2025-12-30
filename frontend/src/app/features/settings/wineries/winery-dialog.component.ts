import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Winery, WineryCreate } from './wineries-admin.service';

export interface WineryDialogData {
  winery?: Winery;
  mode: 'create' | 'edit';
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Athens', label: 'Europe/Athens' },
  { value: 'Europe/Paris', label: 'Europe/Paris' },
  { value: 'Europe/Rome', label: 'Europe/Rome' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles' },
  { value: 'America/New_York', label: 'America/New York' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney' },
];

@Component({
  selector: 'app-winery-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Create New Winery' : 'Edit Winery' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="winery-form">
        <mat-form-field appearance="outline">
          <mat-label>Winery Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Santorini Estates">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g., SNT" maxlength="10">
          <mat-hint>Short unique code (max 10 chars)</mat-hint>
          @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
            <mat-error>Code is required</mat-error>
          }
        </mat-form-field>
        
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Country</mat-label>
            <input matInput formControlName="country" placeholder="e.g., Greece">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Region</mat-label>
            <input matInput formControlName="region" placeholder="e.g., Santorini">
          </mat-form-field>
        </div>
        
        <mat-form-field appearance="outline">
          <mat-label>Address</mat-label>
          <textarea matInput formControlName="address" rows="2" 
                    placeholder="Full address..."></textarea>
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Timezone</mat-label>
          <mat-select formControlName="timezone">
            @for (tz of timezones; track tz.value) {
              <mat-option [value]="tz.value">{{ tz.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="form.invalid"
              (click)="onSave()">
        {{ data.mode === 'create' ? 'Create Winery' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .winery-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 450px;
      padding-top: 0.5rem;
    }
    mat-form-field { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class WineryDialogComponent {
  form: FormGroup;
  timezones = TIMEZONES;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WineryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WineryDialogData
  ) {
    this.form = this.fb.group({
      name: [data.winery?.name || '', Validators.required],
      code: [data.winery?.code || '', Validators.required],
      country: [data.winery?.country || ''],
      region: [data.winery?.region || ''],
      address: [data.winery?.address || ''],
      timezone: [data.winery?.timezone || 'UTC'],
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value as WineryCreate);
    }
  }
}










