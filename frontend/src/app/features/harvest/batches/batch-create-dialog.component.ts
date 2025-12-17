import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';

import { HarvestService, HarvestSeasonDropdown, BatchCreate, SOURCE_TYPE_LABELS } from '../harvest.service';
import { EquipmentService, TankDropdown } from '../../equipment/equipment.service';
import { MasterDataService, GrapeVarietyDropdown, VineyardBlockDropdown } from '../../master-data/master-data.service';

export interface BatchCreateDialogData {
  seasonId?: string;
}

@Component({
  selector: 'app-batch-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Create New Batch</h2>
    
    <mat-dialog-content>
      <mat-stepper [linear]="true" #stepper>
        <!-- Step 1: Basic Info -->
        <mat-step [stepControl]="basicForm">
          <ng-template matStepLabel>Basic Info</ng-template>
          <form [formGroup]="basicForm" class="step-form">
            <mat-form-field appearance="outline">
              <mat-label>Harvest Season</mat-label>
              <mat-select formControlName="harvest_season">
                @for (season of seasons(); track season.id) {
                  <mat-option [value]="season.id">{{ season.display_name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Intake Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="intake_date">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Source Type</mat-label>
              <mat-select formControlName="source_type">
                @for (type of sourceTypes; track type.value) {
                  <mat-option [value]="type.value">{{ type.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Initial Tank</mat-label>
              <mat-select formControlName="initial_tank">
                <mat-option [value]="null">-- None --</mat-option>
                @for (tank of tanks(); track tank.id) {
                  <mat-option [value]="tank.id">{{ tank.display_name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Estimated Must Volume (L)</mat-label>
              <input matInput type="number" formControlName="must_volume_l" min="0">
            </mat-form-field>
            
            <div class="step-actions">
              <button mat-button matStepperNext [disabled]="basicForm.invalid">Next</button>
            </div>
          </form>
        </mat-step>
        
        <!-- Step 2: Grape Sources -->
        <mat-step [stepControl]="sourcesForm">
          <ng-template matStepLabel>Grape Sources</ng-template>
          <form [formGroup]="sourcesForm" class="step-form">
            <div class="sources-list" formArrayName="sources">
              @for (source of sourcesArray.controls; track source; let i = $index) {
                <div class="source-item" [formGroupName]="i">
                  <div class="source-fields">
                    <mat-form-field appearance="outline">
                      <mat-label>Variety</mat-label>
                      <mat-select formControlName="variety">
                        @for (variety of varieties(); track variety.id) {
                          <mat-option [value]="variety.id">{{ variety.name }} ({{ variety.color }})</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Vineyard Block</mat-label>
                      <mat-select formControlName="vineyard_block">
                        <mat-option [value]="null">-- None --</mat-option>
                        @for (block of vineyards(); track block.id) {
                          <mat-option [value]="block.id">{{ block.display_name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Weight (kg)</mat-label>
                      <input matInput type="number" formControlName="weight_kg" min="0">
                    </mat-form-field>
                    
                    <mat-checkbox formControlName="is_estimated">Estimated</mat-checkbox>
                  </div>
                  
                  <button mat-icon-button color="warn" (click)="removeSource(i)" 
                          [disabled]="sourcesArray.length === 1">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                
                @if (i < sourcesArray.length - 1) {
                  <mat-divider></mat-divider>
                }
              }
            </div>
            
            <button mat-stroked-button type="button" (click)="addSource()" class="add-source-btn">
              <mat-icon>add</mat-icon>
              Add Source
            </button>
            
            <div class="total-weight">
              <strong>Total Weight:</strong> {{ calculateTotalWeight() | number:'1.0-0' }} kg
            </div>
            
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-button matStepperNext [disabled]="sourcesForm.invalid">Next</button>
            </div>
          </form>
        </mat-step>
        
        <!-- Step 3: Review -->
        <mat-step>
          <ng-template matStepLabel>Review</ng-template>
          <div class="review-step">
            <h3>Batch Summary</h3>
            
            <div class="review-section">
              <div class="review-item">
                <span class="label">Season:</span>
                <span class="value">{{ getSeasonName() }}</span>
              </div>
              <div class="review-item">
                <span class="label">Intake Date:</span>
                <span class="value">{{ basicForm.get('intake_date')?.value | date:'mediumDate' }}</span>
              </div>
              <div class="review-item">
                <span class="label">Source Type:</span>
                <span class="value">{{ getSourceTypeLabel() }}</span>
              </div>
              <div class="review-item">
                <span class="label">Initial Tank:</span>
                <span class="value">{{ getTankName() || 'None' }}</span>
              </div>
              <div class="review-item">
                <span class="label">Est. Must Volume:</span>
                <span class="value">{{ basicForm.get('must_volume_l')?.value | number }} L</span>
              </div>
            </div>
            
            <h4>Grape Sources ({{ sourcesArray.length }})</h4>
            <div class="sources-review">
              @for (source of sourcesArray.controls; track $index) {
                <div class="source-review-item">
                  <span>{{ getVarietyName(source.get('variety')?.value) }}</span>
                  <span>{{ source.get('weight_kg')?.value | number }} kg</span>
                </div>
              }
              <div class="source-review-total">
                <strong>Total:</strong>
                <strong>{{ calculateTotalWeight() | number }} kg</strong>
              </div>
            </div>
            
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="submitting()">
                {{ submitting() ? 'Creating...' : 'Create Batch' }}
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>
  `,
  styles: [`
    mat-dialog-content { min-width: 550px; max-height: 70vh; }
    
    .step-form { padding: 1rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
    mat-form-field { width: 100%; }
    
    .step-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    
    .sources-list { display: flex; flex-direction: column; gap: 1rem; }
    .source-item {
      display: flex; align-items: flex-start; gap: 0.5rem;
      padding: 1rem; background: var(--gray-100); border-radius: 8px;
    }
    .source-fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .source-fields mat-form-field { margin-bottom: 0; }
    .source-fields mat-checkbox { grid-column: span 2; }
    
    .add-source-btn { margin-top: 0.5rem; }
    
    .total-weight {
      margin-top: 1rem; padding: 1rem; background: var(--primary-light);
      color: white; border-radius: 8px; text-align: center; font-size: 1.1rem;
    }
    
    .review-step { padding: 1rem 0; }
    .review-step h3 { margin: 0 0 1rem; }
    .review-step h4 { margin: 1.5rem 0 0.75rem; }
    
    .review-section {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
      padding: 1rem; background: var(--gray-100); border-radius: 8px;
    }
    .review-item {
      display: flex; flex-direction: column;
      .label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
      .value { font-weight: 500; }
    }
    
    .sources-review {
      background: var(--gray-100); border-radius: 8px; overflow: hidden;
    }
    .source-review-item {
      display: flex; justify-content: space-between; padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--gray-200);
    }
    .source-review-total {
      display: flex; justify-content: space-between; padding: 0.75rem 1rem;
      background: var(--gray-200);
    }
  `]
})
export class BatchCreateDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private harvestService = inject(HarvestService);
  private equipmentService = inject(EquipmentService);
  private masterDataService = inject(MasterDataService);
  
  seasons = signal<HarvestSeasonDropdown[]>([]);
  tanks = signal<TankDropdown[]>([]);
  varieties = signal<GrapeVarietyDropdown[]>([]);
  vineyards = signal<VineyardBlockDropdown[]>([]);
  submitting = signal(false);
  
  sourceTypes = Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  
  basicForm: FormGroup;
  sourcesForm: FormGroup;
  
  constructor(
    public dialogRef: MatDialogRef<BatchCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BatchCreateDialogData
  ) {
    this.basicForm = this.fb.group({
      harvest_season: [data.seasonId || '', Validators.required],
      intake_date: [new Date(), Validators.required],
      source_type: ['OWN'],
      initial_tank: [null],
      must_volume_l: [0],
    });
    
    this.sourcesForm = this.fb.group({
      sources: this.fb.array([this.createSourceGroup()])
    });
  }
  
  ngOnInit(): void {
    this.loadDropdowns();
  }
  
  loadDropdowns(): void {
    this.harvestService.getSeasonsDropdown().subscribe(s => this.seasons.set(s));
    this.equipmentService.getTanksDropdown().subscribe(t => this.tanks.set(t));
    this.masterDataService.getVarietiesDropdown().subscribe(v => this.varieties.set(v));
    this.masterDataService.getVineyardsDropdown().subscribe(v => this.vineyards.set(v));
  }
  
  get sourcesArray(): FormArray {
    return this.sourcesForm.get('sources') as FormArray;
  }
  
  createSourceGroup(): FormGroup {
    return this.fb.group({
      variety: [null, Validators.required],
      vineyard_block: [null],
      weight_kg: [0, [Validators.required, Validators.min(1)]],
      is_estimated: [false],
    });
  }
  
  addSource(): void {
    this.sourcesArray.push(this.createSourceGroup());
  }
  
  removeSource(index: number): void {
    if (this.sourcesArray.length > 1) {
      this.sourcesArray.removeAt(index);
    }
  }
  
  calculateTotalWeight(): number {
    return this.sourcesArray.controls.reduce((sum, ctrl) => {
      return sum + (ctrl.get('weight_kg')?.value || 0);
    }, 0);
  }
  
  getSeasonName(): string {
    const id = this.basicForm.get('harvest_season')?.value;
    const season = this.seasons().find(s => s.id === id);
    return season?.display_name || '-';
  }
  
  getSourceTypeLabel(): string {
    const value = this.basicForm.get('source_type')?.value;
    return SOURCE_TYPE_LABELS[value as keyof typeof SOURCE_TYPE_LABELS] || value;
  }
  
  getTankName(): string | null {
    const id = this.basicForm.get('initial_tank')?.value;
    if (!id) return null;
    const tank = this.tanks().find(t => t.id === id);
    return tank?.display_name || null;
  }
  
  getVarietyName(id: string | null): string {
    if (!id) return 'Unknown';
    const variety = this.varieties().find(v => v.id === id);
    return variety?.name || 'Unknown';
  }
  
  onSubmit(): void {
    if (this.basicForm.invalid || this.sourcesForm.invalid) return;
    
    this.submitting.set(true);
    
    const basicValues = this.basicForm.value;
    const sources = this.sourcesArray.value;
    
    const batch: BatchCreate = {
      harvest_season: basicValues.harvest_season,
      intake_date: this.formatDate(basicValues.intake_date),
      source_type: basicValues.source_type,
      initial_tank: basicValues.initial_tank || undefined,
      must_volume_l: basicValues.must_volume_l,
      sources: sources.map((s: any) => ({
        variety: s.variety,
        vineyard_block: s.vineyard_block || undefined,
        weight_kg: s.weight_kg,
        is_estimated: s.is_estimated,
      })),
    };
    
    this.dialogRef.close(batch);
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

