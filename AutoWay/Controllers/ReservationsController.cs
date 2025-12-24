using AutoWay.AutoWay.Models;
using AutoWay.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AutoWay.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class ReservationsController : ControllerBase
    {
        private readonly AutoWayContext _context;

        public ReservationsController(AutoWayContext context)
        {
            _context = context;
        }

        // GET: Reservations
        [HttpGet]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetReservations()
        {
            var reservations = await _context.Reservations
                .Include(r => r.Utilisateur)
                .Include(r => r.Avis)
                .ToListAsync();
            return Ok(reservations);
        }

        // GET: Reservations/mes-reservations
        [HttpGet("mes-reservations")]
        [Authorize(Roles = "USER,ADMIN,STAFF")]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetMesReservations()
        {
            // Récupérer l'ID de l'utilisateur connecté depuis le token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Utilisateur non identifié." });
            }

            var reservations = await _context.Reservations
                .Include(r => r.Voiture)
                .Include(r => r.Avis)
                .Where(r => r.UtilisateurID == userId)
                .ToListAsync();

            return Ok(reservations);
        }

        // GET: Reservations/5
        [HttpGet("{id}")]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<Reservation>> GetReservation(int id)
        {
            var reservation = await _context.Reservations
                .Include(r => r.Utilisateur)
                .FirstOrDefaultAsync(r => r.ReservationID == id);

            if (reservation == null)
                return NotFound(new { message = "Réservation introuvable." });

            return Ok(reservation);
        }


        // POST: Reservations
        [HttpPost]
        [Authorize(Roles = "ADMIN,STAFF,USER")]
        public async Task<ActionResult<Reservation>> CreateReservation([FromBody] Reservation reservation)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Pour les utilisateurs USER, s'assurer qu'ils ne peuvent créer que pour eux-mêmes
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (User.IsInRole("USER") && userIdClaim != null)
            {
                var currentUserId = int.Parse(userIdClaim.Value);
                reservation.UtilisateurID = currentUserId;
            }

            var voiture = await _context.Voiture.FindAsync(reservation.VoitureID);
            if (voiture == null)
                return BadRequest("Voiture inexistante.");

            reservation.Voiture = voiture;

            // Vérifier la disponibilité de la voiture
            var voitureDispo = !_context.Reservations.Any(r => r.VoitureID == reservation.VoitureID &&
             ((reservation.DateDebut >= r.DateDebut && reservation.DateDebut <= r.DateFin) ||
              (reservation.DateFin >= r.DateDebut && reservation.DateFin <= r.DateFin)));

            if (!voitureDispo)
                return BadRequest("La voiture n'est pas disponible sur cette période.");

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            // Retourne un code 201 (Created) avec l'URL de la nouvelle ressource
            return CreatedAtAction(nameof(GetReservation), new { id = reservation.ReservationID }, reservation);
        }

        // PUT: Reservations/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReservation(int id, [FromBody] Reservation reservation)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (User.IsInRole("USER") && userIdClaim != null && 
                reservation.UtilisateurID != int.Parse(userIdClaim.Value))
                return Forbid();
            
            if (id != reservation.ReservationID)
                return BadRequest(new { message = "L'ID ne correspond pas." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _context.Entry(reservation).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReservationExists(id))
                    return NotFound(new { message = "Réservation introuvable." });
                else
                    throw;
            }

            return NoContent(); // 204
        }

        // DELETE: Reservations/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,STAFF,USER")]
        public async Task<IActionResult> DeleteReservation(int id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null)
                return NotFound(new { message = "Réservation introuvable." });

            // Pour les utilisateurs USER, s'assurer qu'ils ne peuvent supprimer que leurs propres réservations
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (User.IsInRole("USER") && userIdClaim != null)
            {
                var currentUserId = int.Parse(userIdClaim.Value);
                if (reservation.UtilisateurID != currentUserId)
                {
                    return Forbid();
                }
            }

            _context.Reservations.Remove(reservation);
            await _context.SaveChangesAsync();

            return NoContent(); // 204
        }

        private bool ReservationExists(int id)
        {
            return _context.Reservations.Any(e => e.ReservationID == id);
        }
    }
}
