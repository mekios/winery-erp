import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { InventoryService, Material } from '../inventory.service';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FormPageComponent,
    NumberInputComponent,
  ],
  template: `
    <app-form-page
      [title]="isEditMode ? 'Edit Material' : 'Add Material'"
      [subtitle]="isEditMode ? 'Update material information' : 'Add a new winemaking material'"
      icon="flask"
      [saveLabel]="isEditMode ? 'Update' : 'Create'"
      [saving]="saving()"
      [canSave]="form.valid"
      (save)="onSubmit()">
      
      <form [formGroup]="form" class="form-content">
        <div class="form-section">
          <div class="form-grid">
            <!-- Name -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Material Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Potassium Metabisulfite" />
              @if (form.get('name')?.hasError('required')) {
                <mat-error>Material name is required</mat-error>
              }
            </mat-form-field>

            <!-- Code -->
            <mat-form-field appearance="outline">
              <mat-label>Product Code (Optional)</mat-label>
              <input matInput formControlName="code" placeholder="e.g., SO2-KMS-100" />
            </mat-form-field>

            <!-- Category -->
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                @for (category of categories(); track category.value) {
                  <mat-option [value]="category.value">{{ category.label }}</mat-option>
                }
              </mat-select>
              @if (form.get('category')?.hasError('required')) {
                <mat-error>Category is required</mat-error>
              }
            </mat-form-field>

            <!-- Unit -->
            <mat-form-field appearance="outline">
              <mat-label>Unit of Measurement</mat-label>
              <mat-select formControlName="unit">
                @for (unit of units(); track unit.value) {
                  <mat-option [value]="unit.value">{{ unit.label }}</mat-option>
                }
              </mat-select>
              @if (form.get('unit')?.hasError('required')) {
                <mat-error>Unit is required</mat-error>
              }
            </mat-form-field>

            <!-- Supplier -->
            <mat-form-field appearance="outline">
              <mat-label>Supplier (Optional)</mat-label>
              <input matInput formControlName="supplier" placeholder="e.g., WineChem Supplies" />
            </mat-form-field>

            <!-- Low Stock Threshold -->
            <app-number-input
              formControlName="low_stock_threshold"
              label="Low Stock Threshold (Optional)"
              [decimals]="2"
              [min]="0"
              placeholder="Alert when stock falls below">
            </app-number-input>

            <!-- Notes -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes (Optional)</mat-label>
              <textarea
                matInput
                formControlName="notes"
                rows="4"
                placeholder="Additional notes, specifications, or usage instructions"></textarea>
            </mat-form-field>

            <!-- Is Active -->
            <div class="checkbox-field full-width">
              <mat-checkbox formControlName="is_active">
                Active (uncheck to archive this material)
              </mat-checkbox>
            </div>
          </div>
        </div>
      </form>
    </app-form-page>
  `,
  styleUrls: ['./material-form.component.scss']
})
export class MaterialFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  materialId: string | null = null;
  isEditMode = false;

  categories = signal<{ value: string; label: string }[]>([]);
  units = signal<{ value: string; label: string }[]>([]);

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownOptions();
    
    this.materialId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.materialId;

    if (this.isEditMode && this.materialId) {
      this.loadMaterial(this.materialId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      code: ['', Validators.maxLength(50)],
      category: ['', Validators.required],
      unit: ['', Validators.required],
      supplier: ['', Validators.maxLength(200)],
      notes: [''],
      low_stock_threshold: [null],
      is_active: [true],
    });
  }

  loadDropdownOptions(): void {
    this.inventoryService.getMaterialCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err: any) => console.error('Error loading categories:', err),
    });

    this.inventoryService.getMaterialUnits().subscribe({
      next: (units) => this.units.set(units),
      error: (err: any) => console.error('Error loading units:', err),
    });
  }

  loadMaterial(id: string): void {
    this.loading.set(true);

    this.inventoryService.getMaterial(id).subscribe({
      next: (material) => {
        this.form.patchValue({
          name: material.name,
          code: material.code,
          category: material.category,
          unit: material.unit,
          supplier: material.supplier,
          notes: material.notes,
          low_stock_threshold: material.low_stock_threshold,
          is_active: material.is_active,
        });
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading material:', err);
        this.snackBar.open('Failed to load material', 'Close', { duration: 3000 });
        this.router.navigate(['/inventory/materials']);
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formData = this.form.value;

    const request = this.isEditMode && this.materialId
      ? this.inventoryService.updateMaterial(this.materialId, formData)
      : this.inventoryService.createMaterial(formData);

    request.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Material updated successfully' : 'Material created successfully';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.router.navigate(['/inventory/materials']);
      },
      error: (err: any) => {
        console.error('Error saving material:', err);
        this.snackBar.open('Failed to save material', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }
}
