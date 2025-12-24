export interface Utilisateur {
  utilisateurID: number;
  nom: string;
  prenom: string;
  email: string;
  dateNaissance: string; // DateOnly en C# devient string en JSON
  password?: string; // Ne pas envoyer depuis le frontend
  actif: boolean;
  roles: string[];
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  dateNaissance: string;
  password: string;
  actif?: boolean;
  roles?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
}

