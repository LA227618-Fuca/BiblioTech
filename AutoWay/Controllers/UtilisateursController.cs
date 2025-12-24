using AutoWay.Data;
using AutoWay.Models;
using AutoWay.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AutoWay.Controllers
{
    // DTO pour la mise à jour d'utilisateur (sans mot de passe)
    public class UpdateUtilisateurDto
    {
        public int UtilisateurID { get; set; }
        public string Nom { get; set; }
        public string Prenom { get; set; }
        public string Email { get; set; }
        public DateOnly DateNaissance { get; set; }
        public bool Actif { get; set; }
        public string[] Roles { get; set; }
    }

    // DTO pour la mise à jour de son propre profil (sans mot de passe, actif, roles)
    public class UpdateMyProfileDto
    {
        public string Nom { get; set; }
        public string Prenom { get; set; }
        public string Email { get; set; }
        public DateOnly DateNaissance { get; set; }
    }

    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class UtilisateursController : ControllerBase
    {
        private readonly AutoWayContext _context;
        private readonly AuthorizationService _authService;

        public UtilisateursController(AutoWayContext context, AuthorizationService authService)
        {
            _context = context;
            _authService = authService;
        }

        // GET: api/Utilisateurs
        [HttpGet]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<IEnumerable<Utilisateur>>> GetUtilisateur()
        {
            return await _context.Utilisateur.ToListAsync();
        }

        // GET: api/Utilisateurs/me - Récupérer les données de l'utilisateur connecté
        [HttpGet("me")]
        public async Task<ActionResult<Utilisateur>> GetMyProfile()
        {
            // Récupérer l'ID de l'utilisateur depuis le token JWT
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Utilisateur non identifié" });
            }

            var utilisateur = await _context.Utilisateur.FindAsync(userId);
            if (utilisateur == null)
            {
                return NotFound(new { message = "Utilisateur introuvable" });
            }

            return utilisateur;
        }

        // PUT: api/Utilisateurs/me - Mettre à jour les données de l'utilisateur connecté
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
        {
            // Récupérer l'ID de l'utilisateur depuis le token JWT
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Utilisateur non identifié" });
            }

            var existingUser = await _context.Utilisateur.FindAsync(userId);
            if (existingUser == null)
            {
                return NotFound(new { message = "Utilisateur introuvable" });
            }

            // Validation des champs requis
            if (string.IsNullOrWhiteSpace(dto.Nom))
            {
                return BadRequest(new { message = "Le nom est requis." });
            }

            if (string.IsNullOrWhiteSpace(dto.Prenom))
            {
                return BadRequest(new { message = "Le prénom est requis." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "L'email est requis." });
            }

            // Vérifier que l'email n'existe pas déjà (sauf pour l'utilisateur en cours de modification)
            var userWithSameEmail = _context.Utilisateur.FirstOrDefault(u => u.Email == dto.Email && u.UtilisateurID != userId);
            if (userWithSameEmail != null)
            {
                return BadRequest(new { message = "Un utilisateur avec cet email existe déjà." });
            }

            // Mettre à jour les propriétés (l'utilisateur ne peut pas modifier son propre statut actif ni ses rôles)
            existingUser.Nom = dto.Nom;
            existingUser.Prenom = dto.Prenom;
            existingUser.Email = dto.Email;
            existingUser.DateNaissance = dto.DateNaissance;

            // Le mot de passe n'est pas modifié via cet endpoint

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erreur lors de la modification du profil.", error = ex.Message });
            }
        }

        // GET: api/Utilisateurs/5
        [HttpGet("{id}")]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<Utilisateur>> GetUtilisateur(int id)
        {
            var utilisateur = await _context.Utilisateur.FindAsync(id);

            if (utilisateur == null)
            {
                return NotFound();
            }

            return utilisateur;
        }

        private bool UserExists(int id)
        {
            return _context.Utilisateur.Any(e => e.UtilisateurID == id);
        }

        // PUT: api/Utilisateurs/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<IActionResult> PutUtilisateur(int id, [FromBody] UpdateUtilisateurDto dto)
        {
            // Validation de l'ID
            if (id != dto.UtilisateurID)
            {
                return BadRequest(new { message = "L'ID dans l'URL ne correspond pas à l'ID de l'utilisateur." });
            }

            // Validation des champs requis
            if (string.IsNullOrWhiteSpace(dto.Nom))
            {
                return BadRequest(new { message = "Le nom est requis." });
            }

            if (string.IsNullOrWhiteSpace(dto.Prenom))
            {
                return BadRequest(new { message = "Le prénom est requis." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "L'email est requis." });
            }

            // Récupérer l'utilisateur existant
            var existingUser = await _context.Utilisateur.FindAsync(id);
            if (existingUser == null)
            {
                return NotFound(new { message = "Utilisateur introuvable." });
            }

            // Vérifier que l'email n'existe pas déjà (sauf pour l'utilisateur en cours de modification)
            var userWithSameEmail = _context.Utilisateur.FirstOrDefault(u => u.Email == dto.Email && u.UtilisateurID != id);
            if (userWithSameEmail != null)
            {
                return BadRequest(new { message = "Un utilisateur avec cet email existe déjà." });
            }

            // Mettre à jour les propriétés (sauf le mot de passe)
            existingUser.Nom = dto.Nom;
            existingUser.Prenom = dto.Prenom;
            existingUser.Email = dto.Email;
            existingUser.DateNaissance = dto.DateNaissance;
            existingUser.Actif = dto.Actif;
            existingUser.Roles = dto.Roles ?? new string[] { "USER" };

            // IMPORTANT : Le mot de passe n'est jamais modifié via cet endpoint
            // Le DTO UpdateUtilisateurDto ne contient pas de champ Password
            // Le mot de passe existant reste inchangé pour des raisons de sécurité

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
                {
                    return NotFound(new { message = "Utilisateur introuvable." });
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erreur lors de la modification de l'utilisateur.", error = ex.Message });
            }
        }

        // POST: api/Utilisateurs
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<Utilisateur>> PostUtilisateur(Utilisateur utilisateur)
        {
            try
            {
                /*
                if (utilisateur.Roles.Contains("ADMIN") && !User.IsInRole("ADMIN"))
                {
                    return Forbid();
                }
                */

                // Vérifier que l'email n'existe pas déjà
                var existingUser = _context.Utilisateur.FirstOrDefault(u => u.Email == utilisateur.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { message = "Un utilisateur avec cet email existe déjà" });
                }

                // Hash Password of new user before persist it 
                if (utilisateur.Password != null && !string.IsNullOrEmpty(utilisateur.Password))
                {
                    var salt = BCrypt.Net.BCrypt.GenerateSalt();
                    utilisateur.Password = BCrypt.Net.BCrypt.HashPassword(utilisateur.Password, salt);
                }
                else
                {
                    return BadRequest(new { message = "Le mot de passe est requis" });
                }

                // Initialiser les valeurs par défaut si non définies
                if (utilisateur.Roles == null || utilisateur.Roles.Length == 0)
                {
                    utilisateur.Roles = new string[] { "USER" };
                }
                
                if (utilisateur.Actif == false && utilisateur.Actif != true)
                {
                    utilisateur.Actif = true;
                }

                _context.Utilisateur.Add(utilisateur);
                await _context.SaveChangesAsync();

                // Vérifier que l'utilisateur a bien été créé
                var createdUser = await _context.Utilisateur.FindAsync(utilisateur.UtilisateurID);
                if (createdUser == null)
                {
                    return StatusCode(500, new { message = "Erreur lors de la création de l'utilisateur" });
                }

                return CreatedAtAction("GetUtilisateur", new { id = utilisateur.UtilisateurID }, utilisateur);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erreur lors de l'inscription", error = ex.Message });
            }
        }

        // DELETE: api/Utilisateurs/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeleteUtilisateur(int id)
        {
            var utilisateur = await _context.Utilisateur.FindAsync(id);
            if (utilisateur == null)
            {
                return NotFound();
            }

            _context.Utilisateur.Remove(utilisateur);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [AllowAnonymous]
        [HttpPost("/login")]
        public async Task<ActionResult> Login([FromForm] string email, [FromForm] string password)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    return BadRequest(new { message = "Email et mot de passe sont requis" });
                }

                var userExists = VerifierUserPassword(email, password);
                if (userExists == null)
                {
                    return BadRequest(new { message = "Email ou mot de passe incorrect" });
                }

                // S'assurer que l'utilisateur existe bien en base
                var userInDb = await _context.Utilisateur.FindAsync(userExists.UtilisateurID);
                if (userInDb == null)
                {
                    return BadRequest(new { message = "Utilisateur introuvable en base de données" });
                }

                var token = _authService.CreateToken(userExists);

                return Ok(new
                {
                    token,
                    expiration = DateTime.UtcNow.AddMinutes(30)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erreur lors de la connexion", error = ex.Message });
            }
        }

        private Utilisateur VerifierUserPassword(string email, string password)
        {
            try
            {
                var user = _context.Utilisateur.FirstOrDefault(u => u.Email == email);
                if (user != null && user.Actif && BCrypt.Net.BCrypt.Verify(password, user.Password))
                {
                    return user;
                }

                return null;
            }
            catch
            {
                return null;
            }
        }
    }
}
