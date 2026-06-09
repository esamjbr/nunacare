using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// SEC-007: LogsController must reject non-object and oversized DataJson payloads.
public sealed class LogsDataJsonTests
{
    private static (AppDbContext db, LogsController controller, Guid babyId) SetupController()
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
            Username = "testuser",
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
            Name = "Test Family",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId,
            FamilyId = familyId,
            Name = "Test Baby",
            DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-6)),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var controller = new LogsController(db, new FamilyScopeService(db));
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

        return (db, controller, babyId);
    }

    private static BabyLog SeedLog(AppDbContext db, Guid babyId)
    {
        var familyId = db.Families.First().Id;
        var log = new BabyLog
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            BabyId = babyId,
            Type = "Feeding",
            DataJson = "{}",
            LoggedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.BabyLogs.Add(log);
        db.SaveChanges();
        return log;
    }

    // Proves: POST /api/logs rejects an array as Data (must be JSON object).
    [Fact]
    public async Task CreateLog_WithArrayData_Returns400()
    {
        var (_, controller, babyId) = SetupController();
        var arrayData = JsonSerializer.Deserialize<JsonElement>("[1, 2, 3]");

        var result = await controller.CreateLog(
            new CreateBabyLogRequest(babyId, "feeding", arrayData, null),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(400, objectResult!.StatusCode);
    }

    // Proves: POST /api/logs rejects Data whose serialized size exceeds 64 KB.
    [Fact]
    public async Task CreateLog_WithOversizedData_Returns400()
    {
        var (_, controller, babyId) = SetupController();
        var bigValue = new string('x', 70_000);
        var bigData = JsonSerializer.Deserialize<JsonElement>($"{{\"d\":\"{bigValue}\"}}");

        var result = await controller.CreateLog(
            new CreateBabyLogRequest(babyId, "feeding", bigData, null),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(400, objectResult!.StatusCode);
    }

    // Proves: POST /api/logs accepts a well-formed JSON object within size limits.
    [Fact]
    public async Task CreateLog_WithValidObjectData_Returns201()
    {
        var (_, controller, babyId) = SetupController();
        var objectData = JsonSerializer.Deserialize<JsonElement>("{\"ml\":120}");

        var result = await controller.CreateLog(
            new CreateBabyLogRequest(babyId, "feeding", objectData, null),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(201, objectResult!.StatusCode);
    }

    // Proves: PATCH /api/logs/{id} rejects an array as Data.
    [Fact]
    public async Task UpdateLog_WithArrayData_Returns400()
    {
        var (db, controller, babyId) = SetupController();
        var log = SeedLog(db, babyId);
        var arrayData = JsonSerializer.Deserialize<JsonElement>("[1, 2]");

        var result = await controller.UpdateLog(
            log.Id,
            new UpdateBabyLogRequest(null, (JsonElement?)arrayData, null),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(400, objectResult!.StatusCode);
    }

    // Proves: PATCH /api/logs/{id} accepts a well-formed JSON object.
    [Fact]
    public async Task UpdateLog_WithValidObjectData_Returns200()
    {
        var (db, controller, babyId) = SetupController();
        var log = SeedLog(db, babyId);
        var objectData = JsonSerializer.Deserialize<JsonElement>("{\"ml\":200}");

        var result = await controller.UpdateLog(
            log.Id,
            new UpdateBabyLogRequest(null, (JsonElement?)objectData, null),
            CancellationToken.None);

        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        Assert.Equal(200, objectResult!.StatusCode);
    }
}
