using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Data;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// ARCH-001: IFamilyScopeService centralizes tenant-scope checks.
// Tests prove the service itself is correct independent of any controller.
public sealed class Arch001FamilyScopeServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static Guid SeedUser(AppDbContext db, bool isActive, bool isExpired)
    {
        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Username = Guid.NewGuid().ToString(),
            PasswordHash = "hash",
            Role = UserRole.Customer,
            IsActive = isActive,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            ExpiresAt = isExpired ? DateTimeOffset.UtcNow.AddDays(-1) : null,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();
        return userId;
    }

    private static Guid SeedFamily(AppDbContext db, Guid ownerUserId)
    {
        var familyId = Guid.NewGuid();
        db.Families.Add(new Family
        {
            Id = familyId,
            OwnerUserId = ownerUserId,
            Name = "Test Family",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();
        return familyId;
    }

    // Proves: unknown user is blocked.
    [Fact]
    public async Task ResolveAsync_UnknownUser_ReturnsBlocked()
    {
        var db = CreateDb();
        var svc = new FamilyScopeService(db);

        var (isBlocked, familyId) = await svc.ResolveAsync(Guid.NewGuid());

        Assert.True(isBlocked);
        Assert.Null(familyId);
    }

    // Proves: inactive user is blocked even if they have a family.
    [Fact]
    public async Task ResolveAsync_InactiveUser_ReturnsBlocked()
    {
        var db = CreateDb();
        var userId = SeedUser(db, isActive: false, isExpired: false);
        SeedFamily(db, userId);
        var svc = new FamilyScopeService(db);

        var (isBlocked, familyId) = await svc.ResolveAsync(userId);

        Assert.True(isBlocked);
        Assert.Null(familyId);
    }

    // Proves: expired user is blocked even if they have a family.
    [Fact]
    public async Task ResolveAsync_ExpiredUser_ReturnsBlocked()
    {
        var db = CreateDb();
        var userId = SeedUser(db, isActive: true, isExpired: true);
        SeedFamily(db, userId);
        var svc = new FamilyScopeService(db);

        var (isBlocked, familyId) = await svc.ResolveAsync(userId);

        Assert.True(isBlocked);
        Assert.Null(familyId);
    }

    // Proves: active user with no family returns not-blocked with null familyId.
    [Fact]
    public async Task ResolveAsync_ActiveUser_NoFamily_ReturnsNotBlockedNullFamily()
    {
        var db = CreateDb();
        var userId = SeedUser(db, isActive: true, isExpired: false);
        var svc = new FamilyScopeService(db);

        var (isBlocked, familyId) = await svc.ResolveAsync(userId);

        Assert.False(isBlocked);
        Assert.Null(familyId);
    }

    // Proves: active user with a family returns not-blocked with their familyId.
    [Fact]
    public async Task ResolveAsync_ActiveUser_WithFamily_ReturnsFamilyId()
    {
        var db = CreateDb();
        var userId = SeedUser(db, isActive: true, isExpired: false);
        var expectedFamilyId = SeedFamily(db, userId);
        var svc = new FamilyScopeService(db);

        var (isBlocked, familyId) = await svc.ResolveAsync(userId);

        Assert.False(isBlocked);
        Assert.Equal(expectedFamilyId, familyId);
    }

    // Proves: user with ExpiresAt in the future is NOT blocked.
    [Fact]
    public async Task ResolveAsync_NotYetExpiredUser_ReturnsNotBlocked()
    {
        var db = CreateDb();
        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Username = Guid.NewGuid().ToString(),
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
        var svc = new FamilyScopeService(db);

        var (isBlocked, _) = await svc.ResolveAsync(userId);

        Assert.False(isBlocked);
    }
}
