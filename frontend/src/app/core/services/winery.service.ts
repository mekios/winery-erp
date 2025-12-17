import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, catchError } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

export interface Winery {
  id: string;
  name: string;
  code: string;
  country: string;
  region: string;
  address: string;
  timezone: string;
  member_count: number;
  created_at: string;
}

export interface WineryMembership {
  id: string;
  winery: Winery;
  role: 'CONSULTANT' | 'WINERY_OWNER' | 'WINEMAKER' | 'CELLAR_STAFF' | 'LAB';
  is_active: boolean;
}

export interface SetActiveWineryResponse {
  winery_id: string;
  winery_name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class WineryService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private readonly ACTIVE_WINERY_KEY = 'active_winery_id';
  
  // Signals for reactive state
  private _wineries = signal<WineryMembership[]>([]);
  private _currentWinery = signal<WineryMembership | null>(null);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);
  
  // Public readonly signals
  wineries = this._wineries.asReadonly();
  currentWinery = this._currentWinery.asReadonly();
  loading = this._loading.asReadonly();

  constructor() {
    // Subscribe to auth initialization
    this.authService.initialized$.subscribe(initialized => {
      if (initialized && this.authService.isAuthenticated() && !this._initialized()) {
        this.loadUserWineries();
      }
    });
  }

  /**
   * Load all wineries the user has access to
   */
  loadUserWineries(): void {
    // Don't load if not authenticated
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    this._loading.set(true);
    
    // API returns paginated response: { count, next, previous, results }
    this.http.get<{ count: number; results: WineryMembership[] }>(`${environment.apiUrl}/wineries/my-wineries/`)
      .pipe(
        catchError(err => {
          console.error('Failed to load wineries:', err);
          return of({ count: 0, results: [] });
        })
      )
      .subscribe({
        next: (response) => {
          const memberships = response.results;
          this._wineries.set(memberships);
          this._loading.set(false);
          this._initialized.set(true);
          
          // Auto-select first winery or restore from storage
          const storedWineryId = localStorage.getItem(this.ACTIVE_WINERY_KEY);
          const membership = storedWineryId 
            ? memberships.find(m => m.winery.id === storedWineryId)
            : memberships[0];
          
          if (membership) {
            this._currentWinery.set(membership);
            localStorage.setItem(this.ACTIVE_WINERY_KEY, membership.winery.id);
            console.log('[WineryService] Active winery set:', membership.winery.name, membership.winery.id);
          }
        },
        error: () => {
          this._loading.set(false);
          this._initialized.set(true);
        }
      });
  }

  /**
   * Set the active winery
   */
  setActiveWinery(wineryId: string): void {
    const membership = this._wineries().find(m => m.winery.id === wineryId);
    if (membership) {
      this._currentWinery.set(membership);
      localStorage.setItem(this.ACTIVE_WINERY_KEY, wineryId);
    }
  }

  /**
   * Get the active winery ID for API headers
   */
  getActiveWineryId(): string | null {
    return this._currentWinery()?.winery.id || localStorage.getItem(this.ACTIVE_WINERY_KEY);
  }

  /**
   * Create a new winery
   */
  createWinery(data: Partial<Winery>): Observable<Winery> {
    return this.http.post<Winery>(`${environment.apiUrl}/wineries/`, data)
      .pipe(
        tap(() => {
          // Reload wineries after creation
          this.loadUserWineries();
        })
      );
  }

  /**
   * Get winery details
   */
  getWinery(id: string): Observable<Winery> {
    return this.http.get<Winery>(`${environment.apiUrl}/wineries/${id}/`);
  }

  /**
   * Update winery
   */
  updateWinery(id: string, data: Partial<Winery>): Observable<Winery> {
    return this.http.patch<Winery>(`${environment.apiUrl}/wineries/${id}/`, data);
  }

  /**
   * Check if current user is admin of current winery
   */
  isCurrentWineryAdmin(): boolean {
    const role = this._currentWinery()?.role;
    return role === 'CONSULTANT' || role === 'WINERY_OWNER';
  }

  /**
   * Clear winery state (on logout)
   */
  clear(): void {
    this._wineries.set([]);
    this._currentWinery.set(null);
    this._initialized.set(false);
    localStorage.removeItem(this.ACTIVE_WINERY_KEY);
  }
}
