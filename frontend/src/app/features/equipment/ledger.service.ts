import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ===============================
// Composition Types
// ===============================

export interface CompositionBatch {
  batch_id: string;
  label: string;
  volume_l: number;
  percentage: number;
}

export interface CompositionVariety {
  variety: string;
  volume_l: number;
  percentage: number;
}

export interface CompositionVineyard {
  vineyard: string;
  grower: string;
  volume_l: number;
  percentage: number;
}

export interface TankComposition {
  tank_id: string;
  tank_code: string;
  tank_name: string;
  total_volume_l: number;
  by_batch: CompositionBatch[];
  by_variety: CompositionVariety[];
  by_vineyard: CompositionVineyard[];
  unknown_volume_l: number;
  unknown_percentage: number;
  has_integrity_issues: boolean;
}

export interface LedgerEntry {
  id: string;
  event_datetime: string;
  tank: string;
  tank_code: string;
  delta_volume_l: number;
  composition_key_type: 'BATCH' | 'WINE_LOT' | 'UNKNOWN';
  composition_key_id: string | null;
  composition_key_label: string;
  derived_source: 'EXPLICIT' | 'INHERITED' | 'UNKNOWN';
  created_at: string;
}

export interface IntegrityIssue {
  tank_id: string;
  tank_code: string;
  has_unknown_volume: boolean;
  unknown_volume_l: number;
  unknown_percentage: number;
  has_negative_composition: boolean;
  ledger_volume_l: number;
  tank_current_volume_l: number;
  volume_mismatch_l: number;
}

export interface IntegrityReport {
  total_tanks: number;
  tanks_with_issues: number;
  issues: IntegrityIssue[];
}

export interface LedgerStats {
  total_entries: number;
  by_source: {
    explicit: number;
    inherited: number;
    unknown: number;
  };
  tanks_with_data: number;
  tanks_with_unknown: number;
}

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  
  /**
   * Get composition for all tanks with wine
   */
  getAllCompositions(): Observable<TankComposition[]> {
    return this.http.get<TankComposition[]>(`${this.baseUrl}/ledger/composition/`);
  }
  
  /**
   * Get detailed composition for a specific tank
   */
  getTankComposition(tankId: string): Observable<TankComposition> {
    return this.http.get<TankComposition>(`${this.baseUrl}/ledger/composition/${tankId}/`);
  }
  
  /**
   * Get ledger history for a tank
   */
  getTankHistory(tankId: string, limit = 100): Observable<LedgerEntry[]> {
    return this.http.get<LedgerEntry[]>(`${this.baseUrl}/ledger/composition/${tankId}/history/?limit=${limit}`);
  }
  
  /**
   * Get integrity report across all tanks
   */
  getIntegrityReport(): Observable<IntegrityReport> {
    return this.http.get<IntegrityReport>(`${this.baseUrl}/ledger/composition/integrity/`);
  }
  
  /**
   * Get overall ledger statistics
   */
  getStats(): Observable<LedgerStats> {
    return this.http.get<LedgerStats>(`${this.baseUrl}/ledger/stats/`);
  }
}

