import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { AuthService } from '../../core/services/auth.service';
import { Utilisateur } from '../../models/utilisateur.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private utilisateurService = inject(UtilisateurService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private location = inject(Location);

  utilisateur: Utilisateur | null = null;
  isLoading = true;
  error: string | null = null;
  success: string | null = null;
  isEditing = false;

  // Formulaire
  formData = {
    nom: '',
    prenom: '',
    email: '',
    dateNaissance: ''
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.error = null;
    this.utilisateurService.getMyProfile().subscribe({
      next: (user) => {
        this.utilisateur = user;
        this.formData = {
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          dateNaissance: user.dateNaissance
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.error = 'Erreur lors du chargement du profil';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.utilisateur) {
      // Annuler : restaurer les valeurs originales
      this.formData = {
        nom: this.utilisateur.nom,
        prenom: this.utilisateur.prenom,
        email: this.utilisateur.email,
        dateNaissance: this.utilisateur.dateNaissance
      };
    }
    this.error = null;
    this.success = null;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.error = null;
    this.success = null;

    this.utilisateurService.updateMyProfile(this.formData).subscribe({
      next: () => {
        this.success = 'Profil mis à jour avec succès';
        this.isEditing = false;
        // Recharger le profil pour avoir les données à jour
        this.loadProfile();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du profil:', err);
        if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Erreur lors de la mise à jour du profil';
        }
        this.cdr.detectChanges();
      }
    });
  }

  private validateForm(): boolean {
    if (!this.formData.nom || !this.formData.nom.trim()) {
      this.error = 'Le nom est requis';
      return false;
    }
    if (!this.formData.prenom || !this.formData.prenom.trim()) {
      this.error = 'Le prénom est requis';
      return false;
    }
    if (!this.formData.email || !this.formData.email.trim()) {
      this.error = 'L\'email est requis';
      return false;
    }
    if (!this.isValidEmail(this.formData.email)) {
      this.error = 'L\'email n\'est pas valide';
      return false;
    }
    if (!this.formData.dateNaissance) {
      this.error = 'La date de naissance est requise';
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getRoles(): string {
    if (!this.utilisateur?.roles || this.utilisateur.roles.length === 0) {
      return 'Aucun rôle';
    }
    return this.utilisateur.roles.join(', ');
  }

  goBack(): void {
    this.location.back();
  }
}

