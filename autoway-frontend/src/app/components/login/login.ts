import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../models/utilisateur.model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  credentials: LoginRequest = { email: '', password: '' };
  error: string = '';

  ngOnInit(): void {
    // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    this.error = '';
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = 'Email ou mot de passe incorrect';
        console.error('Erreur de connexion:', err);
      }
    });
  }
}
