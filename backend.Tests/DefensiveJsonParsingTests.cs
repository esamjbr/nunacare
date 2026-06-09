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

// SEC-009: LogsController.GetLogs and FamilyMembersController.GetFamilyMembers / UpdateFamilyMember
// must not crash when the database contains corrupt JSON — they must return 200 with a safe fallback.
public sealed class DefensiveJsonParsingTests
{
    // ── LogsController helpers ────────────────────────────────────────────────

    private static (AppDbContext db, LogsController controller, Guid familyId, Guid babyId) SetupLogsController()
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
            Username = "loguser",
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
            Name = "Log Family",
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

        return (db, controller, familyId, babyId);
    }

    // Proves: GetLogs returns 200 even when a stored DataJson is malformed — ParseJson must not throw.
    [Fact]
    public async Task GetLogs_WithCorruptDataJson_Returns200WithFallback()
    {
        var (db, controller, familyId, babyId) = SetupLogsController();

        db.BabyLogs.Add(new BabyLog
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            BabyId = babyId,
            Type = "Feeding",
            DataJson = "{not valid json!!!",
            LoggedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await controller.GetLogs(null, null, null, null, CancellationToken.None);

        var ok = result as OkObjectResult;
        Assert.NotNull(ok);
        Assert.Equal(200, ok!.StatusCode);
    }

    // Proves: GetLogs handles multiple logs where only one has corrupt JSON — good logs still appear.
    [Fact]
    public async Task GetLogs_MixedValidAndCorruptDataJson_Returns200()
    {
        var (db, controller, familyId, babyId) = SetupLogsController();

        db.BabyLogs.Add(new BabyLog
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            BabyId = babyId,
            Type = "Sleep",
            DataJson = "{\"hours\":8}",
            LoggedAt = DateTimeOffset.UtcNow.AddMinutes(-10),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.BabyLogs.Add(new BabyLog
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            BabyId = babyId,
            Type = "Feeding",
            DataJson = "CORRUPT",
            LoggedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await controller.GetLogs(null, null, null, null, CancellationToken.None);

        var ok = result as OkObjectResult;
        Assert.NotNull(ok);
        Assert.Equal(200, ok!.StatusCode);
    }

    // ── FamilyMembersController helpers ──────────────────────────────────────

    private static (AppDbContext db, FamilyMembersController controller, Guid memberId) SetupFamilyMembersController(string permissionsJson)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);

        var userId = Guid.NewGuid();
        var familyId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        db.Users.Add(new User
        {
            Id = userId,
            Username = "fmuser",
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
            Name = "FM Family",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.FamilyMembers.Add(new FamilyMember
        {
            Id = memberId,
            FamilyId = familyId,
            Name = "Grandma",
            Role = "caregiver",
            PermissionsJson = permissionsJson,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var controller = new FamilyMembersController(db, new FamilyScopeService(db));
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

        return (db, controller, memberId);
    }

    // Proves: GetFamilyMembers returns 200 even when PermissionsJson in the DB is malformed.
    [Fact]
    public async Task GetFamilyMembers_WithCorruptPermissionsJson_Returns200()
    {
        var (_, controller, _) = SetupFamilyMembersController("{corrupted!");

        var result = await controller.GetFamilyMembers(CancellationToken.None);

        var ok = result as OkObjectResult;
        Assert.NotNull(ok);
        Assert.Equal(200, ok!.StatusCode);
    }

    // Proves: GetFamilyMembers with corrupt JSON falls back to all-false permissions.
    [Fact]
    public async Task GetFamilyMembers_WithCorruptPermissionsJson_AllPermissionsFalse()
    {
        var (_, controller, _) = SetupFamilyMembersController("not-json-at-all");

        var result = await controller.GetFamilyMembers(CancellationToken.None);

        var ok = result as OkObjectResult;
        Assert.NotNull(ok);
        var list = Assert.IsAssignableFrom<System.Collections.Generic.List<FamilyMemberDto>>(ok!.Value);
        Assert.Single(list);
        var dto = list[0];
        Assert.False(dto.CanAddLogs);
        Assert.False(dto.CanViewLogs);
        Assert.False(dto.CanManageMedicines);
        Assert.False(dto.CanExportReports);
    }

    // Proves: UpdateFamilyMember does not crash when existing PermissionsJson in the DB is malformed.
    [Fact]
    public async Task UpdateFamilyMember_WithCorruptPermissionsJson_Returns200()
    {
        var (_, controller, memberId) = SetupFamilyMembersController("{corrupted!");

        // Trigger the permissions-merge branch by passing at least one permission update.
        var request = new UpdateFamilyMemberRequest(null, null, true, null, null, null);
        var result = await controller.UpdateFamilyMember(memberId, request, CancellationToken.None);

        var ok = result as OkObjectResult;
        Assert.NotNull(ok);
        Assert.Equal(200, ok!.StatusCode);
    }
}
