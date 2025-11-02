using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BibliothequeAPI.Data;
using BibliothequeAPI.Models;
using BibliothequeAPI.Services;
using BCrypt.Net;

namespace BibliothequeAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly BibliothequeAPIContext _context;
        private readonly AuthorizationService _authorizationService;

        public UsersController(BibliothequeAPIContext context, AuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        // POST: api/Users/register
        [HttpPost("register")]
        public async Task<ActionResult<User>> Register([FromBody] User user)
        {
            // Vérifier si l'utilisateur existe déjà
            if (await _context.Users.AnyAsync(u => u.Username == user.Username || u.Email == user.Email))
            {
                return BadRequest("Un utilisateur avec ce nom d'utilisateur ou cet email existe déjà.");
            }

            // Hash Password of new user before persist it 
            if (user.Password != null)
            {
                var salt = BCrypt.Net.BCrypt.GenerateSalt();
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password, salt);
            }

            // Par défaut, l'utilisateur n'a pas de rôle admin (rôle "User")
            if (user.Roles == null || user.Roles.Length == 0)
            {
                user.Roles = new string[] { "User" };
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Ne pas retourner le mot de passe
            user.Password = string.Empty;
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        // POST: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult<TokenResponse>> Login([FromBody] LoginRequest loginRequest)
        {
            var userExists = await UserExists(loginRequest.Username, loginRequest.Password);
            if (userExists == null)
            {
                return BadRequest("Nom d'utilisateur ou mot de passe incorrect.");
            }
            else
            {
                // Generate Token and return it 
                var token = _authorizationService.CreateToken(userExists);
                return Ok(new TokenResponse { Token = token });
            }
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users = await _context.Users.ToListAsync();
            // Ne pas retourner les mots de passe
            users.ForEach(u => u.Password = string.Empty);
            return users;
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Ne pas retourner le mot de passe
            user.Password = string.Empty;
            return user;
        }

        private async Task<User?> UserExists(string username, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user != null && BCrypt.Net.BCrypt.Verify(password, user.Password))
            {
                return user;
            }
            return null;
        }
    }
}

