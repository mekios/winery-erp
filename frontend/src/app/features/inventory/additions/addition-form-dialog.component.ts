import { Component, OnInit, signal, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';

import { IconComponent } from '@shared/components/icon/icon.component';
import { NumberInputComponent } from '@shared/components/number-input/number-input.component';
import { InventoryService, MaterialDropdown } from '../inventory.service';
import { EquipmentService } from '@features/equipment/equipment.service';

export interface AdditionDialogData {
  materialId?: string;
  tankId?: string;
  barrelId?: string;
}

@Component({
  selector: 'app-addition-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    IconComponent,
    NumberInputComponent,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="dialog-header">
      <div class="dialog-icon addition">
        <app-icon name="flask" [size]="20"></app-icon>
      </div>
      <div class="dialog-title-wrap">
        <h2 class="dialog-title">Record Material Addition</h2>
        <p class="dialog-subtitle">Add materials to tanks or barrels</p>
      </div>
    </div>

    <div class="dialog-content">
      <form [formGroup]="form">
        <!-- Material Selection (Highlighted) -->
        <div class="form-section highlight">
          <label class="form-label required">Material</label>
          <mat-form-field appearance="outline">
            <mat-select formControlName="material" (selectionChange)="onMaterialChange()">
              @for (material of materials(); track material.id) {
                <mat-option [value]="material.id">
                  <div class="material-option">
                    <span class="material-name">{{ material.name }}</span>
                    <span class="material-stock">
                      {{ material.current_stock | number:'1.0-2' }} {{ material.unit_display }}
                    </span>
                  </div>
                </mat-option>
              }
            </mat-select>
            @if (form.get('material')?.hasError('required') && form.get('material')?.touched) {
              <mat-error>Please select a material</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Target Selection -->
        <div class="form-section">
          <div class="section-title">Target Vessel</div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Type</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="targetType">
                  <mat-option value="tank">
                    <div class="target-option">
                      <app-icon name="tank" [size]="18"></app-icon>
                      <span>Tank</span>
                    </div>
                  </mat-option>
                  <mat-option value="barrel">
                    <div class="target-option">
                      <app-icon name="barrel" [size]="18"></app-icon>
                      <span>Barrel</span>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-group">
              @if (form.get('targetType')?.value === 'tank') {
                <label class="form-label required">Tank</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="tank">
                    @for (tank of tanks(); track tank.id) {
                      <mat-option [value]="tank.id">
                        <div class="vessel-option">
                          <span class="vessel-code">{{ tank.code }}</span>
                          <span class="vessel-name">{{ tank.name }}</span>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                  @if (form.get('tank')?.hasError('required') && form.get('tank')?.touched) {
                    <mat-error>Please select a tank</mat-error>
                  }
                </mat-form-field>
              }

              @if (form.get('targetType')?.value === 'barrel') {
                <label class="form-label required">Barrel</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="barrel">
                    @for (barrel of barrels(); track barrel.id) {
                      <mat-option [value]="barrel.id">
                        {{ barrel.code }} - {{ barrel.name }}
                      </mat-option>
                    }
                  </mat-select>
                  @if (form.get('barrel')?.hasError('required') && form.get('barrel')?.touched) {
                    <mat-error>Please select a barrel</mat-error>
                  }
                </mat-form-field>
              }
            </div>
          </div>
        </div>

        <!-- Addition Details -->
        <div class="form-section">
          <div class="section-title">Addition Details</div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">
                Quantity @if (selectedMaterialUnit()) {
                  <span class="unit-hint">({{ selectedMaterialUnit() }})</span>
                }
              </label>
              <app-number-input
                formControlName="quantity"
                [decimals]="3"
                [min]="0.001"
                [unit]="selectedMaterialUnit()"
                placeholder="Enter quantity">
              </app-number-input>
            </div>

            <div class="form-group">
              <label class="form-label">Target Volume (L)</label>
              <app-number-input
                formControlName="target_volume_l"
                [decimals]="2"
                [min]="0"
                unit="L"
                placeholder="Volume being treated">
              </app-number-input>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Dosage Rate</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="dosage_rate" placeholder="e.g., 50 mg/L" />
                <mat-hint>Rate per liter or hectoliter</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-group">
              <label class="form-label required">Addition Date</label>
              <mat-form-field appearance="outline">
                <input matInput [matDatepicker]="picker" formControlName="addition_date" />
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>

          <div class="form-row single">
            <div class="form-group">
              <label class="form-label">Purpose</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="purpose">
                  <mat-option value="Stabilization">Stabilization</mat-option>
                  <mat-option value="Clarification">Clarification</mat-option>
                  <mat-option value="SO₂ Addition">SO₂ Addition</mat-option>
                  <mat-option value="Nutrient Addition">Nutrient Addition</mat-option>
                  <mat-option value="pH Adjustment">pH Adjustment</mat-option>
                  <mat-option value="Enzymatic Treatment">Enzymatic Treatment</mat-option>
                  <mat-option value="Other">Other</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-section">
          <label class="form-label">Notes</label>
          <mat-form-field appearance="outline">
            <textarea
              matInput
              formControlName="notes"
              rows="3"
              placeholder="Additional details about this addition"></textarea>
          </mat-form-field>
        </div>
      </form>
    </div>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()" [disabled]="saving()" class="btn-cancel">
        Cancel
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!form.valid || saving()"
        class="btn-primary">
        @if (saving()) {
          <span>Recording...</span>
        } @else {
          <span>Record Addition</span>
        }
      </button>
    </div>
  `,
  styleUrl: './addition-form-dialog.component.scss'
})
export class AdditionFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AdditionFormDialogComponent>);
  private inventoryService = inject(InventoryService);
  private equipmentService = inject(EquipmentService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  saving = signal(false);
  
  materials = signal<MaterialDropdown[]>([]);
  tanks = signal<any[]>([]);
  barrels = signal<any[]>([]);
  selectedMaterialUnit = signal<string>('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: AdditionDialogData) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
    
    // Watch for material changes to update unit
    this.form.get('material')?.valueChanges.subscribe(() => {
      this.updateMaterialUnit();
    });
    
    // Pre-fill tank if provided
    if (this.data?.tankId) {
      this.form.patchValue({ 
        targetType: 'tank',
        tank: this.data.tankId 
      });
    }
    
    // Pre-fill barrel if provided
    if (this.data?.barrelId) {
      this.form.patchValue({ 
        targetType: 'barrel',
        barrel: this.data.barrelId 
      });
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      material: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.001)]],
      targetType: ['tank', Validators.required],
      tank: [''],
      barrel: [''],
      addition_date: [new Date(), Validators.required],
      purpose: [''],
      dosage_rate: [''],
      target_volume_l: [null, Validators.min(0)],
      notes: [''],
    });

    // Watch targetType to conditionally require target
    this.form.get('targetType')?.valueChanges.subscribe((type) => {
      const tankControl = this.form.get('tank');
      const barrelControl = this.form.get('barrel');
      
      // Clear all validators
      tankControl?.clearValidators();
      barrelControl?.clearValidators();
      
      // Set validator based on type
      if (type === 'tank') {
        tankControl?.setValidators(Validators.required);
      } else if (type === 'barrel') {
        barrelControl?.setValidators(Validators.required);
      }
      
      tankControl?.updateValueAndValidity();
      barrelControl?.updateValueAndValidity();
    });
  }

  loadDropdownOptions(): void {
    this.inventoryService.getMaterialsDropdown().subscribe({
      next: (materials: MaterialDropdown[]) => {
        this.materials.set(materials);
        
        // Pre-fill material if provided (after materials are loaded)
        if (this.data?.materialId) {
          this.form.patchValue({ material: this.data.materialId });
          this.updateMaterialUnit();
        }
      },
      error: (err: any) => console.error('Error loading materials:', err),
    });

    this.equipmentService.getTanksDropdown().subscribe({
      next: (tanks: any[]) => this.tanks.set(tanks),
      error: (err: any) => console.error('Error loading tanks:', err),
    });

    this.equipmentService.getBarrelsDropdown().subscribe({
      next: (barrels: any[]) => this.barrels.set(barrels),
      error: (err: any) => console.error('Error loading barrels:', err),
    });
  }

  updateMaterialUnit(): void {
    const materialId = this.form.get('material')?.value;
    const material = this.materials().find(m => m.id === materialId);
    const unit = material?.unit_display || material?.unit || '';
    this.selectedMaterialUnit.set(unit);
  }

  onMaterialChange(): void {
    this.updateMaterialUnit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formData: any = {
      material: this.form.value.material,
      quantity: this.form.value.quantity,
      addition_date: new Date(this.form.value.addition_date).toISOString(),
      purpose: this.form.value.purpose || undefined,
      dosage_rate: this.form.value.dosage_rate || undefined,
      target_volume_l: this.form.value.target_volume_l || undefined,
      notes: this.form.value.notes || undefined,
    };

    // Add the appropriate target
    const targetType = this.form.value.targetType;
    if (targetType === 'tank') {
      formData.tank = this.form.value.tank;
    } else if (targetType === 'barrel') {
      formData.barrel = this.form.value.barrel;
    }

    this.inventoryService.createAddition(formData).subscribe({
      next: () => {
        this.snackBar.open('Addition recorded successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        console.error('Error creating addition:', err);
        this.snackBar.open('Failed to record addition', 'Close', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
