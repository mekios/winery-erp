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
import { MasterDataService, GrapeVariety } from '../master-data.service';

@Component({
  selector: 'app-variety-form',
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
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Variety' : 'New Variety'"
      [subtitle]="isEdit ? 'Update grape variety details' : 'Add a new grape variety to your catalog'"
      icon="grape"
      [saveLabel]="isEdit ? 'Update' : 'Create'"
      [saving]="saving()"
      [canSave]="form.valid"
      (save)="onSave()">
      
      <form [formGroup]="form" class="form-sections">
        <!-- Basic Info Section -->
        <section class="form-section">
          <h2 class="section-title">Basic Information</h2>
          <div class="section-content">
            <div class="field-row">
              <div class="field">
                <label class="form-label required">Name</label>
                <mat-form-field appearance="outline">
                  <input matInput formControlName="name" placeholder="e.g., Cabernet Sauvignon">
                  @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>
            
            <div class="field-row two-col">
              <div class="field">
                <label class="form-label">Code</label>
                <mat-form-field appearance="outline">
                  <input matInput formControlName="code" placeholder="CAB" maxlength="20">
                  <mat-hint>Short code for reference</mat-hint>
                </mat-form-field>
              </div>
              
              <div class="field">
                <label class="form-label required">Color</label>
                <mat-form-field appearance="outline">
                  <mat-select formControlName="color">
                    <mat-option value="RED">
                      <span class="color-option">
                        <span class="color-dot red"></span>
                        Red
                      </span>
                    </mat-option>
                    <mat-option value="WHITE">
                      <span class="color-option">
                        <span class="color-dot white"></span>
                        White
                      </span>
                    </mat-option>
                    <mat-option value="ROSE">
                      <span class="color-option">
                        <span class="color-dot rose"></span>
                        Rosé
                      </span>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Additional Details Section -->
        <section class="form-section">
          <h2 class="section-title">Additional Details</h2>
          <div class="section-content">
            <div class="field">
              <label class="form-label">Notes</label>
              <mat-form-field appearance="outline">
                <textarea matInput formControlName="notes" rows="4" 
                          placeholder="Tasting notes, characteristics, growing conditions..."></textarea>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Status Section -->
        <section class="form-section">
          <h2 class="section-title">Status</h2>
          <div class="section-content">
            <div class="toggle-card" [class.active]="form.get('is_active')?.value">
              <mat-checkbox formControlName="is_active">
                <div class="toggle-content">
                  <span class="toggle-label">Active</span>
                  <span class="toggle-hint">Active varieties appear in dropdowns and can be used</span>
                </div>
              </mat-checkbox>
            </div>
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
      border-radius: 16px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
    
    .section-title {
      margin: 0;
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
    }
    
    .section-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    
    .field-row {
      display: grid;
      gap: 1.5rem;
      
      &.two-col {
        grid-template-columns: 1fr 1fr;
        
        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }
      
      &.three-col {
        grid-template-columns: repeat(3, 1fr);
        
        @media (max-width: 800px) {
          grid-template-columns: 1fr 1fr;
        }
        
        @media (max-width: 500px) {
          grid-template-columns: 1fr;
        }
      }
    }
    
    .field {
      display: flex;
      flex-direction: column;
    }
    
    .form-label {
      font-size: 0.8125rem;
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
    
    .color-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      
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
      
      &.active {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.3);
      }
      
      mat-checkbox {
        width: 100%;
      }
      
      ::ng-deep .mdc-form-field {
        width: 100%;
      }
    }
    
    .toggle-content {
      display: flex;
      flex-direction: column;
      margin-left: 0.5rem;
    }
    
    .toggle-label {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .toggle-hint {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 0.125rem;
    }
  `]
})
export class VarietyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private masterDataService = inject(MasterDataService);
  private snackBar = inject(MatSnackBar);
  
  form!: FormGroup;
  saving = signal(false);
  variety = signal<GrapeVariety | null>(null);
  
  get isEdit(): boolean {
    return !!this.variety();
  }
  
  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVariety(id);
    }
  }
  
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      color: ['RED', Validators.required],
      notes: [''],
      is_active: [true],
    });
  }
  
  private loadVariety(id: string): void {
    this.masterDataService.getVariety(id).subscribe({
      next: (variety) => {
        this.variety.set(variety);
        this.form.patchValue(variety);
      },
      error: () => {
        this.snackBar.open('Failed to load variety', 'Close', { duration: 3000 });
        this.router.navigate(['/master-data/varieties']);
      }
    });
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const data = this.form.value;
    
    const request$ = this.isEdit
      ? this.masterDataService.updateVariety(this.variety()!.id, data)
      : this.masterDataService.createVariety(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Variety updated' : 'Variety created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/master-data/varieties']);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}

