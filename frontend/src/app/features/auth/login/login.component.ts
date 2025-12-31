import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AuthService } from '@core/services/auth.service';
import { WineryService } from '@core/services/winery.service';

@Component({
  selector: 'app-login',
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
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="auth-wrapper">
      <!-- Left Side - Branding -->
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">🍇</div>
          <h1>Winery ERP</h1>
          <p>Complete winemaking management from grape to bottle. Track batches, manage tanks, and maintain quality.</p>
          
          <div class="brand-features">
            <div class="feature">
              <mat-icon>inventory_2</mat-icon>
              <span>Tank Management</span>
            </div>
            <div class="feature">
              <mat-icon>science</mat-icon>
              <span>Lab Analysis</span>
            </div>
            <div class="feature">
              <mat-icon>swap_horiz</mat-icon>
              <span>Transfer Tracking</span>
            </div>
            <div class="feature">
              <mat-icon>bar_chart</mat-icon>
              <span>Reports & Analytics</span>
            </div>
          </div>
        </div>
        
        <div class="brand-footer">
          <span>© 2024 Winery ERP. All rights reserved.</span>
        </div>
      </div>
      
      <!-- Right Side - Login Form -->
      <div class="auth-form-wrapper">
        <div class="auth-form-container">
          <div class="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>
          
          @if (errorMessage()) {
            <div class="alert alert-error">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }
          
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <div class="input-wrapper" [class.focused]="emailFocused()" [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                <mat-icon class="input-icon">mail_outline</mat-icon>
                <input 
                  type="email" 
                  formControlName="email" 
                  placeholder="you@example.com"
                  autocomplete="email"
                  (focus)="emailFocused.set(true)"
                  (blur)="emailFocused.set(false)">
              </div>
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <span class="error-text">Email is required</span>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <span class="error-text">Please enter a valid email</span>
              }
            </div>
            
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-wrapper" [class.focused]="passwordFocused()" [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                <mat-icon class="input-icon">lock_outline</mat-icon>
                <input 
                  [type]="hidePassword() ? 'password' : 'text'" 
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  (focus)="passwordFocused.set(true)"
                  (blur)="passwordFocused.set(false)">
                <button type="button" class="toggle-password" (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <span class="error-text">Password is required</span>
              }
            </div>
            
            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox">
                <span>Remember me</span>
              </label>
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>
            
            <button 
              type="submit" 
              class="btn btn-primary btn-submit"
              [disabled]="loading() || loginForm.invalid">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
                <span>Signing in...</span>
              } @else {
                <span>Sign In</span>
                <mat-icon>arrow_forward</mat-icon>
              }
            </button>
          </form>
          
          <div class="form-footer">
            <span>Don't have an account?</span>
            <a routerLink="/auth/register">Create Account</a>
          </div>
          
          <!-- Demo credentials hint -->
          <div class="demo-hint">
            <mat-icon>info_outline</mat-icon>
            <div>
              <strong>Demo:</strong> consultant&#64;winery.com / demo123
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private wineryService = inject(WineryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal(true);
  emailFocused = signal(false);
  passwordFocused = signal(false);
  
  onSubmit(): void {
    if (this.loginForm.invalid) return;
    
    this.loading.set(true);
    this.errorMessage.set(null);
    
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        // Load wineries after successful login
        this.wineryService.loadUserWineries();
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.detail || 'Invalid email or password. Please try again.'
        );
      }
    });
  }
}
