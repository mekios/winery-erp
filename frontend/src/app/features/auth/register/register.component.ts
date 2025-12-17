import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>
            <span class="logo">🍇 Winery ERP</span>
          </mat-card-title>
          <mat-card-subtitle>Create your account</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          @if (errorMessage()) {
            <div class="error-message">
              <mat-icon>error</mat-icon>
              {{ errorMessage() }}
            </div>
          }
          
          @if (successMessage()) {
            <div class="success-message">
              <mat-icon>check_circle</mat-icon>
              {{ successMessage() }}
            </div>
          }
          
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" placeholder="John Doe">
              <mat-icon matSuffix>person</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     formControlName="email" 
                     placeholder="you@example.com"
                     autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email')) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput 
                     [type]="hidePassword() ? 'password' : 'text'" 
                     formControlName="password"
                     autocomplete="new-password">
              <button type="button" mat-icon-button matSuffix (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength')) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput 
                     [type]="hidePassword() ? 'password' : 'text'" 
                     formControlName="password_confirm"
                     autocomplete="new-password">
              <button type="button" mat-icon-button matSuffix (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.hasError('passwordMismatch')) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            
            <button mat-raised-button 
                    color="primary" 
                    type="submit" 
                    class="full-width submit-btn"
                    [disabled]="loading() || registerForm.invalid">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Create Account
              }
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <p class="text-center">
            Already have an account? 
            <a routerLink="/auth/login">Sign in</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #5e35b1 0%, #1a1a2e 100%);
      padding: 1rem;
    }
    
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 2rem;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .full-width {
      width: 100%;
    }
    
    .submit-btn {
      margin-top: 1rem;
      padding: 0.75rem;
      font-size: 1rem;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffebee;
      color: #c62828;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .success-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #e8f5e9;
      color: #2e7d32;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    mat-card-actions {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid #eee;
      margin-top: 1rem;
      
      p { margin: 0; color: #666; }
      a { color: #5e35b1; font-weight: 500; }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  registerForm: FormGroup = this.fb.group({
    full_name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirm: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  hidePassword = signal(true);
  
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirm = form.get('password_confirm');
    return password && confirm && password.value !== confirm.value 
      ? { passwordMismatch: true } 
      : null;
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) return;
    
    this.loading.set(true);
    this.errorMessage.set(null);
    
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.successMessage.set('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.email?.[0] || 
          err.error?.password?.[0] || 
          'Registration failed. Please try again.'
        );
      }
    });
  }
}




