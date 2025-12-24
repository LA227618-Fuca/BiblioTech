import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../models/utilisateur.model';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  user: RegisterRequest = {
    nom: '',
    prenom: '',
    email: '',
    dateNaissance: '',
    password: '',
    actif: true,
    roles: ['USER']
  };
  error: string = '';

  ngOnInit(): void {
    // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    this.error = '';
    console.log('Tentative d\'inscription:', this.user);
    
    this.authService.register(this.user).subscribe({
      next: (createdUser) => {
        console.log('Utilisateur créé avec succès:', createdUser);
        // Après inscription, connecter l'utilisateur
        this.authService.login({ email: this.user.email, password: this.user.password }).subscribe({
          next: () => {
            console.log('Connexion réussie après inscription');
            this.router.navigate(['/']);
          },
          error: (loginErr) => {
            console.error('Erreur lors de la connexion après inscription:', loginErr);
            this.error = 'Inscription réussie mais connexion échouée. Veuillez vous connecter.';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        });
      },
      error: (err) => {
        console.error('Erreur complète d\'inscription:', err);
        console.error('Status:', err.status);
        console.error('Error body:', err.error);
        
        if (err.status === 400) {
          this.error = err.error?.message || 'Les données d\'inscription sont invalides';
        } else if (err.status === 409) {
          this.error = 'Un utilisateur avec cet email existe déjà';
        } else {
          this.error = err.error?.message || 'Erreur lors de l\'inscription. Vérifiez vos informations.';
        }
      }
    });
  }
}
