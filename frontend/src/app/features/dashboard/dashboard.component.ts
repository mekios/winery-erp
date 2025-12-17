import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';

import { AuthService } from '@core/services/auth.service';
import { WineryService } from '@core/services/winery.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRippleModule
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
          <button class="btn btn-primary" routerLink="/transfers">
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
                {{ membership.winery.region }}, {{ membership.winery.country }}
              </span>
            </div>
          </div>
          <div class="banner-badge">
            <span class="badge badge-primary">{{ formatRole(membership.role) }}</span>
          </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card-wrapper">
            <div class="stat-icon">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">24</div>
              <div class="stat-label">Active Tanks</div>
              <div class="stat-change positive">12% from last month</div>
            </div>
          </div>
          
          <div class="stat-card-wrapper">
            <div class="stat-icon success">
              <mat-icon>grain</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">156</div>
              <div class="stat-label">Active Batches</div>
              <div class="stat-change positive">8% from last month</div>
            </div>
          </div>
          
          <div class="stat-card-wrapper">
            <div class="stat-icon info">
              <mat-icon>swap_horiz</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">12</div>
              <div class="stat-label">Transfers Today</div>
              <div class="stat-change negative">3% from yesterday</div>
            </div>
          </div>
          
          <div class="stat-card-wrapper">
            <div class="stat-icon warning">
              <mat-icon>assignment</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">7</div>
              <div class="stat-label">Open Tasks</div>
              <div class="stat-change positive">2 completed today</div>
            </div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <h3 class="section-title">Quick Actions</h3>
        <div class="actions-grid">
          <a class="action-card card card-hover" routerLink="/transfers" matRipple>
            <div class="action-icon primary">
              <mat-icon>add_circle</mat-icon>
            </div>
            <span class="action-label">New Transfer</span>
            <span class="action-description">Move wine between tanks</span>
          </a>
          
          <a class="action-card card card-hover" routerLink="/analyses" matRipple>
            <div class="action-icon success">
              <mat-icon>science</mat-icon>
            </div>
            <span class="action-label">Record Analysis</span>
            <span class="action-description">Log lab results</span>
          </a>
          
          <a class="action-card card card-hover" routerLink="/batches" matRipple>
            <div class="action-icon info">
              <mat-icon>grain</mat-icon>
            </div>
            <span class="action-label">New Batch</span>
            <span class="action-description">Start grape intake</span>
          </a>
          
          <a class="action-card card card-hover" routerLink="/work-orders" matRipple>
            <div class="action-icon warning">
              <mat-icon>assignment</mat-icon>
            </div>
            <span class="action-label">View Tasks</span>
            <span class="action-description">7 tasks pending</span>
          </a>
        </div>
        
        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header d-flex justify-between align-center">
              <h4>Recent Activity</h4>
              <a routerLink="/activity" class="text-primary text-sm">View all</a>
            </div>
            <div class="card-body">
              <div class="activity-list">
                <div class="activity-item">
                  <div class="activity-icon success">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="activity-content">
                    <span class="activity-title">Transfer #T-2024-0142 completed</span>
                    <span class="activity-meta">Tank A12 → Tank B03 • 500L</span>
                  </div>
                  <span class="activity-time">2 min ago</span>
                </div>
                
                <div class="activity-item">
                  <div class="activity-icon info">
                    <mat-icon>science</mat-icon>
                  </div>
                  <div class="activity-content">
                    <span class="activity-title">Analysis recorded for Tank A12</span>
                    <span class="activity-meta">pH: 3.42 • TA: 6.2 g/L</span>
                  </div>
                  <span class="activity-time">15 min ago</span>
                </div>
                
                <div class="activity-item">
                  <div class="activity-icon warning">
                    <mat-icon>warning</mat-icon>
                  </div>
                  <div class="activity-content">
                    <span class="activity-title">Low SO₂ alert for Tank C07</span>
                    <span class="activity-meta">Free SO₂: 18 mg/L (threshold: 25)</span>
                  </div>
                  <span class="activity-time">1 hour ago</span>
                </div>
                
                <div class="activity-item">
                  <div class="activity-icon primary">
                    <mat-icon>grain</mat-icon>
                  </div>
                  <div class="activity-content">
                    <span class="activity-title">New batch created: B-2024-089</span>
                    <span class="activity-meta">Cabernet Sauvignon • 2,500 kg</span>
                  </div>
                  <span class="activity-time">3 hours ago</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Open Tasks -->
          <div class="card">
            <div class="card-header d-flex justify-between align-center">
              <h4>Open Tasks</h4>
              <a routerLink="/work-orders" class="text-primary text-sm">View all</a>
            </div>
            <div class="card-body p-0">
              <div class="tasks-list">
                <div class="task-item">
                  <div class="task-checkbox">
                    <mat-icon>radio_button_unchecked</mat-icon>
                  </div>
                  <div class="task-content">
                    <span class="task-title">Rack Tank B03</span>
                    <span class="task-meta">Due today • High priority</span>
                  </div>
                  <span class="badge badge-danger">Urgent</span>
                </div>
                
                <div class="task-item">
                  <div class="task-checkbox">
                    <mat-icon>radio_button_unchecked</mat-icon>
                  </div>
                  <div class="task-content">
                    <span class="task-title">SO₂ addition - Tank C07</span>
                    <span class="task-meta">Due today</span>
                  </div>
                  <span class="badge badge-warning">Today</span>
                </div>
                
                <div class="task-item">
                  <div class="task-checkbox">
                    <mat-icon>radio_button_unchecked</mat-icon>
                  </div>
                  <div class="task-content">
                    <span class="task-title">Schedule analysis for Tank A01-A05</span>
                    <span class="task-meta">Due tomorrow</span>
                  </div>
                  <span class="badge badge-info">Tomorrow</span>
                </div>
                
                <div class="task-item">
                  <div class="task-checkbox completed">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="task-content completed">
                    <span class="task-title">Transfer T-2024-0142</span>
                    <span class="task-meta">Completed 2 min ago</span>
                  </div>
                  <span class="badge badge-success">Done</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tank Overview -->
        <div class="card mt-4">
          <div class="card-header d-flex justify-between align-center">
            <h4>Tank Capacity Overview</h4>
            <a routerLink="/tanks" class="text-primary text-sm">Manage tanks</a>
          </div>
          <div class="card-body">
            <div class="tank-grid">
              <div class="tank-item">
                <div class="tank-header">
                  <span class="tank-name">Tank A12</span>
                  <span class="tank-volume">4,500 / 5,000 L</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width: 90%"></div>
                </div>
                <div class="tank-meta">
                  <span>Cabernet Sauvignon 2024</span>
                  <span class="text-success">90%</span>
                </div>
              </div>
              
              <div class="tank-item">
                <div class="tank-header">
                  <span class="tank-name">Tank B03</span>
                  <span class="tank-volume">2,100 / 3,000 L</span>
                </div>
                <div class="progress">
                  <div class="progress-bar info" style="width: 70%"></div>
                </div>
                <div class="tank-meta">
                  <span>Merlot 2024</span>
                  <span class="text-info">70%</span>
                </div>
              </div>
              
              <div class="tank-item">
                <div class="tank-header">
                  <span class="tank-name">Tank C07</span>
                  <span class="tank-volume">1,800 / 2,000 L</span>
                </div>
                <div class="progress">
                  <div class="progress-bar warning" style="width: 90%"></div>
                </div>
                <div class="tank-meta">
                  <span>Chardonnay 2024</span>
                  <span class="text-warning">90%</span>
                </div>
              </div>
              
              <div class="tank-item">
                <div class="tank-header">
                  <span class="tank-name">Tank D01</span>
                  <span class="tank-volume">500 / 5,000 L</span>
                </div>
                <div class="progress">
                  <div class="progress-bar danger" style="width: 10%"></div>
                </div>
                <div class="tank-meta">
                  <span>Sauvignon Blanc 2024</span>
                  <span class="text-danger">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
            <button class="btn btn-primary">
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
       Stats Grid
       =========================================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
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
        mat-icon { color: var(--primary); }
      }
      
      &.success {
        background: rgba(25, 216, 149, 0.12);
        mat-icon { color: var(--success); }
      }
      
      &.info {
        background: rgba(33, 150, 243, 0.12);
        mat-icon { color: var(--info); }
      }
      
      &.warning {
        background: rgba(255, 175, 0, 0.12);
        mat-icon { color: var(--warning); }
      }
      
      mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
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
      
      &.success {
        background: var(--success-light);
        mat-icon { color: var(--success); }
      }
      
      &.info {
        background: var(--info-light);
        mat-icon { color: var(--info); }
      }
      
      &.warning {
        background: var(--warning-light);
        mat-icon { color: var(--warning); }
      }
      
      &.primary {
        background: rgba(124, 77, 255, 0.12);
        mat-icon { color: var(--primary); }
      }
      
      mat-icon {
        font-size: 1.125rem;
        width: 1.125rem;
        height: 1.125rem;
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
    
    /* ===========================================
       Tasks List
       =========================================== */
    .tasks-list {
      display: flex;
      flex-direction: column;
    }
    
    .task-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .task-checkbox {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      
      mat-icon {
        font-size: 1.25rem;
        color: var(--gray-400);
      }
      
      &.completed mat-icon {
        color: var(--success);
      }
    }
    
    .task-content {
      flex: 1;
      min-width: 0;
      
      &.completed {
        .task-title {
          text-decoration: line-through;
          color: var(--text-muted);
        }
      }
    }
    
    .task-title {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    
    .task-meta {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    /* ===========================================
       Tank Overview
       =========================================== */
    .tank-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    @media (max-width: 768px) {
      .tank-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .tank-item {
      padding: 1rem;
      background: var(--gray-100);
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
    
    .tank-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    
    /* ===========================================
       Loading
       =========================================== */
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }
    
    /* ===========================================
       Header Actions
       =========================================== */
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
  `]
})
export class DashboardComponent {
  authService = inject(AuthService);
  wineryService = inject(WineryService);
  
  formatRole(role: string): string {
    return role.replace('_', ' ');
  }
}
