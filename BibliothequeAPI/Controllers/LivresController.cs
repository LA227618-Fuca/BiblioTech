using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BibliothequeAPI.Data;
using BibliothequeAPI.Models;
using Microsoft.AspNetCore.Authorization;

namespace BibliothequeAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LivresController : ControllerBase
    {
        private readonly BibliothequeAPIContext _context;

        public LivresController(BibliothequeAPIContext context)
        {
            _context = context;
        }

        // GET: api/Livres
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Livre>>> GetLivres([FromQuery] string? titre, [FromQuery] string? auteur, [FromQuery] int? categorieId)
        {
            var query = _context.Livres.Include(l => l.Categorie).AsQueryable();

            // Recherche par titre
            if (!string.IsNullOrEmpty(titre))
            {
                query = query.Where(l => l.Titre.Contains(titre));
            }

            // Recherche par auteur
            if (!string.IsNullOrEmpty(auteur))
            {
                query = query.Where(l => l.Auteur.Contains(auteur));
            }

            // Recherche par catégorie
            if (categorieId.HasValue)
            {
                query = query.Where(l => l.CategorieId == categorieId.Value);
            }

            return await query.ToListAsync();
        }

        // GET: api/Livres/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Livre>> GetLivre(int id)
        {
            var livre = await _context.Livres.Include(l => l.Categorie).FirstOrDefaultAsync(l => l.Id == id);

            if (livre == null)
            {
                return NotFound();
            }

            return livre;
        }

        // GET: api/Livres/disponibles
        [HttpGet("disponibles")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Livre>>> GetLivresDisponibles()
        {
            // Compter les emprunts actifs par livre
            var empruntsParLivre = await _context.Emprunts
                .Where(e => e.DateRetourEffective == null)
                .GroupBy(e => e.LivreId)
                .Select(g => new { LivreId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.LivreId, x => x.Count);

            var tousLivres = await _context.Livres
                .Include(l => l.Categorie)
                .ToListAsync();

            // Filtrer les livres qui ont des exemplaires disponibles
            var livresDisponibles = tousLivres
                .Where(l => 
                {
                    var empruntsActifs = empruntsParLivre.ContainsKey(l.Id) ? empruntsParLivre[l.Id] : 0;
                    return l.NbExemplaires > empruntsActifs;
                })
                .ToList();

            return livresDisponibles;
        }

        // GET: api/Livres/empruntes
        [HttpGet("empruntes")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Livre>>> GetLivresEmpruntes()
        {
            var livreIdsEmpruntes = await _context.Emprunts
                .Where(e => e.DateRetourEffective == null)
                .Select(e => e.LivreId)
                .Distinct()
                .ToListAsync();

            var livres = await _context.Livres
                .Include(l => l.Categorie)
                .Where(l => livreIdsEmpruntes.Contains(l.Id))
                .ToListAsync();

            return livres;
        }

        // GET: api/Livres/retard
        [HttpGet("retard")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetLivresEnRetard()
        {
            var empruntsEnRetard = await _context.Emprunts
                .Include(e => e.Livre)
                .ThenInclude(l => l!.Categorie)
                .Include(e => e.User)
                .Where(e => e.DateRetourEffective == null && e.DateRetourPrevue < DateTime.Now)
                .Select(e => new
                {
                    EmpruntId = e.Id,
                    Livre = e.Livre,
                    User = new { Id = e.User!.Id, Username = e.User.Username, Name = e.User.Name },
                    DateEmprunt = e.DateEmprunt,
                    DateRetourPrevue = e.DateRetourPrevue,
                    JoursRetard = (DateTime.Now - e.DateRetourPrevue).Days
                })
                .ToListAsync();

            return Ok(empruntsEnRetard);
        }

        // PUT: api/Livres/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutLivre(int id, Livre livre)
        {
            if (id != livre.Id)
            {
                return BadRequest();
            }

            // Vérifier que la catégorie existe
            if (!await _context.Categories.AnyAsync(c => c.Id == livre.CategorieId))
            {
                return BadRequest("La catégorie spécifiée n'existe pas.");
            }

            _context.Entry(livre).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LivreExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Livres
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Livre>> PostLivre(Livre livre)
        {
            // Vérifier que la catégorie existe
            if (!await _context.Categories.AnyAsync(c => c.Id == livre.CategorieId))
            {
                return BadRequest("La catégorie spécifiée n'existe pas.");
            }

            _context.Livres.Add(livre);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetLivre", new { id = livre.Id }, livre);
        }

        // DELETE: api/Livres/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteLivre(int id)
        {
            var livre = await _context.Livres.FindAsync(id);
            if (livre == null)
            {
                return NotFound();
            }

            // Vérifier s'il y a des emprunts actifs
            var empruntsActifs = await _context.Emprunts.AnyAsync(e => e.LivreId == id && e.DateRetourEffective == null);
            if (empruntsActifs)
            {
                return BadRequest("Impossible de supprimer un livre qui a des emprunts actifs.");
            }

            _context.Livres.Remove(livre);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LivreExists(int id)
        {
            return _context.Livres.Any(e => e.Id == id);
        }
    }
}

