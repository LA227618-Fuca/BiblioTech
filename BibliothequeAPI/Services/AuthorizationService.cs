using BibliothequeAPI.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BibliothequeAPI.Services
{
    public class AuthorizationService
    {
        // À ne surtout pas faire en production ! (Utilisation de variable d'environnement, fichier local non versionné, Vault...)
        private string privateKey = "b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\r\nQyNTUxOQAAACBAAHuj4EY5BCrJoIbne/CYhXWH4YWKYa/qszDMqa/v/QAAAJhsq4IObKuC\r\nDgAAAAtzc2gtZWQyNTUxOQAAACBAAHuj4EY5BCrJoIbne/CYhXWH4YWKYa/qszDMqa/v/Q\r\nAAAEBspyNsIv6CezOEUbcDXN3W6Wp6OcukwhnFfoTXNyXHA0AAe6PgRjkEKsmghud78JiF\r\ndYfhhYphr+qzMMypr+/9AAAADmJickBiYnItdWJ1bnR1AQIDBAUGBw==";

        public string CreateToken(User user)
        {
            var handler = new JwtSecurityTokenHandler();

            var privateKeyUTF8 = Encoding.UTF8.GetBytes(privateKey);

            var credentials = new SigningCredentials(new SymmetricSecurityKey(privateKeyUTF8),
                                                      SecurityAlgorithms.HmacSha256);

            var tokenDescription = new SecurityTokenDescriptor
            {
                SigningCredentials = credentials,
                Expires = DateTime.UtcNow.AddMinutes(60),
                Subject = GenerateClaims(user)
            };

            var token = handler.CreateToken(tokenDescription);

            return handler.WriteToken(token);
        }

        private ClaimsIdentity GenerateClaims(User user)
        {
            var Claims = new ClaimsIdentity();

            Claims.AddClaim(new Claim(ClaimTypes.Name, user.Name));
            Claims.AddClaim(new Claim(ClaimTypes.Email, user.Email));
            Claims.AddClaim(new Claim("username", user.Username));
            Claims.AddClaim(new Claim("id", user.Id.ToString()));

            foreach (var role in user.Roles)
            {
                Claims.AddClaim(new Claim(ClaimTypes.Role, role));
            }

            return Claims;
        }

        public bool IsTokenValid(string token, string role)
        {
            token = token.Replace("Bearer", "").Trim();
            var handler = new JwtSecurityTokenHandler();
            var param = new TokenValidationParameters();
            param.ValidateIssuer = false;
            param.ValidateAudience = false;
            param.ValidateLifetime = true;
            param.IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(privateKey));

            SecurityToken securityToken;
            try
            {
                var claims = handler.ValidateToken(token, param, out securityToken);

                if (role != null)
                {
                    return claims.IsInRole(role);
                }
                else
                {
                    return true;
                }
            }
            catch (Exception e)
            {
                return false;
            }
        }
    }
}

