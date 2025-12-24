using AutoWay.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AutoWay.Services
{
    public class AuthorizationService
    {
        private readonly string _key;
        private readonly string _issuer;
        private readonly string _audience;

        public AuthorizationService(IConfiguration config)
        {
            _key = config["Jwt:Key"];
            _issuer = config["Jwt:Issuer"];
            _audience = config["Jwt:Audience"];
        }

        public string CreateToken(Utilisateur user)
        {
            var handler = new JwtSecurityTokenHandler();
            var keyBytes = Encoding.UTF8.GetBytes(_key);

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(keyBytes),
                SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = GenerateClaims(user),
                Expires = DateTime.UtcNow.AddMinutes(30),
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = credentials
            };

            var token = handler.CreateToken(tokenDescriptor);
            return handler.WriteToken(token);
        }

        private ClaimsIdentity GenerateClaims(Utilisateur user)
        {
            var claims = new ClaimsIdentity();

            claims.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.UtilisateurID.ToString()));
            claims.AddClaim(new Claim(ClaimTypes.Name, user.Nom));
            claims.AddClaim(new Claim(ClaimTypes.Email, user.Email));

            if (user.Roles != null && user.Roles.Any())
            {
                foreach (var role in user.Roles)
                {
                    if (!string.IsNullOrWhiteSpace(role))
                        claims.AddClaim(new Claim(ClaimTypes.Role, role));
                }
            }

            return claims;
        }


        public bool IsTokenValid(string token, string role = null)
        {
            token = token.Replace("Bearer", "").Trim();
            var handler = new JwtSecurityTokenHandler();

            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key))
            };

            try
            {
                var principal = handler.ValidateToken(token, parameters, out _);
                return role == null || principal.IsInRole(role);
            }
            catch
            {
                return false;
            }
        }
    }
}
