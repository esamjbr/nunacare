using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using NunaCare.Api.Middleware;

namespace NunaCare.Api.Tests;

// SEC-002: MustChangePasswordMiddleware must block all data endpoints when the flag is true,
// and must allow the four auth endpoints unconditionally.
public sealed class MustChangePasswordMiddlewareTests
{
    private static ClaimsPrincipal AuthenticatedUser(bool mustChangePassword)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim("mustChangePassword", mustChangePassword.ToString().ToLowerInvariant())
        };
        return new ClaimsPrincipal(new ClaimsIdentity(claims, authenticationType: "test"));
    }

    private static (MustChangePasswordMiddleware middleware, bool[] nextCalledRef) BuildMiddleware()
    {
        var nextCalled = new bool[1];
        var middleware = new MustChangePasswordMiddleware(_ =>
        {
            nextCalled[0] = true;
            return Task.CompletedTask;
        });
        return (middleware, nextCalled);
    }

    // Proves: a data endpoint is blocked with 403 when MustChangePassword is true.
    [Theory]
    [InlineData("/api/babies")]
    [InlineData("/api/logs")]
    [InlineData("/api/mom-checkins")]
    [InlineData("/api/food-reactions")]
    [InlineData("/api/family-members")]
    public async Task Gate_BlocksDataEndpoints_WhenMustChangePasswordTrue(string path)
    {
        var context = new DefaultHttpContext();
        context.User = AuthenticatedUser(mustChangePassword: true);
        context.Request.Path = path;

        var (middleware, nextCalledRef) = BuildMiddleware();
        await middleware.InvokeAsync(context);

        Assert.False(nextCalledRef[0], "next delegate must not be called for a blocked path");
        Assert.Equal(403, context.Response.StatusCode);
    }

    // Proves: the four auth paths are always let through, even with MustChangePassword true.
    [Theory]
    [InlineData("/api/auth/change-password")]
    [InlineData("/api/auth/me")]
    [InlineData("/api/auth/logout")]
    [InlineData("/api/auth/refresh")]
    public async Task Gate_AllowsAuthPaths_WhenMustChangePasswordTrue(string path)
    {
        var context = new DefaultHttpContext();
        context.User = AuthenticatedUser(mustChangePassword: true);
        context.Request.Path = path;

        var (middleware, nextCalledRef) = BuildMiddleware();
        await middleware.InvokeAsync(context);

        Assert.True(nextCalledRef[0], "next delegate must be called for an allowed auth path");
    }

    // Proves: a regular customer (MustChangePassword false) reaches data endpoints normally.
    [Fact]
    public async Task Gate_AllowsDataEndpoint_WhenMustChangePasswordFalse()
    {
        var context = new DefaultHttpContext();
        context.User = AuthenticatedUser(mustChangePassword: false);
        context.Request.Path = "/api/babies";

        var (middleware, nextCalledRef) = BuildMiddleware();
        await middleware.InvokeAsync(context);

        Assert.True(nextCalledRef[0]);
    }

    // Proves: unauthenticated requests are passed through (authentication middleware handles them).
    [Fact]
    public async Task Gate_AllowsUnauthenticated_Passthrough()
    {
        var context = new DefaultHttpContext();
        // No user set — IsAuthenticated is false
        context.Request.Path = "/api/babies";

        var (middleware, nextCalledRef) = BuildMiddleware();
        await middleware.InvokeAsync(context);

        Assert.True(nextCalledRef[0]);
    }
}
