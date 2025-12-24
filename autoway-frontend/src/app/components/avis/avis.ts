import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Navbar } from '../shared/navbar/navbar';
import { AvisService } from '../../core/services/avis.service';
import { ReservationService } from '../../core/services/reservation.service';
import { AuthService } from '../../core/services/auth.service';
import { Avis as AvisModel, CreateAvisRequest } from '../../models/avis.model';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-avis',
  imports: [CommonModule, RouterModule, FormsModule, Navbar],
  templateUrl: './avis.html',
  styleUrl: './avis.scss',
})
export class AvisComponent implements OnInit, OnDestroy {
  avisService = inject(AvisService);
  reservationService = inject(ReservationService);
  authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  
  avis: AvisModel[] = [];
  reservations: Reservation[] = [];
  newAvis: CreateAvisRequest = {
    score: 5,
    reservationID: 0,
    message: ''
  };
  error: string = '';

  ngOnInit(): void {
    this.loadAvis();
    if (this.authService.isAuthenticated()) {
      this.loadReservations();
    }

    // Écouter les événements de navigation pour recharger quand on revient sur la page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/avis' || event.urlAfterRedirects === '/avis') {
        if (this.authService.isAuthenticated()) {
          setTimeout(() => {
            this.loadReservations();
            this.loadAvis();
          }, 100);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAvis(): void {
    this.avisService.getAllAvis().subscribe({
      next: (avis) => {
        this.avis = [...avis.reverse()]; // Plus récents en premier, créer un nouveau tableau
        this.cdr.detectChanges(); // Forcer la détection de changement
      },
      error: (err) => {
        console.error('Erreur lors du chargement des avis:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadReservations(): void {
    // Utiliser getMyReservations() au lieu de getAllReservations() pour les users
    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        // Filtrer seulement les réservations terminées qui n'ont pas encore d'avis
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.reservations = reservations.filter(r => {
          const dateFin = new Date(r.dateFin);
          dateFin.setHours(0, 0, 0, 0);
          // Réservation terminée ET pas encore d'avis
          return dateFin < today && !r.avis;
        });
        this.cdr.detectChanges(); // Forcer la détection de changement
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réservations:', err);
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    this.error = '';
    if (!this.newAvis.reservationID) {
      this.error = 'Veuillez sélectionner une réservation';
      this.cdr.detectChanges();
      return;
    }
    this.avisService.createAvis(this.newAvis).subscribe({
      next: () => {
        this.newAvis = { score: 5, reservationID: 0, message: '' };
        this.loadAvis();
        this.loadReservations();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || err.error?.Message || 'Erreur lors de la création de l\'avis';
        console.error('Erreur de création d\'avis:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getStars(score: number): string {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  }
}
