import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, switchMap, of, Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  full_name: string;
  password: string;
  password_confirm: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  // Use BehaviorSubject for initialization state to work with guards
  private _initialized$ = new BehaviorSubject<boolean>(false);
  initialized$ = this._initialized$.asObservable();
  
  // Signals for reactive state
  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  
  // Public readonly signals
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = this._isAuthenticated.asReadonly();
  
  // Computed values
  isLoggedIn = computed(() => this._isAuthenticated() && this._currentUser() !== null);

  constructor() {
    // Initialize auth state on service creation
    this.initializeAuth();
  }

  /**
   * Check if auth is initialized
   */
  isInitialized(): boolean {
    return this._initialized$.getValue();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private async initializeAuth(): Promise<void> {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    console.log('[AuthService] initializeAuth - access token exists:', !!token, ', refresh token exists:', !!refreshToken);
    
    if (!token && !refreshToken) {
      console.log('[AuthService] No tokens, setting initialized');
      this._initialized$.next(true);
      return;
    }
    
    // If we have a refresh token but no access token, try refresh first
    if (!token && refreshToken) {
      console.log('[AuthService] No access token but have refresh token, attempting refresh...');
      try {
        const user = await firstValueFrom(this.tryRefreshToken());
        if (user) {
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
          console.log('[AuthService] Authenticated via refresh!');
        } else {
          console.log('[AuthService] Refresh returned null, clearing tokens');
          this.clearTokens();
        }
      } catch (err) {
        console.error('[AuthService] Refresh failed:', err);
        this.clearTokens();
      } finally {
        this._initialized$.next(true);
      }
      return;
    }

    try {
      console.log('[AuthService] Validating access token with /users/me/');
      // Try to validate the token - use skipAuthIntercept to prevent interceptor interference
      const user = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/users/me/`, {
          headers: { 'X-Skip-Auth-Intercept': 'true' }
        }).pipe(
          tap(u => console.log('[AuthService] User fetched successfully:', u.email)),
          catchError((err) => {
            console.log('[AuthService] Token validation failed (status:', err?.status, '), trying refresh...');
            // Token invalid, try refresh
            return this.tryRefreshToken();
          })
        )
      );
      
      console.log('[AuthService] Got user after validation/refresh:', user ? user.email : 'null');
      if (user) {
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        console.log('[AuthService] ✓ Authenticated successfully!');
      } else {
        console.warn('[AuthService] ✗ User is null after validation/refresh, clearing tokens');
        this.clearTokens();
      }
    } catch (err) {
      console.error('[AuthService] ✗ All auth attempts failed:', err);
      // All attempts failed, clear tokens
      this.clearTokens();
    } finally {
      console.log('[AuthService] Setting initialized = true');
      this._initialized$.next(true);
    }
  }

  /**
   * Try to refresh the token
   */
  private tryRefreshToken(): Observable<User | null> {
    const refreshToken = this.getRefreshToken();
    console.log('[AuthService] tryRefreshToken - refresh token exists:', !!refreshToken);
    
    if (!refreshToken) {
      console.log('[AuthService] No refresh token, clearing tokens');
      this.clearTokens();
      return of(null);
    }
    
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }, {
      headers: { 'X-Skip-Auth-Intercept': 'true' }
    }).pipe(
      tap(response => console.log('[AuthService] Token refreshed successfully')),
      switchMap(response => {
        this.setTokens(response);
        return this.http.get<User>(`${environment.apiUrl}/users/me/`, {
          headers: { 'X-Skip-Auth-Intercept': 'true' }
        });
      }),
      catchError((err) => {
        console.log('[AuthService] Token refresh failed:', err);
        this.clearTokens();
        return of(null);
      })
    );
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/token/`, credentials)
      .pipe(
        tap(response => {
          this.setTokens(response);
          this._isAuthenticated.set(true);
        }),
        switchMap(() => this.http.get<User>(`${environment.apiUrl}/users/me/`)),
        tap(user => {
          this._currentUser.set(user);
        })
      );
  }

  /**
   * Register a new user
   */
  register(data: RegisterData): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/users/register/`, data);
  }

  /**
   * Logout - clear tokens and redirect
   */
  logout(): void {
    this.clearTokens();
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh the access token
   */
  refreshToken(): Observable<TokenResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }
    
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        this.setTokens(response);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get the refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Store tokens in localStorage
   */
  private setTokens(tokens: TokenResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}
