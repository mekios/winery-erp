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
import { EquipmentService, Tank, TANK_TYPE_LABELS, TANK_STATUS_LABELS } from '../equipment.service';
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
              <span>{{ tank()!.material_name || 'Unknown material' }}</span>
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
            <mat-tab label="Ledger & History">
              <div class="tab-content history-tab">
                @if (historyLoading()) {
                  <app-skeleton width="100%" height="300px"></app-skeleton>
                } @else if (history().length > 0) {
                  <div class="ledger-timeline">
                    @for (entry of history(); track entry.id; let i = $index) {
                      <div class="timeline-entry" 
                           [class.entry-inflow]="entry.delta_volume_l > 0" 
                           [class.entry-outflow]="entry.delta_volume_l < 0"
                           [style.animation-delay]="i * 0.05 + 's'">
                        <!-- Timeline line connector -->
                        @if (i < history().length - 1) {
                          <div class="timeline-connector"></div>
                        }
                        
                        <!-- Timeline node (icon) -->
                        <div class="timeline-node">
                          <div class="node-pulse"></div>
                          <div class="node-icon">
                            @if (entry.event_type === 'batch_intake') {
                              <app-icon name="wine" [size]="16"></app-icon>
                            } @else if (entry.delta_volume_l > 0) {
                              <mat-icon>arrow_downward</mat-icon>
                            } @else {
                              <mat-icon>arrow_upward</mat-icon>
                            }
                          </div>
                        </div>
                        
                        <!-- Entry card -->
                        <div class="entry-card">
                          <div class="card-header">
                            <div class="volume-badge">
                              <span class="volume-value">
                                {{ entry.delta_volume_l > 0 ? '+' : '' }}{{ entry.delta_volume_l | number:'1.0-0' }} L
                              </span>
                              <span class="volume-label">
                                {{ entry.delta_volume_l > 0 ? 'Inflow' : 'Outflow' }}
                              </span>
                            </div>
                            <div class="event-badge" [class]="'event-' + entry.event_type">
                              {{ entry.event_type === 'batch_intake' ? 'Batch Intake' : 'Transfer' }}
                            </div>
                          </div>
                          
                          <div class="card-body">
                            <div class="composition-info">
                              <span class="label-tag" [class]="'tag-' + entry.composition_key_type.toLowerCase()">
                                {{ entry.composition_key_type }}
                              </span>
                              <span class="composition-label">{{ entry.composition_key_label }}</span>
                            </div>
                            
                            <div class="source-info">
                              <app-icon name="info" [size]="12"></app-icon>
                              <span>Source: <strong>{{ entry.derived_source }}</strong></span>
                            </div>
                          </div>
                          
                          <div class="card-footer">
                            <app-icon name="calendar" [size]="14"></app-icon>
                            <span class="timestamp">{{ entry.event_datetime | date:'MMM d, y · h:mm a' }}</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-history">
                    <div class="empty-icon-wrapper">
                      <app-icon name="book-open" [size]="64"></app-icon>
                    </div>
                    <h4>No Ledger Entries Yet</h4>
                    <p>When wine is added or transferred, the tank's history will appear here as a beautiful timeline.</p>
                  </div>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      }
    </div>
  `,
  styleUrls: ['./tank-detail.component.scss']
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


