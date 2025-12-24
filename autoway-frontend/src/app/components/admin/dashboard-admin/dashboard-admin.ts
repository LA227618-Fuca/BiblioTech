import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { VoitureService } from '../../../core/services/voiture.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AvisService } from '../../../core/services/avis.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss',
})
export class DashboardAdmin implements OnInit {
  utilisateurService = inject(UtilisateurService);
  voitureService = inject(VoitureService);
  reservationService = inject(ReservationService);
  avisService = inject(AvisService);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  stats = {
    utilisateurs: 0,
    voitures: 0,
    reservations: 0,
    avis: 0
  };

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    // Charger les utilisateurs uniquement si admin
    if (this.authService.isAdmin()) {
      this.utilisateurService.getAllUtilisateurs().subscribe({
        next: (users) => {
          this.stats.utilisateurs = users.length;
          this.cdr.detectChanges();
        }
      });
    }
    
    this.voitureService.getAllVoitures().subscribe({
      next: (voitures) => {
        this.stats.voitures = voitures.length;
        this.cdr.detectChanges();
      }
    });
    
    this.reservationService.getAllReservations().subscribe({
      next: (reservations) => {
        this.stats.reservations = reservations.length;
        this.cdr.detectChanges();
      }
    });
    
    this.avisService.getAllAvis().subscribe({
      next: (avis) => {
        this.stats.avis = avis.length;
        this.cdr.detectChanges();
      }
    });
  }
}
