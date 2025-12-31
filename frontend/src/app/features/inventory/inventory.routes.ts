import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const inventoryRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'materials',
        loadComponent: () =>
          import('./materials/materials-list.component').then((m) => m.MaterialsListComponent),
      },
      {
        path: 'materials/new',
        loadComponent: () =>
          import('./materials/material-form.component').then((m) => m.MaterialFormComponent),
      },
      {
        path: 'materials/:id',
        loadComponent: () =>
          import('./materials/material-form.component').then((m) => m.MaterialFormComponent),
      },
      {
        path: 'movements',
        loadComponent: () =>
          import('./movements/movements-list.component').then((m) => m.MovementsListComponent),
      },
      {
        path: 'additions',
        loadComponent: () =>
          import('./additions/additions-list.component').then((m) => m.AdditionsListComponent),
      },
      {
        path: '',
        redirectTo: 'materials',
        pathMatch: 'full',
      },
    ],
  },
];

