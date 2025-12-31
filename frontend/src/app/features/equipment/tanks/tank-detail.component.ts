import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
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
    CommonModule, RouterModule, MatButtonModule, MatIconModule,
    MatCardModule, MatTooltipModule, MatSnackBarModule,
    IconComponent, SkeletonComponent, ErrorStateComponent, DecimalPipe
  ],
  template: `
    <div class="detail-page">
      <!-- Animated Background Gradient -->
      <div class="page-gradient"></div>
      
      <!-- Header -->
      <header class="detail-header">
        <button (click)="goBack()" class="back-btn">
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
                <app-icon name="tank" [size]="24"></app-icon>
                <div class="badge-glow"></div>
              </div>
              <div class="title-group">
                <h1>{{ tank()!.code }}</h1>
                @if (tank()!.name) {
                  <span class="tank-name">{{ tank()!.name }}</span>
                }
              </div>
              <span class="status-badge" [class]="getStatusClass(tank()!.status)">
                <span class="status-dot"></span>
                {{ TANK_STATUS_LABELS[tank()!.status] }}
              </span>
            </div>
            <div class="meta-row">
              <div class="meta-item">
                <app-icon name="flask" [size]="14"></app-icon>
                <span>{{ TANK_TYPE_LABELS[tank()!.tank_type] }}</span>
              </div>
              <div class="meta-item">
                <app-icon name="layers" [size]="14"></app-icon>
                <span>{{ tank()!.material_name || 'Unknown material' }}</span>
              </div>
              <div class="meta-item">
                <app-icon name="map-pin" [size]="14"></app-icon>
                <span>{{ tank()!.location || 'No location' }}</span>
              </div>
            </div>
          </div>
          
          <div class="header-actions">
            <button mat-stroked-button [routerLink]="['/production/transfers/new']" [queryParams]="{destinationTank: tankId}">
              <mat-icon>arrow_downward</mat-icon>
              Transfer In
            </button>
            <button mat-stroked-button [routerLink]="['/production/transfers/new']" [queryParams]="{sourceTank: tankId}">
              <mat-icon>arrow_upward</mat-icon>
              Transfer Out
            </button>
            <button mat-stroked-button [routerLink]="['/equipment/tanks', tankId, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit Tank
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
          <!-- Volume Card with Liquid Animation -->
          <div class="volume-card">
            @if (loading()) {
              <app-skeleton width="100%" height="200px"></app-skeleton>
            } @else if (tank()) {
              <div class="volume-visual">
                <div class="tank-illustration">
                  <svg viewBox="0 0 200 300" class="tank-svg">
                    <!-- Outer tank (outline) -->
                    <defs>
                      <linearGradient id="wineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" [attr.style]="'stop-color:' + getDominantVarietyColor().start + ';stop-opacity:0.9'" />
                        <stop offset="100%" [attr.style]="'stop-color:' + getDominantVarietyColor().end + ';stop-opacity:1'" />
                      </linearGradient>
                      <!-- Dynamic clipPath based on fill percentage -->
                      <clipPath id="liquidClip">
                        <rect 
                          x="0" 
                          [attr.y]="270 - (240 * tank()!.fill_percentage / 100)" 
                          width="200" 
                          [attr.height]="270 + (240 * tank()!.fill_percentage / 100)"
                        />
                      </clipPath>
                    </defs>
                    
                    <!-- Tank outline -->
                    <ellipse cx="100" cy="30" rx="80" ry="15" fill="none" stroke="#cbd5e1" stroke-width="2"/>
                    <line x1="20" y1="30" x2="20" y2="270" stroke="#cbd5e1" stroke-width="2"/>
                    <line x1="180" y1="30" x2="180" y2="270" stroke="#cbd5e1" stroke-width="2"/>
                    <ellipse cx="100" cy="270" rx="80" ry="15" fill="none" stroke="#cbd5e1" stroke-width="2"/>
                    
                    <!-- Inner liquid cylinder (clipped to height) -->
                    @if (tank()!.fill_percentage > 0) {
                      <g clip-path="url(#liquidClip)" class="liquid-cylinder">
                        <!-- Cylinder body -->
                        <rect x="22" y="30" width="156" height="240" fill="url(#wineGradient)"/>
                        <!-- Bottom ellipse -->
                        <ellipse cx="100" cy="270" rx="78" ry="14" [attr.fill]="getDominantVarietyColor().end"/>
                      </g>
                    }
                    
                    <!-- Liquid surface (top ellipse) - rendered outside clip -->
                    @if (tank()!.fill_percentage > 0) {
                      <ellipse 
                        cx="100" 
                        [attr.cy]="270 - (240 * tank()!.fill_percentage / 100)" 
                        rx="78" 
                        ry="14" 
                        fill="url(#wineGradient)" 
                        class="liquid-surface"
                      />
                      <!-- Surface highlight for 3D effect -->
                      <ellipse 
                        cx="100" 
                        [attr.cy]="270 - (240 * tank()!.fill_percentage / 100)" 
                        rx="78" 
                        ry="14" 
                        [attr.fill]="getDominantVarietyColor().start" 
                        opacity="0.3"
                        class="liquid-highlight"
                      />
                    }
                  </svg>
                </div>
                
                <div class="volume-info-panel">
                  <div class="volume-header">
                    <div class="volume-main">
                      <span class="volume-label">Current Volume</span>
                      <span class="volume-value">{{ tank()!.current_volume_l | number:'1.0-0' }}</span>
                      <span class="volume-unit">Liters</span>
                    </div>
                    <div class="capacity-badge">
                      <span class="capacity-label">Total Capacity</span>
                      <span class="capacity-value">{{ tank()!.capacity_l | number:'1.0-0' }} L</span>
                    </div>
                  </div>
                  
                  <div class="progress-section">
                    <div class="progress-header">
                      <span class="fill-label">Fill Level</span>
                      <span class="fill-percentage">{{ tank()!.fill_percentage }}%</span>
                    </div>
                    <div class="progress-bar-wrapper">
                      <div class="progress-bar-bg">
                        <div 
                          class="progress-bar-fill" 
                          [style.width.%]="tank()!.fill_percentage"
                          [class.warning]="tank()!.fill_percentage > 90"
                          [class.low]="tank()!.fill_percentage < 10">
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="volume-stats-grid">
                    <div class="stat-card">
                      <app-icon name="droplet" [size]="20"></app-icon>
                      <div class="stat-content">
                        <span class="stat-value">{{ tank()!.current_volume_l | number:'1.0-0' }} L</span>
                        <span class="stat-label">Current</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <app-icon name="zap" [size]="20"></app-icon>
                      <div class="stat-content">
                        <span class="stat-value">{{ tank()!.available_capacity_l | number:'1.0-0' }} L</span>
                        <span class="stat-label">Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
          
          <!-- Two Column Layout: Composition + Ledger -->
          <div class="main-grid">
            <!-- Left Column: Composition -->
            <div class="composition-column">
              <div class="section-title">
                <app-icon name="pie-chart" [size]="24"></app-icon>
                <h2>Composition</h2>
              </div>
              
              @if (compositionLoading()) {
                <div class="composition-skeleton">
                  <app-skeleton width="100%" height="300px"></app-skeleton>
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
                    <app-icon name="alert" [size]="20"></app-icon>
                    <div class="warning-content">
                      <strong>Composition Integrity Issue</strong>
                      <span>This tank has some wine from unknown sources.</span>
                    </div>
                  </div>
                }
                
                @if (composition()!.total_volume_l > 0) {
                  <!-- By Variety -->
                  <div class="composition-section variety-section">
                    <div class="section-header">
                      <h3>
                        <app-icon name="grape" [size]="18"></app-icon>
                        Grape Varieties
                      </h3>
                    </div>
                    @if (composition()!.by_variety.length > 0) {
                      <div class="composition-grid">
                        @for (v of composition()!.by_variety; track v.variety) {
                          <div class="comp-card" [style.--card-color]="getVarietyColor($index)">
                            <div class="comp-card-header">
                              <span class="comp-name">{{ v.variety }}</span>
                              <span class="comp-pct">{{ v.percentage | number:'1.1-1' }}%</span>
                            </div>
                            <div class="comp-bar-modern">
                              <div class="comp-bar-fill" [style.width.%]="v.percentage"></div>
                            </div>
                            <span class="comp-volume">{{ v.volume_l | number:'1.0-0' }} L</span>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="no-data">No variety data available</p>
                    }
                  </div>
                  
                  <!-- By Batch -->
                  <div class="composition-section batch-section">
                    <div class="section-header">
                      <h3>
                        <app-icon name="batch" [size]="18"></app-icon>
                        Batches
                      </h3>
                    </div>
                    @if (composition()!.by_batch.length > 0) {
                      <div class="batch-grid">
                        @for (b of composition()!.by_batch; track b.batch_id) {
                          <div class="batch-card">
                            <div class="batch-header">
                              <span class="batch-label">{{ b.label }}</span>
                              <span class="batch-badge">{{ b.percentage | number:'1.1-1' }}%</span>
                            </div>
                            <div class="batch-volume">
                              <app-icon name="droplet" [size]="14"></app-icon>
                              {{ b.volume_l | number:'1.0-0' }} L
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="no-data">No batch data available</p>
                    }
                  </div>
                  
                  <!-- By Vineyard -->
                  <div class="composition-section vineyard-section">
                    <div class="section-header">
                      <h3>
                        <app-icon name="vineyard" [size]="18"></app-icon>
                        Vineyards
                      </h3>
                    </div>
                    @if (composition()!.by_vineyard.length > 0) {
                      <div class="vineyard-grid">
                        @for (v of composition()!.by_vineyard; track v.vineyard) {
                          <div class="vineyard-card">
                            <div class="vineyard-header">
                              <div class="vineyard-names">
                                <span class="vineyard-name">{{ v.vineyard }}</span>
                                <span class="grower-name">
                                  <app-icon name="farmer" [size]="12"></app-icon>
                                  {{ v.grower }}
                                </span>
                              </div>
                              <div class="vineyard-badge">{{ v.percentage | number:'1.1-1' }}%</div>
                            </div>
                            <div class="vineyard-volume">
                              <app-icon name="droplet" [size]="14"></app-icon>
                              {{ v.volume_l | number:'1.0-0' }} L
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
                      <div class="unknown-card">
                        <app-icon name="help-circle" [size]="24"></app-icon>
                        <div class="unknown-content">
                          <h4>Unknown Origin</h4>
                          <p>{{ composition()!.unknown_volume_l | number:'1.0-0' }} L ({{ composition()!.unknown_percentage | number:'1.1-1' }}%)</p>
                        </div>
                      </div>
                    </div>
                  }
                } @else {
                  <div class="empty-composition">
                    <div class="empty-icon-wrapper">
                      <app-icon name="wine" [size]="64"></app-icon>
                    </div>
                    <h4>Tank is Empty</h4>
                    <p>No composition data to display.</p>
                  </div>
                }
              }
            </div>
            
            <!-- Right Column: Ledger & History -->
            <div class="ledger-column">
              <div class="section-title">
                <app-icon name="book-open" [size]="24"></app-icon>
                <h2>Ledger & History</h2>
              </div>
              
              @if (historyLoading()) {
                <app-skeleton width="100%" height="400px"></app-skeleton>
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
          </div>
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
  
  /**
   * Get the dominant variety color from composition
   * Returns appropriate gradient colors based on variety mix
   */
  getDominantVarietyColor(): { start: string; end: string } {
    const comp = this.composition();
    if (!comp || comp.by_variety.length === 0) {
      // Default purple for unknown/no variety
      return { start: '#7c4dff', end: '#5e35d1' };
    }
    
    // Get total percentages by color
    let redTotal = 0;
    let whiteTotal = 0;
    let roseTotal = 0;
    
    for (const v of comp.by_variety) {
      const varietyName = v.variety.toLowerCase();
      // Simple heuristic based on common variety names
      if (varietyName.includes('merlot') || varietyName.includes('cabernet') || 
          varietyName.includes('syrah') || varietyName.includes('shiraz') ||
          varietyName.includes('pinot noir') || varietyName.includes('grenache') ||
          varietyName.includes('tempranillo') || varietyName.includes('malbec') ||
          varietyName.includes('sangiovese') || varietyName.includes('zinfandel')) {
        redTotal += v.percentage;
      } else if (varietyName.includes('chardonnay') || varietyName.includes('sauvignon') ||
                 varietyName.includes('riesling') || varietyName.includes('pinot gris') ||
                 varietyName.includes('pinot grigio') || varietyName.includes('viognier') ||
                 varietyName.includes('gewurztraminer') || varietyName.includes('moscato') ||
                 varietyName.includes('semillon') || varietyName.includes('albarino')) {
        whiteTotal += v.percentage;
      } else {
        roseTotal += v.percentage;
      }
    }
    
    // Determine dominant color
    if (redTotal > 50) {
      // Red wine - deep red/purple
      return { start: '#dc2626', end: '#991b1b' };
    } else if (whiteTotal > 50) {
      // White wine - bright yellow
      return { start: '#fde047', end: '#facc15' };
    } else if (roseTotal > 50 || (redTotal > 0 && whiteTotal > 0)) {
      // Rosé or blend - pink
      return { start: '#f472b6', end: '#db2777' };
    } else {
      // Mixed blend - purple
      return { start: '#7c4dff', end: '#5e35d1' };
    }
  }
}

