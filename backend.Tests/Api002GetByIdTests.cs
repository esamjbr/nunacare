using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// API-002: CreatedAtAction references named GET /{id} routes.
// These tests prove that GetBaby, GetLog, GetFoodReaction, and GetMomCheckIn
// exist and return 200 for their own entities and 404 for cross-tenant access.
public sealed class Api002GetByIdTests
{
    private sealed class TestSetup
    {
        public AppDbContext Db { get; }
        public Guid UserId { get; }
        public Guid FamilyId { get; }
        public Guid OtherFamilyId { get; }

        public TestSetup()
        {
            var opts = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            Db = new AppDbContext(opts);

            UserId = Guid.NewGuid();
            FamilyId = Guid.NewGuid();
            OtherFamilyId = Guid.NewGuid();

            var otherUserId = Guid.NewGuid();

            Db.Users.Add(new User
            {
                Id = UserId, Username = "user1", PasswordHash = "hash",
                Role = UserRole.Customer, IsActive = true, MustChangePassword = false,
                AccessType = AccessType.Lifetime,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.Users.Add(new User
            {
                Id = otherUserId, Username = "user2", PasswordHash = "hash",
                Role = UserRole.Customer, IsActive = true, MustChangePassword = false,
                AccessType = AccessType.Lifetime,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.Families.Add(new Family
            {
                Id = FamilyId, OwnerUserId = UserId, Name = "F1",
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.Families.Add(new Family
            {
                Id = OtherFamilyId, OwnerUserId = otherUserId, Name = "F2",
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.SaveChanges();
        }

        public ControllerContext CtxFor(Guid userId) => new()
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                }))
            }
        };
    }

    // ── BabiesController ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetBaby_OwnBaby_Returns200()
    {
        var s = new TestSetup();
        var babyId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId, FamilyId = s.FamilyId, Name = "Alice",
            DateOfBirth = new DateOnly(2024, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new BabiesController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetBaby(babyId, CancellationToken.None);

        var ok = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public async Task GetBaby_OtherFamilyBaby_Returns404()
    {
        var s = new TestSetup();
        var otherBabyId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = otherBabyId, FamilyId = s.OtherFamilyId, Name = "Bob",
            DateOfBirth = new DateOnly(2024, 2, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new BabiesController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetBaby(otherBabyId, CancellationToken.None);

        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // ── LogsController ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetLog_OwnLog_Returns200()
    {
        var s = new TestSetup();
        var babyId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId, FamilyId = s.FamilyId, Name = "Alice",
            DateOfBirth = new DateOnly(2024, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.BabyLogs.Add(new BabyLog
        {
            Id = logId, FamilyId = s.FamilyId, BabyId = babyId,
            Type = "Feeding", DataJson = "{}", LoggedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new LogsController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetLog(logId, CancellationToken.None);

        var ok = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public async Task GetLog_OtherFamilyLog_Returns404()
    {
        var s = new TestSetup();
        var otherBabyId = Guid.NewGuid();
        var otherLogId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = otherBabyId, FamilyId = s.OtherFamilyId, Name = "Bob",
            DateOfBirth = new DateOnly(2024, 2, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.BabyLogs.Add(new BabyLog
        {
            Id = otherLogId, FamilyId = s.OtherFamilyId, BabyId = otherBabyId,
            Type = "Sleep", DataJson = "{}", LoggedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new LogsController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetLog(otherLogId, CancellationToken.None);

        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // ── FoodReactionsController ───────────────────────────────────────────────

    [Fact]
    public async Task GetFoodReaction_OwnReaction_Returns200()
    {
        var s = new TestSetup();
        var babyId = Guid.NewGuid();
        var reactionId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId, FamilyId = s.FamilyId, Name = "Alice",
            DateOfBirth = new DateOnly(2024, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.FoodReactions.Add(new FoodReaction
        {
            Id = reactionId, FamilyId = s.FamilyId, BabyId = babyId,
            FoodName = "Banana", TriedDate = new DateOnly(2024, 7, 1), Liked = "liked",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new FoodReactionsController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetFoodReaction(reactionId, CancellationToken.None);

        var ok = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public async Task GetFoodReaction_OtherFamilyReaction_Returns404()
    {
        var s = new TestSetup();
        var otherBabyId = Guid.NewGuid();
        var otherReactionId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = otherBabyId, FamilyId = s.OtherFamilyId, Name = "Bob",
            DateOfBirth = new DateOnly(2024, 2, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.FoodReactions.Add(new FoodReaction
        {
            Id = otherReactionId, FamilyId = s.OtherFamilyId, BabyId = otherBabyId,
            FoodName = "Avocado", TriedDate = new DateOnly(2024, 8, 1), Liked = "neutral",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new FoodReactionsController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetFoodReaction(otherReactionId, CancellationToken.None);

        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // ── MomCheckInsController ─────────────────────────────────────────────────

    [Fact]
    public async Task GetMomCheckIn_OwnCheckIn_Returns200()
    {
        var s = new TestSetup();
        var checkInId = Guid.NewGuid();
        s.Db.MomCheckIns.Add(new MomCheckIn
        {
            Id = checkInId, FamilyId = s.FamilyId, Date = DateOnly.FromDateTime(DateTime.UtcNow),
            Mood = "good", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new MomCheckInsController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetMomCheckIn(checkInId, CancellationToken.None);

        var ok = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    [Fact]
    public async Task GetMomCheckIn_OtherFamilyCheckIn_Returns404()
    {
        var s = new TestSetup();
        var otherCheckInId = Guid.NewGuid();
        s.Db.MomCheckIns.Add(new MomCheckIn
        {
            Id = otherCheckInId, FamilyId = s.OtherFamilyId,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            Mood = "tired", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var ctrl = new MomCheckInsController(s.Db, new FamilyScopeService(s.Db));
        ctrl.ControllerContext = s.CtxFor(s.UserId);

        var result = await ctrl.GetMomCheckIn(otherCheckInId, CancellationToken.None);

        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }
}
