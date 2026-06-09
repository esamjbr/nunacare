using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NunaCare.Api.Auth;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// ARCH-005: AccessType is a display label only. Authorization is driven by IsActive + ExpiresAt.
// Lifetime accounts must have ExpiresAt cleared — an explicit ExpiresAt cannot block a Lifetime user.
public sealed class Arch005AccessTypeTests
{
    private sealed class StubCredentialGenerator : ICredentialGenerator
    {
        public string GenerateUsername(string? fullName = null) => "user_" + Guid.NewGuid().ToString("N")[..8];
        public string GenerateTemporaryPassword() => "TempPass1!";
    }

    private sealed class StubPasswordHashService : IPasswordHashService
    {
        public string HashPassword(string password) => "hash";
        public bool VerifyPassword(string password, string passwordHash) => true;
    }

    private static AppDbContext CreateDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static (AdminCustomersController controller, AppDbContext db) SetupAdmin(AppDbContext db)
    {
        var adminId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = adminId,
            Username = "admin",
            PasswordHash = "hash",
            Role = UserRole.Admin,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var controller = new AdminCustomersController(
            db,
            new StubCredentialGenerator(),
            new StubPasswordHashService(),
            NullLogger<AdminCustomersController>.Instance);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, adminId.ToString()),
                    new Claim(ClaimTypes.Role, "Admin")
                }))
            }
        };
        return (controller, db);
    }

    // Proves: creating a Lifetime customer always results in a null ExpiresAt,
    // even when the caller passes a non-null ExpiresAt.
    [Fact]
    public async Task CreateCustomer_LifetimeAccess_ClearsExpiresAt()
    {
        var db = CreateDb();
        var (controller, _) = SetupAdmin(db);

        var result = await controller.CreateCustomer(
            new CreateCustomerRequest(
                "lifetime_user",
                "FullName",
                null,
                AccessType.Lifetime,
                DateTimeOffset.UtcNow.AddYears(1), // should be ignored
                null),
            CancellationToken.None);

        var created = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(201, created.StatusCode);

        var customer = await db.Users.FirstAsync(u => u.Username == "lifetime_user");
        Assert.Null(customer.ExpiresAt);
    }

    // Proves: updating a customer to Lifetime clears any existing ExpiresAt.
    [Fact]
    public async Task UpdateCustomer_ChangeToLifetime_ClearsExpiresAt()
    {
        var db = CreateDb();
        var (controller, _) = SetupAdmin(db);

        var customerId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = customerId,
            Username = "trial_user",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Trial,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await controller.UpdateCustomer(
            customerId,
            new UpdateCustomerRequest(null, null, AccessType.Lifetime, null),
            CancellationToken.None);

        Assert.IsAssignableFrom<OkObjectResult>(result);

        var customer = await db.Users.FindAsync(customerId);
        Assert.Equal(AccessType.Lifetime, customer!.AccessType);
        Assert.Null(customer.ExpiresAt);
    }

    // Proves: creating a Trial customer preserves the supplied ExpiresAt.
    [Fact]
    public async Task CreateCustomer_TrialAccess_KeepsExpiresAt()
    {
        var db = CreateDb();
        var (controller, _) = SetupAdmin(db);
        var expiry = DateTimeOffset.UtcNow.AddDays(30);

        await controller.CreateCustomer(
            new CreateCustomerRequest("trial2", "Name", null, AccessType.Trial, expiry, null),
            CancellationToken.None);

        var customer = await db.Users.FirstAsync(u => u.Username == "trial2");
        Assert.NotNull(customer.ExpiresAt);
        Assert.Equal(expiry.ToUnixTimeSeconds(), customer.ExpiresAt!.Value.ToUnixTimeSeconds(), tolerance: 1);
    }
}
