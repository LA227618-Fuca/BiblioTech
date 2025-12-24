export interface Voiture {
  voitureID: number;
  marque: string;
  modele: string;
  prixJournalier: number;
  plaqueImm: string;
  actif?: boolean;
  utilisateurID: number;
}

