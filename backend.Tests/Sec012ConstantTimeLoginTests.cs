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

// SEC-012: Login must call VerifyPassword even for unknown usernames to prevent
//          username enumeration via timing differences.
public sealed class Sec012ConstantTimeLoginTests
{
    // Proves: unknown username still triggers VerifyPassword exactly once (decoy hash path).
    [Fact]
    public async Task Login_UnknownUsername_CallsVerifyPasswordOnce()
    {
        var (controller, spy) = CreateController(seedUser: false);

        var result = await controller.Login(
            new LoginRequest("nobody", "anything"),
            CancellationToken.None);

        Assert.Equal(1, spy.VerifyCount);
        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(401, status.StatusCode);
    }

    // Proves: known username with wrong password calls VerifyPassword once and returns 401.
    [Fact]
    public async Task Login_KnownUsername_WrongPassword_CallsVerifyPasswordOnce_Returns401()
    {
        var (controller, spy) = CreateController(seedUser: true);

        var result = await controller.Login(
            new LoginRequest("seeded_user", "WrongPassword99"),
            CancellationToken.None);

        Assert.Equal(1, spy.VerifyCount);
        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(401, status.StatusCode);
    }

    // Regression: known username with correct password still returns 200 after the fix.
    [Fact]
    public async Task Login_KnownUsername_CorrectPassword_Returns200()
    {
        var (controller, spy) = CreateController(seedUser: true);

        var result = await controller.Login(
            new LoginRequest("seeded_user", "correct_password"),
            CancellationToken.None);

        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, status.StatusCode);
    }

    // Proves: blank username/password returns 400 without reaching the database lookup.
    [Fact]
    public async Task Login_BlankCredentials_Returns400()
    {
        var (controller, spy) = CreateController(seedUser: false);

        var result = await controller.Login(
            new LoginRequest("", ""),
            CancellationToken.None);

        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, status.StatusCode);
        Assert.Equal(0, spy.VerifyCount); // early-exit path does not run PBKDF2
    }

    private static (AuthController controller, SpyPasswordHashService spy) CreateController(bool seedUser)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);
        var spy = new SpyPasswordHashService();

        if (seedUser)
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Username = "seeded_user",
                PasswordHash = spy.HashPassword("correct_password"),
                Role = UserRole.Customer,
                IsActive = true,
                MustChangePassword = false,
                AccessType = AccessType.Lifetime,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            db.SaveChanges();
        }

        var controller = new AuthController(db, spy, new FakeTokenService());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return (controller, spy);
    }

    // Spy that counts VerifyPassword calls without running full PBKDF2 iterations.
    // A simple hash→verify round-trip lets the happy-path test return true for the seeded user.
    private sealed class SpyPasswordHashService : IPasswordHashService
    {
        public int VerifyCount { get; private set; }

        public string HashPassword(string password) => $"spy:{password}";

        public bool VerifyPassword(string password, string hash)
        {
            VerifyCount++;
            // Returns true only for matching spy-format hashes (real user path).
            // Returns false for the decoy hash (unknown-username path) since DecoyPasswordHash
            // uses PBKDF2 format which never equals "spy:...".
            return hash == $"spy:{password}";
        }
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string CreateAccessToken(User user) => "fake-access-token";
        public string CreateRefreshToken() => Guid.NewGuid().ToString();
        public string HashRefreshToken(string token) => token;
        public DateTimeOffset GetRefreshTokenExpiry() => DateTimeOffset.UtcNow.AddDays(30);
    }
}
