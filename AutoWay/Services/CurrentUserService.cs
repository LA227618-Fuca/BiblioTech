using System.Security.Claims;
using AutoWay.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoWay.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly AutoWayContext _context;

        public CurrentUserService(AutoWayContext context)
        {
            _context = context;
        }

        public async Task<int?> ResolveCurrentUserIdAsync(ClaimsPrincipal user)
        {
            // 1) Essayer de récupérer le claim "id" (celui que tu ajoutes dans AuthorizationService)
            var idClaim = user.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(idClaim) && int.TryParse(idClaim, out var id))
            {
                return id;
            }

            // 2) Sinon, essayer de récupérer l'email
            var emailClaim = user.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(emailClaim))
            {
                var utilisateur = await _context.Utilisateur
                    .FirstOrDefaultAsync(u => u.Email == emailClaim);

                if (utilisateur != null)
                    return utilisateur.UtilisateurID;
            }

            // 3) Rien trouvé
            return null;
        }
    }
}
