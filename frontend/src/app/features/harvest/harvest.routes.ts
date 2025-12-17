import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const HARVEST_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'batches',
    pathMatch: 'full'
  },
  // Seasons
  {
    path: 'seasons',
    canActivate: [authGuard],
    loadComponent: () => import('./seasons/seasons-list.component')
      .then(m => m.SeasonsListComponent),
    title: 'Harvest Seasons'
  },
  {
    path: 'seasons/new',
    canActivate: [authGuard],
    loadComponent: () => import('./seasons/season-form.component')
      .then(m => m.SeasonFormComponent),
    title: 'New Season'
  },
  {
    path: 'seasons/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./seasons/season-form.component')
      .then(m => m.SeasonFormComponent),
    title: 'Edit Season'
  },
  // Batches
  {
    path: 'batches',
    canActivate: [authGuard],
    loadComponent: () => import('./batches/batches-list.component')
      .then(m => m.BatchesListComponent),
    title: 'Batches'
  },
  {
    path: 'batches/new',
    canActivate: [authGuard],
    loadComponent: () => import('./batches/batch-form.component')
      .then(m => m.BatchFormComponent),
    title: 'New Batch'
  },
  {
    path: 'batches/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./batches/batch-form.component')
      .then(m => m.BatchFormComponent),
    title: 'Edit Batch'
  }
];



