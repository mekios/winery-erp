import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { EquipmentService, TankDropdown } from '../equipment/equipment.service';
import {
  WorkOrdersService,
  WorkOrderDetail,
  WorkOrderCreate,
  WorkOrderLineCreate,
  WorkOrderPriority,
  WorkOrderLineType,
  PRIORITY_LABELS,
  LINE_TYPE_LABELS
} from './work-orders.service';

@Component({
  selector: 'app-work-order-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule, MatDividerModule,
    FormPageComponent, IconComponent
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Work Order' : 'New Work Order'"
      [subtitle]="isEdit ? workOrder()?.code || '' : 'Plan a production task'"
      icon="clipboard-list"
      [saving]="saving()"
      (save)="onSave()"
      (cancel)="onCancel()">
      
      <form [formGroup]="form" class="form-content">
        <!-- Basic Info -->
        <div class="form-section">
          <h3>Basic Information</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Title (optional - auto-generated from tasks)</mat-label>
            <input matInput formControlName="title" placeholder="Leave blank to auto-generate">
            <mat-hint>
              @if (!form.get('title')?.value && linesArray.length > 0) {
                Preview: {{ generateTitlePreview() }}
              } @else if (!form.get('title')?.value) {
                Will be generated from tasks
              }
            </mat-hint>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"
                      placeholder="Detailed instructions..."></textarea>
          </mat-form-field>
          
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                @for (priority of priorities; track priority.value) {
                  <mat-option [value]="priority.value">{{ priority.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Scheduled For</mat-label>
              <input matInput [matDatepicker]="scheduledPicker" formControlName="scheduled_for">
              <mat-datepicker-toggle matIconSuffix [for]="scheduledPicker"></mat-datepicker-toggle>
              <mat-datepicker #scheduledPicker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Due Date</mat-label>
              <input matInput [matDatepicker]="duePicker" formControlName="due_date">
              <mat-datepicker-toggle matIconSuffix [for]="duePicker"></mat-datepicker-toggle>
              <mat-datepicker #duePicker></mat-datepicker>
            </mat-form-field>
          </div>
        </div>
        
        <mat-divider></mat-divider>
        
        <!-- Tasks -->
        <div class="form-section">
          <div class="section-header">
            <h3>Tasks</h3>
            <button mat-stroked-button type="button" (click)="addLine()">
              <mat-icon>add</mat-icon>
              Add Task
            </button>
          </div>
          
          @if (linesArray.length === 0) {
            <div class="empty-lines">
              <app-icon name="clipboard" [size]="40"></app-icon>
              <p>No tasks added yet</p>
              <button mat-stroked-button type="button" (click)="addLine()">
                <mat-icon>add</mat-icon>
                Add First Task
              </button>
            </div>
          }
          
          <div formArrayName="lines" class="lines-form">
            @for (line of linesArray.controls; track i; let i = $index) {
              <div class="line-form-card" [formGroupName]="i">
                <div class="line-header">
                  <span class="line-number">{{ i + 1 }}</span>
                  <mat-form-field appearance="outline" class="line-type-field">
                    <mat-label>Type</mat-label>
                    <mat-select formControlName="line_type" (selectionChange)="onLineTypeChange(i)">
                      @for (type of lineTypes; track type.value) {
                        <mat-option [value]="type.value">{{ type.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <button mat-icon-button type="button" color="warn" (click)="removeLine(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                
                <!-- Transfer fields -->
                @if (line.get('line_type')?.value === 'TRANSFER') {
                  <div class="line-fields">
                    <mat-form-field appearance="outline">
                      <mat-label>From Tank</mat-label>
                      <mat-select formControlName="from_tank">
                        <mat-option [value]="null">-- Select --</mat-option>
                        @for (tank of tanks(); track tank.id) {
                          <mat-option [value]="tank.id">{{ tank.code }} - {{ tank.display_name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>To Tank</mat-label>
                      <mat-select formControlName="to_tank">
                        <mat-option [value]="null">-- Select --</mat-option>
                        @for (tank of tanks(); track tank.id) {
                          <mat-option [value]="tank.id">{{ tank.code }} - {{ tank.display_name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Target Volume (L)</mat-label>
                      <input matInput type="number" formControlName="target_volume_l">
                    </mat-form-field>
                  </div>
                }
                
                <!-- Addition fields -->
                @if (line.get('line_type')?.value === 'ADDITION') {
                  <div class="line-fields">
                    <mat-form-field appearance="outline">
                      <mat-label>Target Tank</mat-label>
                      <mat-select formControlName="target_tank">
                        <mat-option [value]="null">-- Select --</mat-option>
                        @for (tank of tanks(); track tank.id) {
                          <mat-option [value]="tank.id">{{ tank.code }} - {{ tank.display_name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>Material</mat-label>
                      <input matInput formControlName="material_name" placeholder="e.g., SO2">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="dosage-field">
                      <mat-label>Dosage</mat-label>
                      <input matInput type="number" formControlName="dosage_value">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="unit-field">
                      <mat-label>Unit</mat-label>
                      <input matInput formControlName="dosage_unit" placeholder="e.g., g/L">
                    </mat-form-field>
                  </div>
                }
                
                <!-- Analysis / Inspection / Other fields -->
                @if (['ANALYSIS', 'INSPECTION', 'CLEANING', 'MAINTENANCE', 'OTHER'].includes(line.get('line_type')?.value)) {
                  <div class="line-fields">
                    <mat-form-field appearance="outline">
                      <mat-label>Target Tank</mat-label>
                      <mat-select formControlName="target_tank">
                        <mat-option [value]="null">-- Select --</mat-option>
                        @for (tank of tanks(); track tank.id) {
                          <mat-option [value]="tank.id">{{ tank.code }} - {{ tank.display_name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                }
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description / Notes</mat-label>
                  <input matInput formControlName="description" placeholder="What needs to be done">
                </mat-form-field>
              </div>
            }
          </div>
        </div>
      </form>
    </app-form-page>
  `,
  styles: [`
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .form-section {
      h3 {
        margin: 0 0 16px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h3 { margin: 0; }
    }
    
    .full-width { width: 100%; }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .empty-lines {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      background: var(--bg-surface);
      border-radius: 12px;
      color: var(--text-secondary);
      
      p { margin: 16px 0; }
    }
    
    .lines-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .line-form-card {
      background: var(--bg-surface);
      border-radius: 12px;
      padding: 16px;
      border: 1px solid var(--border-color);
    }
    
    .line-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .line-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      flex-shrink: 0;
    }
    
    .line-type-field {
      flex: 1;
      max-width: 200px;
    }
    
    .line-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .dosage-field { max-width: 120px; }
    .unit-field { max-width: 100px; }
    
    @media screen and (max-width: 640px) {
      .line-fields {
        grid-template-columns: 1fr;
      }
      
      .dosage-field, .unit-field {
        max-width: none;
      }
    }
  `]
})
export class WorkOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private workOrdersService = inject(WorkOrdersService);
  private equipmentService = inject(EquipmentService);
  
  workOrderId: string | null = null;
  isEdit = false;
  workOrder = signal<WorkOrderDetail | null>(null);
  loading = signal(false);
  saving = signal(false);
  tanks = signal<TankDropdown[]>([]);
  
  priorities = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
  lineTypes = Object.entries(LINE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  
  form: FormGroup = this.fb.group({
    title: [''],  // Optional - auto-generated from tasks if blank
    description: [''],
    priority: ['NORMAL'],
    scheduled_for: [null],
    due_date: [null],
    assigned_to: [null],
    lines: this.fb.array([])
  });
  
  get linesArray(): FormArray {
    return this.form.get('lines') as FormArray;
  }
  
  ngOnInit(): void {
    this.workOrderId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.workOrderId;
    
    this.loadTanks();
    
    if (this.isEdit && this.workOrderId) {
      this.loadWorkOrder();
    }
  }
  
  loadTanks(): void {
    this.equipmentService.getTanksDropdown().subscribe({
      next: (tanks: TankDropdown[]) => this.tanks.set(tanks)
    });
  }
  
  loadWorkOrder(): void {
    if (!this.workOrderId) return;
    
    this.loading.set(true);
    this.workOrdersService.getWorkOrder(this.workOrderId).subscribe({
      next: (wo) => {
        this.workOrder.set(wo);
        this.patchForm(wo);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load work order', 'Close', { duration: 3000 });
        this.loading.set(false);
        this.router.navigate(['/work-orders']);
      }
    });
  }
  
  patchForm(wo: WorkOrderDetail): void {
    this.form.patchValue({
      title: wo.title,
      description: wo.description,
      priority: wo.priority,
      scheduled_for: wo.scheduled_for ? new Date(wo.scheduled_for) : null,
      due_date: wo.due_date ? new Date(wo.due_date) : null,
      assigned_to: wo.assigned_to,
    });
    
    // Clear and add lines
    this.linesArray.clear();
    for (const line of wo.lines) {
      this.linesArray.push(this.fb.group({
        line_type: [line.line_type],
        target_tank: [line.target_tank],
        target_barrel: [line.target_barrel],
        from_tank: [line.from_tank],
        to_tank: [line.to_tank],
        target_volume_l: [line.target_volume_l],
        material_name: [line.material_name],
        dosage_value: [line.dosage_value],
        dosage_unit: [line.dosage_unit],
        description: [line.description],
      }));
    }
  }
  
  addLine(): void {
    this.linesArray.push(this.fb.group({
      line_type: ['TRANSFER'],
      target_tank: [null],
      target_barrel: [null],
      from_tank: [null],
      to_tank: [null],
      target_volume_l: [null],
      material_name: [''],
      dosage_value: [null],
      dosage_unit: [''],
      description: [''],
    }));
  }
  
  removeLine(index: number): void {
    this.linesArray.removeAt(index);
  }
  
  onLineTypeChange(index: number): void {
    // Reset fields when line type changes
    const line = this.linesArray.at(index);
    line.patchValue({
      target_tank: null,
      target_barrel: null,
      from_tank: null,
      to_tank: null,
      target_volume_l: null,
      material_name: '',
      dosage_value: null,
      dosage_unit: '',
    });
  }
  
  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    this.saving.set(true);
    
    const formValue = this.form.value;
    
    // Prepare data
    const data: WorkOrderCreate = {
      title: formValue.title,
      description: formValue.description || '',
      priority: formValue.priority,
      scheduled_for: formValue.scheduled_for ? new Date(formValue.scheduled_for).toISOString() : undefined,
      due_date: formValue.due_date ? this.formatDate(formValue.due_date) : undefined,
      assigned_to: formValue.assigned_to || undefined,
      lines: formValue.lines.map((line: any, i: number) => ({
        line_no: i + 1,
        line_type: line.line_type,
        target_tank: line.target_tank || undefined,
        target_barrel: line.target_barrel || undefined,
        from_tank: line.from_tank || undefined,
        to_tank: line.to_tank || undefined,
        target_volume_l: line.target_volume_l || undefined,
        material_name: line.material_name || undefined,
        dosage_value: line.dosage_value || undefined,
        dosage_unit: line.dosage_unit || undefined,
        description: line.description || undefined,
      }))
    };
    
    const request = this.isEdit && this.workOrderId
      ? this.workOrdersService.updateWorkOrder(this.workOrderId, data)
      : this.workOrdersService.createWorkOrder(data);
    
    request.subscribe({
      next: (wo) => {
        this.saving.set(false);
        this.snackBar.open(
          this.isEdit ? 'Work order updated' : 'Work order created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/work-orders', wo.id]);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err.error?.detail || 'Failed to save work order';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }
  
  onCancel(): void {
    if (this.isEdit && this.workOrderId) {
      this.router.navigate(['/work-orders', this.workOrderId]);
    } else {
      this.router.navigate(['/work-orders']);
    }
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  generateTitlePreview(): string {
    const lines = this.linesArray.controls;
    if (lines.length === 0) return '';
    
    if (lines.length === 1) {
      const line = lines[0].value;
      return this.describeLinePreview(line);
    }
    
    // Multiple lines - summarize by type
    const typeCounts: Record<string, number> = {};
    for (const lineControl of lines) {
      const lineType = lineControl.value.line_type as string;
      const label = LINE_TYPE_LABELS[lineType as WorkOrderLineType] || lineType;
      typeCounts[label] = (typeCounts[label] || 0) + 1;
    }
    
    const parts = Object.entries(typeCounts)
      .map(([name, count]) => `${count} ${name}${count > 1 ? 's' : ''}`)
      .slice(0, 3);
    
    return parts.join(', ');
  }
  
  private describeLinePreview(line: any): string {
    const lineType = line.line_type as WorkOrderLineType;
    
    if (lineType === 'TRANSFER') {
      const fromTank = this.tanks().find(t => t.id === line.from_tank);
      const toTank = this.tanks().find(t => t.id === line.to_tank);
      const from = fromTank?.code || '?';
      const to = toTank?.code || '?';
      const vol = line.target_volume_l ? ` (${Math.round(line.target_volume_l)}L)` : '';
      return `Transfer ${from} → ${to}${vol}`;
    }
    
    if (lineType === 'ADDITION') {
      const tank = this.tanks().find(t => t.id === line.target_tank);
      const tankCode = tank?.code || '?';
      const material = line.material_name || 'material';
      return `Add ${material} to ${tankCode}`;
    }
    
    if (lineType === 'ANALYSIS') {
      const tank = this.tanks().find(t => t.id === line.target_tank);
      return `Analyze ${tank?.code || '?'}`;
    }
    
    if (lineType === 'INSPECTION') {
      const tank = this.tanks().find(t => t.id === line.target_tank);
      return `Inspect ${tank?.code || '?'}`;
    }
    
    if (lineType === 'CLEANING') {
      const tank = this.tanks().find(t => t.id === line.target_tank);
      return `Clean ${tank?.code || '?'}`;
    }
    
    if (lineType === 'MAINTENANCE') {
      const tank = this.tanks().find(t => t.id === line.target_tank);
      return `Maintain ${tank?.code || '?'}`;
    }
    
    return line.description || LINE_TYPE_LABELS[lineType] || 'Task';
  }
}

