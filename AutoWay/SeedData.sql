-- Script de données de test pour AutoWay
-- Exécuter ce script dans SQL Server Management Studio ou via dotnet ef

USE AutoWayDB;
GO

-- Supprimer les données existantes (optionnel)
DELETE FROM Avis;
DELETE FROM Reservations;
DELETE FROM Voiture;
DELETE FROM Utilisateur;
GO

-- Réinitialiser les identités
DBCC CHECKIDENT ('Utilisateur', RESEED, 0);
DBCC CHECKIDENT ('Voiture', RESEED, 0);
DBCC CHECKIDENT ('Reservations', RESEED, 0);
DBCC CHECKIDENT ('Avis', RESEED, 0);
GO

-- 1. Créer des utilisateurs (mot de passe hashé avec BCrypt pour "password123")
-- Hash BCrypt pour "password123": $2a$11$KIXxKIXxKIXxKIXxKIXxKO (exemple - à remplacer par un vrai hash)

-- Utilisateur ADMIN
INSERT INTO Utilisateur (Nom, Prenom, Email, DateNaissance, Password, Actif, Roles)
VALUES 
('Admin', 'AutoWay', 'admin@autoway.com', '1990-01-01', '$2a$11$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 1, 'ADMIN,USER');

-- Utilisateur STAFF
INSERT INTO Utilisateur (Nom, Prenom, Email, DateNaissance, Password, Actif, Roles)
VALUES 
('Staff', 'Manager', 'staff@autoway.com', '1992-05-15', '$2a$11$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 1, 'STAFF,USER');

-- Utilisateur normal
INSERT INTO Utilisateur (Nom, Prenom, Email, DateNaissance, Password, Actif, Roles)
VALUES 
('Dupont', 'Jean', 'jean.dupont@example.com', '1995-03-20', '$2a$11$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 1, 'USER');

-- 2. Créer des voitures (UtilisateurID = 1 pour l'admin)
INSERT INTO Voiture (Marque, Modele, PrixJournalier, PlaqueImm, Actif, UtilisateurID)
VALUES 
('Renault', 'Captur', 45.00, 'AB-123-CD', 1, 1),
('Peugeot', '3008', 70.00, 'EF-456-GH', 1, 1),
('Tesla', 'Model 3', 120.00, 'IJ-789-KL', 1, 1),
('Audi', 'A3', 85.00, 'MN-012-OP', 1, 1),
('BMW', 'Série 3', 95.00, 'QR-345-ST', 1, 1),
('Mercedes', 'Classe A', 90.00, 'UV-678-WX', 1, 1),
('Volkswagen', 'Golf', 55.00, 'YZ-901-AB', 1, 1),
('Ford', 'Focus', 50.00, 'CD-234-EF', 1, 1);

GO

-- Note: Les mots de passe hashés ci-dessus sont des exemples
-- Pour créer un vrai hash BCrypt, utilisez l'endpoint POST /Utilisateurs avec le mot de passe en clair
-- Le backend hash automatiquement le mot de passe

