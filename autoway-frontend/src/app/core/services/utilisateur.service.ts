import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Utilisateur } from '../../models/utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/Utilisateurs`);
  }

  getUtilisateurById(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/Utilisateurs/${id}`);
  }

  updateUtilisateur(id: number, utilisateur: Utilisateur): Observable<void> {
    // Convertir en PascalCase pour le backend .NET
    const userBackend: any = {
      UtilisateurID: utilisateur.utilisateurID,
      Nom: utilisateur.nom,
      Prenom: utilisateur.prenom,
      Email: utilisateur.email,
      DateNaissance: utilisateur.dateNaissance,
      Actif: utilisateur.actif,
      Roles: utilisateur.roles || ['USER']
    };
    
    // Ajouter le mot de passe seulement s'il est fourni
    if (utilisateur.password && utilisateur.password.trim() !== '') {
      userBackend.Password = utilisateur.password;
    }
    
    return this.http.put<void>(`${this.apiUrl}/Utilisateurs/${id}`, userBackend);
  }

  deleteUtilisateur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Utilisateurs/${id}`);
  }

  // Récupérer son propre profil
  getMyProfile(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/Utilisateurs/me`);
  }

  // Mettre à jour son propre profil
  updateMyProfile(utilisateur: { nom: string; prenom: string; email: string; dateNaissance: string }): Observable<void> {
    // Convertir en PascalCase pour le backend .NET
    const profileBackend = {
      Nom: utilisateur.nom,
      Prenom: utilisateur.prenom,
      Email: utilisateur.email,
      DateNaissance: utilisateur.dateNaissance
    };
    return this.http.put<void>(`${this.apiUrl}/Utilisateurs/me`, profileBackend);
  }
}

