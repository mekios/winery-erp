import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';

import { AuthService } from '@core/services/auth.service';
import { WineryService } from '@core/services/winery.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { 
  DashboardService, 
  DashboardData,
  RecentTransfer,
  RecentAnalysis,
  TopTank,
  DashboardAlert 
} from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DecimalPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    IconComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="dashboard stagger">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="page-subtitle">
            Welcome back, {{ authService.currentUser()?.full_name || authService.currentUser()?.email }}
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" routerLink="/production/transfers/new">
            <mat-icon>add</mat-icon>
            New Transfer
          </button>
        </div>
      </div>
      
      @if (wineryService.currentWinery(); as membership) {
        <!-- Winery Info Banner -->
        <div class="winery-banner">
          <div class="banner-content">
            <div class="banner-icon">
              <mat-icon>wine_bar</mat-icon>
            </div>
            <div class="banner-info">
              <h2>{{ membership.winery.name }}</h2>
              <span class="banner-location">
                <mat-icon>location_on</mat-icon>
                {{ membership.winery.region || 'Region' }}, {{ membership.winery.country || 'Country' }}
              </span>
            </div>
          </div>
          <div class="banner-badge">
            <span class="badge badge-primary">{{ formatRole(membership.role) }}</span>
          </div>
        </div>
        
        @if (error()) {
          <app-error-state
            [title]="error()!"
            message="We couldn't load the dashboard data. Please check your connection and try again."
            variant="network"
            (retry)="loadDashboard()">
          </app-error-state>
        } @else if (loading()) {
          <!-- Skeleton loading state -->
          <div class="skeleton-dashboard">
            <div class="stats-grid">
              @for (i of [1,2,3,4]; track i) {
                <app-skeleton type="stat-card"></app-skeleton>
              }
            </div>
            <div class="actions-grid skeleton-actions">
              @for (i of [1,2,3,4]; track i) {
                <app-skeleton type="card"></app-skeleton>
              }
            </div>
            <div class="content-grid">
              <app-skeleton type="list" [rows]="5"></app-skeleton>
              <app-skeleton type="list" [rows]="5"></app-skeleton>
            </div>
          </div>
        } @else if (data()) {
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card-wrapper" routerLink="/equipment/tanks">
              <div class="stat-icon">
                <app-icon name="tank" [size]="24"></app-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ data()!.stats.tanks.active }}</div>
                <div class="stat-label">Active Tanks</div>
                <div class="stat-change">{{ data()!.stats.tanks.total }} total • {{ data()!.stats.tanks.fill_percentage }}% filled</div>
              </div>
            </div>
            
            <div class="stat-card-wrapper" routerLink="/harvest/batches">
              <div class="stat-icon success">
                <app-icon name="batch" [size]="24"></app-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ data()!.stats.batches.this_season }}</div>
                <div class="stat-label">Batches This Season</div>
                <div class="stat-change">{{ data()!.stats.batches.total }} total</div>
              </div>
            </div>
            
            <div class="stat-card-wrapper" routerLink="/production/transfers">
              <div class="stat-icon info">
                <app-icon name="arrow-right-left" [size]="24"></app-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ data()!.stats.transfers.today }}</div>
                <div class="stat-label">Transfers Today</div>
                <div class="stat-change">{{ data()!.stats.transfers.this_week }} this week</div>
              </div>
            </div>
            
            <div class="stat-card-wrapper" routerLink="/lab/analyses">
              <div class="stat-icon warning">
                <app-icon name="flask-conical" [size]="24"></app-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ data()!.stats.analyses.this_week }}</div>
                <div class="stat-label">Analyses This Week</div>
                <div class="stat-change">{{ data()!.stats.analyses.total }} total</div>
              </div>
            </div>
          </div>
          
          <!-- Alerts -->
          @if (data()!.alerts.length > 0) {
            <div class="alerts-section">
              <h3 class="section-title">
                <mat-icon>warning</mat-icon>
                Alerts
              </h3>
              <div class="alerts-grid">
                @for (alert of data()!.alerts; track $index) {
                  <a class="alert-card" [class]="alert.type" [routerLink]="getAlertLink(alert)">
                    <div class="alert-icon">
                      @if (alert.category === 'unknown_composition') {
                        <mat-icon>help_outline</mat-icon>
                      } @else {
                        <mat-icon>{{ alert.type === 'danger' ? 'error' : 'warning' }}</mat-icon>
                      }
                    </div>
                    <div class="alert-content">
                      <span class="alert-message">{{ alert.message }}</span>
                      <span class="alert-time">{{ alert.date | date:'short' }}</span>
                    </div>
                    <mat-icon class="alert-arrow">chevron_right</mat-icon>
                  </a>
                }
              </div>
            </div>
          }
          
          <!-- Quick Actions -->
          <h3 class="section-title">Quick Actions</h3>
          <div class="actions-grid">
            <a class="action-card card card-hover" routerLink="/production/transfers/new" matRipple>
              <div class="action-icon primary">
                <app-icon name="arrow-right-left" [size]="24"></app-icon>
              </div>
              <span class="action-label">New Transfer</span>
              <span class="action-description">Move wine between tanks</span>
            </a>
            
            <a class="action-card card card-hover" routerLink="/lab/analyses/new" matRipple>
              <div class="action-icon success">
                <app-icon name="flask-conical" [size]="24"></app-icon>
              </div>
              <span class="action-label">Record Analysis</span>
              <span class="action-description">Log lab results</span>
            </a>
            
            <a class="action-card card card-hover" routerLink="/harvest/batches/new" matRipple>
              <div class="action-icon info">
                <app-icon name="batch" [size]="24"></app-icon>
              </div>
              <span class="action-label">New Batch</span>
              <span class="action-description">Start grape intake</span>
            </a>
            
            <a class="action-card card card-hover" routerLink="/production/wine-lots/new" matRipple>
              <div class="action-icon warning">
                <app-icon name="wine" [size]="24"></app-icon>
              </div>
              <span class="action-label">New Wine Lot</span>
              <span class="action-description">Create wine lot</span>
            </a>
          </div>
          
          <!-- Main Content Grid -->
          <div class="content-grid">
            <!-- Recent Transfers -->
            <div class="card">
              <div class="card-header d-flex justify-between align-center">
                <h4>Recent Transfers</h4>
                <a routerLink="/production/transfers" class="text-primary text-sm">View all</a>
              </div>
              <div class="card-body">
                @if (data()!.recent_transfers.length > 0) {
                  <div class="activity-list">
                    @for (transfer of data()!.recent_transfers; track transfer.id) {
                      <div class="activity-item">
                        <div class="activity-icon primary">
                          <app-icon name="arrow-right-left" [size]="18"></app-icon>
                        </div>
                        <div class="activity-content">
                          <span class="activity-title">{{ transfer.action_type_display }}</span>
                          <span class="activity-meta">
                            @if (transfer.source_tank && transfer.destination_tank) {
                              {{ transfer.source_tank }} → {{ transfer.destination_tank }}
                            } @else if (transfer.source_tank) {
                              From {{ transfer.source_tank }}
                            } @else if (transfer.destination_tank) {
                              To {{ transfer.destination_tank }}
                            }
                            • {{ transfer.volume_l | number:'1.0-0' }} L
                          </span>
                        </div>
                        <span class="activity-time">{{ transfer.transfer_date | date:'short' }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state-small">
                    <app-icon name="arrow-right-left" [size]="32"></app-icon>
                    <p>No transfers yet</p>
                  </div>
                }
              </div>
            </div>
            
            <!-- Recent Analyses -->
            <div class="card">
              <div class="card-header d-flex justify-between align-center">
                <h4>Recent Analyses</h4>
                <a routerLink="/lab/analyses" class="text-primary text-sm">View all</a>
              </div>
              <div class="card-body">
                @if (data()!.recent_analyses.length > 0) {
                  <div class="activity-list">
                    @for (analysis of data()!.recent_analyses; track analysis.id) {
                      <div class="activity-item">
                        <div class="activity-icon" 
                             [class.warning]="analysis.va_gl && analysis.va_gl > 0.5"
                             [class.success]="!analysis.va_gl || analysis.va_gl <= 0.5">
                          <app-icon name="flask-conical" [size]="18"></app-icon>
                        </div>
                        <div class="activity-content">
                          <span class="activity-title">{{ analysis.source_display }}</span>
                          <span class="activity-meta">
                            @if (analysis.ph) { pH: {{ analysis.ph | number:'1.2-2' }} }
                            @if (analysis.ta_gl) { • TA: {{ analysis.ta_gl | number:'1.1-1' }} g/L }
                            @if (analysis.free_so2_mgl) { • SO₂: {{ analysis.free_so2_mgl | number:'1.0-0' }} mg/L }
                          </span>
                        </div>
                        <span class="activity-time">{{ analysis.analysis_date | date:'short' }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state-small">
                    <app-icon name="flask-conical" [size]="32"></app-icon>
                    <p>No analyses yet</p>
                  </div>
                }
              </div>
            </div>
          </div>
          
          <!-- Tank Overview -->
          @if (data()!.top_tanks.length > 0) {
            <div class="card mt-4">
              <div class="card-header d-flex justify-between align-center">
                <h4>Tank Capacity Overview</h4>
                <a routerLink="/equipment/tanks" class="text-primary text-sm">Manage tanks</a>
              </div>
              <div class="card-body">
                <div class="tank-grid">
                  @for (tank of data()!.top_tanks; track tank.id) {
                    <div class="tank-item">
                      <div class="tank-header">
                        <span class="tank-name">{{ tank.code }}</span>
                        <span class="tank-volume">{{ tank.current_volume_l | number:'1.0-0' }} / {{ tank.capacity_l | number:'1.0-0' }} L</span>
                      </div>
                      <div class="progress">
                        <div class="progress-bar" 
                             [class.danger]="tank.fill_percentage < 20"
                             [class.warning]="tank.fill_percentage >= 20 && tank.fill_percentage < 50"
                             [class.info]="tank.fill_percentage >= 50 && tank.fill_percentage < 80"
                             [style.width.%]="tank.fill_percentage"></div>
                      </div>
                      <div class="tank-meta">
                        <span>{{ tank.name }}</span>
                        <span [class.text-danger]="tank.fill_percentage < 20"
                              [class.text-warning]="tank.fill_percentage >= 20 && tank.fill_percentage < 50"
                              [class.text-info]="tank.fill_percentage >= 50 && tank.fill_percentage < 80"
                              [class.text-success]="tank.fill_percentage >= 80">
                          {{ tank.fill_percentage }}%
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
          
          <!-- Summary Cards -->
          <div class="summary-grid">
            <div class="summary-card" routerLink="/master-data/varieties">
              <div class="summary-icon">
                <app-icon name="grape" [size]="24"></app-icon>
              </div>
              <div class="summary-content">
                <span class="summary-value">{{ data()!.stats.varieties }}</span>
                <span class="summary-label">Varieties</span>
              </div>
            </div>
            
            <div class="summary-card" routerLink="/master-data/growers">
              <div class="summary-icon">
                <app-icon name="farmer" [size]="24"></app-icon>
              </div>
              <div class="summary-content">
                <span class="summary-value">{{ data()!.stats.growers }}</span>
                <span class="summary-label">Growers</span>
              </div>
            </div>
            
            <div class="summary-card" routerLink="/equipment/barrels">
              <div class="summary-icon">
                <app-icon name="barrel" [size]="24"></app-icon>
              </div>
              <div class="summary-content">
                <span class="summary-value">{{ data()!.stats.barrels.in_use }}</span>
                <span class="summary-label">Barrels in Use</span>
              </div>
            </div>
            
            <div class="summary-card" routerLink="/production/wine-lots">
              <div class="summary-icon">
                <app-icon name="wine" [size]="24"></app-icon>
              </div>
              <div class="summary-content">
                <span class="summary-value">{{ data()!.stats.wine_lots.active }}</span>
                <span class="summary-label">Active Lots</span>
              </div>
            </div>
          </div>
        }
        
      } @else if (wineryService.loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <!-- No Winery State -->
        <div class="card">
          <div class="empty-state">
            <mat-icon>business</mat-icon>
            <h3>No Winery Selected</h3>
            <p>You don't have access to any wineries yet, or you need to select one from the header.</p>
            <button class="btn btn-primary" routerLink="/settings/wineries">
              <mat-icon>add</mat-icon>
              Create New Winery
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* ===========================================
       Winery Banner
       =========================================== */
    .winery-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #7c4dff 0%, #b47cff 100%);
      border-radius: var(--border-radius-lg);
      color: white;
      margin-bottom: 1.5rem;
    }
    
    .banner-content {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    
    .banner-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }
    }
    
    .banner-info h2 {
      margin: 0 0 0.25rem 0;
      color: white;
    }
    
    .banner-location {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      opacity: 0.9;
      
      mat-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }
    }
    
    .banner-badge .badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    /* ===========================================
       Alerts Section
       =========================================== */
    .alerts-section {
      margin-bottom: 1.5rem;
      
      .section-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        mat-icon {
          color: var(--warning);
        }
      }
    }
    
    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 0.75rem;
    }
    
    .alert-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &.warning {
        background: rgba(255, 175, 0, 0.1);
        border: 1px solid rgba(255, 175, 0, 0.2);
        
        .alert-icon mat-icon {
          color: var(--warning);
        }
        
        &:hover {
          background: rgba(255, 175, 0, 0.15);
          border-color: rgba(255, 175, 0, 0.3);
        }
      }
      
      &.danger {
        background: rgba(255, 82, 82, 0.1);
        border: 1px solid rgba(255, 82, 82, 0.2);
        
        .alert-icon mat-icon {
          color: var(--danger);
        }
        
        &:hover {
          background: rgba(255, 82, 82, 0.15);
          border-color: rgba(255, 82, 82, 0.3);
        }
      }
      
      .alert-arrow {
        color: var(--text-muted);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      &:hover .alert-arrow {
        opacity: 1;
      }
    }
    
    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .alert-message {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .alert-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    /* ===========================================
       Stats Grid
       =========================================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-card-wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary);
        box-shadow: 0 4px 12px rgba(124, 77, 255, 0.15);
      }
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(124, 77, 255, 0.12);
      color: var(--primary);
      
      &.success {
        background: rgba(25, 216, 149, 0.12);
        color: var(--success);
      }
      
      &.info {
        background: rgba(33, 150, 243, 0.12);
        color: var(--info);
      }
      
      &.warning {
        background: rgba(255, 175, 0, 0.12);
        color: var(--warning);
      }
    }
    
    .stat-content {
      flex: 1;
    }
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    
    .stat-change {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 576px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* ===========================================
       Section Title
       =========================================== */
    .section-title {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    /* ===========================================
       Quick Actions
       =========================================== */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    @media (max-width: 992px) {
      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 576px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
    }
    
    .action-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      
      &.primary {
        background: rgba(124, 77, 255, 0.12);
        color: var(--primary);
      }
      
      &.success {
        background: rgba(25, 216, 149, 0.12);
        color: var(--success);
      }
      
      &.info {
        background: rgba(33, 150, 243, 0.12);
        color: var(--info);
      }
      
      &.warning {
        background: rgba(255, 175, 0, 0.12);
        color: var(--warning);
      }
    }
    
    .action-label {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    
    .action-description {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    /* ===========================================
       Content Grid
       =========================================== */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    
    @media (max-width: 992px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* ===========================================
       Activity List
       =========================================== */
    .activity-list {
      display: flex;
      flex-direction: column;
    }
    
    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
      
      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      &:first-child {
        padding-top: 0;
      }
    }
    
    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: rgba(124, 77, 255, 0.12);
      color: var(--primary);
      
      &.success {
        background: var(--success-light);
        color: var(--success);
      }
      
      &.info {
        background: var(--info-light);
        color: var(--info);
      }
      
      &.warning {
        background: var(--warning-light);
        color: var(--warning);
      }
      
      &.primary {
        background: rgba(124, 77, 255, 0.12);
        color: var(--primary);
      }
    }
    
    .activity-content {
      flex: 1;
      min-width: 0;
    }
    
    .activity-title {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    
    .activity-meta {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.125rem;
    }
    
    .activity-time {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
    
    .empty-state-small {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-muted);
      
      app-icon {
        opacity: 0.5;
        margin-bottom: 0.5rem;
      }
      
      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }
    
    /* ===========================================
       Tank Overview
       =========================================== */
    .tank-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    
    @media (max-width: 992px) {
      .tank-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 576px) {
      .tank-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .tank-item {
      padding: 1rem;
      background: var(--gray-50);
      border-radius: var(--border-radius-sm);
    }
    
    .tank-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .tank-name {
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .tank-volume {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    
    .progress {
      height: 8px;
      background: var(--gray-200);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-bar {
      height: 100%;
      background: var(--success);
      border-radius: 4px;
      transition: width 0.3s ease;
      
      &.danger { background: var(--danger); }
      &.warning { background: var(--warning); }
      &.info { background: var(--info); }
    }
    
    .tank-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    /* ===========================================
       Summary Grid
       =========================================== */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-top: 1.5rem;
    }
    
    @media (max-width: 992px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary);
      }
    }
    
    .summary-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gray-100);
      color: var(--text-secondary);
    }
    
    .summary-content {
      display: flex;
      flex-direction: column;
    }
    
    .summary-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .summary-label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    /* ===========================================
       Loading / Skeleton
       =========================================== */
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }
    
    .skeleton-dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    
    .skeleton-actions {
      margin-bottom: 0;
    }
    
    /* ===========================================
       Header Actions
       =========================================== */
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    
    .text-danger { color: var(--danger) !important; }
    .text-warning { color: var(--warning) !important; }
    .text-info { color: var(--info) !important; }
    .text-success { color: var(--success) !important; }
    
    .mt-4 { margin-top: 1.5rem; }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  wineryService = inject(WineryService);
  private dashboardService = inject(DashboardService);
  
  loading = signal(true);
  data = signal<DashboardData | null>(null);
  error = signal<string | null>(null);
  private hasLoaded = false;
  
  constructor() {
    // Use effect to react when winery becomes available
    effect(() => {
      const winery = this.wineryService.currentWinery();
      const initialized = this.wineryService.initialized();
      
      // Load dashboard when winery is available and we haven't loaded yet
      if (initialized && winery && !this.hasLoaded) {
        this.hasLoaded = true;
        this.loadDashboard();
      } else if (initialized && !winery) {
        // No winery available
        this.loading.set(false);
      }
    }, { allowSignalWrites: true });
  }
  
  ngOnInit(): void {
    // Effect handles the loading
  }
  
  loadDashboard(): void {
    if (!this.wineryService.currentWinery()) {
      this.loading.set(false);
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    this.hasLoaded = false;
    
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
        this.hasLoaded = true;
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.loading.set(false);
        this.error.set('Failed to load dashboard');
      }
    });
  }
  
  formatRole(role: string): string {
    return role.replace('_', ' ');
  }
  
  getAlertLink(alert: DashboardAlert): string[] {
    if (alert.category === 'unknown_composition' && alert.source_id) {
      return ['/equipment/tanks', alert.source_id];
    }
    if ((alert.category === 'low_so2' || alert.category === 'high_va') && alert.source_id) {
      return ['/lab/analyses'];
    }
    return [];
  }
}
