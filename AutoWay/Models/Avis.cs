using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using AutoWay.AutoWay.Models;

namespace AutoWay.Models
{
    public class Avis
    {
        public int AvisID { get; set; }                  // Identifiant principal
        public string? Message { get; set; }         // Message optionnel de l'avis
        public int Score { get; set; }               // Score entre 1 et 5
        public DateOnly DatePublication { get; set; } // Date de publication
        public DateOnly? DateModification { get; set; } // Date de modification

        // Clé étrangère explicite
        public int ReservationID { get; set; }
        [JsonIgnore]
        public Reservation? Reservation { get; set; } // Avis lié à une réservation
    }
}
