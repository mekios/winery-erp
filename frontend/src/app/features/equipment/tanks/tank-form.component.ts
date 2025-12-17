import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { EquipmentService, Tank, TANK_TYPE_LABELS, TANK_MATERIAL_LABELS, TANK_STATUS_LABELS } from '../equipment.service';

@Component({
  selector: 'app-tank-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    FormPageComponent,
    NumberInputComponent,
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Tank' : 'New Tank'"
      [subtitle]="isEdit ? 'Update tank details' : 'Add a new tank to your facility'"
      icon="tank"
      iconClass="blue"
      [saveLabel]="isEdit ? 'Update' : 'Create'"
      [saving]="saving()"
      [canSave]="form.valid"
      (save)="onSave()">
      
      <form [formGroup]="form" class="form-sections">
        <!-- Basic Information -->
        <section class="form-section">
          <h3 class="section-title">BASIC INFORMATION</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Code</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="code" placeholder="A01" maxlength="20">
                @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
                  <mat-error>Code is required</mat-error>
                }
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Name</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="name" placeholder="Fermentation Tank 1">
              </mat-form-field>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Type</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="tank_type">
                  @for (type of tankTypes; track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label required">Material</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="material">
                  @for (material of materials; track material.value) {
                    <mat-option [value]="material.value">{{ material.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Capacity & Volume -->
        <section class="form-section">
          <h3 class="section-title">CAPACITY & VOLUME</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Capacity</label>
              <app-number-input
                formControlName="capacity_l"
                unit="L"
                placeholder="5,000"
                [min]="0"
                [step]="100"
                [quickValues]="[1000, 2000, 5000, 10000, 20000]">
              </app-number-input>
              @if (form.get('capacity_l')?.hasError('required') && form.get('capacity_l')?.touched) {
                <span class="field-error">Capacity is required</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Current Volume</label>
              <app-number-input
                formControlName="current_volume_l"
                unit="L"
                placeholder="0"
                [min]="0"
                [max]="form.get('capacity_l')?.value || 100000"
                [step]="50"
                [showProgress]="true">
              </app-number-input>
            </div>
          </div>
        </section>
        
        <!-- Location & Status -->
        <section class="form-section">
          <h3 class="section-title">LOCATION & STATUS</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="location" placeholder="Cellar A, Row 3">
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="status">
                  @for (status of statuses; track status.value) {
                    <mat-option [value]="status.value">{{ status.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Features & Options -->
        <section class="form-section">
          <h3 class="section-title">FEATURES & OPTIONS</h3>
          <div class="feature-grid">
            <div class="feature-card" [class.active]="form.get('has_cooling')?.value">
              <mat-checkbox formControlName="has_cooling">
                <div class="feature-content">
                  <span class="feature-icon">❄️</span>
                  <span class="feature-label">Cooling</span>
                </div>
              </mat-checkbox>
            </div>
            <div class="feature-card" [class.active]="form.get('has_heating')?.value">
              <mat-checkbox formControlName="has_heating">
                <div class="feature-content">
                  <span class="feature-icon">🔥</span>
                  <span class="feature-label">Heating</span>
                </div>
              </mat-checkbox>
            </div>
          </div>
        </section>
        
        <!-- Additional Details -->
        <section class="form-section">
          <h3 class="section-title">ADDITIONAL DETAILS</h3>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <mat-form-field appearance="outline">
              <textarea matInput formControlName="notes" rows="3" 
                        placeholder="Maintenance history, special considerations..."></textarea>
            </mat-form-field>
          </div>
          <div class="toggle-card" [class.active]="form.get('is_active')?.value">
            <mat-checkbox formControlName="is_active">
              <div class="toggle-content">
                <span class="toggle-label">Active Tank</span>
                <span class="toggle-hint">Active tanks can receive wine transfers</span>
              </div>
            </mat-checkbox>
          </div>
        </section>
      </form>
      
    </app-form-page>
  `,
  styles: [`
    .form-sections {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .form-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
    }
    
    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      letter-spacing: 0.05em;
      margin: 0 0 1.25rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color-light);
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1rem;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
    }
    
    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      
      &.required::after {
        content: ' *';
        color: var(--danger);
      }
    }
    
    mat-form-field {
      width: 100%;
    }
    
    .field-error {
      font-size: 0.75rem;
      color: var(--danger);
      margin-top: 0.25rem;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    
    .feature-card {
      background: var(--gray-50);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.2s ease;
      cursor: pointer;
      
      &:hover {
        border-color: var(--primary-light);
        background: rgba(124, 58, 237, 0.04);
        transform: translateY(-2px);
      }
      
      &.active {
        border-color: var(--primary);
        background: rgba(124, 58, 237, 0.08);
      }
      
      mat-checkbox {
        width: 100%;
      }
    }
    
    .feature-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-left: 0.5rem;
    }
    
    .feature-icon {
      font-size: 1.5rem;
    }
    
    .feature-label {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .toggle-card {
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1rem;
      transition: all 0.2s ease;
      
      &.active {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.3);
      }
    }
    
    .toggle-content {
      display: flex;
      flex-direction: column;
      margin-left: 0.5rem;
    }
    
    .toggle-label {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .toggle-hint {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 0.125rem;
    }
  `]
})
export class TankFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private equipmentService = inject(EquipmentService);
  private snackBar = inject(MatSnackBar);
  
  form!: FormGroup;
  saving = signal(false);
  tank = signal<Tank | null>(null);
  
  tankTypes = Object.entries(TANK_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  materials = Object.entries(TANK_MATERIAL_LABELS).map(([value, label]) => ({ value, label }));
  statuses = Object.entries(TANK_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  
  get isEdit(): boolean {
    return !!this.tank();
  }
  
  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTank(id);
    }
  }
  
  private initForm(): void {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: [''],
      tank_type: ['STORAGE'],
      material: ['STAINLESS'],
      capacity_l: [null, [Validators.required, Validators.min(0)]],
      current_volume_l: [0, Validators.min(0)],
      location: [''],
      status: ['EMPTY'],
      has_cooling: [false],
      has_heating: [false],
      is_active: [true],
      notes: [''],
    });
  }
  
  private loadTank(id: string): void {
    this.equipmentService.getTank(id).subscribe({
      next: (tank) => {
        this.tank.set(tank);
        this.form.patchValue(tank);
      },
      error: () => {
        this.snackBar.open('Failed to load tank', 'Close', { duration: 3000 });
        this.router.navigate(['/equipment/tanks']);
      }
    });
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const data = this.form.value;
    
    const request$ = this.isEdit
      ? this.equipmentService.updateTank(this.tank()!.id, data)
      : this.equipmentService.createTank(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Tank updated' : 'Tank created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/equipment/tanks']);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}

