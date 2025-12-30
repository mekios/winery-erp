import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { MapPickerComponent } from '@shared/components/map-picker/map-picker.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { MasterDataService, VineyardBlock, GrowerDropdown, GrapeVarietyDropdown, VineyardVarietyCreate } from '../master-data.service';

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
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    FormPageComponent,
    NumberInputComponent,
    MapPickerComponent,
    IconComponent,
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
        
        <!-- Location -->
        <section class="form-section">
          <h3 class="section-title">LOCATION</h3>
          <div class="form-group">
            <label class="form-label">Vineyard Location</label>
            <app-map-picker
              [latitude]="form.get('latitude')?.value"
              [longitude]="form.get('longitude')?.value"
              (locationChange)="onLocationChange($event)">
            </app-map-picker>
          </div>
        </section>
        
        <!-- Grape Varieties -->
        <section class="form-section">
          <div class="section-header">
            <h3 class="section-title">GRAPE VARIETIES</h3>
            <button type="button" mat-stroked-button color="primary" (click)="addVariety()" class="add-variety-btn">
              <mat-icon>add</mat-icon>
              Add Variety
            </button>
          </div>
          
          @if (varietiesArray.length === 0) {
            <div class="empty-state">
              <app-icon name="grape" [size]="48" class="empty-icon"></app-icon>
              <p>No varieties added yet</p>
              <button type="button" mat-flat-button color="primary" (click)="addVariety()">
                Add First Variety
              </button>
            </div>
          } @else {
            <div formArrayName="varieties" class="varieties-list">
              @for (varietyForm of varietiesArray.controls; track $index) {
                <div [formGroupName]="$index" class="variety-item">
                  <div class="variety-fields">
                    <div class="variety-main">
                      <mat-form-field appearance="outline">
                        <mat-label>Variety</mat-label>
                        <mat-select formControlName="variety" placeholder="Select variety">
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
                      
                      <mat-form-field appearance="outline" class="percentage-field">
                        <mat-label>% of Area</mat-label>
                        <input matInput type="number" formControlName="percentage" placeholder="Optional" min="0" max="100" step="0.1">
                        <span matSuffix>%</span>
                      </mat-form-field>
                      
                      <mat-checkbox formControlName="is_primary" class="primary-checkbox">
                        Primary
                      </mat-checkbox>
                    </div>
                    
                    @if (varietyForm.get('notes')?.value || showVarietyNotes[$index]) {
                      <mat-form-field appearance="outline" class="variety-notes">
                        <mat-label>Notes</mat-label>
                        <input matInput formControlName="notes" placeholder="Clone, rootstock, etc.">
                      </mat-form-field>
                    }
                  </div>
                  
                  <div class="variety-actions">
                    @if (!varietyForm.get('notes')?.value && !showVarietyNotes[$index]) {
                      <button type="button" mat-icon-button (click)="toggleVarietyNotes($index)" matTooltip="Add notes">
                        <mat-icon>note_add</mat-icon>
                      </button>
                    }
                    <button type="button" mat-icon-button color="warn" (click)="removeVariety($index)" matTooltip="Remove variety">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </section>
        
        <!-- Viticulture Details -->
        <section class="form-section">
          <h3 class="section-title">VITICULTURE DETAILS</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Area</label>
              <app-number-input
                formControlName="area_acres"
                unit="acres"
                placeholder="0.00"
                [min]="0"
                [step]="0.1"
                [decimals]="2"
                [quickValues]="[1, 5, 10, 20, 50]">
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
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      text-transform: uppercase;
    }
    .section-header .section-title {
      margin-bottom: 0;
    }
    .add-variety-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
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
    
    /* Varieties List */
    .varieties-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .variety-item {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      transition: all 0.2s ease;
      &:hover {
        border-color: var(--primary);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
    }
    .variety-fields {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .variety-main {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      mat-form-field:first-child { flex: 2; }
    }
    .percentage-field {
      flex: 1;
      min-width: 120px;
    }
    .primary-checkbox {
      flex-shrink: 0;
      align-self: center;
      margin-top: 0.5rem;
    }
    .variety-notes {
      width: 100%;
    }
    .variety-actions {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .variety-option { display: flex; align-items: center; gap: 0.5rem; }
    .color-dot {
      width: 10px; height: 10px; border-radius: 50%;
      &.red { background: linear-gradient(135deg, #991b1b, #dc2626); }
      &.white { background: linear-gradient(135deg, #fef3c7, #fcd34d); border: 1px solid #d4a500; }
      &.rose { background: linear-gradient(135deg, #fda4af, #fb7185); }
    }
    
    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-secondary);
      .empty-icon {
        opacity: 0.3;
        margin-bottom: 1rem;
      }
      p {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
      }
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
  showVarietyNotes: boolean[] = [];
  
  get isEdit(): boolean {
    return !!this.vineyard();
  }
  
  get varietiesArray(): FormArray {
    return this.form.get('varieties') as FormArray;
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
      varieties: this.fb.array([]),
      area_acres: [null],
      elevation_m: [null],
      latitude: [null],
      longitude: [null],
      soil_type: [''],
      year_planted: [null],
      notes: [''],
      is_active: [true],
    });
  }
  
  private createVarietyFormGroup(variety?: any): FormGroup {
    return this.fb.group({
      variety: [variety?.variety || '', Validators.required],
      percentage: [variety?.percentage || null],
      is_primary: [variety?.is_primary || false],
      notes: [variety?.notes || '']
    });
  }
  
  addVariety(): void {
    this.varietiesArray.push(this.createVarietyFormGroup());
    this.showVarietyNotes.push(false);
  }
  
  removeVariety(index: number): void {
    this.varietiesArray.removeAt(index);
    this.showVarietyNotes.splice(index, 1);
  }
  
  toggleVarietyNotes(index: number): void {
    this.showVarietyNotes[index] = !this.showVarietyNotes[index];
  }
  
  onLocationChange(location: { latitude: number; longitude: number } | null): void {
    if (location) {
      // Round to 8 decimal places to ensure it fits in the database
      const lat = Math.round(location.latitude * 100000000) / 100000000;
      const lng = Math.round(location.longitude * 100000000) / 100000000;
      
      this.form.patchValue({
        latitude: lat,
        longitude: lng
      });
    } else {
      this.form.patchValue({
        latitude: null,
        longitude: null
      });
    }
    this.form.markAsDirty();
  }
  
  private loadDropdowns(): void {
    this.masterDataService.getGrowersDropdown().subscribe(g => this.growers.set(g));
    this.masterDataService.getVarietiesDropdown().subscribe(v => this.varieties.set(v));
  }
  
  private loadVineyard(id: string): void {
    this.masterDataService.getVineyard(id).subscribe({
      next: (vineyard) => {
        this.vineyard.set(vineyard);
        
        // Populate varieties
        this.varietiesArray.clear();
        this.showVarietyNotes = [];
        if (vineyard.varieties_data && vineyard.varieties_data.length > 0) {
          vineyard.varieties_data.forEach(v => {
            this.varietiesArray.push(this.createVarietyFormGroup(v));
            this.showVarietyNotes.push(!!v.notes);
          });
        }
        
        // Patch other form values
        this.form.patchValue({
          grower: vineyard.grower,
          name: vineyard.name,
          code: vineyard.code,
          region: vineyard.region,
          subregion: vineyard.subregion,
          area_acres: vineyard.area_acres,
          elevation_m: vineyard.elevation_m,
          latitude: vineyard.latitude,
          longitude: vineyard.longitude,
          soil_type: vineyard.soil_type,
          year_planted: vineyard.year_planted,
          notes: vineyard.notes,
          is_active: vineyard.is_active
        });
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
