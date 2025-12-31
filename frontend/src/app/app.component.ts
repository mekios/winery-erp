import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, filter, takeUntil } from 'rxjs';

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
      <div class="app-container" [class.sidebar-collapsed]="sidebarCollapsed()" [class.mobile-menu-open]="mobileMenuOpen()">
        <!-- Mobile Overlay -->
        <div class="mobile-overlay" (click)="closeMobileMenu()"></div>
        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- Mobile Close Button -->
          <button class="mobile-close-btn" (click)="closeMobileMenu()" aria-label="Close menu">
            <mat-icon>close</mat-icon>
          </button>
          
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
            <a class="nav-item" routerLink="/master-data/vineyards" routerLinkActive="active" 
               [routerLinkActiveOptions]="{exact: true}" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Vineyards' : ''" matTooltipPosition="right">
              <app-icon name="vineyard" [size]="20"></app-icon>
              <span>Vineyards</span>
            </a>
            <a class="nav-item" routerLink="/master-data/vineyards/map" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Vineyard Map' : ''" matTooltipPosition="right">
              <app-icon name="map" [size]="20"></app-icon>
              <span>Vineyard Map</span>
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
            
            <a class="nav-item" routerLink="/work-orders" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Work Orders' : ''" matTooltipPosition="right">
              <app-icon name="clipboard-list" [size]="20"></app-icon>
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
            
            <a class="nav-item" routerLink="/settings/config-lists" routerLinkActive="active" matRipple
               [matTooltip]="sidebarCollapsed() ? 'Config Lists' : ''" matTooltipPosition="right">
              <app-icon name="settings" [size]="20"></app-icon>
              <span>Config Lists</span>
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
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  wineryService = inject(WineryService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  isMobile = signal(false);
  initialized = false;
  
  private destroy$ = new Subject<void>();
  
  constructor() {
    // Subscribe to auth initialization
    this.authService.initialized$.subscribe(init => {
      this.initialized = init;
    });
  }
  
  ngOnInit(): void {
    // Watch for mobile breakpoint changes
    this.breakpointObserver
      .observe(['(max-width: 991px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile.set(result.matches);
        // Close mobile menu when switching to desktop
        if (!result.matches && this.mobileMenuOpen()) {
          this.mobileMenuOpen.set(false);
        }
      });
    
    // Close mobile menu on route change
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.mobileMenuOpen()) {
          this.mobileMenuOpen.set(false);
        }
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    // Always toggle mobile menu - CSS handles visibility based on screen size
    this.mobileMenuOpen.update((v: boolean) => !v);
    // Also toggle sidebar collapsed state for desktop
    if (!this.isMobile()) {
      this.sidebarCollapsed.update((v: boolean) => !v);
    }
  }
  
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
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
