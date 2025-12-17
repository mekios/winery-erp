import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { LabService, Analysis, SAMPLE_TYPE_LABELS } from '../lab.service';
import { EquipmentService, TankDropdown, BarrelDropdown } from '@features/equipment/equipment.service';
import { ProductionService } from '@features/production/production.service';
import { HarvestService, BatchList } from '@features/harvest/harvest.service';

@Component({
  selector: 'app-analysis-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormPageComponent, NumberInputComponent,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Analysis' : 'New Analysis'"
      [subtitle]="isEdit ? 'Update lab analysis data' : 'Record wine quality parameters'"
      icon="flask-conical"
      iconClass="purple"
      [saveLabel]="isEdit ? 'Update' : 'Save'"
      [canSave]="form.valid && !saving()"
      [saving]="saving()"
      (save)="onSubmit()">
      
      <form [formGroup]="form" class="form-sections">
        <!-- Sample Source -->
        <section class="form-section">
          <h3 class="section-title">SAMPLE SOURCE</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Sample Type</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="sample_type" (selectionChange)="onSampleTypeChange()">
                  @for (type of sampleTypes; track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Analysis Date</label>
              <mat-form-field appearance="outline">
                <input matInput [matDatepicker]="picker" formControlName="analysis_date">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
          
          <!-- Dynamic source selector based on sample type -->
          <div class="form-row">
            @if (form.get('sample_type')?.value === 'TANK') {
              <div class="form-group">
                <label class="form-label required">Tank</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="tank">
                    @for (tank of tanks(); track tank.id) {
                      <mat-option [value]="tank.id">{{ tank.code }} - {{ tank.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }
            @if (form.get('sample_type')?.value === 'BARREL') {
              <div class="form-group">
                <label class="form-label required">Barrel</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="barrel">
                    @for (barrel of barrels(); track barrel.id) {
                      <mat-option [value]="barrel.id">{{ barrel.code }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }
            @if (form.get('sample_type')?.value === 'WINE_LOT') {
              <div class="form-group">
                <label class="form-label required">Wine Lot</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="wine_lot">
                    @for (lot of wineLots(); track lot.id) {
                      <mat-option [value]="lot.id">{{ lot.lot_code }} - {{ lot.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }
            @if (form.get('sample_type')?.value === 'BATCH') {
              <div class="form-group">
                <label class="form-label required">Batch</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="batch">
                    @for (batch of batches(); track batch.id) {
                      <mat-option [value]="batch.id">{{ batch.batch_code }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }
            
            <div class="form-group">
              <label class="form-label">Temperature</label>
              <app-number-input
                formControlName="temperature_c"
                unit="°C"
                placeholder="20"
                [min]="-5"
                [max]="40"
                [step]="0.5"
                [decimals]="1">
              </app-number-input>
            </div>
          </div>
        </section>
        
        <!-- Basic Parameters -->
        <section class="form-section highlight">
          <h3 class="section-title">🧪 BASIC PARAMETERS</h3>
          
          <div class="form-row three-col">
            <div class="form-group">
              <label class="form-label">pH</label>
              <app-number-input
                formControlName="ph"
                placeholder="3.50"
                [min]="2.0"
                [max]="5.0"
                [step]="0.01"
                [decimals]="2">
              </app-number-input>
              <span class="param-hint">Target: 3.2 - 3.6</span>
            </div>
            
            <div class="form-group">
              <label class="form-label">TA (Titratable Acidity)</label>
              <app-number-input
                formControlName="ta_gl"
                unit="g/L"
                placeholder="6.0"
                [min]="0"
                [max]="20"
                [step]="0.1"
                [decimals]="2">
              </app-number-input>
              <span class="param-hint">Target: 5 - 8 g/L</span>
            </div>
            
            <div class="form-group">
              <label class="form-label">VA (Volatile Acidity)</label>
              <app-number-input
                formControlName="va_gl"
                unit="g/L"
                placeholder="0.3"
                [min]="0"
                [max]="3"
                [step]="0.01"
                [decimals]="2">
              </app-number-input>
              <span class="param-hint warning">Max: 0.6 (white), 0.8 (red)</span>
            </div>
          </div>
        </section>
        
        <!-- Sugar & Fermentation -->
        <section class="form-section">
          <h3 class="section-title">🍇 SUGAR & FERMENTATION</h3>
          
          <div class="form-row three-col">
            <div class="form-group">
              <label class="form-label">Brix</label>
              <app-number-input
                formControlName="brix"
                unit="°"
                placeholder="24.0"
                [min]="-5"
                [max]="40"
                [step]="0.1"
                [decimals]="1">
              </app-number-input>
            </div>
            
            <div class="form-group">
              <label class="form-label">Density</label>
              <app-number-input
                formControlName="density"
                placeholder="0.9950"
                [min]="0.9"
                [max]="1.2"
                [step]="0.0001"
                [decimals]="4">
              </app-number-input>
            </div>
            
            <div class="form-group">
              <label class="form-label">Residual Sugar</label>
              <app-number-input
                formControlName="residual_sugar_gl"
                unit="g/L"
                placeholder="2.0"
                [min]="0"
                [max]="400"
                [step]="0.5"
                [decimals]="1">
              </app-number-input>
            </div>
          </div>
        </section>
        
        <!-- Sulfur Dioxide -->
        <section class="form-section highlight-blue">
          <h3 class="section-title">🛡️ SULFUR DIOXIDE</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Free SO₂</label>
              <app-number-input
                formControlName="free_so2_mgl"
                unit="mg/L"
                placeholder="30"
                [min]="0"
                [max]="200"
                [step]="1"
                [decimals]="1">
              </app-number-input>
              <span class="param-hint">Target: 25 - 40 mg/L</span>
            </div>
            
            <div class="form-group">
              <label class="form-label">Total SO₂</label>
              <app-number-input
                formControlName="total_so2_mgl"
                unit="mg/L"
                placeholder="80"
                [min]="0"
                [max]="400"
                [step]="5"
                [decimals]="1">
              </app-number-input>
              <span class="param-hint">Max: 150 (red), 200 (white)</span>
            </div>
          </div>
          
          @if (molecularSO2() !== null) {
            <div class="computed-value">
              <span class="label">Molecular SO₂ (computed):</span>
              <span class="value" [class.good]="molecularSO2()! >= 0.5 && molecularSO2()! <= 0.8"
                    [class.warning]="molecularSO2()! < 0.5"
                    [class.danger]="molecularSO2()! > 1.0">
                {{ molecularSO2() | number:'1.2-2' }} mg/L
              </span>
              <span class="hint">Target: 0.5 - 0.8 mg/L</span>
            </div>
          }
        </section>
        
        <!-- Alcohol -->
        <section class="form-section">
          <h3 class="section-title">🍷 ALCOHOL</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Alcohol</label>
              <app-number-input
                formControlName="alcohol_abv"
                unit="% ABV"
                placeholder="13.5"
                [min]="0"
                [max]="25"
                [step]="0.1"
                [decimals]="1">
              </app-number-input>
            </div>
            
            @if (potentialAlcohol() !== null) {
              <div class="form-group">
                <label class="form-label">Potential Alcohol (from Brix)</label>
                <div class="computed-display">
                  {{ potentialAlcohol() | number:'1.1-1' }}% ABV
                </div>
              </div>
            }
          </div>
        </section>
        
        <!-- Organic Acids (Collapsible) -->
        <section class="form-section collapsible" [class.expanded]="showOrganicAcids()">
          <button type="button" class="section-toggle" (click)="showOrganicAcids.set(!showOrganicAcids())">
            <h3 class="section-title">🔬 ORGANIC ACIDS (OPTIONAL)</h3>
            <span class="toggle-icon">{{ showOrganicAcids() ? '−' : '+' }}</span>
          </button>
          
          @if (showOrganicAcids()) {
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Malic Acid</label>
                <app-number-input
                  formControlName="malic_acid_gl"
                  unit="g/L"
                  placeholder="2.0"
                  [min]="0"
                  [max]="10"
                  [step]="0.1"
                  [decimals]="2">
                </app-number-input>
              </div>
              
              <div class="form-group">
                <label class="form-label">Lactic Acid</label>
                <app-number-input
                  formControlName="lactic_acid_gl"
                  unit="g/L"
                  placeholder="0.5"
                  [min]="0"
                  [max]="5"
                  [step]="0.1"
                  [decimals]="2">
                </app-number-input>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tartaric Acid</label>
                <app-number-input
                  formControlName="tartaric_acid_gl"
                  unit="g/L"
                  placeholder="5.0"
                  [min]="0"
                  [max]="10"
                  [step]="0.1"
                  [decimals]="2">
                </app-number-input>
              </div>
              
              <div class="form-group">
                <label class="form-label">Citric Acid</label>
                <app-number-input
                  formControlName="citric_acid_gl"
                  unit="g/L"
                  placeholder="0.3"
                  [min]="0"
                  [max]="3"
                  [step]="0.05"
                  [decimals]="2">
                </app-number-input>
              </div>
            </div>
          }
        </section>
        
        <!-- Notes -->
        <section class="form-section">
          <h3 class="section-title">NOTES</h3>
          
          <div class="form-group">
            <mat-form-field appearance="outline">
              <textarea matInput formControlName="notes" rows="3"
                        placeholder="Observations, sensory notes, recommendations..."></textarea>
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
      border-radius: 16px;
      border: 1px solid var(--border-color);
      padding: 1.5rem;
      
      &.highlight {
        border-left: 4px solid var(--primary);
      }
      
      &.highlight-blue {
        border-left: 4px solid #3b82f6;
      }
      
      &.collapsible {
        padding: 0;
        
        .section-toggle {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          
          &:hover {
            background: var(--gray-50);
          }
          
          .section-title {
            margin: 0;
            padding: 0;
            border: none;
          }
          
          .toggle-icon {
            font-size: 1.5rem;
            color: var(--text-secondary);
          }
        }
        
        &.expanded .section-toggle {
          border-bottom: 1px solid var(--border-color);
        }
        
        .form-row {
          padding: 1.5rem;
          padding-top: 1rem;
        }
      }
    }
    
    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin: 0 0 1.25rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color-light);
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1rem;
      
      &:last-child { margin-bottom: 0; }
      
      &.three-col {
        grid-template-columns: repeat(3, 1fr);
        
        @media (max-width: 900px) {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 600px) {
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
    
    mat-form-field { width: 100%; }
    
    .param-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
      
      &.warning {
        color: var(--warning);
      }
    }
    
    .computed-value {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--gray-50);
      border-radius: 12px;
      margin-top: 1rem;
      
      .label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      
      .value {
        font-size: 1.25rem;
        font-weight: 700;
        
        &.good { color: var(--success); }
        &.warning { color: var(--warning); }
        &.danger { color: var(--danger); }
      }
      
      .hint {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-left: auto;
      }
    }
    
    .computed-display {
      padding: 0.875rem 1rem;
      background: var(--gray-100);
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  `]
})
export class AnalysisFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private labService = inject(LabService);
  private equipmentService = inject(EquipmentService);
  private productionService = inject(ProductionService);
  private harvestService = inject(HarvestService);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  isEdit = false;
  analysisId: string | null = null;
  saving = signal(false);
  showOrganicAcids = signal(false);

  tanks = signal<TankDropdown[]>([]);
  barrels = signal<BarrelDropdown[]>([]);
  wineLots = signal<{ id: string; lot_code: string; name: string }[]>([]);
  batches = signal<BatchList[]>([]);

  sampleTypes = Object.entries(SAMPLE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  constructor() {
    this.form = this.fb.group({
      sample_type: ['TANK', Validators.required],
      analysis_date: [new Date(), Validators.required],
      tank: [null],
      barrel: [null],
      wine_lot: [null],
      batch: [null],
      temperature_c: [null],
      // Basic
      ph: [null],
      ta_gl: [null],
      va_gl: [null],
      // Sugar
      brix: [null],
      density: [null],
      residual_sugar_gl: [null],
      // SO2
      free_so2_mgl: [null],
      total_so2_mgl: [null],
      // Alcohol
      alcohol_abv: [null],
      // Organic acids
      malic_acid_gl: [null],
      lactic_acid_gl: [null],
      tartaric_acid_gl: [null],
      citric_acid_gl: [null],
      // Notes
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.analysisId = id;
      this.loadAnalysis(id);
    }
  }

  loadDropdowns(): void {
    this.equipmentService.getTanksDropdown().subscribe(t => this.tanks.set(t));
    this.equipmentService.getBarrelsDropdown().subscribe(b => this.barrels.set(b));
    this.productionService.getWineLots({ page_size: 100 }).subscribe(r => {
      this.wineLots.set(r.results.map(l => ({ id: l.id, lot_code: l.lot_code, name: l.name })));
    });
    this.harvestService.getBatches({ page_size: 100 }).subscribe(r => this.batches.set(r.results));
  }

  loadAnalysis(id: string): void {
    this.labService.getAnalysis(id).subscribe({
      next: (analysis) => {
        this.form.patchValue({
          ...analysis,
          analysis_date: new Date(analysis.analysis_date),
        });
        
        // Show organic acids section if any values are present
        if (analysis.malic_acid_gl || analysis.lactic_acid_gl || 
            analysis.tartaric_acid_gl || analysis.citric_acid_gl) {
          this.showOrganicAcids.set(true);
        }
      },
      error: () => {
        this.snackBar.open('Failed to load analysis', 'Close', { duration: 3000 });
        this.goBack();
      }
    });
  }

  onSampleTypeChange(): void {
    // Clear all source fields when type changes
    this.form.patchValue({
      tank: null,
      barrel: null,
      wine_lot: null,
      batch: null,
    });
  }

  // Computed values
  molecularSO2(): number | null {
    const freeSO2 = this.form.get('free_so2_mgl')?.value;
    const ph = this.form.get('ph')?.value;
    
    if (freeSO2 === null || ph === null) return null;
    
    try {
      const denominator = 1 + Math.pow(10, ph - 1.81);
      return freeSO2 / denominator;
    } catch {
      return null;
    }
  }

  potentialAlcohol(): number | null {
    const brix = this.form.get('brix')?.value;
    if (brix === null) return null;
    return brix * 0.55;
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.saving.set(true);
    const value = this.form.value;

    const data = {
      ...value,
      analysis_date: value.analysis_date.toISOString(),
    };

    const request$ = this.isEdit && this.analysisId
      ? this.labService.updateAnalysis(this.analysisId, data)
      : this.labService.createAnalysis(data);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Analysis updated' : 'Analysis saved',
          'Close',
          { duration: 3000 }
        );
        this.goBack();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.tank?.[0] || 'Failed to save';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/lab/analyses']);
  }
}

