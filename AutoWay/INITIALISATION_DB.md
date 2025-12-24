# Initialisation de la Base de Données - AutoWay

## Problème
La base de données est vide après les migrations. Il n'y a pas de données de seed automatiques.

## Solutions pour initialiser les données

### Option 1 : Créer un utilisateur ADMIN via l'API (Recommandé)

#### Étape 1 : Créer un utilisateur ADMIN

**Via Swagger** (`http://localhost:5140/swagger`) :
1. Ouvrir l'endpoint `POST /Utilisateurs`
2. Utiliser ce JSON :
```json
{
  "nom": "Admin",
  "prenom": "AutoWay",
  "email": "admin@autoway.com",
  "dateNaissance": "1990-01-01",
  "password": "admin123",
  "actif": true,
  "roles": ["ADMIN", "USER"]
}
```

**Via curl ou Postman** :
```bash
curl -X POST "http://localhost:5140/Utilisateurs" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Admin",
    "prenom": "AutoWay",
    "email": "admin@autoway.com",
    "dateNaissance": "1990-01-01",
    "password": "admin123",
    "actif": true,
    "roles": ["ADMIN", "USER"]
  }'
```

#### Étape 2 : Se connecter avec cet utilisateur

**Via Swagger** (`POST /login`) :
- Email: `admin@autoway.com`
- Password: `admin123`

**Via curl** :
```bash
curl -X POST "http://localhost:5140/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@autoway.com&password=admin123"
```

#### Étape 3 : Créer des voitures via l'interface admin

Une fois connecté en tant qu'ADMIN :
1. Aller sur le frontend Angular : `http://localhost:4200`
2. Se connecter avec `admin@autoway.com` / `admin123`
3. Aller dans **Admin > Voitures**
4. Cliquer sur **"+ Ajouter une voiture"**
5. Remplir le formulaire

**Ou via l'API** (avec le token JWT) :
```bash
curl -X POST "http://localhost:5140/Voitures" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "marque": "Renault",
    "modele": "Captur",
    "prixJournalier": 45.00,
    "plaqueImm": "AB-123-CD",
    "actif": true,
    "utilisateurID": 1
  }'
```

### Option 2 : Utiliser le script SQL (Avancé)

Le fichier `SeedData.sql` contient un script SQL, mais **ATTENTION** : les mots de passe hashés sont des exemples et ne fonctionneront pas.

Pour utiliser le script SQL :
1. Ouvrir SQL Server Management Studio
2. Se connecter à `(localdb)\mssqllocaldb`
3. Sélectionner la base `AutoWayDB`
4. Exécuter le script `SeedData.sql`

**Mais** : Les mots de passe ne fonctionneront pas car ils sont hashés avec BCrypt. Il faut créer les utilisateurs via l'API pour que les mots de passe soient correctement hashés.


## Recommandation

**Utilisez l'Option 1** : C'est la méthode la plus sûre et la plus simple :
1. Créer un utilisateur ADMIN via l'API (endpoint `POST /Utilisateurs`)
2. Se connecter avec cet utilisateur (endpoint `POST /login`)
3. Utiliser l'interface admin du frontend pour créer les voitures (`/admin/voitures`)

Cette méthode garantit que les mots de passe sont correctement hashés et que toutes les validations sont respectées.

## Données de test recommandées

### Utilisateurs
- **Admin** : `admin@autoway.com` / `admin123` (rôles: ADMIN, USER)
- **Staff** : `staff@autoway.com` / `staff123` (rôles: STAFF, USER)
- **User** : `user@example.com` / `user123` (rôle: USER)

### Voitures (exemples)
- Renault Captur - 45€/jour
- Peugeot 3008 - 70€/jour
- Tesla Model 3 - 120€/jour
- Audi A3 - 85€/jour
- BMW Série 3 - 95€/jour

