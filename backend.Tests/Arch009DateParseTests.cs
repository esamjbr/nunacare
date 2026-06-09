using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// ARCH-009: FoodReactionsController must parse TriedDate using DateOnly.TryParse, not
// DateTimeOffset.TryParseExact(...).UtcDateTime, which shifts the calendar day on UTC+N servers.
public sealed class Arch009DateParseTests
{
    private static (FoodReactionsController controller, AppDbContext db, Guid babyId) SetupController()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);

        var userId = Guid.NewGuid();
        var familyId = Guid.NewGuid();
        var babyId = Guid.NewGuid();

        db.Users.Add(new User
        {
            Id = userId,
            Username = "fooduser",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.Families.Add(new Family
        {
            Id = familyId,
            OwnerUserId = userId,
            Name = "Food Family",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId,
            FamilyId = familyId,
            Name = "Baby",
            DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-8)),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var controller = new FoodReactionsController(db, new FamilyScopeService(db));
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

        return (controller, db, babyId);
    }

    // Proves: a YYYY-MM-DD date string is stored verbatim — no UTC shift can alter the calendar day.
    [Fact]
    public async Task CreateFoodReaction_DateIsStoredVerbatim()
    {
        var (controller, db, babyId) = SetupController();

        var result = await controller.CreateFoodReaction(
            new CreateFoodReactionRequest(babyId, "Banana", "2024-01-15", "yes", false, false, false, null),
            CancellationToken.None);

        var created = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(201, created.StatusCode);

        var reaction = db.FoodReactions.First();
        Assert.Equal(new DateOnly(2024, 1, 15), reaction.TriedDate);
    }

    // Proves: a bad date string returns 400 (not a crash).
    [Fact]
    public async Task CreateFoodReaction_InvalidDate_Returns400()
    {
        var (controller, _, babyId) = SetupController();

        var result = await controller.CreateFoodReaction(
            new CreateFoodReactionRequest(babyId, "Avocado", "not-a-date", "yes", false, false, false, null),
            CancellationToken.None);

        var bad = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
    }

    // Proves: a date at the end-of-year boundary is preserved correctly.
    [Fact]
    public async Task CreateFoodReaction_EndOfYearDate_StoredCorrectly()
    {
        var (controller, db, babyId) = SetupController();

        await controller.CreateFoodReaction(
            new CreateFoodReactionRequest(babyId, "Mango", "2023-12-31", "yes", false, false, false, null),
            CancellationToken.None);

        var reaction = db.FoodReactions.First();
        Assert.Equal(new DateOnly(2023, 12, 31), reaction.TriedDate);
    }
}
