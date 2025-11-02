using System.Text.Json.Serialization;

namespace BibliothequeAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string[] Roles { get; set; } = Array.Empty<string>();

        // Navigation property - Ignorée dans les requêtes JSON
        [JsonIgnore]
        public ICollection<Emprunt> Emprunts { get; set; } = new List<Emprunt>();
    }
}

