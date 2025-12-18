import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const PRODUCTION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'transfers',
    pathMatch: 'full'
  },
  {
    path: 'transfers',
    canActivate: [authGuard],
    loadComponent: () => import('./transfers/transfers-list.component')
      .then(m => m.TransfersListComponent),
    title: 'Transfers'
  },
  {
    path: 'transfers/new',
    canActivate: [authGuard],
    loadComponent: () => import('./transfers/transfer-form.component')
      .then(m => m.TransferFormComponent),
    title: 'New Transfer'
  },
  {
    path: 'transfers/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./transfers/transfer-form.component')
      .then(m => m.TransferFormComponent),
    title: 'Edit Transfer'
  },
  {
    path: 'wine-lots',
    canActivate: [authGuard],
    loadComponent: () => import('./wine-lots/wine-lots-list.component')
      .then(m => m.WineLotsListComponent),
    title: 'Wine Lots'
  },
  {
    path: 'wine-lots/new',
    canActivate: [authGuard],
    loadComponent: () => import('./wine-lots/wine-lot-form.component')
      .then(m => m.WineLotFormComponent),
    title: 'New Wine Lot'
  },
  {
    path: 'wine-lots/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./wine-lots/wine-lot-form.component')
      .then(m => m.WineLotFormComponent),
    title: 'Wine Lot Details'
  },
  {
    path: 'wine-lots/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./wine-lots/wine-lot-form.component')
      .then(m => m.WineLotFormComponent),
    title: 'Edit Wine Lot'
  }
];



