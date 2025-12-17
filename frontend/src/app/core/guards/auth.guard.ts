import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take, tap } from 'rxjs/operators';

/**
 * Guard that prevents unauthenticated users from accessing protected routes.
 * Waits for auth service to initialize before checking authentication.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('[authGuard] Checking auth for:', state.url);
  
  // Wait for auth initialization, then check authentication
  return authService.initialized$.pipe(
    tap(init => console.log('[authGuard] initialized$:', init)),
    filter(initialized => initialized === true),
    take(1),
    map(() => {
      const isAuth = authService.isAuthenticated();
      console.log('[authGuard] isAuthenticated:', isAuth);
      
      if (isAuth) {
        console.log('[authGuard] Allowing access');
        return true;
      }
      
      console.log('[authGuard] Redirecting to login');
      // Not authenticated, redirect to login
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};

/**
 * Guard that prevents authenticated users from accessing auth pages (login, register).
 * Waits for auth service to initialize before checking authentication.
 */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Wait for auth initialization, then check authentication
  return authService.initialized$.pipe(
    filter(initialized => initialized === true),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        return true;
      }
      
      // Already authenticated, redirect to dashboard
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
