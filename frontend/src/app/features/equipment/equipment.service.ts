import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from '@shared/services/api.service';

// ===============================
// Tank Types
// ===============================
export type TankType = 'FERMENTATION' | 'STORAGE' | 'BLENDING' | 'SETTLING' | 'TEMPERATURE_CONTROL';
export type TankMaterial = 'STAINLESS' | 'CONCRETE' | 'FIBERGLASS' | 'OAK' | 'PLASTIC';
export type TankStatus = 'EMPTY' | 'IN_USE' | 'CLEANING' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface Tank {
  id: string;
  code: string;
  name: string;
  tank_type: TankType;
  material: TankMaterial;
  capacity_l: number;
  current_volume_l: number;
  fill_percentage: number;
  available_capacity_l: number;
  location: string;
  status: TankStatus;
  has_cooling: boolean;
  has_heating: boolean;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TankCreate {
  code: string;
  name?: string;
  tank_type?: TankType;
  material?: TankMaterial;
  capacity_l: number;
  current_volume_l?: number;
  location?: string;
  status?: TankStatus;
  has_cooling?: boolean;
  has_heating?: boolean;
  is_active?: boolean;
  notes?: string;
}

export interface TankDropdown {
  id: string;
  code: string;
  name: string;
  display_name: string;
  capacity_l: number;
  current_volume_l: number;
  available_capacity_l: number;
  status: TankStatus;
}

export interface BarrelDropdown {
  id: string;
  code: string;
  display_name: string;
  capacity_l: number;
  current_volume_l: number;
  available_capacity_l: number;
  status: BarrelStatus;
}

export interface TankSummary {
  total_tanks: number;
  total_capacity_l: number;
  total_volume_l: number;
  utilization_percentage: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

// ===============================
// Barrel Types
// ===============================
export type WoodType = 'FRENCH_OAK' | 'AMERICAN_OAK' | 'HUNGARIAN_OAK' | 'ACACIA' | 'CHESTNUT' | 'OTHER';
export type ToastLevel = 'LIGHT' | 'MEDIUM' | 'MEDIUM_PLUS' | 'HEAVY';
export type BarrelStatus = 'EMPTY' | 'IN_USE' | 'CONDITIONING' | 'RETIRED';

export interface Barrel {
  id: string;
  code: string;
  volume_l: number;
  current_volume_l: number;
  wood_type: WoodType;
  toast_level: ToastLevel;
  cooper: string;
  vintage_year: number | null;
  first_use_year: number | null;
  age_years: number | null;
  use_count: number;
  location: string;
  status: BarrelStatus;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BarrelCreate {
  code: string;
  volume_l?: number;
  wood_type?: WoodType;
  toast_level?: ToastLevel;
  cooper?: string;
  vintage_year?: number;
  first_use_year?: number;
  location?: string;
  status?: BarrelStatus;
  is_active?: boolean;
  notes?: string;
}

// ===============================
// Label Maps for Display
// ===============================
export const TANK_TYPE_LABELS: Record<TankType, string> = {
  FERMENTATION: 'Fermentation',
  STORAGE: 'Storage',
  BLENDING: 'Blending',
  SETTLING: 'Settling',
  TEMPERATURE_CONTROL: 'Temperature Control',
};

export const TANK_MATERIAL_LABELS: Record<TankMaterial, string> = {
  STAINLESS: 'Stainless Steel',
  CONCRETE: 'Concrete',
  FIBERGLASS: 'Fiberglass',
  OAK: 'Oak',
  PLASTIC: 'Food-Grade Plastic',
};

export const TANK_STATUS_LABELS: Record<TankStatus, string> = {
  EMPTY: 'Empty',
  IN_USE: 'In Use',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
  OUT_OF_SERVICE: 'Out of Service',
};

export const WOOD_TYPE_LABELS: Record<WoodType, string> = {
  FRENCH_OAK: 'French Oak',
  AMERICAN_OAK: 'American Oak',
  HUNGARIAN_OAK: 'Hungarian Oak',
  ACACIA: 'Acacia',
  CHESTNUT: 'Chestnut',
  OTHER: 'Other',
};

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private api = inject(ApiService);
  
  // ===============================
  // Tanks
  // ===============================
  
  getTanks(params?: QueryParams): Observable<PaginatedResponse<Tank>> {
    return this.api.getList<Tank>('equipment/tanks', params);
  }
  
  getTanksDropdown(status?: TankStatus): Observable<TankDropdown[]> {
    const endpoint = status 
      ? `equipment/tanks/dropdown/?status=${status}`
      : 'equipment/tanks/dropdown/';
    return this.api.getDropdown<TankDropdown>('equipment/tanks');
  }
  
  getTank(id: string): Observable<Tank> {
    return this.api.get<Tank>('equipment/tanks', id);
  }
  
  createTank(data: TankCreate): Observable<Tank> {
    return this.api.create<Tank>('equipment/tanks', data);
  }
  
  updateTank(id: string, data: Partial<TankCreate>): Observable<Tank> {
    return this.api.patch<Tank>('equipment/tanks', id, data);
  }
  
  deleteTank(id: string): Observable<void> {
    return this.api.delete('equipment/tanks', id);
  }
  
  getTanksSummary(): Observable<TankSummary> {
    return this.api.action<TankSummary>('equipment/tanks', 'summary');
  }
  
  // ===============================
  // Barrels
  // ===============================
  
  getBarrels(params?: QueryParams): Observable<PaginatedResponse<Barrel>> {
    return this.api.getList<Barrel>('equipment/barrels', params);
  }
  
  getBarrel(id: string): Observable<Barrel> {
    return this.api.get<Barrel>('equipment/barrels', id);
  }
  
  createBarrel(data: BarrelCreate): Observable<Barrel> {
    return this.api.create<Barrel>('equipment/barrels', data);
  }
  
  updateBarrel(id: string, data: Partial<BarrelCreate>): Observable<Barrel> {
    return this.api.patch<Barrel>('equipment/barrels', id, data);
  }
  
  deleteBarrel(id: string): Observable<void> {
    return this.api.delete('equipment/barrels', id);
  }
  
  getBarrelsDropdown(status?: BarrelStatus): Observable<BarrelDropdown[]> {
    return this.api.getDropdown<BarrelDropdown>('equipment/barrels');
  }
}



