import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { InventoryService, Material, MaterialCategory, MaterialUnit } from '../inventory.service';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    PageHeaderComponent,
    IconComponent,
    SkeletonComponent,
    NumberInputComponent,
  ],
  templateUrl: './material-form.component.html',
  styleUrl: './material-form.component.scss'
})
export class MaterialFormComponent implements OnInit {
  form!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  materialId: string | null = null;
  isEditMode = false;

  categories = signal<MaterialCategory[]>([]);
  units = signal<MaterialUnit[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {
    this.initForm();
  }

  ngOnInit(): void {
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
      error: (err) => console.error('Error loading categories:', err),
    });

    this.inventoryService.getMaterialUnits().subscribe({
      next: (units) => this.units.set(units),
      error: (err) => console.error('Error loading units:', err),
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
      error: (err) => {
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
      error: (err) => {
        console.error('Error saving material:', err);
        this.snackBar.open('Failed to save material', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/materials']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('maxlength')) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters`;
    }

    return 'Invalid value';
  }
}

