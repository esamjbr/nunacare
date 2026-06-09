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

// Feature 8: BabyLog.CreatedByFamilyMemberId — caregiver attribution.
// Covers happy path, family-scope rejection of a foreign member id, and SetNull on member delete.
public sealed class LogsCaregiverTagTests
{
    private static (AppDbContext db, LogsController controller, Guid familyId, Guid babyId, Guid memberId) Setup()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);

        var userId = Guid.NewGuid();
        var familyId = Guid.NewGuid();
        var babyId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

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
        db.FamilyMembers.Add(new FamilyMember
        {
            Id = memberId, FamilyId = familyId, Name = "Mama", Role = "parent",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
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

        return (db, controller, familyId, babyId, memberId);
    }

    private static JsonElement EmptyData() => JsonSerializer.Deserialize<JsonElement>("{}");

    // Happy path: a log created with a valid family member returns 201 and carries
    // the creator id plus the name resolved at read time.
    [Fact]
    public async Task CreateLog_WithOwnFamilyMember_Returns201AndAttribution()
    {
        var (_, controller, _, babyId, memberId) = Setup();

        var result = await controller.CreateLog(
            new CreateBabyLogRequest(babyId, "feeding", EmptyData(), null, memberId),
            CancellationToken.None);

        var objectResult = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        var dto = Assert.IsType<BabyLogDto>(objectResult.Value);
        Assert.Equal(memberId, dto.CreatedByFamilyMemberId);
        Assert.Equal("Mama", dto.CreatedByName);
    }

    // Tenant isolation: a member id belonging to another family is rejected and no log is written.
    [Fact]
    public async Task CreateLog_WithForeignFamilyMember_Returns404AndDoesNotPersist()
    {
        var (db, controller, _, babyId, _) = Setup();

        // A second family with its own member; that member must not be usable here.
        var otherFamilyId = Guid.NewGuid();
        var foreignMemberId = Guid.NewGuid();
        db.Families.Add(new Family
        {
            Id = otherFamilyId, OwnerUserId = Guid.NewGuid(), Name = "F2",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.FamilyMembers.Add(new FamilyMember
        {
            Id = foreignMemberId, FamilyId = otherFamilyId, Name = "Stranger", Role = "parent",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await controller.CreateLog(
            new CreateBabyLogRequest(babyId, "feeding", EmptyData(), null, foreignMemberId),
            CancellationToken.None);

        var objectResult = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
        Assert.Empty(db.BabyLogs);
    }

    // SetNull: deleting the family member nulls the creator on existing logs (history survives).
    [Fact]
    public async Task DeleteFamilyMember_SetsCreatedByToNull_OnExistingLog()
    {
        var (db, controller, _, babyId, memberId) = Setup();

        var created = await controller.CreateLog(
            new CreateBabyLogRequest(babyId, "feeding", EmptyData(), null, memberId),
            CancellationToken.None);
        var dto = Assert.IsType<BabyLogDto>(Assert.IsAssignableFrom<ObjectResult>(created).Value);

        // Track the dependent log so EF applies the configured SetNull behavior on principal delete.
        _ = db.BabyLogs.ToList();
        var member = db.FamilyMembers.Single(m => m.Id == memberId);
        db.FamilyMembers.Remove(member);
        db.SaveChanges();

        var log = db.BabyLogs.Single(l => l.Id == dto.Id);
        Assert.Null(log.CreatedByFamilyMemberId);
    }
}
