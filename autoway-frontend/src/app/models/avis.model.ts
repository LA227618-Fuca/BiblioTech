export interface Avis {
  avisID: number;
  message?: string;
  score: number; // 1-5
  datePublication: string; // DateOnly en C# devient string en JSON
  dateModification?: string;
  reservationID: number;
}

export interface CreateAvisRequest {
  message?: string;
  score: number;
  reservationID: number;
}

