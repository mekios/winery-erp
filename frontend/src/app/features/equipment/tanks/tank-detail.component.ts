import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { EquipmentService, Tank, TANK_TYPE_LABELS, TANK_STATUS_LABELS, TANK_MATERIAL_LABELS } from '../equipment.service';
import { LedgerService, TankComposition, LedgerEntry } from '../ledger.service';

@Component({
  selector: 'app-tank-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatCardModule, MatProgressBarModule, MatTooltipModule, MatSnackBarModule,
    IconComponent, SkeletonComponent, ErrorStateComponent, DecimalPipe
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
            <app-skeleton width="200px" height="28px"></app-skeleton>
            <app-skeleton width="120px" height="16px"></app-skeleton>
          </div>
        } @else if (tank()) {
          <div class="header-content">
            <div class="title-row">
              <div class="tank-badge">
                <app-icon name="tank" [size]="20"></app-icon>
              </div>
              <h1>{{ tank()!.code }}</h1>
              @if (tank()!.name) {
                <span class="tank-name">{{ tank()!.name }}</span>
              }
              <span class="status-badge" [class]="getStatusClass(tank()!.status)">
                {{ TANK_STATUS_LABELS[tank()!.status] }}
              </span>
            </div>
            <div class="meta-row">
              <span>{{ TANK_TYPE_LABELS[tank()!.tank_type] }}</span>
              <span class="separator">•</span>
              <span>{{ TANK_MATERIAL_LABELS[tank()!.material] }}</span>
              <span class="separator">•</span>
              <span>{{ tank()!.location || 'No location' }}</span>
            </div>
          </div>
          
          <div class="header-actions">
            <button mat-stroked-button [routerLink]="['/equipment/tanks', tankId, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
          </div>
        }
      </header>
      
      @if (error()) {
        <app-error-state
          title="Failed to load tank"
          message="Could not retrieve tank details."
          (retry)="loadTank()">
        </app-error-state>
      } @else {
        <!-- Main Content -->
        <div class="detail-content">
          <!-- Volume Card -->
          <div class="volume-card">
            @if (loading()) {
              <app-skeleton width="100%" height="120px"></app-skeleton>
            } @else if (tank()) {
              <div class="volume-header">
                <div class="volume-info">
                  <span class="volume-label">Current Volume</span>
                  <span class="volume-value">{{ tank()!.current_volume_l | number:'1.0-0' }} L</span>
                </div>
                <div class="capacity-info">
                  <span>of {{ tank()!.capacity_l | number:'1.0-0' }} L capacity</span>
                </div>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="tank()!.fill_percentage"
                [class.warning]="tank()!.fill_percentage > 90"
                [class.low]="tank()!.fill_percentage < 10">
              </mat-progress-bar>
              <div class="volume-stats">
                <div class="stat">
                  <span class="stat-value">{{ tank()!.fill_percentage }}%</span>
                  <span class="stat-label">Fill Level</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ tank()!.available_capacity_l | number:'1.0-0' }} L</span>
                  <span class="stat-label">Available</span>
                </div>
              </div>
            }
          </div>
          
          <!-- Tabs -->
          <mat-tab-group animationDuration="200ms" class="composition-tabs">
            <!-- Composition Tab -->
            <mat-tab label="Composition">
              <div class="tab-content">
                @if (compositionLoading()) {
                  <div class="composition-skeleton">
                    <app-skeleton width="100%" height="200px"></app-skeleton>
                  </div>
                } @else if (compositionError()) {
                  <app-error-state
                    title="Composition unavailable"
                    message="Could not load tank composition data."
                    (retry)="loadComposition()">
                  </app-error-state>
                } @else if (composition()) {
                  @if (composition()!.has_integrity_issues) {
                    <div class="integrity-warning">
                      <app-icon name="alert-triangle" [size]="20"></app-icon>
                      <span>This tank has composition integrity issues. Some wine may be from unknown sources.</span>
                    </div>
                  }
                  
                  @if (composition()!.total_volume_l > 0) {
                    <!-- By Variety -->
                    <div class="composition-section">
                      <h3>By Variety</h3>
                      @if (composition()!.by_variety.length > 0) {
                        <div class="composition-bars">
                          @for (v of composition()!.by_variety; track v.variety) {
                            <div class="comp-row">
                              <div class="comp-label">{{ v.variety }}</div>
                              <div class="comp-bar-wrap">
                                <div class="comp-bar" [style.width.%]="v.percentage" [style.background]="getVarietyColor($index)"></div>
                              </div>
                              <div class="comp-value">{{ v.percentage | number:'1.1-1' }}%</div>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="no-data">No variety data available</p>
                      }
                    </div>
                    
                    <!-- By Batch -->
                    <div class="composition-section">
                      <h3>By Batch</h3>
                      @if (composition()!.by_batch.length > 0) {
                        <div class="batch-list">
                          @for (b of composition()!.by_batch; track b.batch_id) {
                            <div class="batch-item">
                              <div class="batch-code">{{ b.label }}</div>
                              <div class="batch-volume">{{ b.volume_l | number:'1.0-0' }} L</div>
                              <div class="batch-pct">{{ b.percentage | number:'1.1-1' }}%</div>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="no-data">No batch data available</p>
                      }
                    </div>
                    
                    <!-- By Vineyard -->
                    <div class="composition-section">
                      <h3>By Vineyard</h3>
                      @if (composition()!.by_vineyard.length > 0) {
                        <div class="vineyard-list">
                          @for (v of composition()!.by_vineyard; track v.vineyard) {
                            <div class="vineyard-item">
                              <div class="vineyard-info">
                                <span class="vineyard-name">{{ v.vineyard }}</span>
                                <span class="grower-name">{{ v.grower }}</span>
                              </div>
                              <div class="vineyard-stats">
                                <span class="vineyard-volume">{{ v.volume_l | number:'1.0-0' }} L</span>
                                <span class="vineyard-pct">{{ v.percentage | number:'1.1-1' }}%</span>
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="no-data">No vineyard data available</p>
                      }
                    </div>
                    
                    <!-- Unknown -->
                    @if (composition()!.unknown_volume_l > 0) {
                      <div class="composition-section unknown-section">
                        <h3>Unknown Origin</h3>
                        <div class="unknown-info">
                          <app-icon name="alert-triangle" [size]="16"></app-icon>
                          <span>{{ composition()!.unknown_volume_l | number:'1.0-0' }} L ({{ composition()!.unknown_percentage | number:'1.1-1' }}%)</span>
                        </div>
                      </div>
                    }
                  } @else {
                    <div class="empty-composition">
                      <app-icon name="wine" [size]="48"></app-icon>
                      <h4>Tank is Empty</h4>
                      <p>No composition data to display.</p>
                    </div>
                  }
                }
              </div>
            </mat-tab>
            
            <!-- History Tab -->
            <mat-tab label="History">
              <div class="tab-content">
                @if (historyLoading()) {
                  <app-skeleton width="100%" height="300px"></app-skeleton>
                } @else if (history().length > 0) {
                  <div class="history-list">
                    @for (entry of history(); track entry.id) {
                      <div class="history-item" [class.inflow]="entry.delta_volume_l > 0" [class.outflow]="entry.delta_volume_l < 0">
                        <div class="history-icon">
                          @if (entry.delta_volume_l > 0) {
                            <mat-icon>arrow_downward</mat-icon>
                          } @else {
                            <mat-icon>arrow_upward</mat-icon>
                          }
                        </div>
                        <div class="history-content">
                          <div class="history-main">
                            <span class="history-volume" [class.positive]="entry.delta_volume_l > 0" [class.negative]="entry.delta_volume_l < 0">
                              {{ entry.delta_volume_l > 0 ? '+' : '' }}{{ entry.delta_volume_l | number:'1.0-0' }} L
                            </span>
                            <span class="history-key">{{ entry.composition_key_label }}</span>
                          </div>
                          <div class="history-meta">
                            <span class="history-date">{{ entry.event_datetime | date:'MMM d, y h:mm a' }}</span>
                            <span class="history-source" [class]="'source-' + entry.derived_source.toLowerCase()">
                              {{ entry.derived_source }}
                            </span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-history">
                    <app-icon name="clipboard" [size]="48"></app-icon>
                    <h4>No History</h4>
                    <p>No ledger entries for this tank yet.</p>
                  </div>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
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
    
    .back-btn {
      margin-top: 4px;
    }
    
    .header-content {
      flex: 1;
    }
    
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .tank-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #7c4dff, #b47cff);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .tank-name {
      color: var(--text-secondary);
      font-size: 18px;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-empty { background: #f3f4f6; color: #6b7280; }
    .status-in-use { background: #d1fae5; color: #065f46; }
    .status-cleaning { background: #dbeafe; color: #1e40af; }
    .status-maintenance { background: #fef3c7; color: #92400e; }
    .status-out { background: #fee2e2; color: #991b1b; }
    
    .meta-row {
      margin-top: 8px;
      font-size: 14px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .separator {
      opacity: 0.4;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .volume-card {
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .volume-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;
    }
    
    .volume-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 4px;
    }
    
    .volume-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .capacity-info {
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    mat-progress-bar {
      height: 12px !important;
      border-radius: 6px;
    }
    
    ::ng-deep .mat-mdc-progress-bar {
      --mdc-linear-progress-active-indicator-color: var(--primary);
      --mdc-linear-progress-track-color: #e5e7eb;
    }
    
    ::ng-deep mat-progress-bar.warning .mdc-linear-progress__bar-inner {
      background-color: #f59e0b !important;
    }
    
    ::ng-deep mat-progress-bar.low .mdc-linear-progress__bar-inner {
      background-color: #6b7280 !important;
    }
    
    .volume-stats {
      display: flex;
      gap: 32px;
      margin-top: 20px;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .composition-tabs {
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
    
    ::ng-deep .mat-mdc-tab-header {
      border-bottom: 1px solid var(--border-color);
    }
    
    .tab-content {
      padding: 24px;
    }
    
    .integrity-warning {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fef3c7;
      border-radius: 12px;
      color: #92400e;
      font-size: 14px;
      margin-bottom: 24px;
    }
    
    .composition-section {
      margin-bottom: 32px;
    }
    
    .composition-section h3 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      margin: 0 0 16px;
    }
    
    .composition-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .comp-row {
      display: grid;
      grid-template-columns: 120px 1fr 60px;
      gap: 12px;
      align-items: center;
    }
    
    .comp-label {
      font-weight: 500;
      color: var(--text-primary);
      font-size: 14px;
    }
    
    .comp-bar-wrap {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .comp-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .comp-value {
      text-align: right;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .batch-list, .vineyard-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .batch-item {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 16px;
      padding: 12px 16px;
      background: var(--bg-surface);
      border-radius: 10px;
      align-items: center;
    }
    
    .batch-code {
      font-weight: 600;
      color: var(--primary);
      font-size: 14px;
    }
    
    .batch-volume {
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .batch-pct {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .vineyard-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-surface);
      border-radius: 10px;
    }
    
    .vineyard-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .vineyard-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .grower-name {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .vineyard-stats {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .vineyard-volume {
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .vineyard-pct {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .unknown-section {
      background: #fef3c7;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 0;
    }
    
    .unknown-section h3 {
      color: #92400e;
    }
    
    .unknown-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #92400e;
      font-weight: 500;
    }
    
    .empty-composition, .empty-history {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: var(--text-secondary);
    }
    
    .empty-composition h4, .empty-history h4 {
      margin: 16px 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .empty-composition p, .empty-history p {
      margin: 0;
      font-size: 14px;
    }
    
    .no-data {
      color: var(--text-secondary);
      font-size: 14px;
      font-style: italic;
    }
    
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .history-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: var(--bg-surface);
      border-radius: 12px;
      border-left: 4px solid transparent;
    }
    
    .history-item.inflow {
      border-left-color: #10b981;
    }
    
    .history-item.outflow {
      border-left-color: #f59e0b;
    }
    
    .history-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .inflow .history-icon {
      background: #d1fae5;
      color: #065f46;
    }
    
    .outflow .history-icon {
      background: #fef3c7;
      color: #92400e;
    }
    
    .history-content {
      flex: 1;
    }
    
    .history-main {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }
    
    .history-volume {
      font-weight: 700;
      font-size: 16px;
    }
    
    .history-volume.positive {
      color: #059669;
    }
    
    .history-volume.negative {
      color: #d97706;
    }
    
    .history-key {
      color: var(--text-primary);
      font-weight: 500;
    }
    
    .history-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
    }
    
    .history-date {
      color: var(--text-secondary);
    }
    
    .history-source {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    
    .source-explicit {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .source-inherited {
      background: #e0e7ff;
      color: #3730a3;
    }
    
    .source-unknown {
      background: #fef3c7;
      color: #92400e;
    }
    
    @media screen and (max-width: 640px) {
      .detail-page {
        padding: 16px;
      }
      
      .title-row {
        flex-wrap: wrap;
      }
      
      .header-actions {
        width: 100%;
        margin-top: 16px;
      }
      
      .header-actions button {
        flex: 1;
      }
      
      .comp-row {
        grid-template-columns: 80px 1fr 50px;
      }
      
      .volume-value {
        font-size: 24px;
      }
    }
  `]
})
export class TankDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private equipmentService = inject(EquipmentService);
  private ledgerService = inject(LedgerService);
  
  tankId = '';
  tank = signal<Tank | null>(null);
  loading = signal(true);
  error = signal(false);
  
  composition = signal<TankComposition | null>(null);
  compositionLoading = signal(false);
  compositionError = signal(false);
  
  history = signal<LedgerEntry[]>([]);
  historyLoading = signal(false);
  
  TANK_TYPE_LABELS = TANK_TYPE_LABELS;
  TANK_STATUS_LABELS = TANK_STATUS_LABELS;
  TANK_MATERIAL_LABELS = TANK_MATERIAL_LABELS;
  
  private varietyColors = [
    '#7c4dff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
  ];
  
  ngOnInit(): void {
    this.tankId = this.route.snapshot.paramMap.get('id') || '';
    if (this.tankId) {
      this.loadTank();
      this.loadComposition();
      this.loadHistory();
    }
  }
  
  loadTank(): void {
    this.loading.set(true);
    this.error.set(false);
    
    this.equipmentService.getTank(this.tankId).subscribe({
      next: (tank) => {
        this.tank.set(tank);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.snackBar.open('Failed to load tank', 'Close', { duration: 3000 });
      }
    });
  }
  
  loadComposition(): void {
    this.compositionLoading.set(true);
    this.compositionError.set(false);
    
    this.ledgerService.getTankComposition(this.tankId).subscribe({
      next: (comp) => {
        this.composition.set(comp);
        this.compositionLoading.set(false);
      },
      error: () => {
        this.compositionError.set(true);
        this.compositionLoading.set(false);
      }
    });
  }
  
  loadHistory(): void {
    this.historyLoading.set(true);
    
    this.ledgerService.getTankHistory(this.tankId).subscribe({
      next: (entries) => {
        this.history.set(entries);
        this.historyLoading.set(false);
      },
      error: () => {
        this.history.set([]);
        this.historyLoading.set(false);
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/equipment/tanks']);
  }
  
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'EMPTY': 'status-empty',
      'IN_USE': 'status-in-use',
      'CLEANING': 'status-cleaning',
      'MAINTENANCE': 'status-maintenance',
      'OUT_OF_SERVICE': 'status-out'
    };
    return map[status] || 'status-empty';
  }
  
  getVarietyColor(index: number): string {
    return this.varietyColors[index % this.varietyColors.length];
  }
}

