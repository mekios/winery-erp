import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';

import { IconComponent } from '@shared/components/icon/icon.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { InventoryService, MaterialDropdown, MovementType, StockLocation } from '../inventory.service';

@Component({
  selector: 'app-movement-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    IconComponent,
    NumberInputComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      <app-icon name="truck" [size]="20"></app-icon>
      Record Stock Movement
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="movementForm">
        <div class="form-grid">
          <!-- Material -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Material</mat-label>
            <mat-select formControlName="material">
              @for (material of materials(); track material.id) {
                <mat-option [value]="material.id">
                  {{ material.name }} ({{ material.current_stock }} {{ material.unit_display }})
                </mat-option>
              }
            </mat-select>
            <mat-error>{{ getErrorMessage('material') }}</mat-error>
          </mat-form-field>

          <!-- Movement Type -->
          <mat-form-field appearance="outline">
            <mat-label>Movement Type</mat-label>
            <mat-select formControlName="movement_type">
              @for (type of movementTypes(); track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ getErrorMessage('movement_type') }}</mat-error>
          </mat-form-field>

          <!-- Quantity -->
          <app-number-input
            formControlName="quantity"
            label="Quantity"
            [decimals]="3"
            [min]="0.001"
            [required]="true">
          </app-number-input>

          <!-- Location -->
          <mat-form-field appearance="outline">
            <mat-label>Location</mat-label>
            <mat-select formControlName="location">
              @for (location of locations(); track location.value) {
                <mat-option [value]="location.value">{{ location.label }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ getErrorMessage('location') }}</mat-error>
          </mat-form-field>

          <!-- Destination Location (only for transfers) -->
          @if (isTransfer()) {
            <mat-form-field appearance="outline">
              <mat-label>Destination Location</mat-label>
              <mat-select formControlName="destination_location">
                @for (location of locations(); track location.value) {
                  <mat-option [value]="location.value">{{ location.label }}</mat-option>
                }
              </mat-select>
              <mat-error>{{ getErrorMessage('destination_location') }}</mat-error>
            </mat-form-field>
          }

          <!-- Movement Date -->
          <mat-form-field appearance="outline">
            <mat-label>Movement Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="movement_date" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error>{{ getErrorMessage('movement_date') }}</mat-error>
          </mat-form-field>

          <!-- Reference Number -->
          <mat-form-field appearance="outline">
            <mat-label>Reference Number (Optional)</mat-label>
            <input matInput formControlName="reference_number" placeholder="e.g., PO-12345" />
          </mat-form-field>

          <!-- Unit Cost -->
          <app-number-input
            formControlName="unit_cost"
            label="Unit Cost (Optional)"
            [decimals]="2"
            [min]="0"
            placeholder="Cost per unit">
          </app-number-input>

          <!-- Notes -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notes (Optional)</mat-label>
            <textarea
              matInput
              formControlName="notes"
              rows="3"
              placeholder="Additional details"></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="onCancel()" [disabled]="saving()">
        Cancel
      </button>
      <button
        mat-flat-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="saving()">
        @if (saving()) {
          <span>Recording...</span>
        } @else {
          <span>Record Movement</span>
        }
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './movement-form-dialog.component.scss'
})
export class MovementFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = signal(false);
  
  materials = signal<MaterialDropdown[]>([]);
  movementTypes = signal<{ value: string; label: string }[]>([]);
  locations = signal<{ value: string; label: string }[]>([]);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MovementFormDialogComponent>,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
  }

  initForm(): void {
    this.form = this.fb.group({
      material: ['', Validators.required],
      movement_type: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.001)]],
      location: ['', Validators.required],
      destination_location: [''],
      movement_date: [new Date(), Validators.required],
      reference_number: [''],
      unit_cost: [null, Validators.min(0)],
      notes: [''],
    });

    // Watch movement_type to conditionally require destination_location
    this.form.get('movement_type')?.valueChanges.subscribe((type) => {
      const destControl = this.form.get('destination_location');
      if (type === 'TRANSFER') {
        destControl?.setValidators(Validators.required);
      } else {
        destControl?.clearValidators();
        destControl?.setValue('');
      }
      destControl?.updateValueAndValidity();
    });
  }

  loadDropdownOptions(): void {
    this.inventoryService.getMaterialsDropdown().subscribe({
      next: (materials) => this.materials.set(materials),
      error: (err: any) => console.error('Error loading materials:', err),
    });

    this.inventoryService.getMovementTypes().subscribe({
      next: (types) => this.movementTypes.set(types),
      error: (err: any) => console.error('Error loading movement types:', err),
    });

    this.inventoryService.getStockLocations().subscribe({
      next: (locations) => this.locations.set(locations),
      error: (err: any) => console.error('Error loading locations:', err),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formData = {
      ...this.form.value,
      movement_date: new Date(this.form.value.movement_date).toISOString(),
    };

    this.inventoryService.createMovement(formData).subscribe({
      next: () => {
        this.snackBar.open('Movement recorded successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error creating movement:', err);
        this.snackBar.open('Failed to record movement', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('min')) {
      const min = control.errors['min'].min;
      return `Minimum value is ${min}`;
    }

    return 'Invalid value';
  }

  isTransfer(): boolean {
    return this.form.get('movement_type')?.value === 'TRANSFER';
  }
}

