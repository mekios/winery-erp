import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse, QueryParams } from '@shared/services/api.service';
import { environment } from '../../../environments/environment';

// ===============================
// Work Order Types
// ===============================

export type WorkOrderStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED' | 'CANCELLED';
export type WorkOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type WorkOrderLineType = 'TRANSFER' | 'ADDITION' | 'ANALYSIS' | 'INSPECTION' | 'CLEANING' | 'MAINTENANCE' | 'OTHER';
export type WorkOrderLineStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface WorkOrderLine {
  id: string;
  work_order: string;
  line_no: number;
  line_type: WorkOrderLineType;
  line_type_display: string;
  status: WorkOrderLineStatus;
  status_display: string;
  target_display: string;
  target_tank: string | null;
  target_tank_code: string | null;
  target_barrel: string | null;
  target_barrel_code: string | null;
  from_tank: string | null;
  from_tank_code: string | null;
  to_tank: string | null;
  to_tank_code: string | null;
  target_volume_l: number | null;
  material_name: string;
  dosage_value: number | null;
  dosage_unit: string;
  description: string;
  notes: string;
  executed_transfer: string | null;
  executed_analysis: string | null;
  executed_by: string | null;
  executed_by_name: string | null;
  executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  status_display: string;
  priority: WorkOrderPriority;
  priority_display: string;
  scheduled_for: string | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  verified_by: string | null;
  verified_by_name: string | null;
  verified_at: string | null;
  progress_percentage: number;
  lines_count: number;
  lines_completed: number;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderDetail extends WorkOrder {
  lines: WorkOrderLine[];
}

export interface WorkOrderLineCreate {
  line_no?: number;
  line_type: WorkOrderLineType;
  target_tank?: string;
  target_barrel?: string;
  from_tank?: string;
  to_tank?: string;
  target_volume_l?: number;
  material_name?: string;
  dosage_value?: number;
  dosage_unit?: string;
  description?: string;
  notes?: string;
}

export interface WorkOrderCreate {
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
  scheduled_for?: string;
  due_date?: string;
  assigned_to?: string;
  lines?: WorkOrderLineCreate[];
}

export interface WorkOrderSummary {
  total: number;
  by_status: Record<WorkOrderStatus, number>;
  by_priority: Record<WorkOrderPriority, number>;
  due_today: number;
  overdue: number;
  my_assigned: number;
}

export interface LineCompleteData {
  notes?: string;
  create_transfer?: boolean;
  volume_l?: number;
  temperature_c?: number;
  batch_id?: string;
}

// ===============================
// Label Maps
// ===============================

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  DRAFT: 'Draft',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  VERIFIED: 'Verified',
  CANCELLED: 'Cancelled'
};

export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  DRAFT: 'badge-secondary',
  PLANNED: 'badge-info',
  IN_PROGRESS: 'badge-warning',
  DONE: 'badge-success',
  VERIFIED: 'badge-primary',
  CANCELLED: 'badge-danger'
};

export const PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent'
};

export const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  LOW: 'badge-secondary',
  NORMAL: 'badge-info',
  HIGH: 'badge-warning',
  URGENT: 'badge-danger'
};

export const LINE_TYPE_LABELS: Record<WorkOrderLineType, string> = {
  TRANSFER: 'Transfer',
  ADDITION: 'Addition',
  ANALYSIS: 'Analysis',
  INSPECTION: 'Inspection',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other'
};

export const LINE_TYPE_ICONS: Record<WorkOrderLineType, string> = {
  TRANSFER: 'arrow-right-left',
  ADDITION: 'flask-round',
  ANALYSIS: 'flask-conical',
  INSPECTION: 'eye',
  CLEANING: 'sparkles',
  MAINTENANCE: 'wrench',
  OTHER: 'clipboard'
};

@Injectable({ providedIn: 'root' })
export class WorkOrdersService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  
  // ===============================
  // Work Orders
  // ===============================
  
  getWorkOrders(params?: QueryParams): Observable<PaginatedResponse<WorkOrder>> {
    return this.api.getList<WorkOrder>('work-orders', params);
  }
  
  getWorkOrder(id: string): Observable<WorkOrderDetail> {
    return this.api.get<WorkOrderDetail>('work-orders', id);
  }
  
  createWorkOrder(data: WorkOrderCreate): Observable<WorkOrder> {
    return this.api.create<WorkOrder>('work-orders', data);
  }
  
  updateWorkOrder(id: string, data: Partial<WorkOrderCreate>): Observable<WorkOrder> {
    return this.api.patch<WorkOrder>('work-orders', id, data);
  }
  
  deleteWorkOrder(id: string): Observable<void> {
    return this.api.delete('work-orders', id);
  }
  
  getSummary(): Observable<WorkOrderSummary> {
    return this.api.action<WorkOrderSummary>('work-orders', 'summary');
  }
  
  // Status actions (use direct http calls since they need ID in the path)
  markReady(id: string): Observable<WorkOrderDetail> {
    return this.http.post<WorkOrderDetail>(`${this.baseUrl}/work-orders/${id}/mark-ready/`, {});
  }
  
  startWorkOrder(id: string): Observable<WorkOrderDetail> {
    return this.http.post<WorkOrderDetail>(`${this.baseUrl}/work-orders/${id}/start/`, {});
  }
  
  completeWorkOrder(id: string): Observable<WorkOrderDetail> {
    return this.http.post<WorkOrderDetail>(`${this.baseUrl}/work-orders/${id}/complete/`, {});
  }
  
  verifyWorkOrder(id: string): Observable<WorkOrderDetail> {
    return this.http.post<WorkOrderDetail>(`${this.baseUrl}/work-orders/${id}/verify/`, {});
  }
  
  cancelWorkOrder(id: string): Observable<WorkOrderDetail> {
    return this.http.post<WorkOrderDetail>(`${this.baseUrl}/work-orders/${id}/cancel/`, {});
  }
  
  reopenWorkOrder(id: string): Observable<WorkOrderDetail> {
    return this.http.post<WorkOrderDetail>(`${this.baseUrl}/work-orders/${id}/reopen/`, {});
  }
  
  // ===============================
  // Work Order Lines
  // ===============================
  
  getLines(workOrderId: string): Observable<WorkOrderLine[]> {
    return this.api.getList<WorkOrderLine>('work-orders/lines', { work_order: workOrderId }) as any;
  }
  
  completeLine(lineId: string, data: LineCompleteData = {}): Observable<WorkOrderLine> {
    return this.http.post<WorkOrderLine>(`${this.baseUrl}/work-orders/lines/${lineId}/complete/`, data);
  }
  
  skipLine(lineId: string, reason?: string): Observable<WorkOrderLine> {
    return this.http.post<WorkOrderLine>(`${this.baseUrl}/work-orders/lines/${lineId}/skip/`, { reason });
  }
}

