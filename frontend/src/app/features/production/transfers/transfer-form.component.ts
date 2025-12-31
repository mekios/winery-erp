import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { 
  ProductionService, 
  TransferCreate, 
  TransferActionType,
  TRANSFER_ACTION_LABELS 
} from '../production.service';
import { EquipmentService, TankDropdown, BarrelDropdown } from '@features/equipment/equipment.service';
import { HarvestService, BatchList } from '@features/harvest/harvest.service';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormPageComponent,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule,
    NumberInputComponent
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Transfer' : 'New Transfer'"
      [subtitle]="isEdit ? 'Update transfer details' : 'Record a new wine transfer'"
      icon="arrow-right-left"
      [saveLabel]="isEdit ? 'Update' : 'Create'"
      [canSave]="form.valid && !saving()"
      [saving]="saving()"
      (save)="onSubmit()">
      
      <form [formGroup]="form" class="form-sections">
        <!-- Transfer Details -->
        <section class="form-section">
          <h3 class="section-title">TRANSFER DETAILS</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Action Type</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="action_type">
                  @for (action of actionTypes; track action.value) {
                    <mat-option [value]="action.value">{{ action.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Date & Time</label>
              <mat-form-field appearance="outline">
                <input matInput [matDatepicker]="picker" formControlName="transfer_date">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Source -->
        <section class="form-section">
          <h3 class="section-title">SOURCE</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Source Tank</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="source_tank">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (tank of tanks(); track tank.id) {
                    <mat-option [value]="tank.id">
                      {{ tank.code }} - {{ tank.name }} ({{ tank.current_volume_l }} L)
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label">Source Barrel</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="source_barrel">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (barrel of barrels(); track barrel.id) {
                    <mat-option [value]="barrel.id">
                      {{ barrel.code }} ({{ barrel.current_volume_l }} L)
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Destination -->
        <section class="form-section">
          <h3 class="section-title">DESTINATION</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Destination Tank</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="destination_tank">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (tank of tanks(); track tank.id) {
                    <mat-option [value]="tank.id">
                      {{ tank.code }} - {{ tank.name }} ({{ tank.available_capacity_l }} L avail.)
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label">Destination Barrel</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="destination_barrel">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (barrel of barrels(); track barrel.id) {
                    <mat-option [value]="barrel.id">
                      {{ barrel.code }} ({{ barrel.available_capacity_l }} L avail.)
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Volume & Measurements -->
        <section class="form-section">
          <h3 class="section-title">VOLUME & MEASUREMENTS</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Volume</label>
              <app-number-input
                formControlName="volume_l"
                unit="L"
                placeholder="0"
                [min]="0.01"
                [step]="50"
                [decimals]="1"
                [quickValues]="[100, 250, 500, 1000, 2000]">
              </app-number-input>
              @if (form.get('volume_l')?.hasError('required') && form.get('volume_l')?.touched) {
                <span class="field-error">Volume is required</span>
              }
            </div>
            
            <div class="form-group">
              <label class="form-label">Temperature</label>
              <app-number-input
                formControlName="temperature_c"
                unit="°C"
                placeholder="20"
                [min]="-5"
                [max]="40"
                [step]="1"
                [decimals]="1">
              </app-number-input>
            </div>
          </div>
        </section>
        
        <!-- Tracking -->
        <section class="form-section">
          <h3 class="section-title">TRACKING (OPTIONAL)</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Link to Batch</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="batch">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (batch of batches(); track batch.id) {
                    <mat-option [value]="batch.id">{{ batch.batch_code }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-group">
              <label class="form-label">Link to Wine Lot</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="wine_lot">
                  <mat-option [value]="null">— None —</mat-option>
                  @for (lot of wineLots(); track lot.id) {
                    <mat-option [value]="lot.id">{{ lot.lot_code }} - {{ lot.name }}</mat-option>
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
  styleUrls: ['./transfer-form.component.scss']
})
export class TransferFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productionService = inject(ProductionService);
  private equipmentService = inject(EquipmentService);
  private harvestService = inject(HarvestService);
  private snackBar = inject(MatSnackBar);
  
  form: FormGroup;
  isEdit = false;
  transferId: string | null = null;
  saving = signal(false);
  
  tanks = signal<TankDropdown[]>([]);
  barrels = signal<BarrelDropdown[]>([]);
  batches = signal<BatchList[]>([]);
  wineLots = signal<{ id: string; lot_code: string; name: string }[]>([]);
  
  actionTypes = Object.entries(TRANSFER_ACTION_LABELS).map(([value, label]) => ({ value, label }));
  
  constructor() {
    this.form = this.fb.group({
      action_type: ['RACK', Validators.required],
      transfer_date: [new Date(), Validators.required],
      source_tank: [null],
      source_barrel: [null],
      destination_tank: [null],
      destination_barrel: [null],
      volume_l: [null, [Validators.required, Validators.min(0.01)]],
      temperature_c: [null],
      batch: [null],
      wine_lot: [null],
      notes: [''],
    });
  }
  
  ngOnInit(): void {
    this.loadDropdowns();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.transferId = id;
      this.loadTransfer(id);
    } else {
      // Check for query parameters to pre-fill tanks
      this.route.queryParams.subscribe(params => {
        if (params['sourceTank']) {
          this.form.patchValue({ source_tank: params['sourceTank'] });
        }
        if (params['destinationTank']) {
          this.form.patchValue({ destination_tank: params['destinationTank'] });
        }
      });
    }
  }
  
  loadDropdowns(): void {
    this.equipmentService.getTanksDropdown().subscribe(tanks => this.tanks.set(tanks));
    this.equipmentService.getBarrelsDropdown().subscribe(barrels => this.barrels.set(barrels));
    this.harvestService.getBatches({ page_size: 100 }).subscribe(r => this.batches.set(r.results));
    this.productionService.getWineLots({ page_size: 100 }).subscribe(r => {
      this.wineLots.set(r.results.map(l => ({ id: l.id, lot_code: l.lot_code, name: l.name })));
    });
  }
  
  loadTransfer(id: string): void {
    this.productionService.getTransfer(id).subscribe({
      next: (t) => {
        this.form.patchValue({
          action_type: t.action_type,
          transfer_date: new Date(t.transfer_date),
          source_tank: t.source_tank,
          source_barrel: t.source_barrel,
          destination_tank: t.destination_tank,
          destination_barrel: t.destination_barrel,
          volume_l: t.volume_l,
          temperature_c: t.temperature_c,
          batch: t.batch,
          wine_lot: t.wine_lot,
          notes: t.notes,
        });
      },
      error: () => {
        this.snackBar.open('Failed to load transfer', 'Close', { duration: 3000 });
        this.goBack();
      }
    });
  }
  
  onSubmit(): void {
    if (!this.form.valid) return;
    
    this.saving.set(true);
    const formValue = this.form.value;
    
    const data: TransferCreate = {
      action_type: formValue.action_type,
      transfer_date: formValue.transfer_date.toISOString(),
      source_tank: formValue.source_tank || undefined,
      source_barrel: formValue.source_barrel || undefined,
      destination_tank: formValue.destination_tank || undefined,
      destination_barrel: formValue.destination_barrel || undefined,
      volume_l: formValue.volume_l,
      temperature_c: formValue.temperature_c || undefined,
      batch: formValue.batch || undefined,
      wine_lot: formValue.wine_lot || undefined,
      notes: formValue.notes || undefined,
    };
    
    const request$ = this.isEdit && this.transferId
      ? this.productionService.updateTransfer(this.transferId, data)
      : this.productionService.createTransfer(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Transfer updated' : 'Transfer created', 'Close', { duration: 3000 });
        this.goBack();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.volume_l?.[0] || 'Failed to save transfer';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.saving.set(false);
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/production/transfers']);
  }
}

