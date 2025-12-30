import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'wineries',
    pathMatch: 'full'
  },
  {
    path: 'wineries',
    canActivate: [authGuard],
    loadComponent: () => import('./wineries/wineries-list.component')
      .then(m => m.WineriesListComponent),
    title: 'Winery Management'
  },
  {
    path: 'config-lists',
    canActivate: [authGuard],
    loadComponent: () => import('./config-lists/config-lists.component')
      .then(m => m.ConfigListsComponent),
    title: 'Configuration Lists'
  }
];







