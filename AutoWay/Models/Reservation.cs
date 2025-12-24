using AutoWay.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AutoWay.AutoWay.Models
{
    public class Reservation
    {
        public int ReservationID { get; set; }
        public DateOnly DateDebut { get; set; }
        public DateOnly DateFin { get; set; }
        public double PrixFinal { get; set; }

        [JsonIgnore]  // Empêche le cycle avec Utilisateur
        public Utilisateur? Utilisateur { get; set; }

        [JsonIgnore]  // Empêche le cycle avec Voiture
        public Voiture? Voiture { get; set; }

        public int UtilisateurID { get; set; }
        public int VoitureID { get; set; }

        // Relation one-to-one avec Avis
        public Avis? Avis { get; set; }
    }
}
