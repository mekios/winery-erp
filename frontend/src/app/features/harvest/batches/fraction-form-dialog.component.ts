import { Component, inject, OnInit, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { IconComponent } from '@shared/components/icon/icon.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { HarvestService, BatchFractionCreate, FractionType, FRACTION_TYPE_LABELS } from '../harvest.service';
import { EquipmentService, TankDropdown } from '@features/equipment/equipment.service';

export interface FractionFormDialogData {
  batchId: string;
  batchCode: string;
  batchVolume: number;
  usedVolume: number;
}

@Component({
  selector: 'app-fraction-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    IconComponent,
    NumberInputComponent,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <app-icon name="layers" [size]="24"></app-icon>
          <h2>Create Batch Fraction</h2>
        </div>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <app-icon name="x" [size]="20"></app-icon>
        </button>
      </div>

      <div class="dialog-body">
        <div class="batch-info">
          <div class="info-row">
            <span class="label">Batch:</span>
            <span class="value">{{ data.batchCode }}</span>
          </div>
          <div class="info-row">
            <span class="label">Total Volume:</span>
            <span class="value">{{ data.batchVolume | number:'1.0-0' }} L</span>
          </div>
          <div class="info-row">
            <span class="label">Used Volume:</span>
            <span class="value">{{ data.usedVolume | number:'1.0-0' }} L</span>
          </div>
          <div class="info-row available">
            <span class="label">Available:</span>
            <span class="value">{{ availableVolume() | number:'1.0-0' }} L</span>
          </div>
        </div>

        <form [formGroup]="form" class="form-sections">
          <!-- Fraction Type -->
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Fraction Type</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="fraction_type" placeholder="Select type">
                    @for (type of fractionTypes; track type.value) {
                      <mat-option [value]="type.value">
                        <div class="fraction-option">
                          <app-icon [name]="getFractionIcon(type.value)" [size]="18"></app-icon>
                          <span>{{ type.label }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                  @if (form.get('fraction_type')?.hasError('required') && form.get('fraction_type')?.touched) {
                    <mat-error>Fraction type is required</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>
          </div>

          <!-- Tank & Volume -->
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tank</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="tank" placeholder="Select tank (optional)">
                    <mat-option [value]="null">None</mat-option>
                    @for (tank of tanks(); track tank.id) {
                      <mat-option [value]="tank.id">
                        <div class="tank-option">
                          <span class="tank-code">{{ tank.code }}</span>
                          <span class="tank-info">{{ tank.name }} • {{ tank.capacity_l | number:'1.0-0' }}L</span>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Volume</label>
                <app-number-input
                  formControlName="volume_l"
                  unit="L"
                  [placeholder]="'Max ' + (availableVolume() | number:'1.0-0') + ' L available'"
                  [min]="0"
                  [max]="availableVolume()"
                  [step]="50"
                  [quickValues]="getQuickValues()">
                </app-number-input>
                @if (form.get('volume_l')?.hasError('required') && form.get('volume_l')?.touched) {
                  <mat-error>Volume is required</mat-error>
                }
                @if (form.get('volume_l')?.hasError('exceedsAvailable')) {
                  <mat-error class="volume-error">
                    ⚠️ Volume exceeds available batch volume ({{ availableVolume() | number:'1.0-0' }} L)
                  </mat-error>
                }
              </div>
            </div>
          </div>

          <!-- Date & Time -->
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Separation Date & Time</label>
                <mat-form-field appearance="outline">
                  <input matInput
                         type="datetime-local"
                         formControlName="separation_datetime"
                         placeholder="Select date and time">
                </mat-form-field>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Notes</label>
                <mat-form-field appearance="outline">
                  <textarea matInput
                            formControlName="notes"
                            rows="3"
                            placeholder="Optional notes about this fraction..."></textarea>
                </mat-form-field>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="dialog-footer">
        <button mat-button (click)="onCancel()" type="button">Cancel</button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSubmit()"
                [disabled]="form.invalid || isSubmitting()">
          @if (isSubmitting()) {
            <span>Creating...</span>
          } @else {
            <span>Create Fraction</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      min-width: 500px;
      max-width: 600px;
      max-height: 90vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 16px;
      border-bottom: 1px solid var(--color-border);
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      
      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
        
        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
      }
      
      .close-btn {
        color: white;
      }
    }

    .dialog-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .batch-info {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--color-border-light);
        
        &:last-child {
          border-bottom: none;
        }
        
        &.available {
          font-weight: 600;
          color: var(--color-success);
          margin-top: 8px;
          padding-top: 12px;
          border-top: 2px solid var(--color-border);
        }
        
        .label {
          color: var(--color-text-secondary);
        }
        
        .value {
          font-weight: 500;
        }
      }
    }

    .form-sections {
      .form-section {
        margin-bottom: 24px;
      }

      .form-row {
        margin-bottom: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-primary);
        margin-bottom: 8px;

        &.required::after {
          content: ' *';
          color: var(--color-danger);
        }
      }

      mat-form-field {
        width: 100%;
      }
    }

    .fraction-option,
    .tank-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tank-option {
      .tank-code {
        font-weight: 600;
      }
      
      .tank-info {
        font-size: 12px;
        color: var(--color-text-secondary);
      }
    }

    .volume-error {
      color: var(--color-danger);
      font-size: 13px;
      margin-top: 4px;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
    }
  `]
})
export class FractionFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FractionFormDialogComponent>);
  private harvestService = inject(HarvestService);
  private equipmentService = inject(EquipmentService);

  data: FractionFormDialogData = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  tanks = signal<TankDropdown[]>([]);
  isSubmitting = signal(false);

  fractionTypes = Object.entries(FRACTION_TYPE_LABELS).map(([value, label]) => ({
    value: value as FractionType,
    label
  }));

  availableVolume = signal(0);

  ngOnInit(): void {
    this.availableVolume.set(this.data.batchVolume - this.data.usedVolume);

    this.form = this.fb.group({
      fraction_type: ['', Validators.required],
      tank: [null],
      volume_l: [0, [Validators.required, Validators.min(1)]],
      separation_datetime: [''],
      notes: ['']
    });

    // Subscribe to volume changes for validation
    this.form.get('volume_l')?.valueChanges.subscribe(volume => {
      this.validateVolume(volume);
    });

    this.loadTanks();
  }

  loadTanks(): void {
    this.equipmentService.getTanksDropdown().subscribe({
      next: (tanks) => {
        this.tanks.set(tanks);
      },
      error: (err) => console.error('Error loading tanks:', err)
    });
  }

  validateVolume(volume: number): void {
    const control = this.form.get('volume_l');
    if (!control) return;

    if (volume > this.availableVolume()) {
      const currentErrors = control.errors || {};
      control.setErrors({ ...currentErrors, exceedsAvailable: true });
      control.markAsTouched();
    } else {
      const errors = control.errors;
      if (errors && errors['exceedsAvailable']) {
        delete errors['exceedsAvailable'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  getQuickValues(): number[] {
    const available = this.availableVolume();
    const base = [100, 250, 500];
    return base.filter(v => v <= available).concat(available > 500 ? [1000, available] : [available]);
  }

  getFractionIcon(type: FractionType): string {
    const icons: Record<FractionType, string> = {
      FREE_RUN: 'droplet',
      PRESS_1: 'move',
      PRESS_2: 'move',
      PRESS_3: 'move',
      SKIN_CONTACT: 'clock',
      SETTLING: 'layers',
      RACKING: 'arrow-down',
      OTHER: 'more-horizontal'
    };
    return icons[type] || 'circle';
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.value;
    const fractionData: BatchFractionCreate = {
      batch: this.data.batchId,
      fraction_type: formValue.fraction_type,
      tank: formValue.tank || undefined,
      volume_l: formValue.volume_l,
      separation_datetime: formValue.separation_datetime || undefined,
      notes: formValue.notes || ''
    };

    this.harvestService.createFraction(fractionData).subscribe({
      next: (fraction) => {
        this.dialogRef.close(fraction);
      },
      error: (err) => {
        console.error('Error creating fraction:', err);
        this.isSubmitting.set(false);
        // TODO: Show error message to user
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

