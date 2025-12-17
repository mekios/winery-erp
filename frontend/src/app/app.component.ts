import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '@core/services/auth.service';
import { WineryService } from '@core/services/winery.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSelectModule,
    MatBadgeModule,
    MatDividerModule,
    MatRippleModule,
    MatTooltipModule,
    IconComponent
  ],
  template: `
    @if (!initialized) {
      <!-- Loading state while checking auth -->
      <div class="app-loading">
        <div class="loading-content">
          <span class="loading-logo">🍇</span>
          <span class="loading-text">Loading...</span>
        </div>
      </div>
    } @else if (authService.isAuthenticated()) {
      <div class="app-container" [class.sidebar-collapsed]="sidebarCollapsed()">
        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- Logo -->
          <div class="sidebar-brand" [matTooltip]="sidebarCollapsed() ? 'Winery ERP' : ''" matTooltipPosition="right">
            <span class="brand-icon">🍇</span>
            <span class="brand-text">Winery ERP</span>
          </div>
          
          <!-- Navigation -->
            <nav class="sidebar-nav">
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Dashboard' : ''" matTooltipPosition="right">
              <app-icon name="dashboard" [size]="20"></app-icon>
              <span>Dashboard</span>
            </a>
            
            <div class="nav-section">Equipment</div>
            
            <a class="nav-item" routerLink="/equipment/tanks" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Tanks' : ''" matTooltipPosition="right">
              <app-icon name="tank" [size]="20"></app-icon>
              <span>Tanks</span>
            </a>
            <a class="nav-item" routerLink="/equipment/barrels" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Barrels' : ''" matTooltipPosition="right">
              <app-icon name="barrel" [size]="20"></app-icon>
              <span>Barrels</span>
            </a>
            
            <div class="nav-section">Master Data</div>
            
            <a class="nav-item" routerLink="/master-data/varieties" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Varieties' : ''" matTooltipPosition="right">
              <app-icon name="grape" [size]="20"></app-icon>
              <span>Grape Varieties</span>
            </a>
            <a class="nav-item" routerLink="/master-data/growers" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Growers' : ''" matTooltipPosition="right">
              <app-icon name="farmer" [size]="20"></app-icon>
              <span>Growers</span>
            </a>
            <a class="nav-item" routerLink="/master-data/vineyards" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Vineyards' : ''" matTooltipPosition="right">
              <app-icon name="vineyard" [size]="20"></app-icon>
              <span>Vineyards</span>
            </a>
            
            <div class="nav-section">Harvest</div>
            
            <a class="nav-item" routerLink="/harvest/seasons" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Seasons' : ''" matTooltipPosition="right">
              <app-icon name="calendar" [size]="20"></app-icon>
              <span>Seasons</span>
            </a>
            <a class="nav-item" routerLink="/harvest/batches" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Batches' : ''" matTooltipPosition="right">
              <app-icon name="batch" [size]="20"></app-icon>
              <span>Batches</span>
            </a>
            
            <div class="nav-section">Production</div>
            
            <a class="nav-item" routerLink="/production/transfers" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Transfers' : ''" matTooltipPosition="right">
              <app-icon name="arrow-right-left" [size]="20"></app-icon>
              <span>Transfers</span>
            </a>
            <a class="nav-item" routerLink="/production/wine-lots" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Wine Lots' : ''" matTooltipPosition="right">
              <app-icon name="wine" [size]="20"></app-icon>
              <span>Wine Lots</span>
            </a>
            
            <div class="nav-section">Lab & Quality</div>
            
            <a class="nav-item" routerLink="/lab/analyses" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Analyses' : ''" matTooltipPosition="right">
              <app-icon name="flask-conical" [size]="20"></app-icon>
              <span>Analyses</span>
            </a>
            
            <div class="nav-section">Operations</div>
            
            <a class="nav-item disabled" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Work Orders' : ''" matTooltipPosition="right">
              <mat-icon>assignment</mat-icon>
              <span>Work Orders</span>
            </a>
            <a class="nav-item disabled" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Inventory' : ''" matTooltipPosition="right">
              <mat-icon>inventory</mat-icon>
              <span>Inventory</span>
            </a>
            
            <div class="nav-section">Admin</div>
            
            <a class="nav-item" routerLink="/settings/wineries" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Wineries' : ''" matTooltipPosition="right">
              <app-icon name="building" [size]="20"></app-icon>
              <span>Wineries</span>
            </a>
          </nav>
          
          <!-- Collapse Toggle -->
          <div class="sidebar-footer">
            <button class="collapse-btn" (click)="toggleSidebar()" 
                    [matTooltip]="sidebarCollapsed() ? 'Expand' : 'Collapse'" matTooltipPosition="right">
              <mat-icon>{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
              <span>Collapse</span>
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="main-wrapper">
          <!-- Top Header -->
          <header class="top-header">
            <button class="sidebar-toggle" (click)="toggleSidebar()">
              <mat-icon>{{ sidebarCollapsed() ? 'menu' : 'menu_open' }}</mat-icon>
            </button>
            
            <div class="header-spacer"></div>
            
            <!-- Winery Selector -->
            @if (wineryService.wineries().length > 0) {
              <div class="winery-selector" [matMenuTriggerFor]="wineryMenu">
                <mat-icon>business</mat-icon>
                <span>{{ wineryService.currentWinery()?.winery?.name || 'Select Winery' }}</span>
                <mat-icon>arrow_drop_down</mat-icon>
              </div>
              <mat-menu #wineryMenu="matMenu">
                @for (membership of wineryService.wineries(); track membership.winery.id) {
                  <button mat-menu-item (click)="onWineryChange(membership.winery.id)">
                    <mat-icon>{{ membership.winery.id === wineryService.currentWinery()?.winery?.id ? 'check' : 'business' }}</mat-icon>
                    <span>{{ membership.winery.name }}</span>
                  </button>
                }
              </mat-menu>
            }
            
            <!-- Notifications -->
            <button class="header-icon-btn" matRipple [matMenuTriggerFor]="notificationsMenu">
              <mat-icon matBadge="2" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
            </button>
            <mat-menu #notificationsMenu="matMenu" class="notifications-menu">
              <div class="menu-header">
                <strong>Notifications</strong>
                <a>Mark all read</a>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item class="notification-item">
                <mat-icon class="text-success">check_circle</mat-icon>
                <div class="notification-content">
                  <span class="notification-title">Transfer completed</span>
                  <span class="notification-time">2 min ago</span>
                </div>
              </button>
              <button mat-menu-item class="notification-item">
                <mat-icon class="text-warning">warning</mat-icon>
                <div class="notification-content">
                  <span class="notification-title">Low inventory alert</span>
                  <span class="notification-time">1 hour ago</span>
                </div>
              </button>
            </mat-menu>
            
            <!-- User Avatar -->
            <button class="user-avatar" [matMenuTriggerFor]="userMenu">
              {{ getUserInitials() }}
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="user-menu-header">
                <strong>{{ authService.currentUser()?.full_name || 'User' }}</strong>
                <span>{{ authService.currentUser()?.email }}</span>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>My Profile</span>
              </button>
              <button mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon>
                <span>Settings</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </header>

          <!-- Page Content -->
          <main class="page-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    } @else {
      <!-- Auth Layout (full page) -->
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    /* ===========================================
       Main Layout
       =========================================== */
    .app-container {
      display: flex;
      min-height: 100vh;
    }
    
    /* ===========================================
       Sidebar
       =========================================== */
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1a1a2e 0%, #16162b 100%);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 1000;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-x: hidden;
      overflow-y: hidden;
    }
    
    .sidebar-collapsed .sidebar {
      width: 64px;
      
      .brand-text,
      .nav-item span,
      .nav-badge {
        opacity: 0;
        visibility: hidden;
        width: 0;
        overflow: hidden;
        white-space: nowrap;
        position: absolute;
      }
      
      /* Hide section headers completely */
      .nav-section {
        max-height: 0;
        padding: 0;
        margin: 0;
        opacity: 0;
        visibility: hidden;
      }
      
      .sidebar-brand {
        padding: 1rem 0;
        justify-content: center;
        
        .brand-icon {
          font-size: 1.5rem;
        }
      }
      
      .sidebar-nav {
        padding: 0.375rem;
      }
      
      .nav-item {
        width: 48px;
        height: 48px;
        padding: 0;
        justify-content: center;
        align-items: center;
        border-radius: 12px;
        margin: 0 auto 4px;
        gap: 0;
        
        mat-icon, app-icon {
          margin: 0;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        &:hover mat-icon,
        &:hover app-icon {
          transform: scale(1.15);
        }
        
        &.active::before {
          display: none;
        }
        
        &.active {
          background: rgba(124, 77, 255, 0.25);
        }
      }
    }
    
    /* Brand */
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .brand-icon {
      font-size: 1.75rem;
    }
    
    .brand-text {
      font-size: 1.125rem;
      font-weight: 700;
      white-space: nowrap;
      transition: opacity 0.2s ease;
    }
    
    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      overflow-x: hidden;
      
      /* Custom scrollbar */
      &::-webkit-scrollbar {
        width: 4px;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(124, 77, 255, 0.3);
        border-radius: 4px;
        
        &:hover {
          background: rgba(124, 77, 255, 0.5);
        }
      }
      
      /* Firefox */
      scrollbar-width: thin;
      scrollbar-color: rgba(124, 77, 255, 0.3) transparent;
    }
    
    .nav-section {
      padding: 1rem 0.75rem 0.375rem;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.35);
      white-space: nowrap;
      transition: all 0.25s ease;
      max-height: 2.5rem;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 0.875rem;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 2px;
      position: relative;
      
      mat-icon, app-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
        opacity: 0.8;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
      }
      
      span {
        white-space: nowrap;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: white;
        
        mat-icon, app-icon {
          opacity: 1;
        }
      }
      
      &.active {
        background: rgba(124, 77, 255, 0.2);
        color: white;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: #7c4dff;
          border-radius: 0 3px 3px 0;
        }
        
        mat-icon, app-icon {
          opacity: 1;
          color: #b47cff;
        }
      }
      
      &.disabled {
        opacity: 0.4;
        pointer-events: none;
        cursor: not-allowed;
      }
    }
    
    .nav-badge {
      margin-left: auto;
      background: #ff6258;
      color: white;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      transition: opacity 0.2s ease;
    }
    
    /* Sidebar Footer */
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      margin-top: auto;
    }
    
    .collapse-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.6);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all 0.2s ease;
      
      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }
    
    .sidebar-collapsed .sidebar-footer {
      padding: 0.375rem;
      
      .collapse-btn {
        width: 48px;
        height: 48px;
        margin: 0 auto;
        justify-content: center;
        padding: 0;
        border-radius: 12px;
        
        span {
          display: none;
        }
      }
    }
    
    /* ===========================================
       Main Content
       =========================================== */
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .sidebar-collapsed .main-wrapper {
      margin-left: 64px;
    }
    
    /* ===========================================
       Top Header
       =========================================== */
    .top-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0 1.5rem;
      height: 64px;
      background: white;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: var(--gray-100);
      }
      
      mat-icon {
        color: var(--text-secondary);
      }
    }
    
    .header-spacer {
      flex: 1;
    }
    
    .winery-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--gray-100);
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: var(--gray-200);
      }
      
      mat-icon:first-child {
        color: var(--primary);
        font-size: 1.25rem;
      }
      
      span {
        font-weight: 600;
        color: var(--text-primary);
      }
      
      mat-icon:last-child {
        color: var(--text-secondary);
        font-size: 1.25rem;
      }
    }
    
    .header-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: var(--gray-100);
      }
      
      mat-icon {
        color: var(--text-secondary);
      }
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c4dff 0%, #b47cff 100%);
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      transition: box-shadow 0.2s ease;
      
      &:hover {
        box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.2);
      }
    }
    
    /* Menus */
    .user-menu-header {
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      
      strong {
        font-size: 0.9375rem;
        color: var(--text-primary);
      }
      
      span {
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }
    }
    
    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      
      strong {
        font-size: 0.9375rem;
      }
      
      a {
        font-size: 0.75rem;
        color: var(--primary);
        cursor: pointer;
      }
    }
    
    .notification-item {
      padding: 0.75rem 1rem !important;
      
      mat-icon {
        margin-right: 0.75rem;
      }
      
      .notification-content {
        display: flex;
        flex-direction: column;
      }
      
      .notification-title {
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .notification-time {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }
    
    .text-success { color: var(--success) !important; }
    .text-warning { color: var(--warning) !important; }
    
    /* ===========================================
       Page Content
       =========================================== */
    .page-content {
      flex: 1;
      padding: 1.5rem;
      background: var(--bg-body);
    }
    
    /* ===========================================
       Responsive
       =========================================== */
    @media (max-width: 991px) {
      .sidebar {
        transform: translateX(-100%);
      }
      
      .sidebar-collapsed .sidebar {
        transform: translateX(-100%);
      }
      
      .main-wrapper,
      .sidebar-collapsed .main-wrapper {
        margin-left: 0;
      }
    }
    
    /* ===========================================
       Loading State
       =========================================== */
    .app-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #7c4dff 100%);
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: white;
    }
    
    .loading-logo {
      font-size: 4rem;
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    .loading-text {
      font-size: 1.125rem;
      font-weight: 500;
      opacity: 0.8;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
  wineryService = inject(WineryService);
  private router = inject(Router);
  
  sidebarCollapsed = signal(false);
  initialized = false;
  
  constructor() {
    // Subscribe to auth initialization
    this.authService.initialized$.subscribe(init => {
      this.initialized = init;
    });
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  }
  
  getCurrentRole(): string {
    const membership = this.wineryService.currentWinery();
    if (membership?.role) {
      return membership.role.replace('_', ' ').toLowerCase();
    }
    return 'user';
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed.update((v: boolean) => !v);
  }

  onWineryChange(wineryId: string): void {
    this.wineryService.setActiveWinery(wineryId);
    // Reload current route to refresh data with new winery context
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
