using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NunaCare.Api.Auth;
using NunaCare.Api.Data;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// ARCH-012: DatabaseInitializer must only call MigrateAsync when AutoMigrateOnStartup is true.
// When false, it should log and skip — not apply migrations automatically.
public sealed class Arch012AutoMigrateTests
{
    // Minimal no-op stub — just enough to construct DatabaseInitializer.
    private sealed class NoOpHashService : IPasswordHashService
    {
        public string HashPassword(string password) => "hash";
        public bool VerifyPassword(string password, string passwordHash) => true;
    }

    private static AppDbContext CreateDb(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static DatabaseInitializer CreateInitializer(AppDbContext db, bool autoMigrate)
    {
        return new DatabaseInitializer(
            db,
            new NoOpHashService(),
            Options.Create(new AdminSeedOptions()),       // no admin to seed
            Options.Create(new DatabaseOptions { AutoMigrateOnStartup = autoMigrate }),
            NullLogger<DatabaseInitializer>.Instance);
    }

    // Proves: DatabaseInitializer.InitializeAsync completes without throwing when
    // AutoMigrateOnStartup = false (uses InMemory DB which does not support migrations).
    // If the code unconditionally called MigrateAsync, InMemory would throw.
    [Fact]
    public async Task InitializeAsync_AutoMigrateDisabled_DoesNotThrow()
    {
        var db = CreateDb(Guid.NewGuid().ToString());
        var initializer = CreateInitializer(db, autoMigrate: false);

        var ex = await Record.ExceptionAsync(() => initializer.InitializeAsync(CancellationToken.None));
        Assert.Null(ex);
    }

    // Proves: AutoMigrateOnStartup = true throws on InMemory DB (because InMemory doesn't
    // support MigrateAsync). This confirms the flag actually gates the MigrateAsync call.
    [Fact]
    public async Task InitializeAsync_AutoMigrateEnabled_CallsMigrateAsync()
    {
        var db = CreateDb(Guid.NewGuid().ToString());
        var initializer = CreateInitializer(db, autoMigrate: true);

        // InMemory databases don't support migrations — InvalidOperationException is expected.
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => initializer.InitializeAsync(CancellationToken.None));
    }
}
