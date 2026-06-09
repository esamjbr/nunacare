using System.Security.Claims;
using System.Text.Json;
using NunaCare.Api.Common;

namespace NunaCare.Api.Middleware;

public sealed class MustChangePasswordMiddleware
{
    private static readonly PathString[] AllowedPaths =
    [
        new("/api/auth/me"),
        new("/api/auth/change-password"),
        new("/api/auth/logout"),
        new("/api/auth/refresh")
    ];

    private readonly RequestDelegate _next;

    public MustChangePasswordMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true &&
            context.User.FindFirstValue("mustChangePassword") == "true")
        {
            var allowed = AllowedPaths.Any(p => context.Request.Path.StartsWithSegments(p));
            if (!allowed)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    JsonSerializer.Serialize(ApiError.Create("You must change your password before accessing this resource.")));
                return;
            }
        }

        await _next(context);
    }
}
