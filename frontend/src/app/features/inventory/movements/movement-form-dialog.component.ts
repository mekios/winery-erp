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
  templateUrl: './movement-form-dialog.component.html',
  styleUrl: './movement-form-dialog.component.scss'
})
export class MovementFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = signal(false);
  
  materials = signal<MaterialDropdown[]>([]);
  movementTypes = signal<MovementType[]>([]);
  locations = signal<StockLocation[]>([]);

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
      error: (err) => console.error('Error loading materials:', err),
    });

    this.inventoryService.getMovementTypes().subscribe({
      next: (types) => this.movementTypes.set(types),
      error: (err) => console.error('Error loading movement types:', err),
    });

    this.inventoryService.getStockLocations().subscribe({
      next: (locations) => this.locations.set(locations),
      error: (err) => console.error('Error loading locations:', err),
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

