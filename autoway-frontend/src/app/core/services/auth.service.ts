import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, Utilisateur } from '../../models/utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private tokenKey = 'autoway_token';
  private currentUserSubject = new BehaviorSubject<Utilisateur | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Vérifier si un token existe au démarrage
    const token = this.getToken();
    if (token) {
      this.loadUserFromToken(token);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, formData).pipe(
      tap(response => {
        this.setToken(response.token);
        this.loadUserFromToken(response.token);
      })
    );
  }

  register(user: RegisterRequest): Observable<Utilisateur> {
    // Convertir en PascalCase pour le backend .NET
    const userBackend = {
      Nom: user.nom,
      Prenom: user.prenom,
      Email: user.email,
      DateNaissance: user.dateNaissance ? new Date(user.dateNaissance).toISOString().split('T')[0] : '',
      Password: user.password,
      Actif: user.actif ?? true,
      Roles: user.roles || ['USER']
    };
    
    console.log('Envoi de l\'inscription au backend:', userBackend);
    
    return this.http.post<Utilisateur>(`${this.apiUrl}/Utilisateurs`, userBackend);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Méthode publique pour recharger l'utilisateur depuis le token
  reloadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      this.loadUserFromToken(token);
    }
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles?.includes(role) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isStaff(): boolean {
    return this.hasRole('STAFF');
  }

  isUser(): boolean {
    return this.hasRole('USER');
  }

  private loadUserFromToken(token: string): void {
    try {
      // Décoder le JWT pour extraire les infos utilisateur
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Décodage token - Payload complet:', payload);
      
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
      
      console.log('Utilisateur ID extrait:', userId);
      
      const user: Utilisateur = {
        utilisateurID: userId,
        email: payload['email'] ||
               payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
               payload['emailaddress'] ||
               payload['Email'] || '',
        nom: payload['unique_name'] ||
             payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
             payload['name'] || 
             payload['Name'] || '',
        prenom: payload.prenom || payload.Prenom || '',
        dateNaissance: payload.dateNaissance || payload.DateNaissance || '',
        actif: payload.actif ?? payload.Actif ?? true,
        roles: payload['role'] ? (Array.isArray(payload['role']) ? payload['role'] : [payload['role']]) :
               (Array.isArray(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) 
                 ? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                 : (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ? [payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']] : []))
      };
      
      console.log('Utilisateur chargé depuis token:', user);
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
    }
  }

  getCurrentUser(): Utilisateur | null {
    return this.currentUserSubject.value;
  }
}

