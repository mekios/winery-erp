import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FormPageComponent } from '@shared/components/form-page/form-page.component';
import { MasterDataService, Grower } from '../master-data.service';

@Component({
  selector: 'app-grower-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSnackBarModule,
    FormPageComponent,
  ],
  template: `
    <app-form-page
      [title]="isEdit ? 'Edit Grower' : 'New Grower'"
      [subtitle]="isEdit ? 'Update grower information' : 'Add a new grape grower or supplier'"
      icon="farmer"
      iconClass="green"
      [saveLabel]="isEdit ? 'Update' : 'Create'"
      [saving]="saving()"
      [canSave]="form.valid"
      (save)="onSave()">
      
      <form [formGroup]="form" class="form-sections">
        <!-- Basic Info Section -->
        <section class="form-section">
          <h2 class="section-title">Grower Information</h2>
          <div class="section-content">
            <div class="field">
              <label class="form-label required">Grower Name</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="name" placeholder="e.g., Papadopoulos Vineyards">
                @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>
            </div>
            
            <div class="field">
              <label class="form-label">Contact Person</label>
              <mat-form-field appearance="outline">
                <input matInput formControlName="contact_name" placeholder="Primary contact name">
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Contact Section -->
        <section class="form-section">
          <h2 class="section-title">Contact Details</h2>
          <div class="section-content">
            <div class="field-row two-col">
              <div class="field">
                <label class="form-label">Phone</label>
                <mat-form-field appearance="outline">
                  <input matInput formControlName="phone" type="tel" placeholder="+30 210 123 4567">
                </mat-form-field>
              </div>
              
              <div class="field">
                <label class="form-label">Email</label>
                <mat-form-field appearance="outline">
                  <input matInput formControlName="email" type="email" placeholder="contact@example.com">
                  @if (form.get('email')?.hasError('email')) {
                    <mat-error>Invalid email format</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>
            
            <div class="field">
              <label class="form-label">Address</label>
              <mat-form-field appearance="outline">
                <textarea matInput formControlName="address" rows="2" 
                          placeholder="Street, City, Region"></textarea>
              </mat-form-field>
            </div>
          </div>
        </section>
        
        <!-- Notes Section -->
        <section class="form-section">
          <h2 class="section-title">Additional Details</h2>
          <div class="section-content">
            <div class="field">
              <label class="form-label">Notes</label>
              <mat-form-field appearance="outline">
                <textarea matInput formControlName="notes" rows="3" 
                          placeholder="Payment terms, quality notes, certifications..."></textarea>
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
                  <span class="toggle-hint">Active growers appear in selections and can receive orders</span>
                </div>
              </mat-checkbox>
            </div>
          </div>
        </section>
      </form>
      
    </app-form-page>
  `,
  styleUrls: ['./grower-form.component.scss']
})
export class GrowerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private masterDataService = inject(MasterDataService);
  private snackBar = inject(MatSnackBar);
  
  form!: FormGroup;
  saving = signal(false);
  grower = signal<Grower | null>(null);
  
  get isEdit(): boolean {
    return !!this.grower();
  }
  
  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGrower(id);
    }
  }
  
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      contact_name: [''],
      phone: [''],
      email: ['', Validators.email],
      address: [''],
      notes: [''],
      is_active: [true],
    });
  }
  
  private loadGrower(id: string): void {
    this.masterDataService.getGrower(id).subscribe({
      next: (grower) => {
        this.grower.set(grower);
        this.form.patchValue(grower);
      },
      error: () => {
        this.snackBar.open('Failed to load grower', 'Close', { duration: 3000 });
        this.router.navigate(['/master-data/growers']);
      }
    });
  }
  
  onSave(): void {
    if (this.form.invalid) return;
    
    this.saving.set(true);
    const data = this.form.value;
    
    const request$ = this.isEdit
      ? this.masterDataService.updateGrower(this.grower()!.id, data)
      : this.masterDataService.createGrower(data);
    
    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Grower updated' : 'Grower created',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/master-data/growers']);
      },
      error: () => {
        this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}

