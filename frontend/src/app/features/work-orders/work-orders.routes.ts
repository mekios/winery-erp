import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const WORK_ORDERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./work-orders-list.component')
      .then(m => m.WorkOrdersListComponent),
    title: 'Work Orders'
  },
  {
    path: 'new',
    canActivate: [authGuard],
    loadComponent: () => import('./work-order-form.component')
      .then(m => m.WorkOrderFormComponent),
    title: 'New Work Order'
  },
  {
    path: ':id',
    canActivate: [authGuard],
    loadComponent: () => import('./work-order-detail.component')
      .then(m => m.WorkOrderDetailComponent),
    title: 'Work Order'
  },
  {
    path: ':id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./work-order-form.component')
      .then(m => m.WorkOrderFormComponent),
    title: 'Edit Work Order'
  }
];





