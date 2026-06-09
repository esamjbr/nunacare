using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using NunaCare.Api.ExceptionHandling;

namespace NunaCare.Api.Tests;

// SEC-009: GlobalExceptionHandler must catch any unhandled exception, return 500,
// and write a JSON body with a "message" field — never a raw stack trace.
public sealed class GlobalExceptionHandlerTests
{
    private static GlobalExceptionHandler BuildHandler() =>
        new(NullLogger<GlobalExceptionHandler>.Instance);

    // Proves: handler returns true (exception handled), sets 500, writes JSON with message.
    [Fact]
    public async Task TryHandleAsync_ReturnsTrue_Sets500_WritesJsonMessage()
    {
        var handler = BuildHandler();
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var handled = await handler.TryHandleAsync(context, new Exception("kaboom"), CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(500, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.TryGetProperty("message", out _));
    }

    // Proves: response body does not contain any exception type name or stack trace.
    [Fact]
    public async Task TryHandleAsync_BodyDoesNotLeakExceptionDetails()
    {
        var handler = BuildHandler();
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await handler.TryHandleAsync(
            context,
            new InvalidOperationException("secret internal detail"),
            CancellationToken.None);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        Assert.DoesNotContain("secret internal detail", body);
        Assert.DoesNotContain("InvalidOperationException", body);
    }

    // Proves: handler copes with a nested exception without itself throwing.
    [Fact]
    public async Task TryHandleAsync_HandlesNestedException_Returns500()
    {
        var handler = BuildHandler();
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var handled = await handler.TryHandleAsync(
            context,
            new InvalidOperationException("outer", new NullReferenceException("inner")),
            CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(500, context.Response.StatusCode);
    }
}
