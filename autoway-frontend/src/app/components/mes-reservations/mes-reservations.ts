import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Navbar } from '../shared/navbar/navbar';
import { ReservationService } from '../../core/services/reservation.service';
import { AvisService } from '../../core/services/avis.service';
import { AuthService } from '../../core/services/auth.service';
import { Reservation } from '../../models/reservation.model';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-mes-reservations',
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './mes-reservations.html',
  styleUrl: './mes-reservations.scss',
})
export class MesReservations implements OnInit, OnDestroy {
  reservationService = inject(ReservationService);
  avisService = inject(AvisService);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  reservations: Reservation[] = [];
  userId: number = 0;

  ngOnInit(): void {
    // Recharger les réservations à chaque fois qu'on arrive sur cette page
    this.loadUserAndReservations();
    
    // Écouter les événements de navigation pour recharger quand on revient sur la page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/mes-reservations' || event.urlAfterRedirects === '/mes-reservations') {
        // Recharger les réservations quand on navigue vers cette page
        setTimeout(() => {
          this.loadReservations();
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserAndReservations(): void {
    // Recharger l'utilisateur depuis le token pour s'assurer qu'il est à jour
    this.authService.reloadUserFromToken();
    const user = this.authService.getCurrentUser();
    
    if (user && user.utilisateurID) {
      this.userId = user.utilisateurID;
      this.loadReservations();
    } else {
      // Si l'utilisateur n'est pas chargé, essayer de le décoder depuis le token
      const token = this.authService.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = parseInt(payload['nameid'] || payload['id'] || '0');
          if (userId > 0) {
            this.userId = userId;
            this.loadReservations();
          }
        } catch (error) {
          console.error('Erreur lors du décodage du token:', error);
        }
      }
    }
  }

  loadReservations(): void {
    // Utiliser l'endpoint spécifique pour les réservations de l'utilisateur
    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations = [...reservations]; // Créer un nouveau tableau pour forcer la détection
        this.cdr.detectChanges(); // Forcer la détection de changement
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réservations:', err);
        this.cdr.detectChanges();
      }
    });
  }

  deleteReservation(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.reservationService.deleteReservation(id).subscribe({
        next: () => {
          this.loadReservations();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
        }
      });
    }
  }

  isPast(dateFin: string): boolean {
    return new Date(dateFin) < new Date();
  }
}
