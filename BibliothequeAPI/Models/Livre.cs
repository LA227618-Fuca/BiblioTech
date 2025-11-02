using System.Text.Json.Serialization;

namespace BibliothequeAPI.Models
{
    public class Livre
    {
        public int Id { get; set; }
        public string Titre { get; set; } = string.Empty;
        public string Auteur { get; set; } = string.Empty;
        public int Annee { get; set; }
        public int NbExemplaires { get; set; }
        public int CategorieId { get; set; }

        // Navigation properties - Ignorées dans les requêtes JSON
        [JsonIgnore]
        public Categorie? Categorie { get; set; }
        [JsonIgnore]
        public ICollection<Emprunt> Emprunts { get; set; } = new List<Emprunt>();
    }
}

