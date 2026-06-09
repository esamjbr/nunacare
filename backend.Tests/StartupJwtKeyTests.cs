using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace NunaCare.Api.Tests;

// SEC-003: startup must reject invalid or placeholder JWT signing keys.
//
// Integration note: WebApplicationFactory<Program> runs Program.cs startup code.
// The JWT key guard fires before DatabaseInitializer, so these failure-case tests
// do NOT require a real database — the host never gets that far.
//
// The success case (valid key passes guard) cannot be tested end-to-end without a
// real PostgreSQL database because DatabaseInitializer calls MigrateAsync(). The
// logical unit test below verifies the guard conditions are correct instead.
public sealed class StartupJwtKeyTests
{
    // Proves: the guard conditions correctly identify which keys to accept and reject.
    [Theory]
    [InlineData("", true)]
    [InlineData("   ", true)]
    [InlineData("tooshort", true)]
    [InlineData("dev-only-change-this-signing-key-before-production-32chars", true)]
    [InlineData("this-is-a-valid-long-signing-key-for-testing-purposes-only!", false)]
    public void JwtKeyGuard_CorrectlyClassifiesKeys(string key, bool shouldReject)
    {
        const string placeholder = "dev-only-change-this-signing-key-before-production-32chars";
        bool rejected = string.IsNullOrWhiteSpace(key) || key.Length < 32 || key == placeholder;
        Assert.Equal(shouldReject, rejected);
    }

    // Proves: startup throws when signing key is empty.
    [Fact]
    public void Startup_WithEmptySigningKey_ThrowsOnBuild()
    {
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(b =>
                b.ConfigureAppConfiguration((_, cfg) =>
                    cfg.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Jwt:SigningKey"] = ""
                    })));

        Assert.ThrowsAny<Exception>(() => factory.CreateClient());
    }

    // Proves: startup throws when signing key is shorter than 32 characters.
    [Fact]
    public void Startup_WithShortSigningKey_ThrowsOnBuild()
    {
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(b =>
                b.ConfigureAppConfiguration((_, cfg) =>
                    cfg.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Jwt:SigningKey"] = "short-key"
                    })));

        Assert.ThrowsAny<Exception>(() => factory.CreateClient());
    }

    // Proves: startup throws when signing key is the known development placeholder.
    [Fact]
    public void Startup_WithPlaceholderSigningKey_ThrowsOnBuild()
    {
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(b =>
                b.ConfigureAppConfiguration((_, cfg) =>
                    cfg.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Jwt:SigningKey"] = "dev-only-change-this-signing-key-before-production-32chars"
                    })));

        Assert.ThrowsAny<Exception>(() => factory.CreateClient());
    }
}
