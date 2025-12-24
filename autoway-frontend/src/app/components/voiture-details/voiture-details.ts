import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../shared/navbar/navbar';
import { VoitureService } from '../../core/services/voiture.service';
import { AvisService } from '../../core/services/avis.service';
import { Voiture } from '../../models/voiture.model';
import { Avis } from '../../models/avis.model';

@Component({
  selector: 'app-voiture-details',
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './voiture-details.html',
  styleUrl: './voiture-details.scss',
})
export class VoitureDetails {
  route = inject(ActivatedRoute);
  router = inject(Router);
  voitureService = inject(VoitureService);
  avisService = inject(AvisService);
  private cdr = inject(ChangeDetectorRef);
  voiture: Voiture | null = null;
  avis: Avis[] = [];
  isLoading: boolean = true;
  error: string = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVoiture(parseInt(id));
      this.loadAvis();
    } else {
      this.isLoading = false;
      this.error = 'ID de voiture invalide';
      this.cdr.detectChanges();
    }
  }

  loadVoiture(id: number): void {
    this.isLoading = true;
    this.error = '';
    this.voitureService.getVoitureById(id).subscribe({
      next: (voiture) => {
        this.voiture = voiture;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la voiture:', err);
        this.error = 'Erreur lors du chargement de la voiture. Veuillez réessayer.';
        this.isLoading = false;
        this.cdr.detectChanges();
        // Rediriger vers le catalogue après 3 secondes
        setTimeout(() => {
          this.router.navigate(['/catalogue']);
        }, 3000);
      }
    });
  }

  loadAvis(): void {
    this.avisService.getAllAvis().subscribe({
      next: (avis) => {
        this.avis = avis;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des avis:', err);
      }
    });
  }

  getImageUrl(voiture: Voiture): string {
    // Essayer d'abord d'utiliser une image statique basée sur l'ID
    // Formats supportés : jpg, jpeg, png
    return `assets/images/voitures/voiture_${voiture.voitureID}.jpg`;
  }

  getPlaceholderUrl(voiture: Voiture): string {
    // Retourner une URL placeholder en cas d'erreur de chargement
    const marque = encodeURIComponent(voiture.marque);
    const modele = encodeURIComponent(voiture.modele);
    return `https://via.placeholder.com/900x500/333333/FFFFFF?text=${marque}+${modele}`;
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

  getStars(score: number): string {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  }

  getAvisForVoiture(): Avis[] {
    // Filtrer les avis liés à cette voiture via les réservations
    // Pour l'instant, on retourne tous les avis
    return this.avis.slice(0, 3);
  }
}
