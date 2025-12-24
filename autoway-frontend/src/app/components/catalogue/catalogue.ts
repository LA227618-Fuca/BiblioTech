import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../shared/navbar/navbar';
import { VoitureService } from '../../core/services/voiture.service';
import { Voiture } from '../../models/voiture.model';

@Component({
  selector: 'app-catalogue',
  imports: [CommonModule, RouterModule, FormsModule, Navbar],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
})
export class Catalogue {
  voitureService = inject(VoitureService);
  private cdr = inject(ChangeDetectorRef);
  voitures: Voiture[] = [];
  voituresFiltrees: Voiture[] = [];
  recherche: string = '';
  prixMax: number = 300;
  prixMaxSlider: number = 300; // Valeur max du slider

  ngOnInit(): void {
    this.loadVoitures();
  }

  loadVoitures(): void {
    this.voitureService.getAllVoitures().subscribe({
      next: (voitures) => {
        this.voitures = voitures.filter(v => v.actif !== false);
        // Calculer le prix maximum réel des voitures pour afficher toutes les voitures par défaut
        if (this.voitures.length > 0) {
          const prixValides = this.voitures.map(v => v.prixJournalier).filter(p => p != null && !isNaN(p) && p > 0);
          if (prixValides.length > 0) {
            const maxPrix = Math.max(...prixValides);
            // Mettre à jour prixMax et prixMaxSlider, en arrondissant au supérieur
            this.prixMaxSlider = Math.max(300, Math.ceil(maxPrix));
            this.prixMax = this.prixMaxSlider; // Afficher toutes les voitures par défaut
          }
        }
        // Toujours appliquer le filtre pour s'assurer que les voitures sont affichées
        this.filtrer();
        // Forcer la détection de changement pour s'assurer que la vue se met à jour
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des voitures:', err);
        this.voituresFiltrees = [];
        this.cdr.detectChanges();
      }
    });
  }

  filtrer(): void {
    if (this.voitures.length === 0) {
      this.voituresFiltrees = [];
      return;
    }

    // Créer un nouveau tableau pour forcer la détection de changement Angular
    const filtered = this.voitures.filter(v => {
      const matchRecherche = !this.recherche ||
        v.marque.toLowerCase().includes(this.recherche.toLowerCase()) ||
        v.modele.toLowerCase().includes(this.recherche.toLowerCase());
      const matchPrix = v.prixJournalier <= this.prixMax;
      return matchRecherche && matchPrix;
    });

    this.voituresFiltrees = [...filtered];
  }

  getImageUrl(voiture: Voiture): string {
    // Formats supportés : jpg, jpeg, png
    // Le navigateur essaiera automatiquement de charger l'image
    return `assets/images/voitures/voiture_${voiture.voitureID}.jpg`;
  }

  getImageUrlWithFallback(voiture: Voiture): string {
    // Essayer plusieurs formats dans l'ordre : jpg, jpeg, png
    // Cette méthode peut être utilisée si on veut forcer un format spécifique
    // Pour l'instant, on retourne jpg et le gestionnaire d'erreur gère le fallback
    const formats = ['jpg', 'jpeg', 'png'];
    return `assets/images/voitures/voiture_${voiture.voitureID}.${formats[0]}`;
  }

  getPlaceholderUrl(voiture: Voiture): string {
    // Retourner une URL placeholder en cas d'erreur de chargement
    const marque = encodeURIComponent(voiture.marque);
    const modele = encodeURIComponent(voiture.modele);
    return `https://via.placeholder.com/600x340/333333/FFFFFF?text=${marque}+${modele}`;
  }

  onImageError(event: any, voiture: Voiture): void {
    const img = event.target as HTMLImageElement;
    const currentSrc = img.src;
    const formats = ['jpg', 'jpeg', 'png'];

    // Vérifier si on a déjà essayé tous les formats
    const triedFormat = currentSrc.split('.').pop()?.toLowerCase();
    const currentFormatIndex = formats.indexOf(triedFormat || '');

    if (currentFormatIndex < formats.length - 1) {
      // Essayer le format suivant
      const nextFormat = formats[currentFormatIndex + 1];
      img.src = `assets/images/voitures/voiture_${voiture.voitureID}.${nextFormat}`;
    } else {
      // Tous les formats ont été essayés, utiliser le placeholder
      img.src = this.getPlaceholderUrl(voiture);
    }
  }
}
