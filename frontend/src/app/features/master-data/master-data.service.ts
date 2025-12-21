import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from '@shared/services/api.service';

// ===============================
// Grape Variety Types
// ===============================
export interface GrapeVariety {
  id: string;
  name: string;
  code: string;
  color: 'RED' | 'WHITE' | 'ROSE';
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface GrapeVarietyCreate {
  name: string;
  code?: string;
  color: 'RED' | 'WHITE' | 'ROSE';
  is_active?: boolean;
  notes?: string;
}

// ===============================
// Grower Types
// ===============================
export interface Grower {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
  notes: string;
  vineyard_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GrowerCreate {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  notes?: string;
}

// ===============================
// Vineyard Block Types
// ===============================
export interface VineyardBlock {
  id: string;
  grower: string;
  grower_name: string;
  name: string;
  code: string;
  region: string;
  subregion: string;
  area_ha: number | null;
  elevation_m: number | null;
  primary_variety: string | null;
  primary_variety_name: string | null;
  soil_type: string;
  year_planted: number | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface VineyardBlockCreate {
  grower: string;
  name: string;
  code?: string;
  region?: string;
  subregion?: string;
  area_ha?: number;
  elevation_m?: number;
  primary_variety?: string;
  soil_type?: string;
  year_planted?: number;
  is_active?: boolean;
  notes?: string;
}

// ===============================
// Dropdown Types
// ===============================
export interface GrapeVarietyDropdown {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface GrowerDropdown {
  id: string;
  name: string;
}

export interface VineyardBlockDropdown {
  id: string;
  name: string;
  code: string;
  grower_name: string;
  display_name: string;
  region: string;
}

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private api = inject(ApiService);
  
  // ===============================
  // Grape Varieties
  // ===============================
  
  getVarieties(params?: QueryParams): Observable<PaginatedResponse<GrapeVariety>> {
    return this.api.getList<GrapeVariety>('master-data/varieties', params);
  }
  
  getVarietiesDropdown(): Observable<GrapeVarietyDropdown[]> {
    return this.api.getDropdown<GrapeVarietyDropdown>('master-data/varieties');
  }
  
  getVariety(id: string): Observable<GrapeVariety> {
    return this.api.get<GrapeVariety>('master-data/varieties', id);
  }
  
  createVariety(data: GrapeVarietyCreate): Observable<GrapeVariety> {
    return this.api.create<GrapeVariety>('master-data/varieties', data);
  }
  
  updateVariety(id: string, data: Partial<GrapeVarietyCreate>): Observable<GrapeVariety> {
    return this.api.patch<GrapeVariety>('master-data/varieties', id, data);
  }
  
  deleteVariety(id: string): Observable<void> {
    return this.api.delete('master-data/varieties', id);
  }
  
  // ===============================
  // Growers
  // ===============================
  
  getGrowers(params?: QueryParams): Observable<PaginatedResponse<Grower>> {
    return this.api.getList<Grower>('master-data/growers', params);
  }
  
  getGrowersDropdown(): Observable<GrowerDropdown[]> {
    return this.api.getDropdown<GrowerDropdown>('master-data/growers');
  }
  
  getGrower(id: string): Observable<Grower> {
    return this.api.get<Grower>('master-data/growers', id);
  }
  
  createGrower(data: GrowerCreate): Observable<Grower> {
    return this.api.create<Grower>('master-data/growers', data);
  }
  
  updateGrower(id: string, data: Partial<GrowerCreate>): Observable<Grower> {
    return this.api.patch<Grower>('master-data/growers', id, data);
  }
  
  deleteGrower(id: string): Observable<void> {
    return this.api.delete('master-data/growers', id);
  }
  
  // ===============================
  // Vineyard Blocks
  // ===============================
  
  getVineyards(params?: QueryParams): Observable<PaginatedResponse<VineyardBlock>> {
    return this.api.getList<VineyardBlock>('master-data/vineyards', params);
  }
  
  getVineyardsDropdown(): Observable<VineyardBlockDropdown[]> {
    return this.api.getDropdown<VineyardBlockDropdown>('master-data/vineyards');
  }
  
  getVineyard(id: string): Observable<VineyardBlock> {
    return this.api.get<VineyardBlock>('master-data/vineyards', id);
  }
  
  createVineyard(data: VineyardBlockCreate): Observable<VineyardBlock> {
    return this.api.create<VineyardBlock>('master-data/vineyards', data);
  }
  
  updateVineyard(id: string, data: Partial<VineyardBlockCreate>): Observable<VineyardBlock> {
    return this.api.patch<VineyardBlock>('master-data/vineyards', id, data);
  }
  
  deleteVineyard(id: string): Observable<void> {
    return this.api.delete('master-data/vineyards', id);
  }
}






