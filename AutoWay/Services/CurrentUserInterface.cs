using AutoWay.Data;
using System.Security.Claims;

namespace AutoWay.Services
{
    public interface ICurrentUserService
    {
        Task<int?> ResolveCurrentUserIdAsync(ClaimsPrincipal user);
    }
}
