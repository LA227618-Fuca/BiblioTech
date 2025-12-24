using AutoWay.AutoWay.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AutoWay.Models
{
    public class Voiture
    {
        public int VoitureID { get; set; }
        public string Marque { get; set; }
        public string Modele { get; set; }
        public double PrixJournalier { get; set; }
        public string PlaqueImm { get; set; }
        public bool? Actif { get; set; }
        
        public int UtilisateurID { get; set; }  // clé étrangère
        [JsonIgnore]
        public Utilisateur? Utilisateur { get; set; }  // nullable

        // Une voiture peut avoir plusieurs réservations

        public List<Reservation>? Reservations { get; set; } = new();
    }
}
