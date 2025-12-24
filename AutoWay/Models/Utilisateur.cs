using AutoWay.AutoWay.Models;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AutoWay.Models
{
    public class Utilisateur
    {
        public int UtilisateurID { get; set; }
        public string Nom { get; set; }
        public string Prenom { get; set; }
        public string Email { get; set; }

        public DateOnly DateNaissance { get; set; }
        public string Password { get; set; }
        public bool Actif { get; set; }

        [JsonIgnore] // ignore la navigation pour éviter les cycles
        public List<Voiture>? Voitures { get; set; }

        [JsonIgnore] // idem pour les réservations
        public List<Reservation>? Reservations { get; set; }
        public string[] Roles { get; set; }

    }
}
