import { Routes } from '@angular/router';
import { authGuard } from './core/guards';
import { AppShellComponent } from './layout';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'circles',
        loadComponent: () => import('./features/circles/circles-list/circles-list.component').then(m => m.CirclesListComponent)
      },
      {
        path: 'circles/create',
        loadComponent: () => import('./features/circles/create-circle/create-circle.component').then(m => m.CreateCircleComponent)
      },
      {
        path: 'circles/:circleId',
        loadComponent: () => import('./features/circles/circle-overview/circle-overview.component').then(m => m.CircleOverviewComponent)
      },
      {
        path: 'circles/:circleId/members',
        loadComponent: () => import('./features/members/members.component').then(m => m.MembersComponent)
      },
      {
        path: 'circles/:circleId/round',
        loadComponent: () => import('./features/rounds/round-status/round-status.component').then(m => m.RoundStatusComponent)
      },
      {
        path: 'circles/:circleId/history',
        loadComponent: () => import('./features/rounds/round-history/round-history.component').then(m => m.RoundHistoryComponent)
      },
      {
        path: 'circles/:circleId/summary',
        loadComponent: () => import('./features/circles/circle-summary/circle-summary.component').then(m => m.CircleSummaryComponent)
      },
      {
        path: 'join-requests',
        loadComponent: () => import('./features/join-requests/join-requests.component').then(m => m.JoinRequestsComponent)
      },
      {
        path: 'circles/:circleId/join-requests',
        loadComponent: () => import('./features/join-requests/join-requests.component').then(m => m.JoinRequestsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
