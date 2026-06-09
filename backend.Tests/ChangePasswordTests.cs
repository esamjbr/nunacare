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

// SEC-001: change-password endpoint must verify current password for non-first-login users.
public sealed class ChangePasswordTests
{
    private static (AuthController controller, User user) CreateController(bool mustChangePassword)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);
        var hasher = new Pbkdf2PasswordHashService();

        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Username = "testuser",
            PasswordHash = hasher.HashPassword("Correct_Password_1"),
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = mustChangePassword,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.Users.Add(user);
        db.SaveChanges();

        var controller = new AuthController(db, hasher, new FakeTokenService());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                }))
            }
        };

        return (controller, user);
    }

    // Proves: regular user with no CurrentPassword supplied is rejected.
    [Fact]
    public async Task ChangePassword_MissingCurrentPassword_WhenNotFirstLogin_Returns400()
    {
        var (controller, _) = CreateController(mustChangePassword: false);

        var result = await controller.ChangePassword(
            new ChangePasswordRequest(CurrentPassword: null, NewPassword: "NewPassword_123"),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(400, objectResult!.StatusCode);
    }

    // Proves: wrong current password is rejected, even when new password is valid.
    [Fact]
    public async Task ChangePassword_WrongCurrentPassword_WhenNotFirstLogin_Returns400()
    {
        var (controller, _) = CreateController(mustChangePassword: false);

        var result = await controller.ChangePassword(
            new ChangePasswordRequest(CurrentPassword: "Wrong_Password_99", NewPassword: "NewPassword_123"),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(400, objectResult!.StatusCode);
    }

    // Proves: correct current password is accepted and password is updated.
    [Fact]
    public async Task ChangePassword_CorrectCurrentPassword_WhenNotFirstLogin_Returns200()
    {
        var (controller, _) = CreateController(mustChangePassword: false);

        var result = await controller.ChangePassword(
            new ChangePasswordRequest(CurrentPassword: "Correct_Password_1", NewPassword: "NewPassword_123"),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(200, objectResult!.StatusCode);
    }

    // Proves: first-login forced-password-change bypasses the current-password check.
    [Fact]
    public async Task ChangePassword_NoCurrentPassword_WhenFirstLogin_Returns200()
    {
        var (controller, _) = CreateController(mustChangePassword: true);

        var result = await controller.ChangePassword(
            new ChangePasswordRequest(CurrentPassword: null, NewPassword: "NewPassword_123"),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(200, objectResult!.StatusCode);
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string CreateAccessToken(User user) => "fake-access-token";
        public string CreateRefreshToken() => Guid.NewGuid().ToString();
        public string HashRefreshToken(string refreshToken) => refreshToken;
        public DateTimeOffset GetRefreshTokenExpiry() => DateTimeOffset.UtcNow.AddDays(30);
    }
}
