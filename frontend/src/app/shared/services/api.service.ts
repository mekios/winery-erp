import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Build HttpParams from query params object
   */
  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    
    return httpParams;
  }

  /**
   * GET request with pagination support
   */
  getList<T>(endpoint: string, params?: QueryParams): Observable<PaginatedResponse<T>> {
    return this.http.get<PaginatedResponse<T>>(
      `${this.baseUrl}/${endpoint}/`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * GET request for dropdown data (no pagination)
   */
  getDropdown<T>(endpoint: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/${endpoint}/dropdown/`);
  }

  /**
   * GET single item by ID
   */
  get<T>(endpoint: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}/${id}/`);
  }

  /**
   * POST - create new item
   */
  create<T>(endpoint: string, data: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}/`, data);
  }

  /**
   * PUT - full update
   */
  update<T>(endpoint: string, id: string, data: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}/${id}/`, data);
  }

  /**
   * PATCH - partial update
   */
  patch<T>(endpoint: string, id: string, data: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}/${id}/`, data);
  }

  /**
   * DELETE - remove item
   */
  delete(endpoint: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${endpoint}/${id}/`);
  }

  /**
   * Custom action endpoint (POST by default)
   */
  action<T>(endpoint: string, action: string, data?: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}/${action}/`, data || {});
  }
  
  /**
   * Custom action endpoint with DELETE method
   */
  actionDelete<T>(endpoint: string, action: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}/${action}/`);
  }
}



