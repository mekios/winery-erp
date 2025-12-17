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
import { MasterDataService, VineyardBlock, GrowerDropdown, GrapeVarietyDropdown } from '../master-data.service';

@Component({
  selector: 'app-vineyard-form',
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
      [title]="isEdit ? 'Edit Vineyard' : 'New Vineyard'"
      [subtitle]="isEdit ? 'Update vineyard block details' : 'Add a new vineyard block or parcel'"
      icon="vineyard"
      iconClass="amber"
      [saveLabel]="isEdit ? 'Update' : 'Create'"
      [saving]="saving()"
      [canSave]="form.valid"
      (save)="onSave()">
      
      <form [formGroup]="form" class="form-sections">
        <!-- Ownership -->
        <section class="form-section">
          <h3 class="section-title">OWNERSHIP</h3>
          <div class="form-group">
            <label class="form-label required">Grower</label>
            <mat-form-field appearance="outline">
              <mat-select formControlName="grower" placeholder="Select a grower">
                @for (g of growers(); track g.id) {
                  <mat-option [value]="g.id">{{ g.name }}</mat-option>
                }
              </mat-select>
              @if (form.get('grower')?.hasError('required') && form.get('grower')?.touched) {
                <mat-error>Grower is required</mat-error>
              }
            </mat-form-field>
          </div>
        </section>
        
        <!-- Basic Information -->
        <section class="form-section">
          <h3 class="section-title">BASIC INFORMATION</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Block Name</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="name" placeholder="e.g., North Slope">
                @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Code</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="code" placeholder="NS01" maxlength="20">
              </mat-form-field>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Region</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="region" placeholder="e.g., Nemea">
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Subregion</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="subregion" placeholder="e.g., Ancient Nemea">
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Viticulture Details -->
        <section class="form-section">
          <h3 class="section-title">VITICULTURE DETAILS</h3>
          <div class="form-group">
            <label class="form-label">Primary Variety</label>
            <mat-form-field appearance="outline">
              <mat-select formControlName="primary_variety" placeholder="Select variety">
                <mat-option [value]="null">— None —</mat-option>
                @for (v of varieties(); track v.id) {
                  <mat-option [value]="v.id">
                    <span class="variety-option">
                      <span class="color-dot" [class]="v.color.toLowerCase()"></span>
                      {{ v.name }}
                    </span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Area</label>
              <app-number-input
                formControlName="area_ha"
                unit="ha"
                placeholder="0.00"
                [min]="0"
                [step]="0.1"
                [decimals]="2"
                [quickValues]="[0.5, 1, 2, 5, 10]">
              </app-number-input>
            </div>
            <div class="form-group">
              <label class="form-label">Elevation</label>
              <app-number-input
                formControlName="elevation_m"
                unit="m"
                placeholder="0"
                [min]="0"
                [max]="2000"
                [step]="50"
                [quickValues]="[100, 200, 300, 500, 800]">
              </app-number-input>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Soil Type</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="soil_type" placeholder="e.g., Clay, Limestone">
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Year Planted</label>
              <mat-form-field appearance="outline">
                <input matInput type="number" formControlName="year_planted" min="1900" max="2100" placeholder="2020">
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
                        placeholder="Microclimate, irrigation, special characteristics..."></textarea>
            </mat-form-field>
          </div>
          <div class="toggle-card" [class.active]="form.get('is_active')?.value">
            <mat-checkbox formControlName="is_active">
              <div class="toggle-content">
                <span class="toggle-label">Active Vineyard</span>
                <span class="toggle-hint">Active vineyards appear in harvest selections</span>
              </div>
            </mat-checkbox>
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
      margin-bottom: 0.5rem;
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }
    .form-group { display: flex; flex-direction: column; }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      &.required::after { content: ' *'; color: var(--danger); }
    }
    mat-form-field { width: 100%; }
    .variety-option { display: flex; align-items: center; gap: 0.5rem; }
    .color-dot {
      width: 10px; height: 10px; border-radius: 50%;
      &.red { background: linear-gradient(135deg, #991b1b, #dc2626); }
      &.white { background: linear-gradient(135deg, #fef3c7, #fcd34d); border: 1px solid #d4a500; }
      &.rose { background: linear-gradient(135deg, #fda4af, #fb7185); }
    }
    .toggle-card {
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.2s ease;
      &.active { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.3); }
    }
    .toggle-content { display: flex; flex-direction: column; margin-left: 0.5rem; }
    .toggle-label { font-weight: 600; color: var(--text-primary); }
    .toggle-hint { font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.125rem; }
  `]
})
export class VineyardFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private masterDataService = inject(MasterDataService);
  private snackBar = inject(MatSnackBar);
  
  form!: FormGroup;
  saving = signal(false);
  vineyard = signal<VineyardBlock | null>(null);
  growers = signal<GrowerDropdown[]>([]);
  varieties = signal<GrapeVarietyDropdown[]>([]);
  
  get isEdit(): boolean {
    return !!this.vineyard();
  }
  
  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVineyard(id);
    }
  }
  
  private initForm(): void {
    this.form = this.fb.group({
      grower: ['', Validators.required],
      name: ['', Validators.required],
      code: [''],
      region: [''],
      subregion: [''],
      primary_variety: [null],
      area_ha: [null],
      elevation_m: [null],
      soil_type: [''],
      year_planted: [null],
      notes: [''],
      is_active: [true],
    });
  }
  
  private loadDropdowns(): void {
    this.masterDataService.getGrowersDropdown().subscribe(g => this.growers.set(g));
    this.masterDataService.getVarietiesDropdown().subscribe(v => this.varieties.set(v));
  }
  
  private loadVineyard(id: string): void {
    this.masterDataService.getVineyard(id).subscribe({
      next: (vineyard) => {
        this.vineyard.set(vineyard);
        this.form.patchValue(vineyard);
      },
      error: () => {
        this.snackBar.open('Failed to load vineyard', 'Close', { duration: 3000 });
        this.router.navigate(['/master-data/vineyards']);
      }
    });
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const data = this.form.value;
    
    const request$ = this.isEdit
      ? this.masterDataService.updateVineyard(this.vineyard()!.id, data)
      : this.masterDataService.createVineyard(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Vineyard updated' : 'Vineyard created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/master-data/vineyards']);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}

