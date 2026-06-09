using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

public sealed class AccountControllerTests
{
    private sealed class Setup
    {
        public AppDbContext Db { get; }
        public AccountController Ctrl { get; }
        public Guid FamilyId { get; }
        public Guid UserId { get; }

        public Setup(bool isActive = true)
        {
            var opts = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            Db = new AppDbContext(opts);

            UserId = Guid.NewGuid();
            FamilyId = Guid.NewGuid();

            Db.Users.Add(new User
            {
                Id = UserId, Username = "u1", PasswordHash = "h",
                Role = UserRole.Customer, IsActive = isActive, MustChangePassword = false,
                AccessType = AccessType.Lifetime,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.Families.Add(new Family
            {
                Id = FamilyId, OwnerUserId = UserId, Name = "F1",
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.SaveChanges();

            Ctrl = new AccountController(Db, new FamilyScopeService(Db));
            Ctrl.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, UserId.ToString())
                    }))
                }
            };
        }
    }

    // Happy path: export returns 200.
    [Fact]
    public async Task ExportData_ActiveUser_Returns200()
    {
        var s = new Setup();
        var result = await s.Ctrl.ExportData(CancellationToken.None);
        var ok = Assert.IsAssignableFrom<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    // Export for inactive user returns 403.
    [Fact]
    public async Task ExportData_InactiveUser_Returns403()
    {
        var s = new Setup(isActive: false);
        var result = await s.Ctrl.ExportData(CancellationToken.None);
        var forbidden = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(403, forbidden.StatusCode);
    }

    // Delete-data removes babies (and cascades downstream records), returns 204.
    [Fact]
    public async Task DeleteData_WithBaby_RemovesBabyAndReturns204()
    {
        var s = new Setup();
        var babyId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId, FamilyId = s.FamilyId, Name = "Alice",
            DateOfBirth = new DateOnly(2024, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var result = await s.Ctrl.DeleteData(CancellationToken.None);
        Assert.IsAssignableFrom<NoContentResult>(result);

        Assert.Equal(0, s.Db.BabyProfiles.Count());
    }

    // Delete-data removes MomCheckIns.
    [Fact]
    public async Task DeleteData_WithMomCheckIns_RemovesThemAndReturns204()
    {
        var s = new Setup();
        s.Db.MomCheckIns.Add(new MomCheckIn
        {
            Id = Guid.NewGuid(), FamilyId = s.FamilyId,
            Date = DateOnly.FromDateTime(DateTime.UtcNow), Mood = "calm",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var result = await s.Ctrl.DeleteData(CancellationToken.None);
        Assert.IsAssignableFrom<NoContentResult>(result);
        Assert.Equal(0, s.Db.MomCheckIns.Count());
    }

    // Delete-data for inactive user returns 403.
    [Fact]
    public async Task DeleteData_InactiveUser_Returns403()
    {
        var s = new Setup(isActive: false);
        var result = await s.Ctrl.DeleteData(CancellationToken.None);
        var forbidden = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(403, forbidden.StatusCode);
    }

    // User and Family records remain after delete-data.
    [Fact]
    public async Task DeleteData_PreservesUserAndFamily()
    {
        var s = new Setup();
        await s.Ctrl.DeleteData(CancellationToken.None);

        Assert.Equal(1, s.Db.Users.Count());
        Assert.Equal(1, s.Db.Families.Count());
    }
}
