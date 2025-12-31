import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Token storage keys (must match AuthService)
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACTIVE_WINERY_KEY = 'active_winery_id';

// Flag to prevent multiple refresh calls
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Auth interceptor that:
 * 1. Adds JWT token to requests
 * 2. Adds X-Winery-ID header for multi-tenancy
 * 3. Automatically refreshes expired tokens on 401 errors
 * 4. Redirects to login if refresh fails
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  // Don't inject AuthService here - it causes circular dependency during initialization
  // Only inject it when we actually need it (in handle401Error)
  
  // Check if this request should skip auth intercept (used during initialization)
  const skipAuthIntercept = req.headers.has('X-Skip-Auth-Intercept');
  
  // Get tokens directly from localStorage
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const wineryId = localStorage.getItem(ACTIVE_WINERY_KEY);
  
  // Build headers
  let headers = req.headers;
  
  // Remove the skip header before sending (if present)
  if (skipAuthIntercept) {
    headers = headers.delete('X-Skip-Auth-Intercept');
  }
  
  // Add auth token
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Add winery ID for multi-tenancy
  if (wineryId) {
    headers = headers.set('X-Winery-ID', wineryId);
  }
  
  const authReq = req.clone({ headers });
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !skipAuthIntercept) {
        // Don't try to refresh if this is already a token endpoint
        if (req.url.includes('/auth/token')) {
          // Token refresh failed, logout
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          router.navigate(['/auth/login']);
          return throwError(() => error);
        }
        
        // Try to refresh the token (inject AuthService only when needed)
        return handle401Error(req, next, router);
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * Handle 401 error by attempting to refresh the token
 */
function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  router: Router
) {
  // Inject AuthService only when we need it to avoid circular dependency during init
  const authService = inject(AuthService);
  
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);
    
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      // No refresh token, logout
      isRefreshing = false;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      router.navigate(['/auth/login']);
      return throwError(() => new Error('No refresh token'));
    }
    
    // Call the auth service refresh method
    return authService.refreshToken().pipe(
      switchMap((tokenResponse) => {
        isRefreshing = false;
        
        if (tokenResponse && tokenResponse.access) {
          // Refresh successful, emit new token
          refreshTokenSubject.next(tokenResponse.access);
          
          // Retry the original request with new token
          const newToken = localStorage.getItem(ACCESS_TOKEN_KEY);
          const clonedRequest = addTokenToRequest(request, newToken);
          return next(clonedRequest);
        }
        
        // Refresh failed, logout
        router.navigate(['/auth/login']);
        return throwError(() => new Error('Token refresh failed'));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        
        // Refresh failed, logout
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        router.navigate(['/auth/login']);
        return throwError(() => err);
      })
    );
  } else {
    // Refresh is already in progress, wait for it to complete
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        // Retry the original request with new token
        const clonedRequest = addTokenToRequest(request, token);
        return next(clonedRequest);
      })
    );
  }
}

/**
 * Helper to add token to request
 */
function addTokenToRequest(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return request;
  }
  
  const wineryId = localStorage.getItem(ACTIVE_WINERY_KEY);
  let headers = request.headers.set('Authorization', `Bearer ${token}`);
  
  if (wineryId) {
    headers = headers.set('X-Winery-ID', wineryId);
  }
  
  return request.clone({ headers });
}
