import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Enums
export type MaterialCategory = 'ADDITIVE' | 'STABILIZER' | 'FINING_AGENT' | 'YEAST' | 'NUTRIENT' | 'ENZYME' | 'ACID' | 'TANNIN' | 'OAK' | 'CLEANING' | 'PACKAGING' | 'OTHER';
export type MaterialUnit = 'g' | 'kg' | 'ml' | 'l' | 'unit' | 'pack';
export type StockLocation = 'MAIN_STORAGE' | 'CELLAR' | 'LAB' | 'BOTTLING_LINE' | 'WAREHOUSE' | 'OTHER';
export type MovementType = 'PURCHASE' | 'ADJUSTMENT' | 'TRANSFER' | 'USAGE' | 'WASTE' | 'RETURN';

// Interfaces
export interface Material {
  id: string;
  name: string;
  code: string;
  category: MaterialCategory;
  category_display: string;
  unit: MaterialUnit;
  unit_display: string;
  supplier: string;
  notes?: string;
  low_stock_threshold: number | null;
  current_stock: number;
  is_low_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialDetail extends Material {
  winery: string;
  stock_by_location: StockByLocation[];
}

export interface StockByLocation {
  location: StockLocation;
  location_display: string;
  quantity: number;
}

export interface MaterialCreate {
  name: string;
  code?: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  supplier?: string;
  notes?: string;
  low_stock_threshold?: number;
  is_active?: boolean;
}

export interface MaterialDropdown {
  id: string;
  name: string;
  code: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  label: string;
}

export interface MaterialStock {
  id: string;
  material: string;
  material_name: string;
  material_unit: MaterialUnit;
  location: StockLocation;
  location_display: string;
  quantity: number;
  updated_at: string;
}

export interface MaterialMovement {
  id: string;
  material: string;
  material_name: string;
  material_unit: MaterialUnit;
  movement_type: MovementType;
  movement_type_display: string;
  quantity: number;
  location: StockLocation;
  location_display: string;
  destination_location: StockLocation | null;
  destination_location_display: string | null;
  movement_date: string;
  reference_number: string;
  unit_cost: number | null;
  notes: string;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
}

export interface MaterialMovementCreate {
  material: string;
  movement_type: MovementType;
  quantity: number;
  location: StockLocation;
  destination_location?: StockLocation;
  movement_date: string;
  reference_number?: string;
  unit_cost?: number;
  notes?: string;
}

export interface Addition {
  id: string;
  material: string;
  material_name: string;
  material_unit: MaterialUnit;
  material_category: string;
  quantity: number;
  target_display: string;
  tank: string | null;
  barrel: string | null;
  wine_lot: string | null;
  batch: string | null;
  addition_date: string;
  purpose: string;
  dosage_rate: string;
  target_volume_l: number | null;
  added_by: string | null;
  added_by_name: string;
  created_at: string;
}

export interface AdditionDetail extends Addition {
  winery: string;
  tank_code: string;
  barrel_code: string;
  wine_lot_code: string;
  batch_code: string;
  notes: string;
  updated_at: string;
}

export interface AdditionCreate {
  material: string;
  quantity: number;
  tank?: string;
  barrel?: string;
  wine_lot?: string;
  batch?: string;
  addition_date: string;
  purpose?: string;
  notes?: string;
  target_volume_l?: number;
  dosage_rate?: string;
}

export interface AdditionSummary {
  total_additions: number;
  additions_this_week: number;
  most_used_materials: {
    material__name: string;
    total_quantity: number;
    usage_count: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/inventory`;

  // === MATERIALS ===
  
  getMaterials(params?: { category?: string; is_active?: boolean; search?: string }): Observable<Material[]> {
    let httpParams = new HttpParams();
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.is_active !== undefined) httpParams = httpParams.set('is_active', params.is_active.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    
    return this.http.get<Material[]>(`${this.baseUrl}/materials/`, { params: httpParams });
  }

  getMaterial(id: string): Observable<MaterialDetail> {
    return this.http.get<MaterialDetail>(`${this.baseUrl}/materials/${id}/`);
  }

  createMaterial(data: MaterialCreate): Observable<MaterialDetail> {
    return this.http.post<MaterialDetail>(`${this.baseUrl}/materials/`, data);
  }

  updateMaterial(id: string, data: Partial<MaterialCreate>): Observable<MaterialDetail> {
    return this.http.patch<MaterialDetail>(`${this.baseUrl}/materials/${id}/`, data);
  }

  deleteMaterial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/materials/${id}/`);
  }

