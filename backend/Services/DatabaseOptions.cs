namespace NunaCare.Api.Services;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    // ARCH-012: must be explicitly set to true in development.
    // Never auto-migrate in production — run "dotnet ef database update" as a deploy step.
    public bool AutoMigrateOnStartup { get; set; } = false;
}
