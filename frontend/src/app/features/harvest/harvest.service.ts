import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from '@shared/services/api.service';

// ===============================
// Harvest Season Types
// ===============================
export interface HarvestSeason {
  id: string;
  year: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  notes: string;
  batch_count: number;
  total_grape_weight_kg: number;
  created_at: string;
  updated_at: string;
}

export interface HarvestSeasonCreate {
  year: number;
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface HarvestSeasonDropdown {
  id: string;
  year: number;
  name: string;
  display_name: string;
  is_active: boolean;
}

// ===============================
// Batch Types
// ===============================
export type BatchStage = 'INTAKE' | 'CRUSHING' | 'FERMENTATION' | 'POST_FERMENT' | 'AGING' | 'BLENDING' | 'BOTTLING' | 'COMPLETE';
export type SourceType = 'OWN' | 'PURCHASED' | 'MIXED';

export interface BatchSource {
  id: string;
  vineyard_block: string | null;
  vineyard_name: string | null;
  grower_name: string | null;
  variety: string | null;
  variety_name: string | null;
  variety_color: string | null;
  weight_kg: number;
  is_estimated: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BatchSourceCreate {
  vineyard_block?: string;
  variety?: string;
  weight_kg: number;
  is_estimated?: boolean;
  notes?: string;
}

export interface VarietyBreakdown {
  variety_id: string | null;
  variety_name: string;
  weight_kg: number;
  percentage: number;
}

export interface Batch {
  id: string;
  batch_code: string;
  harvest_season: string;
  season_name: string;
  season_year: number;
  intake_date: string;
  source_type: SourceType;
  initial_tank: string | null;
  tank_code: string | null;
  tank_name: string | null;
  grape_weight_kg: number;
  must_volume_l: number;
  stage: BatchStage;
  notes: string;
  source_count: number;
  primary_variety_name: string | null;
  variety_breakdown: VarietyBreakdown[];
  sources: BatchSource[];
  created_at: string;
  updated_at: string;
}

export interface BatchList {
  id: string;
  batch_code: string;
  season_year: number;
  intake_date: string;
  source_type: SourceType;
  tank_code: string | null;
  grape_weight_kg: number;
  must_volume_l: number;
  stage: BatchStage;
  source_count: number;
  primary_variety_name: string | null;
}

export interface BatchCreate {
  harvest_season: string;
  intake_date: string;
  source_type?: SourceType;
  initial_tank?: string;
  must_volume_l?: number;
  notes?: string;
  sources?: BatchSourceCreate[];
}

export interface BatchSummary {
  total_batches: number;
  total_grape_weight_kg: number;
  total_must_volume_l: number;
  by_stage: Record<string, number>;
  by_source_type: Record<string, number>;
}

// ===============================
// Label Maps
// ===============================
export const BATCH_STAGE_LABELS: Record<BatchStage, string> = {
  INTAKE: 'Intake',
  CRUSHING: 'Crushing',
  FERMENTATION: 'Fermentation',
  POST_FERMENT: 'Post-Fermentation',
  AGING: 'Aging',
  BLENDING: 'Blending',
  BOTTLING: 'Bottling',
  COMPLETE: 'Complete',
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  OWN: 'Own Vineyard',
  PURCHASED: 'Purchased',
  MIXED: 'Mixed Sources',
};

@Injectable({ providedIn: 'root' })
export class HarvestService {
  private api = inject(ApiService);
  
  // ===============================
  // Harvest Seasons
  // ===============================
  
  getSeasons(params?: QueryParams): Observable<PaginatedResponse<HarvestSeason>> {
    return this.api.getList<HarvestSeason>('harvest/seasons', params);
  }
  
  getSeasonsDropdown(): Observable<HarvestSeasonDropdown[]> {
    return this.api.getDropdown<HarvestSeasonDropdown>('harvest/seasons');
  }
  
  getSeason(id: string): Observable<HarvestSeason> {
    return this.api.get<HarvestSeason>('harvest/seasons', id);
  }
  
  getCurrentSeason(): Observable<HarvestSeason> {
    return this.api.action<HarvestSeason>('harvest/seasons', 'current');
  }
  
  createSeason(data: HarvestSeasonCreate): Observable<HarvestSeason> {
    return this.api.create<HarvestSeason>('harvest/seasons', data);
  }
  
  updateSeason(id: string, data: Partial<HarvestSeasonCreate>): Observable<HarvestSeason> {
    return this.api.patch<HarvestSeason>('harvest/seasons', id, data);
  }
  
  deleteSeason(id: string): Observable<void> {
    return this.api.delete('harvest/seasons', id);
  }
  
  // ===============================
  // Batches
  // ===============================
  
  getBatches(params?: QueryParams): Observable<PaginatedResponse<BatchList>> {
    return this.api.getList<BatchList>('harvest/batches', params);
  }
  
  getBatch(id: string): Observable<Batch> {
    return this.api.get<Batch>('harvest/batches', id);
  }
  
  createBatch(data: BatchCreate): Observable<Batch> {
    return this.api.create<Batch>('harvest/batches', data as unknown as Partial<Batch>);
  }
  
  updateBatch(id: string, data: Partial<BatchCreate>): Observable<Batch> {
    return this.api.patch<Batch>('harvest/batches', id, data as unknown as Partial<Batch>);
  }
  
  deleteBatch(id: string): Observable<void> {
    return this.api.delete('harvest/batches', id);
  }
  
  getBatchSummary(seasonId?: string): Observable<BatchSummary> {
    const params = seasonId ? `?season=${seasonId}` : '';
    return this.api.action<BatchSummary>('harvest/batches', `summary${params}`);
  }
  
  addBatchSource(batchId: string, source: BatchSourceCreate): Observable<BatchSource> {
    return this.api.action<BatchSource>('harvest/batches', `${batchId}/add_source`, source);
  }
  
  // ===============================
  // Batch Sources
  // ===============================
  
  deleteSource(id: string): Observable<void> {
    return this.api.delete('harvest/sources', id);
  }
  
  updateSource(id: string, data: Partial<BatchSourceCreate>): Observable<BatchSource> {
    return this.api.patch<BatchSource>('harvest/sources', id, data);
  }
}

