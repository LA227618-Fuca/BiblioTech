import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { VoitureService } from '../../../core/services/voiture.service';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';
import { Voiture } from '../../../models/voiture.model';

@Component({
  selector: 'app-gestion-voitures',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestion-voitures.html',
  styleUrl: './gestion-voitures.scss',
})
export class GestionVoitures implements OnInit, OnDestroy {
  voitureService = inject(VoitureService);
  utilisateurService = inject(UtilisateurService);
  authService = inject(AuthService);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  
  voitures: Voiture[] = [];
  newVoiture: Voiture = {
    voitureID: 0,
    marque: '',
    modele: '',
    prixJournalier: 0,
    plaqueImm: '',
    actif: true,
    utilisateurID: 0
  };
  editingVoiture: Voiture | null = null;
  error: string = '';

  ngOnInit(): void {
    this.loadVoitures();
    const user = this.authService.getCurrentUser();
    if (user) {
      this.newVoiture.utilisateurID = user.utilisateurID;
    }

    // Écouter les événements de navigation pour recharger quand on revient sur cette page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/admin/voitures' || event.urlAfterRedirects === '/admin/voitures') {
        setTimeout(() => {
          this.loadVoitures();
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVoitures(): void {
    this.voitureService.getAllVoitures().subscribe({
      next: (voitures) => {
        this.voitures = [...voitures]; // Créer un nouveau tableau pour forcer la détection
        this.cdr.detectChanges(); // Forcer la détection de changement
      },
      error: (err) => {
        console.error('Erreur lors du chargement des voitures:', err);
        this.cdr.detectChanges();
      }
    });
  }

  createVoiture(): void {
    this.error = '';
    this.voitureService.createVoiture(this.newVoiture).subscribe({
      next: () => {
        this.loadVoitures();
        this.newVoiture = {
          voitureID: 0,
          marque: '',
          modele: '',
          prixJournalier: 0,
          plaqueImm: '',
          actif: true,
          utilisateurID: this.newVoiture.utilisateurID
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Erreur lors de la création de la voiture';
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  editVoiture(voiture: Voiture): void {
    this.editingVoiture = { ...voiture };
    this.error = '';
    this.cdr.detectChanges();
    // Ouvrir le modal d'édition
    const editModal = document.getElementById('editCar');
    if (editModal) {
      const bsModal = new (window as any).bootstrap.Modal(editModal);
      bsModal.show();
    }
  }

  closeEditModal(): void {
    this.editingVoiture = null;
    this.error = '';
    const editModal = document.getElementById('editCar');
    if (editModal) {
      const bsModal = (window as any).bootstrap.Modal.getInstance(editModal);
      if (bsModal) {
        bsModal.hide();
      }
    }
  }

  updateVoiture(): void {
    if (!this.editingVoiture) {
      return;
    }

    // Validation
    if (!this.editingVoiture.marque || !this.editingVoiture.modele || !this.editingVoiture.plaqueImm) {
      this.error = 'Tous les champs sont requis';
      this.cdr.detectChanges();
      return;
    }

    if (this.editingVoiture.prixJournalier <= 0) {
      this.error = 'Le prix journalier doit être supérieur à 0';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.voitureService.updateVoiture(this.editingVoiture.voitureID, this.editingVoiture).subscribe({
      next: () => {
        this.loadVoitures();
        this.closeEditModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = err.error?.message || err.error?.Message || 'Erreur lors de la mise à jour';
        this.cdr.detectChanges();
      }
    });
  }

  deleteVoiture(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette voiture ?')) {
      this.voitureService.deleteVoiture(id).subscribe({
        next: () => {
          this.loadVoitures();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression';
          console.error('Erreur:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }
}
