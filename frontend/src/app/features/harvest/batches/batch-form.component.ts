import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { HarvestService, Batch, HarvestSeasonDropdown, SOURCE_TYPE_LABELS } from '../harvest.service';
import { EquipmentService, TankDropdown } from '../../equipment/equipment.service';
import { MasterDataService, GrapeVarietyDropdown, VineyardBlockDropdown } from '../../master-data/master-data.service';

@Component({
  selector: 'app-batch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    FormPageComponent,
    NumberInputComponent,
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Batch' : 'New Batch'"
      [subtitle]="isEdit ? 'Update batch details' : 'Record grape intake'"
      icon="batch"
      iconClass="rose"
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
              <label class="form-label required">Harvest Season</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="harvest_season">
                  @for (season of seasons(); track season.id) {
                    <mat-option [value]="season.id">{{ season.display_name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label required">Intake Date</label>
              <mat-form-field appearance="outline">
                <input matInput [matDatepicker]="picker" formControlName="intake_date">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Source & Destination -->
        <section class="form-section">
          <h3 class="section-title">SOURCE & DESTINATION</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Source Type</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="source_type">
                  @for (type of sourceTypes; track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Initial Tank</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="initial_tank">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (tank of tanks(); track tank.id) {
                    <mat-option [value]="tank.id">{{ tank.display_name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Estimated Must Volume</label>
              <app-number-input
                formControlName="must_volume_l"
                unit="L"
                placeholder="0"
                [min]="0"
                [step]="100"
                [quickValues]="[500, 1000, 2000, 5000]">
              </app-number-input>
            </div>
          </div>
        </section>
        
        <!-- Grape Sources -->
        <section class="form-section">
          <div class="section-header-with-action">
            <h3 class="section-title no-border">🍇 GRAPE SOURCES</h3>
            <button mat-stroked-button color="primary" type="button" (click)="addSource()">
              <mat-icon>add</mat-icon>
              Add Source
            </button>
          </div>
          
          <div formArrayName="sources" class="sources-list">
            @for (source of sourcesArray.controls; track source; let i = $index) {
              <div class="source-card" [formGroupName]="i">
                <div class="source-header">
                  <span class="source-number">#{{ i + 1 }}</span>
                  <button mat-icon-button type="button" (click)="removeSource(i)" 
                          [disabled]="sourcesArray.length === 1">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                
                <div class="source-form">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Variety</mat-label>
                      <mat-select formControlName="variety">
                        @for (v of varieties(); track v.id) {
                          <mat-option [value]="v.id">{{ v.name }} ({{ v.color }})</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Vineyard</mat-label>
                      <mat-select formControlName="vineyard_block">
                        <mat-option [value]="null">— None —</mat-option>
                        @for (v of vineyards(); track v.id) {
                          <mat-option [value]="v.id">{{ v.display_name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row weight-row">
                    <div class="weight-input">
                      <label class="form-label">Weight</label>
                      <app-number-input
                        formControlName="weight_kg"
                        unit="kg"
                        placeholder="0"
                        [min]="0"
                        [step]="50"
                        [quickValues]="[100, 250, 500, 1000]">
                      </app-number-input>
                    </div>
                    
                    <div class="estimated-toggle">
                      <mat-checkbox formControlName="is_estimated">Estimated weight</mat-checkbox>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
          
          @if (sourcesArray.length === 0) {
            <div class="empty-sources">
              <p>No sources added yet. Add at least one grape source.</p>
              <button mat-stroked-button color="primary" type="button" (click)="addSource()">
                <mat-icon>add</mat-icon>
                Add First Source
              </button>
            </div>
          }
        </section>
        
        <!-- Additional Details -->
        <section class="form-section">
          <h3 class="section-title">ADDITIONAL DETAILS</h3>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <mat-form-field appearance="outline">
              <textarea matInput formControlName="notes" rows="3" 
                        placeholder="Brix readings, observations, quality notes..."></textarea>
            </mat-form-field>
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
      
      &.no-border {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
    }
    
    .section-header-with-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
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
    
    .sources-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .source-card {
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
      }
    }
    
    .source-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    
    .source-number {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--primary);
      background: rgba(124, 77, 255, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
    }
    
    .source-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .weight-row {
      align-items: flex-end;
    }
    
    .weight-input {
      flex: 1;
    }
    
    .estimated-toggle {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--gray-50);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    
    .empty-sources {
      text-align: center;
      padding: 2rem;
      background: var(--gray-50);
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      
      p {
        margin: 0 0 1rem;
        color: var(--text-secondary);
      }
    }
  `]
})
export class BatchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private harvestService = inject(HarvestService);
  private equipmentService = inject(EquipmentService);
  private masterDataService = inject(MasterDataService);
  private snackBar = inject(MatSnackBar);
  
  form!: FormGroup;
  saving = signal(false);
  batch = signal<Batch | null>(null);
  
  seasons = signal<HarvestSeasonDropdown[]>([]);
  tanks = signal<TankDropdown[]>([]);
  varieties = signal<GrapeVarietyDropdown[]>([]);
  vineyards = signal<VineyardBlockDropdown[]>([]);
  
  sourceTypes = Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  
  get isEdit(): boolean {
    return !!this.batch();
  }
  
  get sourcesArray(): FormArray {
    return this.form.get('sources') as FormArray;
  }
  
  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
    
    const id = this.route.snapshot.paramMap.get('id');
    const seasonId = this.route.snapshot.queryParamMap.get('season');
    
    if (id) {
      this.loadBatch(id);
    } else if (seasonId) {
      this.form.patchValue({ harvest_season: seasonId });
    }
  }
  
  private initForm(): void {
    this.form = this.fb.group({
      harvest_season: ['', Validators.required],
      intake_date: [new Date(), Validators.required],
      source_type: ['VINEYARD'],
      initial_tank: [null],
      must_volume_l: [null],
      notes: [''],
      sources: this.fb.array([]),
    });
    
    // Add one default source
    this.addSource();
  }
  
  private loadDropdowns(): void {
    this.harvestService.getSeasonsDropdown().subscribe(s => this.seasons.set(s));
    this.equipmentService.getTanksDropdown().subscribe(t => this.tanks.set(t));
    this.masterDataService.getVarietiesDropdown().subscribe(v => this.varieties.set(v));
    this.masterDataService.getVineyardsDropdown().subscribe(v => this.vineyards.set(v));
  }
  
  private loadBatch(id: string): void {
    this.harvestService.getBatch(id).subscribe({
      next: (batch) => {
        this.batch.set(batch);
        this.form.patchValue({
          harvest_season: batch.harvest_season,
          intake_date: batch.intake_date ? new Date(batch.intake_date) : null,
          source_type: batch.source_type,
          initial_tank: batch.initial_tank,
          must_volume_l: batch.must_volume_l,
          notes: batch.notes,
        });
        
        // Clear default source and load batch sources
        this.sourcesArray.clear();
        if (batch.sources && batch.sources.length > 0) {
          batch.sources.forEach(source => {
            this.sourcesArray.push(this.fb.group({
              variety: [source.variety, Validators.required],
              vineyard_block: [source.vineyard_block],
              weight_kg: [source.weight_kg, [Validators.required, Validators.min(0)]],
              is_estimated: [source.is_estimated],
            }));
          });
        } else {
          this.addSource();
        }
      },
      error: () => {
        this.snackBar.open('Failed to load batch', 'Close', { duration: 3000 });
        this.router.navigate(['/harvest/batches']);
      }
    });
  }
  
  addSource(): void {
    this.sourcesArray.push(this.fb.group({
      variety: ['', Validators.required],
      vineyard_block: [null],
      weight_kg: [0, [Validators.required, Validators.min(0)]],
      is_estimated: [false],
    }));
  }
  
  removeSource(index: number): void {
    if (this.sourcesArray.length > 1) {
      this.sourcesArray.removeAt(index);
    }
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const value = this.form.value;
    const data = {
      ...value,
      intake_date: value.intake_date ? this.formatDate(value.intake_date) : null,
    };
    
    const request$ = this.isEdit
      ? this.harvestService.updateBatch(this.batch()!.id, data)
      : this.harvestService.createBatch(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Batch updated' : 'Batch created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/harvest/batches']);
      },
      error: (err) => {
        const msg = err.error?.non_field_errors?.[0] || 'Failed to save';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

