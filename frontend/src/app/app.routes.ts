import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  // Master Data (Sprint 1.2)
  {
    path: 'master-data',
    canActivate: [authGuard],
    loadChildren: () => import('./features/master-data/master-data.routes')
      .then(m => m.MASTER_DATA_ROUTES)
  },
  // Equipment (Sprint 1.2)
  {
    path: 'equipment',
    canActivate: [authGuard],
    loadChildren: () => import('./features/equipment/equipment.routes')
      .then(m => m.EQUIPMENT_ROUTES)
  },
  // Harvest (Sprint 1.3)
  {
    path: 'harvest',
    canActivate: [authGuard],
    loadChildren: () => import('./features/harvest/harvest.routes')
      .then(m => m.HARVEST_ROUTES)
  },
  // Production (Sprint 1.4)
  {
    path: 'production',
    canActivate: [authGuard],
    loadChildren: () => import('./features/production/production.routes')
      .then(m => m.PRODUCTION_ROUTES)
  },
  // Lab (Sprint 1.5)
  {
    path: 'lab',
    canActivate: [authGuard],
    loadChildren: () => import('./features/lab/lab.routes')
      .then(m => m.LAB_ROUTES)
  },
  // Work Orders (Sprint 2.3)
  {
    path: 'work-orders',
    canActivate: [authGuard],
    loadChildren: () => import('./features/work-orders/work-orders.routes')
      .then(m => m.WORK_ORDERS_ROUTES)
  },
  // Settings/Admin
  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () => import('./features/settings/settings.routes')
      .then(m => m.SETTINGS_ROUTES)
  },
  // Shortcut routes for sidebar navigation
  {
    path: 'tanks',
    redirectTo: 'equipment/tanks',
    pathMatch: 'full'
  },
  {
    path: 'varieties',
    redirectTo: 'master-data/varieties',
    pathMatch: 'full'
  },
  {
    path: 'wineries',
    redirectTo: 'settings/wineries',
    pathMatch: 'full'
  },
  // Future routes (Phase 1)
  // {
  //   path: 'batches',
  //   canActivate: [authGuard],
  //   loadChildren: () => import('./features/batches/batches.routes').then(m => m.BATCH_ROUTES)
  // },
  // {
  //   path: 'transfers',
  //   canActivate: [authGuard],
  //   loadChildren: () => import('./features/transfers/transfers.routes').then(m => m.TRANSFER_ROUTES)
  // },
  // {
  //   path: 'analyses',
  //   canActivate: [authGuard],
  //   loadChildren: () => import('./features/analyses/analyses.routes').then(m => m.ANALYSIS_ROUTES)
  // },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

