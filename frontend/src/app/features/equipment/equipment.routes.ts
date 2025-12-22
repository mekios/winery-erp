import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'tanks',
    pathMatch: 'full'
  },
  // Tanks
  {
    path: 'tanks',
    canActivate: [authGuard],
    loadComponent: () => import('./tanks/tanks-list.component')
      .then(m => m.TanksListComponent),
    title: 'Tanks'
  },
  {
    path: 'tanks/new',
    canActivate: [authGuard],
    loadComponent: () => import('./tanks/tank-form.component')
      .then(m => m.TankFormComponent),
    title: 'New Tank'
  },
  {
    path: 'tanks/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./tanks/tank-detail.component')
      .then(m => m.TankDetailComponent),
    title: 'Tank Details'
  },
  {
    path: 'tanks/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./tanks/tank-form.component')
      .then(m => m.TankFormComponent),
    title: 'Edit Tank'
  },
  // Barrels
  {
    path: 'barrels',
    canActivate: [authGuard],
    loadComponent: () => import('./barrels/barrels-list.component')
      .then(m => m.BarrelsListComponent),
    title: 'Barrels'
  },
  {
    path: 'barrels/new',
    canActivate: [authGuard],
    loadComponent: () => import('./barrels/barrel-form.component')
      .then(m => m.BarrelFormComponent),
    title: 'New Barrel'
  },
  {
    path: 'barrels/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./barrels/barrel-form.component')
      .then(m => m.BarrelFormComponent),
    title: 'Edit Barrel'
  }
];



