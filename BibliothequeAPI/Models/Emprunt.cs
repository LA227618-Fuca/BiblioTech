using System.Text.Json.Serialization;

namespace BibliothequeAPI.Models
{
    public class Emprunt
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int LivreId { get; set; }
        public DateTime DateEmprunt { get; set; }
        public DateTime DateRetourPrevue { get; set; }
        public DateTime? DateRetourEffective { get; set; }

        // Navigation properties - Ignorées dans les requêtes JSON
        [JsonIgnore]
        public User? User { get; set; }
        [JsonIgnore]
        public Livre? Livre { get; set; }
    }
}

