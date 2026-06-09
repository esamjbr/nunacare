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

public sealed class WeightsControllerTests
{
    private static (AppDbContext db, WeightsController ctrl, Guid familyId, Guid babyId) Setup()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(opts);

        var userId = Guid.NewGuid();
        var familyId = Guid.NewGuid();
        var babyId = Guid.NewGuid();

        db.Users.Add(new User
        {
            Id = userId, Username = "u1", PasswordHash = "h",
            Role = UserRole.Customer, IsActive = true, MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.Families.Add(new Family
        {
            Id = familyId, OwnerUserId = userId, Name = "F1",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId, FamilyId = familyId, Name = "Alice",
            DateOfBirth = new DateOnly(2024, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var ctrl = new WeightsController(db, new FamilyScopeService(db));
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                }))
            }
        };
        return (db, ctrl, familyId, babyId);
    }

    // Happy path: create weight entry returns 201.
    [Fact]
    public async Task CreateWeightEntry_HappyPath_Returns201()
    {
        var (_, ctrl, _, babyId) = Setup();
        var result = await ctrl.CreateWeightEntry(
            new CreateWeightEntryRequest(babyId, 7.5m, "kg", "2024-06-01", null),
            CancellationToken.None);
        var created = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(201, created.StatusCode);
    }

    // GetWeightEntry returns 200 for own entry.
    [Fact]
    public async Task GetWeightEntry_OwnEntry_Returns200()
    {
        var (db, ctrl, familyId, babyId) = Setup();
        var entryId = Guid.NewGuid();
        db.WeightEntries.Add(new WeightEntry
        {
            Id = entryId, FamilyId = familyId, BabyId = babyId,
            Value = 6.8m, Unit = "kg", Date = new DateOnly(2024, 5, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await ctrl.GetWeightEntry(entryId, CancellationToken.None);
        var ok = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    // GetWeightEntry with unknown id returns 404.
    [Fact]
    public async Task GetWeightEntry_UnknownId_Returns404()
    {
        var (_, ctrl, _, _) = Setup();
        var result = await ctrl.GetWeightEntry(Guid.NewGuid(), CancellationToken.None);
        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // Invalid unit returns 400.
    [Fact]
    public async Task CreateWeightEntry_InvalidUnit_Returns400()
    {
        var (_, ctrl, _, babyId) = Setup();
        var result = await ctrl.CreateWeightEntry(
            new CreateWeightEntryRequest(babyId, 7.5m, "stones", "2024-06-01", null),
            CancellationToken.None);
        var bad = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
    }

    // Invalid date returns 400.
    [Fact]
    public async Task CreateWeightEntry_InvalidDate_Returns400()
    {
        var (_, ctrl, _, babyId) = Setup();
        var result = await ctrl.CreateWeightEntry(
            new CreateWeightEntryRequest(babyId, 7.5m, "kg", "not-a-date", null),
            CancellationToken.None);
        var bad = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
    }
}