  getMaterialsDropdown(): Observable<MaterialDropdown[]> {
    return this.http.get<MaterialDropdown[]>(`${this.baseUrl}/materials/dropdown/`);
  }

  getLowStockMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.baseUrl}/materials/low_stock/`);
  }

  getMaterialStockHistory(id: string): Observable<MaterialMovement[]> {
    return this.http.get<MaterialMovement[]>(`${this.baseUrl}/materials/${id}/stock_history/`);
  }

  // === STOCK ===

  getStockLevels(params?: { material?: string; location?: string }): Observable<MaterialStock[]> {
    let httpParams = new HttpParams();
    if (params?.material) httpParams = httpParams.set('material', params.material);
    if (params?.location) httpParams = httpParams.set('location', params.location);
    
    return this.http.get<MaterialStock[]>(`${this.baseUrl}/stock/`, { params: httpParams });
  }

  // === MOVEMENTS ===

  getMovements(params?: { material?: string; movement_type?: string; location?: string }): Observable<MaterialMovement[]> {
    let httpParams = new HttpParams();
    if (params?.material) httpParams = httpParams.set('material', params.material);
    if (params?.movement_type) httpParams = httpParams.set('movement_type', params.movement_type);
    if (params?.location) httpParams = httpParams.set('location', params.location);
    
    return this.http.get<MaterialMovement[]>(`${this.baseUrl}/movements/`, { params: httpParams });
  }

  getMovement(id: string): Observable<MaterialMovement> {
    return this.http.get<MaterialMovement>(`${this.baseUrl}/movements/${id}/`);
  }

  createMovement(data: MaterialMovementCreate): Observable<MaterialMovement> {
    return this.http.post<MaterialMovement>(`${this.baseUrl}/movements/`, data);
  }

  updateMovement(id: string, data: Partial<MaterialMovementCreate>): Observable<MaterialMovement> {
    return this.http.patch<MaterialMovement>(`${this.baseUrl}/movements/${id}/`, data);
  }

  deleteMovement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/movements/${id}/`);
  }

  // === ADDITIONS ===

  getAdditions(params?: { material?: string; tank?: string; barrel?: string }): Observable<Addition[]> {
    let httpParams = new HttpParams();
    if (params?.material) httpParams = httpParams.set('material', params.material);
    if (params?.tank) httpParams = httpParams.set('tank', params.tank);
    if (params?.barrel) httpParams = httpParams.set('barrel', params.barrel);
    
    return this.http.get<Addition[]>(`${this.baseUrl}/additions/`, { params: httpParams });
  }

  getAddition(id: string): Observable<AdditionDetail> {
    return this.http.get<AdditionDetail>(`${this.baseUrl}/additions/${id}/`);
  }

  createAddition(data: AdditionCreate): Observable<AdditionDetail> {
    return this.http.post<AdditionDetail>(`${this.baseUrl}/additions/`, data);
  }

  updateAddition(id: string, data: Partial<AdditionCreate>): Observable<AdditionDetail> {
    return this.http.patch<AdditionDetail>(`${this.baseUrl}/additions/${id}/`, data);
  }

  deleteAddition(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/additions/${id}/`);
  }

  getAdditionsByTank(tankId: string): Observable<Addition[]> {
    return this.http.get<Addition[]>(`${this.baseUrl}/additions/by_tank/`, { 
      params: { tank_id: tankId } 
    });
  }

  getAdditionsByBarrel(barrelId: string): Observable<Addition[]> {
    return this.http.get<Addition[]>(`${this.baseUrl}/additions/by_barrel/`, { 
      params: { barrel_id: barrelId } 
    });
  }

  getAdditionsSummary(): Observable<AdditionSummary> {
    return this.http.get<AdditionSummary>(`${this.baseUrl}/additions/summary/`);
  }
}

