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
  }
];






