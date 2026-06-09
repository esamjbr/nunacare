namespace NunaCare.Api.Services;

public sealed class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";

    public string? Username { get; init; }
    public string? Password { get; init; }
}
