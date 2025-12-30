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
  styles: [`
    /* ===========================================
       Auth Wrapper
       =========================================== */
    .auth-wrapper {
      display: flex;
      min-height: 100vh;
    }
    
    /* ===========================================
       Left Side - Branding
       =========================================== */
    .auth-brand {
      flex: 1;
      background: linear-gradient(135deg, #1a1a2e 0%, #7c4dff 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 3rem;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: -30%;
        left: -30%;
        width: 80%;
        height: 80%;
        background: radial-gradient(circle, rgba(124,77,255,0.3) 0%, transparent 70%);
      }
    }
    
    .brand-content {
      position: relative;
      z-index: 1;
    }
    
    .brand-logo {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    
    .brand-content h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: white;
    }
    
    .brand-content p {
      font-size: 1.125rem;
      opacity: 0.85;
      line-height: 1.7;
      max-width: 400px;
    }
    
    .brand-features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 3rem;
    }
    
    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      
      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
        opacity: 0.9;
      }
      
      span {
        font-size: 0.875rem;
        font-weight: 500;
      }
    }
    
    .brand-footer {
      position: relative;
      z-index: 1;
      font-size: 0.8125rem;
      opacity: 0.6;
    }
    
    /* ===========================================
       Right Side - Form
       =========================================== */
    .auth-form-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--bg-body);
    }
    
    .auth-form-container {
      width: 100%;
      max-width: 420px;
    }
    
    .form-header {
      margin-bottom: 2rem;
      
      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
      }
      
      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }
    
    /* ===========================================
       Alert
       =========================================== */
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: var(--border-radius-sm);
      margin-bottom: 1.5rem;
      
      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
      }
    }
    
    .alert-error {
      background: var(--danger-light);
      color: #c62828;
    }
    
    /* ===========================================
       Form Styles
       =========================================== */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      transition: all var(--transition-fast);
      
      &.focused {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.12);
      }
      
      &.error {
        border-color: var(--danger);
        
        .input-icon {
          color: var(--danger);
        }
      }
    }
    
    .input-icon {
      color: var(--text-muted);
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }
    
    .input-wrapper input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.9375rem;
      font-family: inherit;
      background: transparent;
      color: var(--text-primary);
      
      &::placeholder {
        color: var(--text-muted);
      }
    }
    
    .toggle-password {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      display: flex;
      
      mat-icon {
        color: var(--text-muted);
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
        transition: color var(--transition-fast);
      }
      
      &:hover mat-icon {
        color: var(--text-secondary);
      }
    }
    
    .error-text {
      font-size: 0.75rem;
      color: var(--danger);
    }
    
    /* ===========================================
       Form Options
       =========================================== */
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-secondary);
      
      input {
        width: 16px;
        height: 16px;
        accent-color: var(--primary);
      }
    }
    
    .forgot-link {
      font-size: 0.875rem;
      color: var(--primary);
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    /* ===========================================
       Submit Button
       =========================================== */
    .btn-submit {
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      margin-top: 0.5rem;
      
      mat-spinner {
        display: inline-flex;
        margin-right: 0.5rem;
        
        ::ng-deep circle {
          stroke: white;
        }
      }
      
      mat-icon {
        font-size: 1.25rem;
        margin-left: 0.5rem;
      }
    }
    
    /* ===========================================
       Form Footer
       =========================================== */
    .form-footer {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.875rem;
      
      span {
        color: var(--text-secondary);
      }
      
      a {
        color: var(--primary);
        font-weight: 600;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    /* ===========================================
       Demo Hint
       =========================================== */
    .demo-hint {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding: 1rem;
      background: var(--info-light);
      border-radius: var(--border-radius-sm);
      font-size: 0.8125rem;
      color: #0d6efd;
      
      mat-icon {
        font-size: 1.125rem;
        width: 1.125rem;
        height: 1.125rem;
        flex-shrink: 0;
      }
      
      strong {
        font-weight: 700;
      }
    }
    
    /* ===========================================
       Responsive
       =========================================== */
    @media (max-width: 991px) {
      .auth-brand {
        display: none;
      }
      
      .auth-form-wrapper {
        padding: 1.5rem;
      }
    }
    
    @media (max-width: 576px) {
      .form-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
    }
  `]
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
