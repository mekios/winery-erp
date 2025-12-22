import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  tanks: {
    total: number;
    active: number;
    empty: number;
    total_capacity_l: number;
    total_volume_l: number;
    fill_percentage: number;
  };
  barrels: {
    total: number;
    in_use: number;
  };
  batches: {
    total: number;
    this_season: number;
  };
  wine_lots: {
    total: number;
    active: number;
  };
  transfers: {
    total: number;
    today: number;
    this_week: number;
  };
  analyses: {
    total: number;
    this_week: number;
  };
  varieties: number;
  growers: number;
}

export interface RecentTransfer {
  id: string;
  action_type: string;
  action_type_display: string;
  source_tank: string | null;
  destination_tank: string | null;
  volume_l: number;
  transfer_date: string;
}

export interface RecentAnalysis {
  id: string;
  source_display: string;
  analysis_date: string;
  ph: number | null;
  ta_gl: number | null;
  va_gl: number | null;
  free_so2_mgl: number | null;
}

export interface TopTank {
  id: string;
  code: string;
  name: string;
  capacity_l: number;
  current_volume_l: number;
  fill_percentage: number;
}

export interface DashboardAlert {
  type: 'warning' | 'danger' | 'info';
  category: 'low_so2' | 'high_va' | 'unknown_composition' | string;
  message: string;
  date: string;
  source_id: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_transfers: RecentTransfer[];
  recent_analyses: RecentAnalysis[];
  top_tanks: TopTank[];
  alerts: DashboardAlert[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/wineries`;

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/dashboard/`);
  }
}

