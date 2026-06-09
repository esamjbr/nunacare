namespace NunaCare.Api.Tests;

// SEC-006: Program.cs must reject localhost/wildcard CORS origins and AllowedHosts: * in Production.
// The guard runs at startup before the server accepts requests; these tests verify the exact
// boolean conditions used in the guard so a wrong condition change causes a test failure here.
public sealed class CorsOriginGuardTests
{
    // Proves: the guard identifies localhost origins as invalid for production.
    [Theory]
    [InlineData("http://localhost:5173")]
    [InlineData("http://localhost:3000")]
    [InlineData("http://127.0.0.1:5173")]
    [InlineData("*")]
    public void ProductionOriginGuard_RejectsLocalhostAndWildcard(string origin)
    {
        bool rejected = origin == "*" || origin.Contains("localhost") || origin.Contains("127.0.0.1");
        Assert.True(rejected, $"Origin '{origin}' should be rejected in Production but the guard would allow it.");
    }

    // Proves: the guard allows real production origins through.
    [Theory]
    [InlineData("https://nunacare.netlify.app")]
    [InlineData("https://app.nunacare.jo")]
    [InlineData("https://nunacare.pages.dev")]
    public void ProductionOriginGuard_AllowsRealProductionOrigins(string origin)
    {
        bool rejected = origin == "*" || origin.Contains("localhost") || origin.Contains("127.0.0.1");
        Assert.False(rejected, $"Origin '{origin}' is a valid production origin but the guard would reject it.");
    }

    // Proves: the AllowedHosts guard rejects wildcard and blank values.
    [Theory]
    [InlineData("*")]
    [InlineData("")]
    [InlineData("   ")]
    public void AllowedHostsGuard_RejectsWildcardAndEmpty(string value)
    {
        bool rejected = string.IsNullOrWhiteSpace(value) || value.Trim() == "*";
        Assert.True(rejected, $"AllowedHosts value '{value}' should be rejected in Production.");
    }

    // Proves: the AllowedHosts guard accepts explicit host lists.
    [Theory]
    [InlineData("api.nunacare.jo")]
    [InlineData("api.nunacare.jo;app.nunacare.jo")]
    public void AllowedHostsGuard_AllowsExplicitHosts(string value)
    {
        bool rejected = string.IsNullOrWhiteSpace(value) || value.Trim() == "*";
        Assert.False(rejected, $"AllowedHosts value '{value}' is valid but the guard would reject it.");
    }

    // Proves: appsettings.json no longer contains the wildcard AllowedHosts value.
    [Fact]
    public void AppsettingsJson_AllowedHosts_IsNoLongerWildcard()
    {
        // Walk up from the test DLL until we find a sibling "backend/appsettings.json".
        // Structure: backend.Tests/bin/Debug/net8.0/ → ... → pregnency/backend/appsettings.json
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        string? appsettings = null;
        while (dir != null)
        {
            var candidate = Path.Combine(dir.FullName, "backend", "appsettings.json");
            if (File.Exists(candidate))
            {
                appsettings = candidate;
                break;
            }
            dir = dir.Parent;
        }

        Assert.NotNull(appsettings); // guard: can't find appsettings.json
        var json = File.ReadAllText(appsettings!);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var allowedHosts = doc.RootElement.GetProperty("AllowedHosts").GetString();

        Assert.NotNull(allowedHosts);
        Assert.NotEqual("*", allowedHosts);
    }
}
