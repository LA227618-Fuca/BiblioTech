using AutoWay.Data;
using AutoWay.Models;
using AutoWay.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AutoWay.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AvisController : ControllerBase
    {
        private readonly AutoWayContext _context;
        private readonly ICurrentUserService _currentUserService;

        public AvisController(AutoWayContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        // GET: api/Avis
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Avis>>> GetAvis()
        {
            return await _context.Avis.ToListAsync();
        }

        // GET: api/Avis/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Avis>> GetAvis(int id)
        {
            var avis = await _context.Avis.FindAsync(id);

            if (avis == null)
            {
                return NotFound();
            }

            return avis;
        }

        // POST: api/Avis
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Avis>> PostAvis(Avis avis)
        {
            var userId = await _currentUserService.ResolveCurrentUserIdAsync(User);
            if (userId == null)
            {
                return Forbid();
            }

            if (avis.ReservationID == 0)
            {
                return BadRequest("ReservationID is required.");
            }

            var reservation = await _context.Reservations.FindAsync(avis.ReservationID);
            if (reservation == null) return NotFound("Reservation not found.");

            if (reservation.UtilisateurID != userId.Value)
                return Forbid("Vous ne possédez pas cette réservation.");

            // s'assurer qu'il n'existe pas déjà un avis pour cette réservation
            var dejaAvis = await _context.Avis.AnyAsync(a => a.ReservationID == avis.ReservationID);
            if (dejaAvis)
            {
                return Conflict("Cette réservation possède déjà un avis.");
            }

            // Valider le score entre 1 et 5
            if (avis.Score < 1 || avis.Score > 5)
            {
                return BadRequest("Le score doit être compris entre 1 et 5.");
            }

            // Forcer la date côté serveur (utiliser DateOnly car le modèle l'attend)
            avis.DatePublication = DateOnly.FromDateTime(DateTime.UtcNow);
            avis.DateModification = null;

            _context.Avis.Add(avis);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAvis), new { id = avis.AvisID }, avis);
        }

        // PUT: api/Avis/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutAvis(int id, Avis avis)
        {
            if (id != avis.AvisID) return BadRequest();

            var userId = await _currentUserService.ResolveCurrentUserIdAsync(User);
            if (userId == null)
            {
                return Forbid();
            }

            var existing = await _context.Avis.FindAsync(id);
            if (existing == null) return NotFound();

            // Vérifier l'appartenance via la reservation liée à l'avis
            var reservation = await _context.Reservations.FindAsync(existing.ReservationID);

            if (reservation == null) return NotFound("Reservation not found.");
            if (reservation.UtilisateurID != userId.Value) return Forbid();

            // Valider le score entre 1 et 5
            if (avis.Score < 1 || avis.Score > 5)
            {
                return BadRequest("Le score doit être compris entre 1 et 5.");
            }

            // Mettre à jour champs autorisés
            existing.Message = avis.Message;
            existing.Score = avis.Score;

            // Mettre à jour la date de modification (autorise la modification à tout moment)
            existing.DateModification = DateOnly.FromDateTime(DateTime.UtcNow);

            // Les entités chargées sont suivies ; les propriétés modifiées seront persistées
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AvisExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Avis/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteAvis(int id)
        {
            var userId = await _currentUserService.ResolveCurrentUserIdAsync(User);
            if (userId == null) return Forbid();

            var avis = await _context.Avis.FindAsync(id);
            if (avis == null) return NotFound();

            var reservation = await _context.Reservations.FindAsync(avis.ReservationID);
            if (reservation == null) return NotFound("Reservation not found.");

            if (reservation.UtilisateurID != userId.Value) return Forbid();

            _context.Avis.Remove(avis);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AvisExists(int id)
        {
            return _context.Avis.Any(e => e.AvisID == id);
        }
    }
}
