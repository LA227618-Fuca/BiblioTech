import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../shared/navbar/navbar';
import { AvisService } from '../../core/services/avis.service';
import { Avis } from '../../models/avis.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  avisService = inject(AvisService);
  avisRecents: Avis[] = [];

  ngOnInit(): void {
    this.avisService.getAllAvis().subscribe({
      next: (avis) => {
        // Prendre les 3 derniers avis
        this.avisRecents = avis.slice(-3).reverse();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des avis:', err);
      }
    });
  }

  getStars(score: number): string {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  }
}
