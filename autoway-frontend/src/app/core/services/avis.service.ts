import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Avis, CreateAvisRequest } from '../../models/avis.model';

@Injectable({
  providedIn: 'root'
})
export class AvisService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllAvis(): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.apiUrl}/Avis`);
  }

  getAvisById(id: number): Observable<Avis> {
    return this.http.get<Avis>(`${this.apiUrl}/Avis/${id}`);
  }

  createAvis(avis: CreateAvisRequest): Observable<Avis> {
    return this.http.post<Avis>(`${this.apiUrl}/Avis`, avis);
  }

  updateAvis(id: number, avis: Avis): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Avis/${id}`, avis);
  }

  deleteAvis(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Avis/${id}`);
  }
}

