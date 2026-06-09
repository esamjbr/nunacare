using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NunaCare.Api.Auth;
using NunaCare.Api.Data;
using NunaCare.Api.Entities;

namespace NunaCare.Api.Services;


public sealed class DatabaseInitializer
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHashService _passwordHashService;
    private readonly AdminSeedOptions _adminSeedOptions;
    private readonly DatabaseOptions _databaseOptions;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(
        AppDbContext dbContext,
        IPasswordHashService passwordHashService,
        IOptions<AdminSeedOptions> adminSeedOptions,
        IOptions<DatabaseOptions> databaseOptions,
        ILogger<DatabaseInitializer> logger)
    {
        _dbContext = dbContext;
        _passwordHashService = passwordHashService;
        _adminSeedOptions = adminSeedOptions.Value;
        _databaseOptions = databaseOptions.Value;
        _logger = logger;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        // ARCH-012: only auto-migrate when explicitly enabled. In production, run
        // "dotnet ef database update" as a dedicated deploy step to avoid race conditions
        // and unreviewed DDL on startup.
        if (_databaseOptions.AutoMigrateOnStartup)
            await _dbContext.Database.MigrateAsync(cancellationToken);
        else
            _logger.LogInformation("Database auto-migration is disabled. Run migrations manually as a deploy step.");

        await SeedAdminAsync(cancellationToken);
    }

    private async Task SeedAdminAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_adminSeedOptions.Username) ||
            string.IsNullOrWhiteSpace(_adminSeedOptions.Password))
        {
            _logger.LogWarning(
                "Admin seed skipped. Set AdminSeed__Username and AdminSeed__Password to seed an admin user.");
            return;
        }

        var normalizedUsername = _adminSeedOptions.Username.Trim();
        var exists = await _dbContext.Users
            .AnyAsync(user => user.Username == normalizedUsername, cancellationToken);

        if (exists)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Username = normalizedUsername,
            PasswordHash = _passwordHashService.HashPassword(_adminSeedOptions.Password),
            Role = UserRole.Admin,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Users.Add(admin);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Seeded admin user '{Username}'.", admin.Username);
    }
}
