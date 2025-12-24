import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Voiture } from '../../models/voiture.model';

@Injectable({
  providedIn: 'root'
})
export class VoitureService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllVoitures(): Observable<Voiture[]> {
    return this.http.get<Voiture[]>(`${this.apiUrl}/Voitures`);
  }

  getVoitureById(id: number): Observable<Voiture> {
    return this.http.get<Voiture>(`${this.apiUrl}/Voitures/${id}`);
  }

  createVoiture(voiture: Voiture): Observable<Voiture> {
    return this.http.post<Voiture>(`${this.apiUrl}/Voitures`, voiture);
  }

  updateVoiture(id: number, voiture: Voiture): Observable<void> {
    // Convertir en PascalCase pour le backend .NET
    const voitureBackend = {
      VoitureID: voiture.voitureID,
      Marque: voiture.marque,
      Modele: voiture.modele,
      PrixJournalier: voiture.prixJournalier,
      PlaqueImm: voiture.plaqueImm,
      Actif: voiture.actif,
      UtilisateurID: voiture.utilisateurID
    };
    
    return this.http.put<void>(`${this.apiUrl}/Voitures/${id}`, voitureBackend);
  }

  deleteVoiture(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Voitures/${id}`);
  }
}

