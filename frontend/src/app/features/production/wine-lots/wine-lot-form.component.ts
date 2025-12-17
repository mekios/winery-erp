import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { 
  ProductionService, 
  WineLotCreate, 
  WineLotStatus,
  WINE_LOT_STATUS_LABELS 
} from '../production.service';
import { EquipmentService, TankDropdown, BarrelDropdown } from '@features/equipment/equipment.service';

@Component({
  selector: 'app-wine-lot-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormPageComponent,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    NumberInputComponent
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Wine Lot' : 'New Wine Lot'"
      [subtitle]="isEdit ? 'Update wine lot details' : 'Create a new wine lot'"
      icon="wine"
      [saveLabel]="isEdit ? 'Update' : 'Create'"
      [canSave]="form.valid && !saving()"
      [saving]="saving()"
      (save)="onSubmit()">
      
      <form [formGroup]="form" class="form-sections">
        <!-- Basic Info -->
        <section class="form-section">
          <h3 class="section-title">BASIC INFORMATION</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Lot Code</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="lot_code" placeholder="e.g., 2024-CS-001">
                @if (form.get('lot_code')?.hasError('required') && form.get('lot_code')?.touched) {
                  <mat-error>Lot code is required</mat-error>
                }
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Vintage</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="vintage">
                  @for (year of vintageYears; track year) {
                    <mat-option [value]="year">{{ year }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Name</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="name" placeholder="e.g., Reserve Cabernet">
                @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label">Wine Type</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="wine_type" placeholder="e.g., Cabernet Sauvignon">
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Volume & Location -->
        <section class="form-section">
          <h3 class="section-title">VOLUME & LOCATION</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Initial Volume</label>
              <app-number-input
                formControlName="initial_volume_l"
                unit="L"
                placeholder="0"
                [min]="0"
                [step]="100"
                [quickValues]="[500, 1000, 2000, 5000]">
              </app-number-input>
            </div>
            
            <div class="form-group">
              <label class="form-label">Current Volume</label>
              <app-number-input
                formControlName="current_volume_l"
                unit="L"
                placeholder="0"
                [min]="0"
                [max]="form.get('initial_volume_l')?.value || 100000"
                [step]="50"
                [showProgress]="true">
              </app-number-input>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Current Tank</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="current_tank">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (tank of tanks(); track tank.id) {
                    <mat-option [value]="tank.id">{{ tank.code }} - {{ tank.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label">Current Barrel</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="current_barrel">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (barrel of barrels(); track barrel.id) {
                    <mat-option [value]="barrel.id">{{ barrel.code }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Status -->
        <section class="form-section">
          <h3 class="section-title">STATUS</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Status</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="status">
                  @for (status of statuses; track status.value) {
                    <mat-option [value]="status.value">{{ status.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notes</label>
            <mat-form-field appearance="outline">
              <textarea matInput formControlName="notes" rows="3" placeholder="Any additional notes..."></textarea>
            </mat-form-field>
          </div>
        </section>
      </form>
      
    </app-form-page>
  `,
  styles: [`
    .form-sections { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-section {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 1.5rem;
    }
    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      text-transform: uppercase;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      
      &.required::after {
        content: ' *';
        color: var(--danger);
      }
    }
    mat-form-field { width: 100%; }
  `]
})
export class WineLotFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productionService = inject(ProductionService);
  private equipmentService = inject(EquipmentService);
  private snackBar = inject(MatSnackBar);
  
  form: FormGroup;
  isEdit = false;
  lotId: string | null = null;
  saving = signal(false);
  
  tanks = signal<TankDropdown[]>([]);
  barrels = signal<BarrelDropdown[]>([]);
  
  statuses = Object.entries(WINE_LOT_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  
  vintageYears: number[] = [];
  
  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 20; y--) {
      this.vintageYears.push(y);
    }
    
    this.form = this.fb.group({
      lot_code: ['', Validators.required],
      name: ['', Validators.required],
      vintage: [currentYear, Validators.required],
      wine_type: [''],
      status: ['IN_PROGRESS', Validators.required],
      initial_volume_l: [0],
      current_volume_l: [0],
      current_tank: [null],
      current_barrel: [null],
      notes: [''],
    });
  }
  
  ngOnInit(): void {
    this.loadDropdowns();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.lotId = id;
      this.loadWineLot(id);
    }
  }
  
  loadDropdowns(): void {
    this.equipmentService.getTanksDropdown().subscribe(tanks => this.tanks.set(tanks));
    this.equipmentService.getBarrelsDropdown().subscribe(barrels => this.barrels.set(barrels));
  }
  
  loadWineLot(id: string): void {
    this.productionService.getWineLot(id).subscribe({
      next: (lot) => {
        this.form.patchValue({
          lot_code: lot.lot_code,
          name: lot.name,
          vintage: lot.vintage,
          wine_type: lot.wine_type,
          status: lot.status,
          initial_volume_l: lot.initial_volume_l,
          current_volume_l: lot.current_volume_l,
          current_tank: lot.current_tank,
          current_barrel: lot.current_barrel,
          notes: lot.notes,
        });
      },
      error: () => {
        this.snackBar.open('Failed to load wine lot', 'Close', { duration: 3000 });
        this.goBack();
      }
    });
  }
  
  onSubmit(): void {
    if (!this.form.valid) return;
    
    this.saving.set(true);
    const formValue = this.form.value;
    
    const data: WineLotCreate = {
      lot_code: formValue.lot_code,
      name: formValue.name,
      vintage: formValue.vintage,
      wine_type: formValue.wine_type || undefined,
      status: formValue.status,
      initial_volume_l: formValue.initial_volume_l || undefined,
      current_volume_l: formValue.current_volume_l || undefined,
      current_tank: formValue.current_tank || undefined,
      current_barrel: formValue.current_barrel || undefined,
      notes: formValue.notes || undefined,
    };
    
    const request$ = this.isEdit && this.lotId
      ? this.productionService.updateWineLot(this.lotId, data)
      : this.productionService.createWineLot(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Wine lot updated' : 'Wine lot created', 'Close', { duration: 3000 });
        this.goBack();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.lot_code?.[0] || 'Failed to save wine lot';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/production/wine-lots']);
  }
}

