import { Component, OnInit, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';

import { IconComponent } from '@shared/components/icon/icon.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { InventoryService, MaterialDropdown, MovementType, StockLocation } from '../inventory.service';

export interface MovementFormDialogData {
  materialId?: string;
}

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
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="dialog-header">
      <div class="dialog-icon">
        <app-icon name="truck" [size]="20"></app-icon>
      </div>
      <div class="dialog-title-wrap">
        <h2 class="dialog-title">Record Stock Movement</h2>
        <p class="dialog-subtitle">Track material inventory changes</p>
      </div>
    </div>

    <div class="dialog-content">
      <form [formGroup]="form">
        <!-- Material Selection (Highlighted) -->
        <div class="form-section highlight">
          <label class="form-label required">Material</label>
          <mat-form-field appearance="outline">
            <mat-select formControlName="material" (selectionChange)="onMaterialChange()">
              @for (material of materials(); track material.id) {
                <mat-option [value]="material.id">
                  <div class="material-option">
                    <span class="material-name">{{ material.name }}</span>
                    <span class="material-stock">
                      {{ material.current_stock | number:'1.0-2' }} {{ material.unit_display }}
                    </span>
                  </div>
                </mat-option>
              }
            </mat-select>
            @if (form.get('material')?.hasError('required') && form.get('material')?.touched) {
              <mat-error>Please select a material</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Movement Details -->
        <div class="form-section">
          <div class="section-title">Movement Details</div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Movement Type</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="movement_type">
                  @for (type of movementTypes(); track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
                @if (form.get('movement_type')?.hasError('required') && form.get('movement_type')?.touched) {
                  <mat-error>Movement type is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-group">
              <label class="form-label required">
                Quantity @if (selectedMaterialUnit()) {
                  <span class="unit-hint">({{ selectedMaterialUnit() }})</span>
                }
              </label>
              <app-number-input
                formControlName="quantity"
                [decimals]="3"
                [min]="0.001"
                [unit]="selectedMaterialUnit()"
                [placeholder]="'Enter quantity'">
              </app-number-input>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">
                @if (isTransfer()) { From } Location
              </label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="location">
                  @for (location of locations(); track location.value) {
                    <mat-option [value]="location.value">{{ location.label }}</mat-option>
                  }
                </mat-select>
                @if (form.get('location')?.hasError('required') && form.get('location')?.touched) {
                  <mat-error>Location is required</mat-error>
                }
              </mat-form-field>
            </div>

            @if (isTransfer()) {
              <div class="form-group">
                <label class="form-label required">To Location</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="destination_location">
                    @for (location of locations(); track location.value) {
                      <mat-option [value]="location.value">{{ location.label }}</mat-option>
                    }
                  </mat-select>
                  @if (form.get('destination_location')?.hasError('required') && form.get('destination_location')?.touched) {
                    <mat-error>Destination is required</mat-error>
                  }
                </mat-form-field>
              </div>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Movement Date</label>
              <mat-form-field appearance="outline">
                <input matInput [matDatepicker]="picker" formControlName="movement_date" />
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (form.get('movement_date')?.hasError('required') && form.get('movement_date')?.touched) {
                  <mat-error>Date is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-group">
              <label class="form-label">Reference Number</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="reference_number" placeholder="e.g., PO-12345" />
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Cost (Optional Section) -->
        @if (form.get('movement_type')?.value === 'PURCHASE' || form.get('movement_type')?.value === 'RECEIVE') {
          <div class="form-section">
            <div class="section-title">Cost Information</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Unit Cost (€)</label>
                <app-number-input
                  formControlName="unit_cost"
                  [decimals]="2"
                  [min]="0"
                  unit="€"
                  placeholder="Cost per unit">
                </app-number-input>
              </div>

              @if (form.value.unit_cost && form.value.quantity) {
                <div class="form-group">
                  <div class="info-display">
                    <span class="info-label">Total Cost</span>
                    <span class="info-value">€{{ (form.value.unit_cost * form.value.quantity) | number:'1.2-2' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Notes -->
        <div class="form-section">
          <label class="form-label">Notes</label>
          <mat-form-field appearance="outline">
            <textarea
              matInput
              formControlName="notes"
              rows="3"
              placeholder="Additional details about this movement"></textarea>
          </mat-form-field>
        </div>
      </form>
    </div>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" [disabled]="saving()" class="btn-cancel">
        Cancel
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!form.valid || saving()"
        class="btn-primary">
        @if (saving()) {
          <span>Recording...</span>
        } @else {
          <span>Record Movement</span>
        }
      </button>
    </div>
  `,
  styleUrl: './movement-form-dialog.component.scss'
})
export class MovementFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = signal(false);
  
  materials = signal<MaterialDropdown[]>([]);
  movementTypes = signal<{ value: string; label: string }[]>([]);
  locations = signal<{ value: string; label: string }[]>([]);
  selectedMaterialUnit = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MovementFormDialogComponent>,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: MovementFormDialogData
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
    
    // Watch for material changes to update unit
    this.form.get('material')?.valueChanges.subscribe(() => {
      this.updateMaterialUnit();
    });
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
      next: (materials) => {
        this.materials.set(materials);
        
        // Pre-fill material if provided
        if (this.data?.materialId) {
          this.form.patchValue({ material: this.data.materialId });
          this.updateMaterialUnit();
        }
      },
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

  updateMaterialUnit(): void {
    const materialId = this.form.get('material')?.value;
    const material = this.materials().find(m => m.id === materialId);
    const unit = material?.unit_display || material?.unit || '';
    this.selectedMaterialUnit.set(unit);
  }

  onMaterialChange(): void {
    this.updateMaterialUnit();
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

  isTransfer(): boolean {
    return this.form.get('movement_type')?.value === 'TRANSFER';
  }
}
