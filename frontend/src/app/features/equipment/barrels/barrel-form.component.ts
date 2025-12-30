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
import { EquipmentService, Barrel } from '../equipment.service';
import { MasterDataService, WoodTypeDropdown } from '@features/master-data/master-data.service';

const TOAST_LEVELS = [
  { value: 'LIGHT', label: 'Light', icon: '🌾' },
  { value: 'MEDIUM', label: 'Medium', icon: '🔥' },
  { value: 'MEDIUM_PLUS', label: 'Medium Plus', icon: '🔥🔥' },
  { value: 'HEAVY', label: 'Heavy', icon: '🔥🔥🔥' },
];

const STATUSES = [
  { value: 'EMPTY', label: 'Empty' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'CONDITIONING', label: 'Conditioning' },
  { value: 'RETIRED', label: 'Retired' },
];

@Component({
  selector: 'app-barrel-form',
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
      [title]="isEdit ? 'Edit Barrel' : 'New Barrel'"
      [subtitle]="isEdit ? 'Update barrel details' : 'Add a new barrel for aging'"
      icon="barrel"
      iconClass="amber"
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
                <input matInput formControlName="code" placeholder="B001" maxlength="20">
                @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
                  <mat-error>Code is required</mat-error>
                }
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Volume</label>
              <app-number-input
                formControlName="volume_l"
                unit="L"
                placeholder="225"
                [min]="0"
                [step]="25"
                [quickValues]="[225, 228, 300, 400, 500]">
              </app-number-input>
            </div>
          </div>
        </section>
        
        <!-- Wood Characteristics -->
        <section class="form-section">
          <h3 class="section-title">WOOD CHARACTERISTICS</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Wood Type</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="wood_type">
                  <mat-option [value]="null">-- None --</mat-option>
                  @for (w of woodTypes(); track w.id) {
                    <mat-option [value]="w.id">
                      <span class="wood-option">
                        <span class="wood-icon">🪵</span>
                        {{ w.name }}
                      </span>
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Toast Level</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="toast_level">
                  @for (t of toastLevels; track t.value) {
                    <mat-option [value]="t.value">
                      <span class="toast-option">
                        <span class="toast-icon">{{ t.icon }}</span>
                        {{ t.label }}
                      </span>
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Provenance -->
        <section class="form-section">
          <h3 class="section-title">PROVENANCE</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cooper (Manufacturer)</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="cooper" placeholder="e.g., Seguin Moreau">
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Vintage Year</label>
              <mat-form-field appearance="outline">
                <input matInput type="number" formControlName="vintage_year" min="1900" max="2100" placeholder="2023">
              </mat-form-field>
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
                <input matInput formControlName="location" placeholder="Barrel Room, Row 2">
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="status">
                  @for (s of statuses; track s.value) {
                    <mat-option [value]="s.value">{{ s.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
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
                        placeholder="History, wine types aged, condition notes..."></textarea>
            </mat-form-field>
          </div>
          <div class="toggle-card" [class.active]="form.get('is_active')?.value">
            <mat-checkbox formControlName="is_active">
              <div class="toggle-content">
                <span class="toggle-label">Active Barrel</span>
                <span class="toggle-hint">Active barrels can be used for aging</span>
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
    
    .wood-option, .toast-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .wood-icon, .toast-icon {
      font-size: 1.125rem;
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
export class BarrelFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private equipmentService = inject(EquipmentService);
  private masterDataService = inject(MasterDataService);
  private snackBar = inject(MatSnackBar);
  
  form!: FormGroup;
  saving = signal(false);
  barrel = signal<Barrel | null>(null);
  woodTypes = signal<WoodTypeDropdown[]>([]);
  
  toastLevels = TOAST_LEVELS;
  statuses = STATUSES;
  
  get isEdit(): boolean {
    return !!this.barrel();
  }
  
  ngOnInit(): void {
    this.initForm();
    this.loadWoodTypes();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBarrel(id);
    }
  }
  
  private loadWoodTypes(): void {
    this.masterDataService.getWoodTypesDropdown().subscribe({
      next: (woodTypes) => this.woodTypes.set(woodTypes),
      error: () => console.error('Failed to load wood types')
    });
  }
  
  private initForm(): void {
    this.form = this.fb.group({
      code: ['', Validators.required],
      volume_l: [225],
      wood_type: [null],
      toast_level: ['MEDIUM'],
      cooper: [''],
      vintage_year: [new Date().getFullYear()],
      location: [''],
      status: ['EMPTY'],
      notes: [''],
      is_active: [true],
    });
  }
  
  private loadBarrel(id: string): void {
    this.equipmentService.getBarrel(id).subscribe({
      next: (barrel) => {
        this.barrel.set(barrel);
        this.form.patchValue(barrel);
      },
      error: () => {
        this.snackBar.open('Failed to load barrel', 'Close', { duration: 3000 });
        this.router.navigate(['/equipment/barrels']);
      }
    });
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const data = this.form.value;
    
    const request$ = this.isEdit
      ? this.equipmentService.updateBarrel(this.barrel()!.id, data)
      : this.equipmentService.createBarrel(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Barrel updated' : 'Barrel created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/equipment/barrels']);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}

