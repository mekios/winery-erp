import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

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
  updated_at: string;
}

export interface WineryCreate {
  name: string;
  code: string;
  country?: string;
  region?: string;
  address?: string;
  timezone?: string;
}

export interface WineryMember {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  winery: string;
  winery_name: string;
  role: 'CONSULTANT' | 'WINERY_OWNER' | 'WINEMAKER' | 'CELLAR_STAFF' | 'LAB';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddMemberRequest {
  user_email: string;
  winery: string;
  role: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const ROLE_LABELS: Record<string, string> = {
  CONSULTANT: 'Consultant',
  WINERY_OWNER: 'Winery Owner',
  WINEMAKER: 'Winemaker',
  CELLAR_STAFF: 'Cellar Staff',
  LAB: 'Lab Staff',
};

@Injectable({ providedIn: 'root' })
export class WineriesAdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/wineries`;

  /**
   * Get all wineries the user has access to (admins see all)
   */
  getWineries(): Observable<PaginatedResponse<Winery>> {
    return this.http.get<PaginatedResponse<Winery>>(`${this.baseUrl}/`);
  }

  /**
   * Get a single winery by ID
   */
  getWinery(id: string): Observable<Winery> {
    return this.http.get<Winery>(`${this.baseUrl}/${id}/`);
  }

  /**
   * Create a new winery (creator becomes WINERY_OWNER automatically)
   */
  createWinery(data: WineryCreate): Observable<Winery> {
    return this.http.post<Winery>(`${this.baseUrl}/`, data);
  }

  /**
   * Update a winery
   */
  updateWinery(id: string, data: Partial<WineryCreate>): Observable<Winery> {
    return this.http.patch<Winery>(`${this.baseUrl}/${id}/`, data);
  }

  /**
   * Delete a winery
   */
  deleteWinery(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }

  /**
   * Get members of a winery
   */
  getWineryMembers(wineryId: string): Observable<WineryMember[]> {
    return this.http.get<WineryMember[]>(`${this.baseUrl}/${wineryId}/members/`);
  }

  /**
   * Add a member to a winery
   */
  addMember(data: AddMemberRequest): Observable<WineryMember> {
    return this.http.post<WineryMember>(`${this.baseUrl}/memberships/`, data);
  }

  /**
   * Update a membership (change role, deactivate)
   */
  updateMembership(id: string, data: Partial<WineryMember>): Observable<WineryMember> {
    return this.http.patch<WineryMember>(`${this.baseUrl}/memberships/${id}/`, data);
  }

  /**
   * Remove a member from a winery
   */
  removeMember(membershipId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/memberships/${membershipId}/`);
  }
}






