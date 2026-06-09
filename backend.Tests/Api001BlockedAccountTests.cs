using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Auth;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// API-001: inactive or expired accounts must receive 403 (not 404 "Family not found")
//          so customers get a calm renewal message rather than a confusing not-found error.
public sealed class Api001BlockedAccountTests
{
    // Proves: inactive user with a linked family returns 403, not 404.
    [Fact]
    public async Task GetBabies_InactiveUser_WithFamily_Returns403()
    {
        var (controller, _) = CreateController(isActive: false, isExpired: false, seedFamily: true);

        var result = await controller.GetBabies(CancellationToken.None);

        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(403, status.StatusCode);
    }

    // Proves: expired user with a linked family returns 403, not 404.
    [Fact]
    public async Task GetBabies_ExpiredUser_WithFamily_Returns403()
    {
        var (controller, _) = CreateController(isActive: true, isExpired: true, seedFamily: true);

        var result = await controller.GetBabies(CancellationToken.None);

        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(403, status.StatusCode);
    }

    // Regression: active user with no family still returns 404 (unchanged behavior).
    [Fact]
    public async Task GetBabies_ActiveUser_NoFamily_Returns404()
    {
        var (controller, _) = CreateController(isActive: true, isExpired: false, seedFamily: false);

        var result = await controller.GetBabies(CancellationToken.None);

        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, status.StatusCode);
    }

    // Regression: active user with a family returns 200 with an empty baby list.
    [Fact]
    public async Task GetBabies_ActiveUser_WithFamily_Returns200()
    {
        var (controller, _) = CreateController(isActive: true, isExpired: false, seedFamily: true);

        var result = await controller.GetBabies(CancellationToken.None);

        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, status.StatusCode);
    }

    // Proves: CreateBaby for an inactive user returns 403.
    [Fact]
    public async Task CreateBaby_InactiveUser_Returns403()
    {
        var (controller, _) = CreateController(isActive: false, isExpired: false, seedFamily: true);

        var result = await controller.CreateBaby(
            new NunaCare.Api.DTOs.CreateBabyRequest("TestBaby", new DateOnly(2024, 1, 1), null, null),
            CancellationToken.None);

        var status = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(403, status.StatusCode);
    }

    private static (BabiesController controller, Guid userId) CreateController(
        bool isActive, bool isExpired, bool seedFamily)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);

        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Username = "customer1",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            IsActive = isActive,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            ExpiresAt = isExpired ? DateTimeOffset.UtcNow.AddDays(-1) : null,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });

        if (seedFamily)
        {
            db.Families.Add(new Family
            {
                Id = Guid.NewGuid(),
                OwnerUserId = userId,
                Name = "Test Family",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }

        db.SaveChanges();

        var controller = new BabiesController(db, new FamilyScopeService(db));
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

        return (controller, userId);
    }
}
