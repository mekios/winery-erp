import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const MASTER_DATA_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'varieties',
    pathMatch: 'full'
  },
  // Varieties
  {
    path: 'varieties',
    canActivate: [authGuard],
    loadComponent: () => import('./varieties/varieties-list.component')
      .then(m => m.VarietiesListComponent),
    title: 'Grape Varieties'
  },
  {
    path: 'varieties/new',
    canActivate: [authGuard],
    loadComponent: () => import('./varieties/variety-form.component')
      .then(m => m.VarietyFormComponent),
    title: 'New Variety'
  },
  {
    path: 'varieties/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./varieties/variety-form.component')
      .then(m => m.VarietyFormComponent),
    title: 'Edit Variety'
  },
  // Growers
  {
    path: 'growers',
    canActivate: [authGuard],
    loadComponent: () => import('./growers/growers-list.component')
      .then(m => m.GrowersListComponent),
    title: 'Growers'
  },
  {
    path: 'growers/new',
    canActivate: [authGuard],
    loadComponent: () => import('./growers/grower-form.component')
      .then(m => m.GrowerFormComponent),
    title: 'New Grower'
  },
  {
    path: 'growers/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./growers/grower-form.component')
      .then(m => m.GrowerFormComponent),
    title: 'Edit Grower'
  },
  // Vineyards
  {
    path: 'vineyards',
    canActivate: [authGuard],
    loadComponent: () => import('./vineyards/vineyards-list.component')
      .then(m => m.VineyardsListComponent),
    title: 'Vineyard Blocks'
  },
  {
    path: 'vineyards/map',
    canActivate: [authGuard],
    loadComponent: () => import('./vineyards/vineyards-map.component')
      .then(m => m.VineyardsMapComponent),
    title: 'Vineyard Map'
  },
  {
    path: 'vineyards/new',
    canActivate: [authGuard],
    loadComponent: () => import('./vineyards/vineyard-form.component')
      .then(m => m.VineyardFormComponent),
    title: 'New Vineyard'
  },
  {
    path: 'vineyards/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./vineyards/vineyard-form.component')
      .then(m => m.VineyardFormComponent),
    title: 'Edit Vineyard'
  }
];



