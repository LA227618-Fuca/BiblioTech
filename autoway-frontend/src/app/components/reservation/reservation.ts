import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../shared/navbar/navbar';
import { VoitureService } from '../../core/services/voiture.service';
import { ReservationService } from '../../core/services/reservation.service';
import { AuthService } from '../../core/services/auth.service';
import { Voiture } from '../../models/voiture.model';
import { CreateReservationRequest } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation',
  imports: [CommonModule, RouterModule, FormsModule, Navbar],
  templateUrl: './reservation.html',
  styleUrl: './reservation.scss',
})
export class Reservation {
  route = inject(ActivatedRoute);
  router = inject(Router);
  voitureService = inject(VoitureService);
  reservationService = inject(ReservationService);
  authService = inject(AuthService);
  voiture: Voiture | null = null;
  reservation: CreateReservationRequest = {
    dateDebut: '',
    dateFin: '',
    prixFinal: 0,
    utilisateurID: 0,
    voitureID: 0
  };
  error: string = '';

  ngOnInit(): void {
    const voitureId = this.route.snapshot.paramMap.get('voitureId');
    if (voitureId) {
      this.reservation.voitureID = parseInt(voitureId);
      this.loadVoiture(parseInt(voitureId));
    } else {
      this.error = 'ID de voiture invalide';
      return;
    }
    
    // Le guard authGuard s'occupe déjà de la redirection si non authentifié
    // On essaie juste de charger l'utilisateur
    this.loadUser();
  }

  loadUser(): void {
    // Recharger l'utilisateur depuis le token pour s'assurer qu'il est à jour
    this.authService.reloadUserFromToken();
    const user = this.authService.getCurrentUser();
    
    if (user && user.utilisateurID && user.utilisateurID > 0) {
      this.reservation.utilisateurID = user.utilisateurID;
    } else {
      // Essayer de décoder directement depuis le token
      const token = this.authService.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Payload du token:', payload);
          
          // Essayer différents chemins pour trouver l'ID (nameid est le format JWT standard)
          const userId = parseInt(
            payload['nameid'] ||
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
            payload['nameidentifier'] || 
            payload['NameIdentifier'] ||
            payload['sub'] ||
            payload['id'] || 
            payload['Id'] ||
            '0'
          );
          
          if (userId > 0) {
            this.reservation.utilisateurID = userId;
            console.log('Utilisateur ID trouvé:', userId);
          } else {
            console.warn('Utilisateur ID non trouvé dans le token. Payload:', payload);
          }
        } catch (error) {
          console.error('Erreur lors du décodage du token:', error);
        }
      }
    }
  }

  loadVoiture(id: number): void {
    this.voitureService.getVoitureById(id).subscribe({
      next: (voiture) => {
        this.voiture = voiture;
        this.calculerPrix();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la voiture:', err);
      }
    });
  }

  calculerPrix(): void {
    if (this.reservation.dateDebut && this.reservation.dateFin && this.voiture) {
      const dateDebut = new Date(this.reservation.dateDebut);
      const dateFin = new Date(this.reservation.dateFin);
      const jours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));
      if (jours > 0) {
        this.reservation.prixFinal = jours * this.voiture.prixJournalier;
      }
    }
  }

  getNombreJours(): number {
    if (this.reservation.dateDebut && this.reservation.dateFin) {
      const dateDebut = new Date(this.reservation.dateDebut);
      const dateFin = new Date(this.reservation.dateFin);
      const jours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));
      return jours > 0 ? jours : 0;
    }
    return 0;
  }

  onSubmit(): void {
    this.error = '';
    
    // Vérifier que l'utilisateur est connecté
    if (!this.authService.isAuthenticated()) {
      this.error = 'Vous devez être connecté pour effectuer une réservation';
      this.router.navigate(['/login']);
      return;
    }
    
    // Récupérer l'utilisateur actuel au moment de la soumission
    // Recharger depuis le token pour s'assurer d'avoir les dernières infos
    this.authService.reloadUserFromToken();
    const user = this.authService.getCurrentUser();
    
    // Vérifier et récupérer l'ID utilisateur
    if (user && user.utilisateurID && user.utilisateurID > 0) {
      this.reservation.utilisateurID = user.utilisateurID;
    } else {
      // Si l'utilisateur n'est toujours pas chargé, décoder directement le token
      const token = this.authService.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.id || '0');
          if (userId > 0) {
            this.reservation.utilisateurID = userId;
          } else {
            this.error = 'Erreur: utilisateur non identifié. Veuillez vous reconnecter.';
            this.router.navigate(['/login']);
            return;
          }
        } catch (error) {
          console.error('Erreur lors du décodage du token:', error);
          this.error = 'Erreur: session invalide. Veuillez vous reconnecter.';
          this.router.navigate(['/login']);
          return;
        }
      } else {
        this.error = 'Erreur: utilisateur non identifié. Veuillez vous reconnecter.';
        this.router.navigate(['/login']);
        return;
      }
    }
    
    // Vérifier que l'utilisateur ID est défini
    if (!this.reservation.utilisateurID || this.reservation.utilisateurID === 0) {
      this.error = 'Erreur: utilisateur non identifié. Veuillez vous reconnecter.';
      this.router.navigate(['/login']);
      return;
    }
    
    // Vérifier les dates
    if (!this.reservation.dateDebut || !this.reservation.dateFin) {
      this.error = 'Veuillez sélectionner les dates';
      return;
    }
    
    // Vérifier que la date de fin est après la date de début
    const dateDebut = new Date(this.reservation.dateDebut);
    const dateFin = new Date(this.reservation.dateFin);
    if (dateFin <= dateDebut) {
      this.error = 'La date de fin doit être après la date de début';
      return;
    }
    
    // Vérifier que la date de début n'est pas dans le passé
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    if (dateDebut < aujourdhui) {
      this.error = 'La date de début ne peut pas être dans le passé';
      return;
    }
    
    this.calculerPrix();
    
    // Vérifier que le prix est calculé
    if (this.reservation.prixFinal <= 0) {
      this.error = 'Erreur dans le calcul du prix. Veuillez vérifier les dates.';
      return;
    }
    
    // Convertir en PascalCase pour le backend .NET
    const reservationBackend = {
      DateDebut: this.reservation.dateDebut,
      DateFin: this.reservation.dateFin,
      PrixFinal: this.reservation.prixFinal,
      UtilisateurID: this.reservation.utilisateurID,
      VoitureID: this.reservation.voitureID
    };
    
    console.log('Envoi de la réservation:', reservationBackend);
    
    this.reservationService.createReservation(reservationBackend as any).subscribe({
      next: (response) => {
        console.log('Réservation créée avec succès:', response);
        this.router.navigate(['/mes-reservations']);
      },
      error: (err) => {
        console.error('Erreur complète de réservation:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Error body:', err.error);
        
        if (err.status === 401 || err.status === 403) {
          this.error = 'Vous devez être connecté pour effectuer une réservation';
        } else if (err.status === 400) {
          this.error = err.error?.message || err.error?.Message || 'Les données de réservation sont invalides';
        } else if (err.status === 404) {
          this.error = 'Voiture introuvable';
        } else {
          this.error = err.error?.message || err.error?.Message || 'Erreur lors de la réservation. Veuillez réessayer.';
        }
      }
    });
  }
}
