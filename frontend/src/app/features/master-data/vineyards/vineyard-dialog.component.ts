import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { VineyardBlock, VineyardBlockCreate, GrowerDropdown, GrapeVarietyDropdown } from '../master-data.service';

export interface VineyardDialogData {
  vineyard?: VineyardBlock;
  mode: 'create' | 'edit';
  growers: GrowerDropdown[];
  varieties: GrapeVarietyDropdown[];
}

@Component({
  selector: 'app-vineyard-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add Vineyard Block' : 'Edit Vineyard Block' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="vineyard-form">
        <mat-form-field appearance="outline">
          <mat-label>Grower</mat-label>
          <mat-select formControlName="grower">
            @for (g of data.growers; track g.id) {
              <mat-option [value]="g.id">{{ g.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('grower')?.hasError('required') && form.get('grower')?.touched) {
            <mat-error>Grower is required</mat-error>
          }
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Block Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g., North Slope">
            @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" maxlength="20">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Region</mat-label>
            <input matInput formControlName="region">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Subregion</mat-label>
            <input matInput formControlName="subregion">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Primary Variety (optional - for quick add)</mat-label>
          <mat-select formControlName="variety">
            <mat-option [value]="null">-- None --</mat-option>
            @for (v of data.varieties; track v.id) {
              <mat-option [value]="v.id">{{ v.name }} ({{ v.color }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Area (acres)</mat-label>
            <input matInput type="number" formControlName="area_acres" min="0" step="0.1">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Elevation (m)</mat-label>
            <input matInput type="number" formControlName="elevation_m" min="0">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Soil Type</mat-label>
            <input matInput formControlName="soil_type">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Year Planted</mat-label>
            <input matInput type="number" formControlName="year_planted" min="1900" max="2100">
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
    .vineyard-form { display: flex; flex-direction: column; gap: 0.25rem; min-width: 500px; padding-top: 0.5rem; }
    mat-form-field { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class VineyardDialogComponent {
  form: FormGroup;
  
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<VineyardDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: VineyardDialogData) {
    //  Extract first variety if editing a vineyard with varieties
    const primaryVariety = data.vineyard?.varieties_data && data.vineyard.varieties_data.length > 0
      ? data.vineyard.varieties_data.find(v => v.is_primary)?.variety || data.vineyard.varieties_data[0].variety
      : null;
    
    this.form = this.fb.group({
      grower: [data.vineyard?.grower || '', Validators.required],
      name: [data.vineyard?.name || '', Validators.required],
      code: [data.vineyard?.code || ''],
      region: [data.vineyard?.region || ''],
      subregion: [data.vineyard?.subregion || ''],
      variety: [primaryVariety],
      area_acres: [data.vineyard?.area_acres || null],
      elevation_m: [data.vineyard?.elevation_m || null],
      soil_type: [data.vineyard?.soil_type || ''],
      year_planted: [data.vineyard?.year_planted || null],
      notes: [data.vineyard?.notes || ''],
      is_active: [data.vineyard?.is_active ?? true],
    });
  }
  
  onCancel(): void { this.dialogRef.close(); }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    const formValue = this.form.value;
    const data: VineyardBlockCreate = {
      ...formValue,
      varieties: formValue.variety ? [{ variety: formValue.variety, is_primary: true }] : []
    };
    delete (data as any).variety; // Remove the temporary 'variety' field
    
    this.dialogRef.close(data);
  }
}










