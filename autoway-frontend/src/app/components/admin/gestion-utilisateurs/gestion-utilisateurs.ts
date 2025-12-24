import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { Utilisateur } from '../../../models/utilisateur.model';

@Component({
  selector: 'app-gestion-utilisateurs',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestion-utilisateurs.html',
  styleUrl: './gestion-utilisateurs.scss',
})
export class GestionUtilisateurs implements OnInit, OnDestroy {
  utilisateurService = inject(UtilisateurService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  
  utilisateurs: Utilisateur[] = [];
  
  // État du modal d'édition
  editingUser: Utilisateur | null = null;
  showEditModal = false;
  editForm: Partial<Utilisateur> = {};
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadUtilisateurs();

    // Écouter les événements de navigation pour recharger quand on revient sur cette page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/admin/utilisateurs' || event.urlAfterRedirects === '/admin/utilisateurs') {
        setTimeout(() => {
          this.loadUtilisateurs();
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUtilisateurs(): void {
    this.utilisateurService.getAllUtilisateurs().subscribe({
      next: (utilisateurs) => {
        this.utilisateurs = [...utilisateurs]; // Créer un nouveau tableau pour forcer la détection
        this.cdr.detectChanges(); // Forcer la détection de changement
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal(utilisateur: Utilisateur): void {
    this.editingUser = { ...utilisateur }; // Copie de l'utilisateur
    this.editForm = {
      utilisateurID: utilisateur.utilisateurID,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      dateNaissance: utilisateur.dateNaissance,
      actif: utilisateur.actif,
      roles: [...utilisateur.roles] // Copie du tableau de rôles
    };
    this.showEditModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
    this.editForm = {};
    this.errorMessage = '';
    this.successMessage = '';
  }

  toggleRole(role: string): void {
    if (!this.editForm.roles) {
      this.editForm.roles = [];
    }
    const index = this.editForm.roles.indexOf(role);
    if (index > -1) {
      this.editForm.roles.splice(index, 1);
    } else {
      this.editForm.roles.push(role);
    }
    // S'assurer qu'il y a au moins un rôle
    if (this.editForm.roles.length === 0) {
      this.editForm.roles = ['USER'];
    }
  }

  saveUser(): void {
    if (!this.editForm.utilisateurID) {
      this.errorMessage = 'ID utilisateur manquant';
      return;
    }

    // Validation des champs requis
    if (!this.editForm.nom || !this.editForm.prenom || !this.editForm.email) {
      this.errorMessage = 'Nom, prénom et email sont requis';
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editForm.email)) {
      this.errorMessage = 'Format d\'email invalide';
      return;
    }

    // Préparer les données pour l'envoi (sans le mot de passe - les admins ne peuvent pas modifier les mots de passe)
    const userToUpdate: Utilisateur = {
      utilisateurID: this.editForm.utilisateurID,
      nom: this.editForm.nom,
      prenom: this.editForm.prenom,
      email: this.editForm.email,
      dateNaissance: this.editForm.dateNaissance || '',
      actif: this.editForm.actif ?? true,
      roles: this.editForm.roles || ['USER']
      // Le mot de passe n'est pas inclus - les admins ne peuvent pas modifier les mots de passe
    };

    this.utilisateurService.updateUtilisateur(userToUpdate.utilisateurID, userToUpdate).subscribe({
      next: () => {
        this.successMessage = 'Utilisateur modifié avec succès';
        this.cdr.detectChanges();
        this.loadUtilisateurs();
        setTimeout(() => {
          this.closeEditModal();
        }, 1500);
      },
      error: (err) => {
        console.error('Erreur lors de la modification:', err);
        console.error('Détails de l\'erreur:', err.error);
        
        // Gérer les erreurs de validation
        if (err.error?.errors) {
          const validationErrors = Object.values(err.error.errors).flat();
          this.errorMessage = validationErrors.join(', ') || 'Erreurs de validation';
        } else {
          this.errorMessage = err.error?.message || err.error?.Message || err.error?.title || 'Erreur lors de la modification de l\'utilisateur';
        }
      }
    });
  }

  deleteUtilisateur(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.utilisateurService.deleteUtilisateur(id).subscribe({
        next: () => {
          this.loadUtilisateurs();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.errorMessage = 'Erreur lors de la suppression de l\'utilisateur';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
