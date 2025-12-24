import { Avis } from './avis.model';

export interface Reservation {
  reservationID: number;
  dateDebut: string; // DateOnly en C# devient string en JSON (format: "YYYY-MM-DD")
  dateFin: string;
  prixFinal: number;
  utilisateurID: number;
  voitureID: number;
  avis?: Avis;
}

export interface CreateReservationRequest {
  dateDebut: string;
  dateFin: string;
  prixFinal: number;
  utilisateurID: number;
  voitureID: number;
}

