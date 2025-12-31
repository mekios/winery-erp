import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HarvestSeason, HarvestSeasonCreate } from '../harvest.service';

export interface SeasonDialogData {
  season?: HarvestSeason;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-season-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Create Harvest Season' : 'Edit Harvest Season' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="season-form">
        <mat-form-field appearance="outline">
          <mat-label>Year</mat-label>
          <input matInput type="number" formControlName="year" min="2000" max="2100">
          @if (form.get('year')?.hasError('required') && form.get('year')?.touched) {
            <mat-error>Year is required</mat-error>
          }
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Harvest 2024">
          <mat-hint>Leave blank to auto-generate</mat-hint>
        </mat-form-field>
        
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="start_date">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="end_date">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
        
        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
        
        <mat-checkbox formControlName="is_active">Active Season</mat-checkbox>
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
  styleUrls: ['./season-dialog.component.scss']
})
export class SeasonDialogComponent {
  form: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SeasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SeasonDialogData
  ) {
    this.form = this.fb.group({
      year: [data.season?.year || new Date().getFullYear(), Validators.required],
      name: [data.season?.name || ''],
      start_date: [data.season?.start_date ? new Date(data.season.start_date) : null],
      end_date: [data.season?.end_date ? new Date(data.season.end_date) : null],
      notes: [data.season?.notes || ''],
      is_active: [data.season?.is_active ?? true],
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSave(): void {
    if (this.form.valid) {
      const value = this.form.value;
      const result: HarvestSeasonCreate = {
        ...value,
        start_date: value.start_date ? this.formatDate(value.start_date) : null,
        end_date: value.end_date ? this.formatDate(value.end_date) : null,
      };
      this.dialogRef.close(result);
    }
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}










