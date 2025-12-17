import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from '@shared/services/api.service';

// ===============================
// Transfer Types
// ===============================
export type TransferActionType = 
  | 'FILL' 
  | 'RACK' 
  | 'BLEND' 
  | 'TOP_UP' 
  | 'DRAIN' 
  | 'BARREL_FILL' 
  | 'BARREL_EMPTY' 
  | 'BARREL_RACK' 
  | 'FILTER' 
  | 'BOTTLE';

export interface Transfer {
  id: string;
  winery: string;
  action_type: TransferActionType;
  action_type_display: string;
  transfer_date: string;
  source_tank: string | null;
  source_tank_name: string | null;
  source_tank_code: string | null;
  source_barrel: string | null;
  source_barrel_code: string | null;
  destination_tank: string | null;
  destination_tank_name: string | null;
  destination_tank_code: string | null;
  destination_barrel: string | null;
  destination_barrel_code: string | null;
  volume_l: number;
  temperature_c: number | null;
  batch: string | null;
  batch_code: string | null;
  wine_lot: string | null;
  wine_lot_code: string | null;
  notes: string;
  performed_by: string | null;
  performed_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferCreate {
  action_type: TransferActionType;
  transfer_date: string;
  source_tank?: string;
  source_barrel?: string;
  destination_tank?: string;
  destination_barrel?: string;
  volume_l: number;
  temperature_c?: number;
  batch?: string;
  wine_lot?: string;
  notes?: string;
}

export interface TransferSummary {
  period: string;
  total_transfers: number;
  total_volume_l: number;
  by_action_type: { action_type: TransferActionType; count: number; volume: number }[];
}

// ===============================
// Wine Lot Types
// ===============================
export type WineLotStatus = 'IN_PROGRESS' | 'AGING' | 'READY' | 'BOTTLED' | 'SOLD';

export interface LotBatchLink {
  id: string;
  batch: string;
  batch_code: string;
  batch_date: string;
  volume_l: number;
  percentage: number | null;
  notes: string;
  created_at: string;
}

export interface LotBatchLinkCreate {
  batch: string;
  volume_l: number;
  percentage?: number;
  notes?: string;
}

export interface WineLot {
  id: string;
  winery: string;
  lot_code: string;
  name: string;
  vintage: number;
  wine_type: string;
  status: WineLotStatus;
  status_display: string;
  initial_volume_l: number;
  current_volume_l: number;
  current_tank: string | null;
  current_tank_code: string | null;
  current_barrel: string | null;
  current_barrel_code: string | null;
  batch_links: LotBatchLink[];
  batch_varieties: Record<string, number>;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WineLotCreate {
  lot_code: string;
  name: string;
  vintage: number;
  wine_type?: string;
  status?: WineLotStatus;
  initial_volume_l?: number;
  current_volume_l?: number;
  current_tank?: string;
  current_barrel?: string;
  batch_links?: LotBatchLinkCreate[];
  notes?: string;
}

export interface WineLotSummary {
  total_lots: number;
  total_volume_l: number;
  by_status: { status: WineLotStatus; count: number; volume: number }[];
  by_vintage: { vintage: number; count: number; volume: number }[];
}

// ===============================
// Label Maps
// ===============================
export const TRANSFER_ACTION_LABELS: Record<TransferActionType, string> = {
  FILL: 'Fill Tank',
  RACK: 'Racking',
  BLEND: 'Blending',
  TOP_UP: 'Topping Up',
  DRAIN: 'Drain',
  BARREL_FILL: 'Barrel Fill',
  BARREL_EMPTY: 'Barrel Empty',
  BARREL_RACK: 'Barrel Racking',
  FILTER: 'Filtration',
  BOTTLE: 'Bottling',
};

export const WINE_LOT_STATUS_LABELS: Record<WineLotStatus, string> = {
  IN_PROGRESS: 'In Progress',
  AGING: 'Aging',
  READY: 'Ready for Bottling',
  BOTTLED: 'Bottled',
  SOLD: 'Sold Out',
};

export const TRANSFER_ACTION_ICONS: Record<TransferActionType, string> = {
  FILL: 'droplet',
  RACK: 'arrow-right',
  BLEND: 'git-merge',
  TOP_UP: 'plus-circle',
  DRAIN: 'download',
  BARREL_FILL: 'package',
  BARREL_EMPTY: 'package-open',
  BARREL_RACK: 'repeat',
  FILTER: 'filter',
  BOTTLE: 'wine',
};

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private api = inject(ApiService);
  
  // ===============================
  // Transfers
  // ===============================
  
  getTransfers(params?: QueryParams): Observable<PaginatedResponse<Transfer>> {
    return this.api.getList<Transfer>('production/transfers', params);
  }
  
  getTransfer(id: string): Observable<Transfer> {
    return this.api.get<Transfer>('production/transfers', id);
  }
  
  createTransfer(data: TransferCreate): Observable<Transfer> {
    return this.api.create<Transfer>('production/transfers', data as unknown as Partial<Transfer>);
  }
  
  updateTransfer(id: string, data: Partial<TransferCreate>): Observable<Transfer> {
    return this.api.patch<Transfer>('production/transfers', id, data as unknown as Partial<Transfer>);
  }
  
  deleteTransfer(id: string): Observable<void> {
    return this.api.delete('production/transfers', id);
  }
  
  getTransferActionTypes(): Observable<{ value: TransferActionType; label: string }[]> {
    return this.api.action<{ value: TransferActionType; label: string }[]>('production/transfers', 'action_types');
  }
  
  getTransferSummary(): Observable<TransferSummary> {
    return this.api.action<TransferSummary>('production/transfers', 'summary');
  }
  
  // ===============================
  // Wine Lots
  // ===============================
  
  getWineLots(params?: QueryParams): Observable<PaginatedResponse<WineLot>> {
    return this.api.getList<WineLot>('production/wine-lots', params);
  }
  
  getWineLot(id: string): Observable<WineLot> {
    return this.api.get<WineLot>('production/wine-lots', id);
  }
  
  createWineLot(data: WineLotCreate): Observable<WineLot> {
    return this.api.create<WineLot>('production/wine-lots', data as unknown as Partial<WineLot>);
  }
  
  updateWineLot(id: string, data: Partial<WineLotCreate>): Observable<WineLot> {
    return this.api.patch<WineLot>('production/wine-lots', id, data as unknown as Partial<WineLot>);
  }
  
  deleteWineLot(id: string): Observable<void> {
    return this.api.delete('production/wine-lots', id);
  }
  
  getWineLotStatuses(): Observable<{ value: WineLotStatus; label: string }[]> {
    return this.api.action<{ value: WineLotStatus; label: string }[]>('production/wine-lots', 'statuses');
  }
  
  getWineLotSummary(): Observable<WineLotSummary> {
    return this.api.action<WineLotSummary>('production/wine-lots', 'summary');
  }
  
  addBatchToLot(lotId: string, data: LotBatchLinkCreate): Observable<LotBatchLink> {
    return this.api.action<LotBatchLink>('production/wine-lots', `${lotId}/add_batch`, data);
  }
  
  removeBatchFromLot(lotId: string, batchId: string): Observable<void> {
    return this.api.actionDelete<void>('production/wine-lots', `${lotId}/remove_batch/${batchId}`);
  }
}

