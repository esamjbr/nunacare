using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NunaCare.Api.Auth;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// SEC-008: CreateCustomer and ResetPassword must set Cache-Control: no-store
// so proxies and browsers never cache temporary passwords.
public sealed class TempPasswordCacheHeaderTests
{
    private static (AppDbContext db, AdminCustomersController controller, DefaultHttpContext httpContext) SetupController()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);

        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new System.IO.MemoryStream();

        var controller = new AdminCustomersController(db, new FakeCredentialGenerator(), new Pbkdf2PasswordHashService(), NullLogger<AdminCustomersController>.Instance);
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        return (db, controller, httpContext);
    }

    // Proves: CreateCustomer response carries Cache-Control: no-store.
    [Fact]
    public async Task CreateCustomer_ResponseHasNoCacheHeader()
    {
        var (_, controller, httpContext) = SetupController();

        var request = new CreateCustomerRequest(null, "Test User", null, null, null, null);
        await controller.CreateCustomer(request, CancellationToken.None);

        Assert.Equal("no-store", httpContext.Response.Headers.CacheControl.ToString());
    }

    // Proves: ResetPassword response carries Cache-Control: no-store.
    [Fact]
    public async Task ResetPassword_ResponseHasNoCacheHeader()
    {
        var (db, controller, httpContext) = SetupController();

        var customerId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = customerId,
            Username = "customer1",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = true,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        await controller.ResetPassword(customerId, CancellationToken.None);

        Assert.Equal("no-store", httpContext.Response.Headers.CacheControl.ToString());
    }

    // Proves: GetCustomer (no temp password) does NOT set Cache-Control: no-store,
    // confirming the header is only applied where sensitive data is returned.
    [Fact]
    public async Task GetCustomer_ResponseDoesNotHaveNoCacheHeader()
    {
        var (db, controller, httpContext) = SetupController();

        var customerId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = customerId,
            Username = "customer2",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        await controller.GetCustomer(customerId, CancellationToken.None);

        Assert.NotEqual("no-store", httpContext.Response.Headers.CacheControl.ToString());
    }

    private sealed class FakeCredentialGenerator : ICredentialGenerator
    {
        public string GenerateUsername(string? fullName = null) => $"user{Guid.NewGuid():N}"[..12];
        public string GenerateTemporaryPassword() => "TempPass_123!";
    }
}
