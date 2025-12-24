import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Reservation } from '../../../models/reservation.model';

@Component({
  selector: 'app-gestion-reservations',
  imports: [CommonModule, RouterModule],
  templateUrl: './gestion-reservations.html',
  styleUrl: './gestion-reservations.scss',
})
export class GestionReservations implements OnInit, OnDestroy {
  reservationService = inject(ReservationService);
  authService = inject(AuthService);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  
  reservations: Reservation[] = [];

  ngOnInit(): void {
    this.loadReservations();

    // Écouter les événements de navigation pour recharger quand on revient sur cette page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/admin/reservations' || event.urlAfterRedirects === '/admin/reservations') {
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

  loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
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
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      this.reservationService.deleteReservation(id).subscribe({
        next: () => {
          this.loadReservations();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }
}
