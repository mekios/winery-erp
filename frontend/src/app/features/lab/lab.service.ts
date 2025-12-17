import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from '@shared/services/api.service';

// === TYPES ===

export type SampleType = 'TANK' | 'BARREL' | 'WINE_LOT' | 'BATCH' | 'BLEND' | 'BOTTLE' | 'OTHER';

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  TANK: 'Tank',
  BARREL: 'Barrel',
  WINE_LOT: 'Wine Lot',
  BATCH: 'Batch',
  BLEND: 'Blend Sample',
  BOTTLE: 'Bottle',
  OTHER: 'Other',
};

export interface Analysis {
  id: string;
  winery: string;
  sample_type: SampleType;
  tank: string | null;
  tank_code: string | null;
  barrel: string | null;
  barrel_code: string | null;
  wine_lot: string | null;
  wine_lot_code: string | null;
  batch: string | null;
  batch_code: string | null;
  analysis_date: string;
  sample_date: string | null;
  temperature_c: number | null;
  // Basic parameters
  ph: number | null;
  ta_gl: number | null;
  va_gl: number | null;
  // Sugar & Density
  brix: number | null;
  density: number | null;
  residual_sugar_gl: number | null;
  // SO₂
  free_so2_mgl: number | null;
  total_so2_mgl: number | null;
  // Alcohol
  alcohol_abv: number | null;
  // Organic acids
  malic_acid_gl: number | null;
  lactic_acid_gl: number | null;
  tartaric_acid_gl: number | null;
  citric_acid_gl: number | null;
  // Color
  color_intensity: number | null;
  color_hue: number | null;
  // Metadata
  analyzed_by: string | null;
  analyzed_by_name: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  source_display: string;
  molecular_so2: number | null;
  potential_alcohol: number | null;
  bound_so2: number | null;
  mlf_progress: string | null;
}

export interface AnalysisList {
  id: string;
  sample_type: SampleType;
  source_display: string;
  analysis_date: string;
  ph: number | null;
  ta_gl: number | null;
  va_gl: number | null;
  brix: number | null;
  density: number | null;
  residual_sugar_gl: number | null;
  free_so2_mgl: number | null;
  total_so2_mgl: number | null;
  molecular_so2: number | null;
  alcohol_abv: number | null;
  analyzed_by_name: string | null;
}

export interface AnalysisCreate {
  sample_type: SampleType;
  tank?: string;
  barrel?: string;
  wine_lot?: string;
  batch?: string;
  analysis_date: string;
  sample_date?: string;
  temperature_c?: number;
  // Basic parameters
  ph?: number;
  ta_gl?: number;
  va_gl?: number;
  // Sugar & Density
  brix?: number;
  density?: number;
  residual_sugar_gl?: number;
  // SO₂
  free_so2_mgl?: number;
  total_so2_mgl?: number;
  // Alcohol
  alcohol_abv?: number;
  // Organic acids
  malic_acid_gl?: number;
  lactic_acid_gl?: number;
  tartaric_acid_gl?: number;
  citric_acid_gl?: number;
  // Color
  color_intensity?: number;
  color_hue?: number;
  // Metadata
  notes?: string;
}

export interface AnalysisHistoryPoint {
  date: string;
  ph: number | null;
  ta_gl: number | null;
  va_gl: number | null;
  brix: number | null;
  density: number | null;
  free_so2_mgl: number | null;
  total_so2_mgl: number | null;
  molecular_so2: number | null;
  alcohol_abv: number | null;
  malic_acid_gl: number | null;
  lactic_acid_gl: number | null;
}

export interface AnalysisSummary {
  total_count: number;
  averages: {
    ph: number | null;
    ta_gl: number | null;
    va_gl: number | null;
    free_so2_mgl: number | null;
    total_so2_mgl: number | null;
  };
  ranges: {
    ph: { min: number | null; max: number | null };
    va_gl: { min: number | null; max: number | null };
  };
  by_sample_type: Record<string, number>;
}

// === SERVICE ===

@Injectable({
  providedIn: 'root',
})
export class LabService {
  private api = inject(ApiService);
  private endpoint = 'lab/analyses';

  // === CRUD ===

  getAnalyses(params?: QueryParams): Observable<PaginatedResponse<AnalysisList>> {
    return this.api.getList<AnalysisList>(this.endpoint, params);
  }

  getAnalysis(id: string): Observable<Analysis> {
    return this.api.get<Analysis>(this.endpoint, id);
  }

  createAnalysis(data: AnalysisCreate): Observable<Analysis> {
    return this.api.create<Analysis>(this.endpoint, data);
  }

  updateAnalysis(id: string, data: Partial<AnalysisCreate>): Observable<Analysis> {
    return this.api.update<Analysis>(this.endpoint, id, data);
  }

  deleteAnalysis(id: string): Observable<void> {
    return this.api.delete(this.endpoint, id);
  }

  // === Quick Entry ===

  quickEntry(data: AnalysisCreate): Observable<Analysis> {
    return this.api.action<Analysis>(this.endpoint, 'quick_entry', data);
  }

  // === Sample Types ===

  getSampleTypes(): Observable<{ value: string; label: string }[]> {
    return this.api.action<{ value: string; label: string }[]>(this.endpoint, 'sample_types', {});
  }

  // === History ===

  getTankHistory(tankId: string, limit = 50): Observable<AnalysisHistoryPoint[]> {
    return this.api.action<AnalysisHistoryPoint[]>(
      this.endpoint,
      `tank_history?tank=${tankId}&limit=${limit}`,
      {}
    );
  }

  getWineLotHistory(lotId: string, limit = 50): Observable<AnalysisHistoryPoint[]> {
    return this.api.action<AnalysisHistoryPoint[]>(
      this.endpoint,
      `wine_lot_history?wine_lot=${lotId}&limit=${limit}`,
      {}
    );
  }

  // === Summary ===

  getSummary(startDate?: string, endDate?: string): Observable<AnalysisSummary> {
    let params = '';
    if (startDate) params += `?start_date=${startDate}`;
    if (endDate) params += `${params ? '&' : '?'}end_date=${endDate}`;
    return this.api.action<AnalysisSummary>(this.endpoint, `summary${params}`, {});
  }
}

