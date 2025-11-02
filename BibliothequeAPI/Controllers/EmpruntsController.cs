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
using System.Security.Claims;

namespace BibliothequeAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmpruntsController : ControllerBase
    {
        private readonly BibliothequeAPIContext _context;

        public EmpruntsController(BibliothequeAPIContext context)
        {
            _context = context;
        }

        // GET: api/Emprunts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Emprunt>>> GetEmprunts()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            var isAdmin = User.IsInRole("Admin");

            IQueryable<Emprunt> query = _context.Emprunts
                .Include(e => e.Livre)
                .ThenInclude(l => l!.Categorie)
                .Include(e => e.User);

            // Si l'utilisateur n'est pas admin, il ne voit que ses propres emprunts
            if (!isAdmin && userIdClaim != null && int.TryParse(userIdClaim, out int userId))
            {
                query = query.Where(e => e.UserId == userId);
            }

            return await query.ToListAsync();
        }

        // GET: api/Emprunts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Emprunt>> GetEmprunt(int id)
        {
            var emprunt = await _context.Emprunts
                .Include(e => e.Livre)
                .ThenInclude(l => l!.Categorie)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (emprunt == null)
            {
                return NotFound();
            }

            // Vérifier que l'utilisateur peut voir cet emprunt
            var userIdClaim = User.FindFirst("id")?.Value;
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && userIdClaim != null && int.TryParse(userIdClaim, out int userId))
            {
                if (emprunt.UserId != userId)
                {
                    return Forbid();
                }
            }

            return emprunt;
        }

        // GET: api/Emprunts/mes-emprunts
        [HttpGet("mes-emprunts")]
        public async Task<ActionResult<IEnumerable<Emprunt>>> GetMesEmprunts()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var emprunts = await _context.Emprunts
                .Include(e => e.Livre)
                .ThenInclude(l => l!.Categorie)
                .Where(e => e.UserId == userId && e.DateRetourEffective == null)
                .ToListAsync();

            return emprunts;
        }

        // GET: api/Emprunts/mon-historique
        [HttpGet("mon-historique")]
        public async Task<ActionResult<IEnumerable<Emprunt>>> GetMonHistorique()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var emprunts = await _context.Emprunts
                .Include(e => e.Livre)
                .ThenInclude(l => l!.Categorie)
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.DateEmprunt)
                .ToListAsync();

            return emprunts;
        }

        // POST: api/Emprunts
        [HttpPost]
        public async Task<ActionResult<Emprunt>> PostEmprunt([FromBody] EmpruntRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            // Vérifier que le livre existe
            var livre = await _context.Livres.FindAsync(request.LivreId);
            if (livre == null)
            {
                return NotFound("Livre introuvable.");
            }

            // Vérifier s'il reste des exemplaires disponibles
            var empruntsActifs = await _context.Emprunts
                .CountAsync(e => e.LivreId == request.LivreId && e.DateRetourEffective == null);

            if (empruntsActifs >= livre.NbExemplaires)
            {
                return BadRequest("Aucun exemplaire disponible pour ce livre.");
            }

            // Vérifier que l'utilisateur n'a pas déjà emprunté ce livre
            var dejaEmprunte = await _context.Emprunts
                .AnyAsync(e => e.UserId == userId && e.LivreId == request.LivreId && e.DateRetourEffective == null);

            if (dejaEmprunte)
            {
                return BadRequest("Vous avez déjà emprunté ce livre.");
            }

            var emprunt = new Emprunt
            {
                UserId = userId,
                LivreId = request.LivreId,
                DateEmprunt = DateTime.Now,
                DateRetourPrevue = DateTime.Now.AddDays(14), // 14 jours par défaut
                DateRetourEffective = null
            };

            _context.Emprunts.Add(emprunt);
            await _context.SaveChangesAsync();

            // Charger les relations pour le retour
            await _context.Entry(emprunt)
                .Reference(e => e.Livre)
                .LoadAsync();
            await _context.Entry(emprunt.Livre!)
                .Reference(l => l.Categorie)
                .LoadAsync();
            await _context.Entry(emprunt)
                .Reference(e => e.User)
                .LoadAsync();

            return CreatedAtAction("GetEmprunt", new { id = emprunt.Id }, emprunt);
        }

        // POST: api/Emprunts/retourner-livre/{livreId}
        [HttpPost("retourner-livre/{livreId}")]
        public async Task<IActionResult> RetournerLivre(int livreId)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            // Trouver l'emprunt en cours pour ce livre et cet utilisateur
            var emprunt = await _context.Emprunts
                .Where(e => e.LivreId == livreId && e.UserId == userId && e.DateRetourEffective == null)
                .OrderByDescending(e => e.DateEmprunt)
                .FirstOrDefaultAsync();

            if (emprunt == null)
            {
                return NotFound("Vous n'avez pas d'emprunt en cours pour ce livre.");
            }

            emprunt.DateRetourEffective = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Livre retourné avec succès", empruntId = emprunt.Id });
        }

        // DELETE: api/Emprunts/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteEmprunt(int id)
        {
            var emprunt = await _context.Emprunts.FindAsync(id);
            if (emprunt == null)
            {
                return NotFound();
            }

            _context.Emprunts.Remove(emprunt);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class EmpruntRequest
    {
        public int LivreId { get; set; }
    }
}

