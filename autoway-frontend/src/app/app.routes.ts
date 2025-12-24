import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(m => m.Home)
  },
  {
    path: 'catalogue',
    loadComponent: () => import('./components/catalogue/catalogue').then(m => m.Catalogue)
  },
  {
    path: 'voiture/:id',
    loadComponent: () => import('./components/voiture-details/voiture-details').then(m => m.VoitureDetails)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.Register)
  },
  {
    path: 'reservation/:voitureId',
    loadComponent: () => import('./components/reservation/reservation').then(m => m.Reservation),
    canActivate: [authGuard]
  },
  {
    path: 'mes-reservations',
    loadComponent: () => import('./components/mes-reservations/mes-reservations').then(m => m.MesReservations),
    canActivate: [authGuard]
  },
  {
    path: 'avis',
    loadComponent: () => import('./components/avis/avis').then(m => m.AvisComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN', 'STAFF'])],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin/dashboard-admin/dashboard-admin').then(m => m.DashboardAdmin)
      },
      {
        path: 'voitures',
        loadComponent: () => import('./components/admin/gestion-voitures/gestion-voitures').then(m => m.GestionVoitures)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./components/admin/gestion-reservations/gestion-reservations').then(m => m.GestionReservations)
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard(['ADMIN'])], // Seuls les admins peuvent gérer les utilisateurs
        loadComponent: () => import('./components/admin/gestion-utilisateurs/gestion-utilisateurs').then(m => m.GestionUtilisateurs)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
