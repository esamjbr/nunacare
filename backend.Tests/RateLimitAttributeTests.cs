using System.Reflection;
using Microsoft.AspNetCore.RateLimiting;
using NunaCare.Api.Controllers;

namespace NunaCare.Api.Tests;

// SEC-004: Login and Refresh must carry [EnableRateLimiting] so ASP.NET Core's
// rate-limiter middleware enforces the auth_rate_limit policy.
// Behavioral testing (429 after N requests) requires a live HTTP server; this
// test proves the attribute is wired — no attribute means no enforcement.
public sealed class RateLimitAttributeTests
{
    // Proves: Login carries the rate-limit attribute.
    [Fact]
    public void Login_HasEnableRateLimitingAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.Login));
        Assert.NotNull(method);
        var attr = method!.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("auth_rate_limit", attr!.PolicyName);
    }

    // Proves: Refresh carries the rate-limit attribute.
    [Fact]
    public void Refresh_HasEnableRateLimitingAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.Refresh));
        Assert.NotNull(method);
        var attr = method!.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attr);
        Assert.Equal("auth_rate_limit", attr!.PolicyName);
    }

    // Proves: ChangePassword does NOT have the rate-limit attribute — it's already
    // protected by [Authorize] and the MustChangePassword gate.
    [Fact]
    public void ChangePassword_DoesNotHaveRateLimitAttribute()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.ChangePassword));
        Assert.NotNull(method);
        var attr = method!.GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.Null(attr);
    }
}
