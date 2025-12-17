import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Winery, AddMemberRequest, ROLE_LABELS } from './wineries-admin.service';

export interface AddMemberDialogData {
  winery: Winery;
}

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Member to {{ data.winery.name }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="member-form">
        <mat-form-field appearance="outline">
          <mat-label>User Email</mat-label>
          <input matInput formControlName="user_email" type="email" 
                 placeholder="user@example.com">
          @if (form.get('user_email')?.hasError('required') && form.get('user_email')?.touched) {
            <mat-error>Email is required</mat-error>
          }
          @if (form.get('user_email')?.hasError('email')) {
            <mat-error>Please enter a valid email</mat-error>
          }
        </mat-form-field>
        
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            @for (role of roles; track role.value) {
              <mat-option [value]="role.value">{{ role.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        
        <div class="role-description">
          @switch (form.get('role')?.value) {
            @case ('CONSULTANT') {
              <p><strong>Consultant:</strong> Full access to all wineries. Can manage users and settings.</p>
            }
            @case ('WINERY_OWNER') {
              <p><strong>Winery Owner:</strong> Full access to this winery. Can manage members and settings.</p>
            }
            @case ('WINEMAKER') {
              <p><strong>Winemaker:</strong> Can manage production, batches, transfers, and analyses.</p>
            }
            @case ('CELLAR_STAFF') {
              <p><strong>Cellar Staff:</strong> Can execute work orders and record transfers.</p>
            }
            @case ('LAB') {
              <p><strong>Lab Staff:</strong> Can record and view analyses.</p>
            }
          }
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="form.invalid"
              (click)="onSave()">
        Add Member
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .member-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 400px;
      padding-top: 0.5rem;
    }
    mat-form-field { width: 100%; }
    .role-description {
      background: var(--gray-100);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-top: 0.5rem;
      p { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
    }
  `]
})
export class AddMemberDialogComponent {
  form: FormGroup;
  roles = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMemberDialogData
  ) {
    this.form = this.fb.group({
      user_email: ['', [Validators.required, Validators.email]],
      role: ['WINEMAKER', Validators.required],
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onSave(): void {
    if (this.form.valid) {
      const result: AddMemberRequest = {
        ...this.form.value,
        winery: this.data.winery.id,
      };
      this.dialogRef.close(result);
    }
  }
}




