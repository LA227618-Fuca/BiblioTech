using System.Text.Json.Serialization;

namespace BibliothequeAPI.Models
{
    public class Categorie
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Navigation property - Ignorée dans les requêtes JSON
        [JsonIgnore]
        public ICollection<Livre> Livres { get; set; } = new List<Livre>();
    }
}

