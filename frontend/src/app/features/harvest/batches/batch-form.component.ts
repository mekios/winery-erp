import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { MatDialog } from '@angular/material/dialog';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { HarvestService, Batch, HarvestSeasonDropdown, SOURCE_TYPE_LABELS, FractionType, FRACTION_TYPE_LABELS } from '../harvest.service';
import { EquipmentService, TankDropdown } from '../../equipment/equipment.service';
import { MasterDataService, GrapeVarietyDropdown, VineyardBlockDropdown } from '../../master-data/master-data.service';
import { FractionFormDialogComponent, FractionFormDialogData } from './fraction-form-dialog.component';

@Component({
  selector: 'app-batch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
        
        <!-- Source & Volume -->
        <section class="form-section">
          <h3 class="section-title">SOURCE & VOLUME</h3>
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
              <label class="form-label">Must Volume</label>
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
        
        <!-- Batch Fractions -->
        <section class="form-section">
          <div class="section-header-with-action">
            <h3 class="section-title no-border">📦 BATCH FRACTIONS</h3>
            @if (!isEdit) {
              <button mat-stroked-button color="primary" type="button" (click)="addFraction()">
                <mat-icon>add</mat-icon>
                Add Fraction
              </button>
            } @else if (batch()) {
              <button mat-stroked-button color="primary" type="button" (click)="openFractionDialog()">
                <mat-icon>add</mat-icon>
                Add Fraction
              </button>
            }
          </div>
          
          @if (!isEdit) {
            <!-- Create Mode: Inline Fraction Form -->
            @if (fractionsArray.length > 0) {
              <div formArrayName="fractions" class="fractions-list">
                @for (fraction of fractionsArray.controls; track fraction; let i = $index) {
                  <div class="fraction-card" [formGroupName]="i">
                    <div class="fraction-header">
                      <span class="fraction-number">#{{ i + 1 }}</span>
                      <button mat-icon-button type="button" (click)="removeFraction(i)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                    
                    <div class="fraction-form">
                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Fraction Type</mat-label>
                          <mat-select formControlName="fraction_type">
                            <mat-select-trigger>
                              {{ getFractionTypeLabel(fraction.get('fraction_type')?.value) }}
                            </mat-select-trigger>
                            @for (type of fractionTypes; track type.value) {
                              <mat-option [value]="type.value">
                                <div class="fraction-option">
                                  <mat-icon>{{ getFractionIcon(type.value) }}</mat-icon>
                                  <span>{{ type.label }}</span>
                                </div>
                              </mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                        
                        <mat-form-field appearance="outline">
                          <mat-label>Tank</mat-label>
                          <mat-select formControlName="tank">
                            <mat-option [value]="null">— None —</mat-option>
                            @for (tank of tanks(); track tank.id) {
                              <mat-option [value]="tank.id">{{ tank.display_name }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      </div>
                      
                      <div class="form-row">
                        <div class="volume-input">
                          <label class="form-label">Volume</label>
                          <app-number-input
                            formControlName="volume_l"
                            unit="L"
                            placeholder="0"
                            [min]="0"
                            [step]="50"
                            [quickValues]="[100, 250, 500, 1000]">
                          </app-number-input>
                          @if (getFractionCapacityError(i)) {
                            <span class="field-error">{{ getFractionCapacityError(i) }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
              
              <div class="fractions-summary">
                <div class="summary-item">
                  <span class="summary-label">Total Fractions:</span>
                  <span class="summary-value">{{ fractionsArray.length }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Volume:</span>
                  <span class="summary-value">{{ getTotalFractionVolume() | number:'1.0-0' }} L</span>
                </div>
                <div class="summary-item" [class.warning]="getTotalFractionVolume() > (form.get('must_volume_l')?.value || 0)">
                  <span class="summary-label">Remaining:</span>
                  <span class="summary-value">
                    {{ getRemainingVolume() | number:'1.0-0' }} L
                  </span>
                </div>
              </div>
            } @else {
              <div class="no-fractions">
                <mat-icon>layers</mat-icon>
                <p>No fractions defined yet</p>
                <p class="hint">Split this batch into fractions (free run, press, etc.) or leave empty</p>
              </div>
            }
          } @else if (isEdit && batch()) {
            <!-- Edit Mode: Show existing fractions -->
            @if (batch()!.fractions.length > 0) {
              <div class="fractions-list">
                @for (fraction of batch()!.fractions; track fraction.id) {
                  <div class="fraction-card">
                    <div class="fraction-header">
                      <div class="fraction-title">
                        <mat-icon class="fraction-icon">{{ getFractionIcon(fraction.fraction_type) }}</mat-icon>
                        <div>
                          <div class="fraction-code">{{ fraction.fraction_code }}</div>
                          <div class="fraction-type">{{ fraction.fraction_type_display }}</div>
                        </div>
                      </div>
                      <button mat-icon-button type="button" (click)="deleteFraction(fraction.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                    
                    <div class="fraction-details">
                      <div class="detail-item">
                        <span class="detail-label">Tank:</span>
                        @if (fraction.tank_id && fraction.tank_code) {
                          <a [routerLink]="['/equipment/tanks', fraction.tank_id]" class="detail-value tank-link">
                            {{ fraction.tank_code }}
                            <mat-icon class="link-icon">open_in_new</mat-icon>
                          </a>
                        } @else {
                          <span class="detail-value">—</span>
                        }
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Volume:</span>
                        <span class="detail-value">{{ fraction.volume_l | number:'1.0-0' }} L</span>
                      </div>
                      @if (fraction.separation_datetime) {
                        <div class="detail-item">
                          <span class="detail-label">Date:</span>
                          <span class="detail-value">{{ fraction.separation_datetime | date:'short' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
              
              <div class="fractions-summary">
                <div class="summary-item">
                  <span class="summary-label">Total Fractions:</span>
                  <span class="summary-value">{{ batch()!.fractions.length }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Volume:</span>
                  <span class="summary-value">{{ batch()!.total_fraction_volume | number:'1.0-0' }} L</span>
                </div>
                <div class="summary-item" [class.warning]="batch()!.total_fraction_volume > batch()!.must_volume_l">
                  <span class="summary-label">Remaining:</span>
                  <span class="summary-value">
                    {{ (batch()!.must_volume_l - batch()!.total_fraction_volume) | number:'1.0-0' }} L
                  </span>
                </div>
              </div>
            } @else {
              <div class="no-fractions">
                <mat-icon>layers</mat-icon>
                <p>No fractions created yet</p>
                <p class="hint">Split this batch into fractions (free run, press, etc.)</p>
              </div>
            }
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
  styleUrls: ['./batch-form.component.scss']
})
export class BatchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private harvestService = inject(HarvestService);
  private equipmentService = inject(EquipmentService);
  private masterDataService = inject(MasterDataService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
  form!: FormGroup;
  saving = signal(false);
  batch = signal<Batch | null>(null);
  
  seasons = signal<HarvestSeasonDropdown[]>([]);
  tanks = signal<TankDropdown[]>([]);
  varieties = signal<GrapeVarietyDropdown[]>([]);
  vineyards = signal<VineyardBlockDropdown[]>([]);
  
  sourceTypes = Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  fractionTypes = Object.entries(FRACTION_TYPE_LABELS).map(([value, label]) => ({
    value: value as FractionType,
    label
  }));
  
  get isEdit(): boolean {
    return !!this.batch();
  }
  
  get sourcesArray(): FormArray {
    return this.form.get('sources') as FormArray;
  }
  
  get fractionsArray(): FormArray {
    return this.form.get('fractions') as FormArray;
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
      source_type: ['OWN'],
      must_volume_l: [null],
      notes: [''],
      sources: this.fb.array([]),
      fractions: this.fb.array([]),
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
  
  addFraction(): void {
    this.fractionsArray.push(this.fb.group({
      fraction_type: ['', Validators.required],
      tank: [null],
      volume_l: [0, [Validators.required, Validators.min(1)]],
      separation_datetime: [''],
      notes: ['']
    }));
  }
  
  removeFraction(index: number): void {
    this.fractionsArray.removeAt(index);
  }
  
  getTotalFractionVolume(): number {
    let total = 0;
    for (let i = 0; i < this.fractionsArray.length; i++) {
      const volume = this.fractionsArray.at(i).get('volume_l')?.value || 0;
      total += parseFloat(volume);
    }
    return total;
  }
  
  getRemainingVolume(): number {
    const mustVolume = this.form.get('must_volume_l')?.value || 0;
    return mustVolume - this.getTotalFractionVolume();
  }
  
  getFractionCapacityError(index: number): string | null {
    const fraction = this.fractionsArray.at(index);
    const tankId = fraction.get('tank')?.value;
    const volume = fraction.get('volume_l')?.value;
    
    if (!tankId || !volume || volume <= 0) return null;
    
    const tank = this.tanks().find(t => t.id === tankId);
    if (!tank) return null;
    
    const available = tank.available_capacity_l;
    if (volume > available) {
      return `Tank ${tank.code} can only accept ${available}L (Current: ${tank.current_volume_l}L / Capacity: ${tank.capacity_l}L)`;
    }
    
    return null;
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const value = this.form.value;
    
    // Clean up fractions data - remove empty strings, set null for empty datetime
    const fractions = (value.fractions || []).map((f: any) => ({
      ...f,
      separation_datetime: f.separation_datetime || null,
      notes: f.notes || '',
      tank: f.tank || null
    }));
    
    const data = {
      ...value,
      intake_date: value.intake_date ? this.formatDate(value.intake_date) : null,
      fractions
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
        const msg = err.error?.non_field_errors?.[0] || err.error?.fractions?.[0]?.separation_datetime?.[0] || 'Failed to save';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // Batch Fractions Methods
  
  openFractionDialog(): void {
    if (!this.batch()) return;
    
    const b = this.batch()!;
    const dialogData: FractionFormDialogData = {
      batchId: b.id,
      batchCode: b.batch_code,
      batchVolume: b.must_volume_l,
      usedVolume: b.total_fraction_volume || 0
    };
    
    const dialogRef = this.dialog.open(FractionFormDialogComponent, {
      width: '600px',
      data: dialogData,
      disableClose: false
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload batch to get updated fractions
        this.loadBatch(b.id);
        this.snackBar.open('Fraction created successfully', 'Close', { duration: 3000 });
      }
    });
  }
  
  deleteFraction(fractionId: string): void {
    if (!confirm('Are you sure you want to delete this fraction?')) {
      return;
    }
    
    this.harvestService.deleteFraction(fractionId).subscribe({
      next: () => {
        // Reload batch to get updated fractions
        if (this.batch()) {
          this.loadBatch(this.batch()!.id);
        }
        this.snackBar.open('Fraction deleted successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to delete fraction', 'Close', { duration: 3000 });
      }
    });
  }
  
  getFractionIcon(type: FractionType): string {
    const icons: Record<FractionType, string> = {
      FREE_RUN: 'opacity',
      PRESS_1: 'compress',
      PRESS_2: 'compress',
      PRESS_3: 'compress',
      SKIN_CONTACT: 'access_time',
      SETTLING: 'layers',
      RACKING: 'arrow_downward',
      OTHER: 'more_horiz'
    };
    return icons[type] || 'circle';
  }
  
  getFractionTypeLabel(type: FractionType | null): string {
    if (!type) return '';
    return FRACTION_TYPE_LABELS[type] || type;
  }
}

