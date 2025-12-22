import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import {
  WorkOrdersService,
  WorkOrderDetail,
  WorkOrderLine,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  LINE_TYPE_LABELS,
  LINE_TYPE_ICONS,
  WorkOrderStatus,
  WorkOrderLineStatus
} from './work-orders.service';

@Component({
  selector: 'app-work-order-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, DatePipe, DecimalPipe,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatProgressBarModule, MatTooltipModule, MatSnackBarModule,
    IconComponent, SkeletonComponent, ErrorStateComponent
  ],
  template: `
    <div class="detail-page">
      <!-- Header -->
      <header class="detail-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        
        @if (loading()) {
          <div class="header-content">
            <app-skeleton width="250px" height="28px"></app-skeleton>
            <app-skeleton width="150px" height="16px"></app-skeleton>
          </div>
        } @else if (workOrder()) {
          <div class="header-content">
            <div class="title-row">
              <span class="wo-code">{{ workOrder()!.code }}</span>
              <h1>{{ workOrder()!.title }}</h1>
              <span class="status-badge" [class]="getStatusClass(workOrder()!.status)">
                {{ STATUS_LABELS[workOrder()!.status] }}
              </span>
              <span class="priority-badge" [class]="getPriorityClass(workOrder()!.priority)">
                {{ PRIORITY_LABELS[workOrder()!.priority] }}
              </span>
            </div>
            <div class="meta-row">
              @if (workOrder()!.assigned_to_name) {
                <span>
                  <mat-icon>person</mat-icon>
                  {{ workOrder()!.assigned_to_name }}
                </span>
              }
              @if (workOrder()!.scheduled_for) {
                <span>
                  <mat-icon>schedule</mat-icon>
                  {{ workOrder()!.scheduled_for | date:'MMM d, y h:mm a' }}
                </span>
              }
              @if (workOrder()!.due_date) {
                <span [class.overdue]="isOverdue()">
                  <mat-icon>event</mat-icon>
                  Due: {{ workOrder()!.due_date | date:'MMM d, y' }}
                </span>
              }
            </div>
          </div>
          
          <div class="header-actions">
            @if (canMarkReady()) {
              <button mat-raised-button color="primary" (click)="markReady()">
                <mat-icon>check_circle</mat-icon>
                Mark Ready
              </button>
            }
            @if (canStart()) {
              <button mat-raised-button color="primary" (click)="startWorkOrder()">
                <mat-icon>play_arrow</mat-icon>
                Start
              </button>
            }
            @if (canComplete()) {
              <button mat-raised-button color="primary" (click)="completeWorkOrder()">
                <mat-icon>check</mat-icon>
                Mark Done
              </button>
            }
            @if (canVerify()) {
              <button mat-raised-button color="accent" (click)="verifyWorkOrder()">
                <mat-icon>verified</mat-icon>
                Verify
              </button>
            }
            <button mat-stroked-button [matMenuTriggerFor]="actionsMenu">
              <mat-icon>more_vert</mat-icon>
              Actions
            </button>
            <mat-menu #actionsMenu="matMenu">
              <button mat-menu-item [routerLink]="['/work-orders', workOrderId, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              @if (workOrder()!.status !== 'CANCELLED') {
                <button mat-menu-item (click)="cancelWorkOrder()">
                  <mat-icon>cancel</mat-icon>
                  Cancel
                </button>
              }
              @if (workOrder()!.status === 'CANCELLED' || workOrder()!.status === 'DONE') {
                <button mat-menu-item (click)="reopenWorkOrder()">
                  <mat-icon>refresh</mat-icon>
                  Reopen
                </button>
              }
            </mat-menu>
          </div>
        }
      </header>
      
      @if (error()) {
        <app-error-state
          title="Failed to load work order"
          message="Could not retrieve work order details."
          (retry)="loadWorkOrder()">
        </app-error-state>
      } @else if (loading()) {
        <div class="skeleton-content">
          <app-skeleton width="100%" height="80px"></app-skeleton>
          <app-skeleton width="100%" height="300px"></app-skeleton>
        </div>
      } @else if (workOrder()) {
        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-value">{{ workOrder()!.lines_completed }} / {{ workOrder()!.lines_count }} tasks</span>
          </div>
          <mat-progress-bar 
            mode="determinate" 
            [value]="workOrder()!.progress_percentage">
          </mat-progress-bar>
        </div>
        
        <!-- Description -->
        @if (workOrder()!.description) {
          <div class="description-section">
            <h3>Description</h3>
            <p>{{ workOrder()!.description }}</p>
          </div>
        }
        
        <!-- Lines -->
        <div class="lines-section">
          <h3>Tasks</h3>
          
          @if (workOrder()!.lines.length > 0) {
            <div class="lines-list">
              @for (line of workOrder()!.lines; track line.id) {
                <div class="line-card" [class]="'status-' + line.status.toLowerCase()">
                  <div class="line-number">{{ line.line_no }}</div>
                  
                  <div class="line-icon" [class]="'type-' + line.line_type.toLowerCase()">
                    <app-icon [name]="LINE_TYPE_ICONS[line.line_type]" [size]="20"></app-icon>
                  </div>
                  
                  <div class="line-content">
                    <div class="line-type">{{ LINE_TYPE_LABELS[line.line_type] }}</div>
                    
                    @if (line.description) {
                      <div class="line-description">{{ line.description }}</div>
                    }
                    
                    <div class="line-meta">
                      @if (line.target_display) {
                        <span class="line-target">
                          <app-icon name="tank" [size]="14"></app-icon>
                          {{ line.target_display }}
                        </span>
                      }
                      @if (line.target_volume_l) {
                        <span>{{ line.target_volume_l | number:'1.0-0' }} L</span>
                      }
                      @if (line.material_name) {
                        <span>{{ line.material_name }}</span>
                        @if (line.dosage_value) {
                          <span>{{ line.dosage_value }} {{ line.dosage_unit }}</span>
                        }
                      }
                    </div>
                    
                    @if (line.notes) {
                      <div class="line-notes">
                        <mat-icon>notes</mat-icon>
                        {{ line.notes }}
                      </div>
                    }
                    
                    @if (line.executed_at) {
                      <div class="line-executed">
                        <mat-icon>check_circle</mat-icon>
                        Completed by {{ line.executed_by_name }} on {{ line.executed_at | date:'short' }}
                      </div>
                    }
                  </div>
                  
                  <div class="line-status">
                    <span class="line-status-badge" [class]="'badge-' + getLineStatusClass(line.status)">
                      {{ line.status_display }}
                    </span>
                  </div>
                  
                  @if (line.status === 'PENDING' || line.status === 'IN_PROGRESS') {
                    <div class="line-actions">
                      <button mat-icon-button 
                              matTooltip="Complete" 
                              color="primary"
                              (click)="completeLine(line)">
                        <mat-icon>check</mat-icon>
                      </button>
                      <button mat-icon-button 
                              matTooltip="Skip"
                              (click)="skipLine(line)">
                        <mat-icon>skip_next</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="empty-lines">
              <app-icon name="clipboard" [size]="48"></app-icon>
              <p>No tasks in this work order</p>
              <a mat-stroked-button [routerLink]="['/work-orders', workOrderId, 'edit']">
                Add Tasks
              </a>
            </div>
          }
        </div>
        
        <!-- Footer Info -->
        <div class="footer-info">
          <div class="info-item">
            <span class="info-label">Created by</span>
            <span class="info-value">{{ workOrder()!.created_by_name || 'Unknown' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Created</span>
            <span class="info-value">{{ workOrder()!.created_at | date:'medium' }}</span>
          </div>
          @if (workOrder()!.completed_at) {
            <div class="info-item">
              <span class="info-label">Completed</span>
              <span class="info-value">{{ workOrder()!.completed_at | date:'medium' }}</span>
            </div>
          }
          @if (workOrder()!.verified_by_name) {
            <div class="info-item">
              <span class="info-label">Verified by</span>
              <span class="info-value">{{ workOrder()!.verified_by_name }} on {{ workOrder()!.verified_at | date:'short' }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; }
    
    .detail-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .detail-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .back-btn { margin-top: 4px; }
    
    .header-content { flex: 1; }
    
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .wo-code {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
      background: rgba(124, 77, 255, 0.1);
      padding: 4px 10px;
      border-radius: 6px;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .status-badge, .priority-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-draft { background: #f3f4f6; color: #6b7280; }
    .status-planned { background: #dbeafe; color: #1e40af; }
    .status-in-progress { background: #fef3c7; color: #92400e; }
    .status-done { background: #d1fae5; color: #065f46; }
    .status-verified { background: #e0e7ff; color: #3730a3; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    
    .priority-low { background: #f3f4f6; color: #6b7280; }
    .priority-normal { background: #dbeafe; color: #1e40af; }
    .priority-high { background: #fef3c7; color: #92400e; }
    .priority-urgent { background: #fee2e2; color: #991b1b; }
    
    .meta-row {
      margin-top: 12px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      
      span {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: var(--text-secondary);
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        
        &.overdue {
          color: #b91c1c;
          font-weight: 600;
        }
      }
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .progress-section {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 20px;
      margin-bottom: 24px;
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .progress-label {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .progress-value {
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .description-section {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 20px;
      margin-bottom: 24px;
      
      h3 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }
      
      p {
        margin: 0;
        color: var(--text-primary);
        white-space: pre-wrap;
      }
    }
    
    .lines-section {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 20px;
      margin-bottom: 24px;
      
      h3 {
        margin: 0 0 16px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }
    }
    
    .lines-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .line-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: var(--bg-surface);
      border-radius: 10px;
      border-left: 4px solid var(--border-color);
      transition: all 0.2s ease;
      
      &.status-completed {
        border-left-color: #10b981;
        opacity: 0.7;
        
        .line-icon { opacity: 0.5; }
      }
      
      &.status-skipped {
        border-left-color: #6b7280;
        opacity: 0.5;
        text-decoration: line-through;
      }
      
      &.status-in_progress {
        border-left-color: #f59e0b;
      }
      
      &.status-pending {
        border-left-color: var(--primary);
      }
    }
    
    .line-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--gray-200);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    
    .line-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.type-transfer { background: rgba(124, 77, 255, 0.1); color: var(--primary); }
      &.type-addition { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.type-analysis { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.type-inspection { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.type-cleaning { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
      &.type-maintenance { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
      &.type-other { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
    }
    
    .line-content {
      flex: 1;
      min-width: 0;
    }
    
    .line-type {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .line-description {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .line-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--text-secondary);
      flex-wrap: wrap;
      
      .line-target {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        color: var(--primary);
      }
    }
    
    .line-notes {
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(124, 77, 255, 0.05);
      border-radius: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      display: flex;
      align-items: flex-start;
      gap: 8px;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
    
    .line-executed {
      margin-top: 8px;
      font-size: 12px;
      color: #059669;
      display: flex;
      align-items: center;
      gap: 6px;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .line-status {
      flex-shrink: 0;
    }
    
    .line-status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .badge-pending { background: #e0e7ff; color: #3730a3; }
    .badge-in-progress { background: #fef3c7; color: #92400e; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-skipped { background: #f3f4f6; color: #6b7280; }
    
    .line-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    
    .empty-lines {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      color: var(--text-secondary);
      
      p {
        margin: 16px 0;
      }
    }
    
    .footer-info {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
      padding: 16px 0;
      color: var(--text-secondary);
      font-size: 13px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }
    
    .info-value {
      color: var(--text-primary);
    }
    
    .skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    @media screen and (max-width: 640px) {
      .detail-page { padding: 16px; }
      
      .title-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .header-actions {
        width: 100%;
        margin-top: 16px;
      }
      
      .line-card {
        flex-wrap: wrap;
      }
      
      .line-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
      }
    }
  `]
})
export class WorkOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private workOrdersService = inject(WorkOrdersService);
  
  workOrderId = '';
  workOrder = signal<WorkOrderDetail | null>(null);
  loading = signal(true);
  error = signal(false);
  
  STATUS_LABELS = STATUS_LABELS;
  PRIORITY_LABELS = PRIORITY_LABELS;
  LINE_TYPE_LABELS = LINE_TYPE_LABELS;
  LINE_TYPE_ICONS = LINE_TYPE_ICONS;
  
  ngOnInit(): void {
    this.workOrderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.workOrderId) {
      this.loadWorkOrder();
    }
  }
  
  loadWorkOrder(): void {
    this.loading.set(true);
    this.error.set(false);
    
    this.workOrdersService.getWorkOrder(this.workOrderId).subscribe({
      next: (wo) => {
        this.workOrder.set(wo);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/work-orders']);
  }
  
  getStatusClass(status: WorkOrderStatus): string {
    return 'status-' + status.toLowerCase().replace('_', '-');
  }
  
  getPriorityClass(priority: string): string {
    return 'priority-' + priority.toLowerCase();
  }
  
  getLineStatusClass(status: WorkOrderLineStatus): string {
    return status.toLowerCase().replace('_', '-');
  }
  
  isOverdue(): boolean {
    const wo = this.workOrder();
    if (!wo || !wo.due_date) return false;
    if (wo.status === 'DONE' || wo.status === 'VERIFIED' || wo.status === 'CANCELLED') return false;
    return new Date(wo.due_date) < new Date();
  }
  
  canMarkReady(): boolean {
    const wo = this.workOrder();
    return wo?.status === 'DRAFT' && (wo?.lines_count || 0) > 0;
  }
  
  canStart(): boolean {
    const wo = this.workOrder();
    return wo?.status === 'PLANNED' && (wo?.lines_count || 0) > 0;
  }
  
  canComplete(): boolean {
    const wo = this.workOrder();
    return wo?.status === 'IN_PROGRESS' && wo?.lines_completed === wo?.lines_count;
  }
  
  canVerify(): boolean {
    const wo = this.workOrder();
    return wo?.status === 'DONE';
  }
  
  markReady(): void {
    this.workOrdersService.markReady(this.workOrderId).subscribe({
      next: (wo) => {
        this.workOrder.set(wo);
        this.snackBar.open('Work order marked as ready', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to mark as ready', 'Close', { duration: 3000 })
    });
  }
  
  startWorkOrder(): void {
    this.workOrdersService.startWorkOrder(this.workOrderId).subscribe({
      next: (wo) => {
        this.workOrder.set(wo);
        this.snackBar.open('Work order started', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to start', 'Close', { duration: 3000 })
    });
  }
  
  completeWorkOrder(): void {
    this.workOrdersService.completeWorkOrder(this.workOrderId).subscribe({
      next: (wo) => {
        this.workOrder.set(wo);
        this.snackBar.open('Work order completed', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to complete', 'Close', { duration: 3000 })
    });
  }
  
  verifyWorkOrder(): void {
    this.workOrdersService.verifyWorkOrder(this.workOrderId).subscribe({
      next: (wo) => {
        this.workOrder.set(wo);
        this.snackBar.open('Work order verified', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to verify', 'Close', { duration: 3000 })
    });
  }
  
  cancelWorkOrder(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Work Order',
        message: 'Are you sure you want to cancel this work order?',
        confirmText: 'Cancel Work Order',
        confirmColor: 'warn',
        icon: 'cancel'
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.workOrdersService.cancelWorkOrder(this.workOrderId).subscribe({
          next: (wo) => {
            this.workOrder.set(wo);
            this.snackBar.open('Work order cancelled', 'Close', { duration: 3000 });
          },
          error: () => this.snackBar.open('Failed to cancel', 'Close', { duration: 3000 })
        });
      }
    });
  }
  
  reopenWorkOrder(): void {
    this.workOrdersService.reopenWorkOrder(this.workOrderId).subscribe({
      next: (wo) => {
        this.workOrder.set(wo);
        this.snackBar.open('Work order reopened', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to reopen', 'Close', { duration: 3000 })
    });
  }
  
  completeLine(line: WorkOrderLine): void {
    this.workOrdersService.completeLine(line.id).subscribe({
      next: () => {
        this.loadWorkOrder();
        this.snackBar.open('Task completed', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to complete task', 'Close', { duration: 3000 })
    });
  }
  
  skipLine(line: WorkOrderLine): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Skip Task',
        message: `Skip "${LINE_TYPE_LABELS[line.line_type]}" task?`,
        confirmText: 'Skip',
        icon: 'skip_next'
      }
    });
    
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.workOrdersService.skipLine(line.id).subscribe({
          next: () => {
            this.loadWorkOrder();
            this.snackBar.open('Task skipped', 'Close', { duration: 2000 });
          },
          error: () => this.snackBar.open('Failed to skip task', 'Close', { duration: 3000 })
        });
      }
    });
  }
}

