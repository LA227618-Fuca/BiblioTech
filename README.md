## Notes de maintenance
- Hotfix appliqué: 01/12/2025 à 10:10
- Motif: Correction configuration production

## Modification du backend auto way
Ajout d’une fonctionnalité de gestion du profil utilisateur connecté, permettant à un utilisateur authentifié de consulter et modifier ses propres informations personnelles, sans passer par un administrateur.

1. Nouveau DTO : UpdateMyProfileDto

DTO dédié à la mise à jour du profil personnel

2. Nouveau endpoint : GET /api/Utilisateurs/me

Permet à l’utilisateur connecté de récupérer son propre profil

3. Nouveau endpoint : PUT /api/Utilisateurs/me

Permet à l’utilisateur connecté de mettre à jour son profil
