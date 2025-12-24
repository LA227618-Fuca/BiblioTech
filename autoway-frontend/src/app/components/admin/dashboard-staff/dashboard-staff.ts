import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VoitureService } from '../../../core/services/voiture.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AvisService } from '../../../core/services/avis.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-staff',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-staff.html',
  styleUrl: './dashboard-staff.scss',
})
export class DashboardStaff implements OnInit {
  voitureService = inject(VoitureService);
  reservationService = inject(ReservationService);
  avisService = inject(AvisService);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  stats = {
    voitures: 0,
    reservations: 0,
    avis: 0
  };

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
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

