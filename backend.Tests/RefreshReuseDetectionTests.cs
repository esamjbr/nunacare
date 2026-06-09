using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Auth;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;

namespace NunaCare.Api.Tests;

// SEC-005: replaying a revoked refresh token must trigger mass-revocation of all
// active sessions for the owning user (theft response), not just a plain 401.
public sealed class RefreshReuseDetectionTests
{
    private const string RawToken = "original-token-abc";

    private static (AppDbContext db, AuthController controller, Guid userId) Setup()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);
        var hasher = new Pbkdf2PasswordHashService();
        var fakeTokenSvc = new FakeTokenService();

        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Username = "customer",
            PasswordHash = hasher.HashPassword("Password_1"),
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });

        // Seed the initial refresh token; FakeTokenService.HashRefreshToken is identity.
        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = fakeTokenSvc.HashRefreshToken(RawToken),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
            CreatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var controller = new AuthController(db, hasher, fakeTokenSvc);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        return (db, controller, userId);
    }

    // Proves: first rotation succeeds and issues a new token.
    [Fact]
    public async Task Refresh_FirstUse_Returns200()
    {
        var (_, controller, _) = Setup();

        var result = await controller.Refresh(new RefreshRequest(RawToken), CancellationToken.None);

        var ok = result as OkObjectResult;
        Assert.NotNull(ok);
        Assert.Equal(200, ok!.StatusCode);
    }

    // Proves: replaying a revoked token returns 401 and wipes all active sessions.
    [Fact]
    public async Task Refresh_RevokedTokenReplay_RevokesAllSessionsAndReturns401()
    {
        var (db, controller, userId) = Setup();

        // First use — rotates the token; the original is now revoked.
        await controller.Refresh(new RefreshRequest(RawToken), CancellationToken.None);

        // The rotation issued a new token. Confirm it's active before the attack.
        var activeBeforeReplay = db.RefreshTokens
            .AsNoTracking()
            .Count(t => t.UserId == userId && t.RevokedAt == null);
        Assert.Equal(1, activeBeforeReplay);

        // Replay the original (now-revoked) token — theft detected.
        var replayResult = await controller.Refresh(new RefreshRequest(RawToken), CancellationToken.None);
        var replayResponse = replayResult as ObjectResult;
        Assert.NotNull(replayResponse);
        Assert.Equal(401, replayResponse!.StatusCode);

        // All active sessions must now be revoked.
        var activeAfterReplay = db.RefreshTokens
            .AsNoTracking()
            .Count(t => t.UserId == userId && t.RevokedAt == null);
        Assert.Equal(0, activeAfterReplay);
    }

    // Proves: an unknown token (never issued) still returns 401, no crash.
    [Fact]
    public async Task Refresh_UnknownToken_Returns401()
    {
        var (_, controller, _) = Setup();

        var result = await controller.Refresh(new RefreshRequest("never-issued-token"), CancellationToken.None);

        var response = result as ObjectResult;
        Assert.NotNull(response);
        Assert.Equal(401, response!.StatusCode);
    }

    // Proves: an expired token returns 401 (expiry path still works after the refactor).
    [Fact]
    public async Task Refresh_ExpiredToken_Returns401()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);
        var hasher = new Pbkdf2PasswordHashService();
        var fakeTokenSvc = new FakeTokenService();

        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Username = "expireduser",
            PasswordHash = hasher.HashPassword("Password_1"),
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = fakeTokenSvc.HashRefreshToken("expired-token"),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1), // already expired
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-31)
        });
        db.SaveChanges();

        var controller = new AuthController(db, hasher, fakeTokenSvc);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
        };

        var result = await controller.Refresh(new RefreshRequest("expired-token"), CancellationToken.None);

        var response = result as ObjectResult;
        Assert.NotNull(response);
        Assert.Equal(401, response!.StatusCode);
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string CreateAccessToken(User user) => "fake-access-token";
        public string CreateRefreshToken() => Guid.NewGuid().ToString();
        public string HashRefreshToken(string refreshToken) => refreshToken;
        public DateTimeOffset GetRefreshTokenExpiry() => DateTimeOffset.UtcNow.AddDays(30);
    }
}
