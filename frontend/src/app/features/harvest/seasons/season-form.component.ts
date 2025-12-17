import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { HarvestService, HarvestSeason } from '../harvest.service';

@Component({
  selector: 'app-season-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    FormPageComponent,
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Season' : 'New Season'"
      [subtitle]="isEdit ? 'Update harvest season details' : 'Start a new harvest season'"
      icon="calendar"
      iconClass="green"
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
              <label class="form-label required">Year</label>
              <mat-form-field appearance="outline">
                <input matInput type="number" formControlName="year" min="2000" max="2100" placeholder="2024">
                @if (form.get('year')?.hasError('required') && form.get('year')?.touched) {
                  <mat-error>Year is required</mat-error>
                }
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">Season Name</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="name" placeholder="e.g., Harvest 2024">
                <mat-hint>Leave blank to auto-generate</mat-hint>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Date Range -->
        <section class="form-section">
          <h3 class="section-title">DATE RANGE</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <mat-form-field appearance="outline">
                <input matInput [matDatepicker]="startPicker" formControlName="start_date">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <mat-form-field appearance="outline">
                <input matInput [matDatepicker]="endPicker" formControlName="end_date">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
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
              <textarea matInput formControlName="notes" rows="4" 
                        placeholder="Weather conditions, expectations, special observations..."></textarea>
            </mat-form-field>
          </div>
          <div class="toggle-card" [class.active]="form.get('is_active')?.value">
            <mat-checkbox formControlName="is_active">
              <div class="toggle-content">
                <span class="toggle-label">Active Season</span>
                <span class="toggle-hint">The active season appears as default when creating batches</span>
              </div>
            </mat-checkbox>
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
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      
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
    
    .toggle-card {
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1rem;
      transition: all 0.2s ease;
      
      &.active {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.3);
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
export class SeasonFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private harvestService = inject(HarvestService);
  private snackBar = inject(MatSnackBar);
  
  form!: FormGroup;
  saving = signal(false);
  season = signal<HarvestSeason | null>(null);
  
  get isEdit(): boolean {
    return !!this.season();
  }
  
  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSeason(id);
    }
  }
  
  private initForm(): void {
    this.form = this.fb.group({
      year: [new Date().getFullYear(), Validators.required],
      name: [''],
      start_date: [null],
      end_date: [null],
      notes: [''],
      is_active: [true],
    });
  }
  
  private loadSeason(id: string): void {
    this.harvestService.getSeason(id).subscribe({
      next: (season) => {
        this.season.set(season);
        this.form.patchValue({
          ...season,
          start_date: season.start_date ? new Date(season.start_date) : null,
          end_date: season.end_date ? new Date(season.end_date) : null,
        });
      },
      error: () => {
        this.snackBar.open('Failed to load season', 'Close', { duration: 3000 });
        this.router.navigate(['/harvest/seasons']);
      }
    });
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const value = this.form.value;
    const data = {
      ...value,
      start_date: value.start_date ? this.formatDate(value.start_date) : null,
      end_date: value.end_date ? this.formatDate(value.end_date) : null,
    };
    
    const request$ = this.isEdit
      ? this.harvestService.updateSeason(this.season()!.id, data)
      : this.harvestService.createSeason(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Season updated' : 'Season created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/harvest/seasons']);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

