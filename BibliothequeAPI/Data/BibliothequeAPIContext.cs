using Microsoft.EntityFrameworkCore;
using BibliothequeAPI.Models;

namespace BibliothequeAPI.Data
{
    public class BibliothequeAPIContext : DbContext
    {
        public BibliothequeAPIContext(DbContextOptions<BibliothequeAPIContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = default!;
        public DbSet<Livre> Livres { get; set; } = default!;
        public DbSet<Categorie> Categories { get; set; } = default!;
        public DbSet<Emprunt> Emprunts { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuration de la relation Categorie -> Livres (1 à plusieurs)
            modelBuilder.Entity<Livre>()
                .HasOne(l => l.Categorie)
                .WithMany(c => c.Livres)
                .HasForeignKey(l => l.CategorieId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuration de la relation User -> Emprunts (1 à plusieurs)
            modelBuilder.Entity<Emprunt>()
                .HasOne(e => e.User)
                .WithMany(u => u.Emprunts)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuration de la relation Livre -> Emprunts (1 à plusieurs)
            modelBuilder.Entity<Emprunt>()
                .HasOne(e => e.Livre)
                .WithMany(l => l.Emprunts)
                .HasForeignKey(e => e.LivreId)
                .OnDelete(DeleteBehavior.Restrict);

            // Index pour améliorer les performances de recherche
            modelBuilder.Entity<Livre>()
                .HasIndex(l => l.Titre);
            modelBuilder.Entity<Livre>()
                .HasIndex(l => l.Auteur);
            modelBuilder.Entity<Livre>()
                .HasIndex(l => l.CategorieId);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}

