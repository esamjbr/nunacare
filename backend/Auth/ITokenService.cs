using NunaCare.Api.Entities;

namespace NunaCare.Api.Auth;

public interface ITokenService
{
    string CreateAccessToken(User user);
    string CreateRefreshToken();
    string HashRefreshToken(string refreshToken);
    DateTimeOffset GetRefreshTokenExpiry();
}
