using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoWay.Data;
using AutoWay.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;


namespace AutoWay.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class VoituresController : ControllerBase
    {
        private readonly AutoWayContext _context;

        public VoituresController(AutoWayContext context)
        {
            _context = context;
        }

        // GET: api/Voitures
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Voiture>>> GetVoiture()
        {
            return await _context.Voiture.ToListAsync();
        }

        // GET: api/Voitures/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Voiture>> GetVoiture(int id)
        {
            var voiture = await _context.Voiture.FindAsync(id);

            if (voiture == null)
            {
                return NotFound();
            }

            return voiture;
        }

        // PUT: api/Voitures/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<IActionResult> PutVoiture(int id, Voiture voiture)
        {
            if (id != voiture.VoitureID)
            {
                return BadRequest();
            }

            _context.Entry(voiture).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VoitureExists(id))
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

        [HttpPost]
        [Authorize(Roles = "ADMIN,STAFF")] // => Seuls ADMIN ou STAFF peuvent créer une voiture
        public async Task<ActionResult<Voiture>> PostVoiture(Voiture voiture)
        {
            var utilisateur = await _context.Utilisateur.FindAsync(voiture.UtilisateurID);
            if (utilisateur == null)
                return BadRequest("Utilisateur non trouvé");

            voiture.Utilisateur = utilisateur;

            _context.Voiture.Add(voiture);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetVoiture", new { id = voiture.VoitureID }, voiture);
        }


        // DELETE: api/Voitures/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeleteVoiture(int id)
        {
            var voiture = await _context.Voiture.FindAsync(id);
            if (voiture == null)
            {
                return NotFound();
            }

            _context.Voiture.Remove(voiture);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool VoitureExists(int id)
        {
            return _context.Voiture.Any(e => e.VoitureID == id);
        }
    }
}
