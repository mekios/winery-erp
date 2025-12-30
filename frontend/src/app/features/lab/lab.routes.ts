import { Routes } from '@angular/router';

export const LAB_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'analyses',
    pathMatch: 'full',
  },
  {
    path: 'analyses',
    children: [
      {
        path: '',
        loadComponent: () => import('./analyses/analyses-list.component')
          .then(m => m.AnalysesListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./analyses/analysis-form.component')
          .then(m => m.AnalysisFormComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./analyses/analysis-form.component')
          .then(m => m.AnalysisFormComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./analyses/analysis-form.component')
          .then(m => m.AnalysisFormComponent),
      },
    ],
  },
];








