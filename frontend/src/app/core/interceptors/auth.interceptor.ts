import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Token storage keys (must match AuthService)
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACTIVE_WINERY_KEY = 'active_winery_id';

/**
 * Auth interceptor that:
 * 1. Adds JWT token to requests (from localStorage directly to avoid circular dependency)
 * 2. Adds X-Winery-ID header for multi-tenancy
 * 3. Handles 401 errors - redirects to login (refresh is handled by AuthService during init)
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  
  // Check if this request should skip auth intercept (used during initialization)
  const skipAuthIntercept = req.headers.has('X-Skip-Auth-Intercept');
  
  // Get tokens directly from localStorage to avoid circular dependency
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
      // Handle 401 Unauthorized (skip during initialization)
      if (error.status === 401 && !req.url.includes('/auth/token') && !skipAuthIntercept) {
        // Clear tokens and redirect to login
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
