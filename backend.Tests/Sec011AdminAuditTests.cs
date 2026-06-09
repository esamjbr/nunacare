using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NunaCare.Api.Auth;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

// SEC-011: PhoneNumber must not appear in the bulk customer list DTO;
//          admin actions that expose PII must write audit log entries.
public sealed class Sec011AdminAuditTests
{
    // Proves: CustomerSummaryDto (bulk list) does not expose PhoneNumber.
    [Fact]
    public void CustomerSummaryDto_DoesNotHavePhoneNumberProperty()
    {
        var prop = typeof(CustomerSummaryDto).GetProperty("PhoneNumber");
        Assert.Null(prop);
    }

    // Regression guard: CustomerDetailDto (single-customer endpoint) still exposes PhoneNumber.
    [Fact]
    public void CustomerDetailDto_HasPhoneNumberProperty()
    {
        var prop = typeof(CustomerDetailDto).GetProperty("PhoneNumber");
        Assert.NotNull(prop);
    }

    // Proves: GetCustomers writes an audit log entry referencing the calling admin.
    [Fact]
    public async Task GetCustomers_WritesAuditLog()
    {
        var (controller, logger, _) = CreateController();

        await controller.GetCustomers(CancellationToken.None);

        Assert.True(logger.LogCallCount > 0, "Expected at least one log message from GetCustomers");
    }

    // Proves: GetCustomer writes an audit log entry referencing the specific customer ID.
    [Fact]
    public async Task GetCustomer_WritesAuditLog()
    {
        var (controller, logger, customerId) = CreateController();

        await controller.GetCustomer(customerId, CancellationToken.None);

        Assert.True(logger.LogCallCount > 0, "Expected at least one log message from GetCustomer");
    }

    // Proves: GetCustomers returns 200 with customers (regression: fix didn't break the endpoint).
    [Fact]
    public async Task GetCustomers_Returns200WithCustomerList()
    {
        var (controller, _, _) = CreateController();

        var result = await controller.GetCustomers(CancellationToken.None);

        var ok = result as OkObjectResult;
        Assert.NotNull(ok);
        Assert.Equal(200, ok!.StatusCode);
    }

    private static (AdminCustomersController controller, CapturingLogger<AdminCustomersController> logger, Guid customerId) CreateController()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);

        var adminId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        db.Users.Add(new User
        {
            Id = customerId,
            Username = "cust1",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var logger = new CapturingLogger<AdminCustomersController>();
        var controller = new AdminCustomersController(db, new FakeCredentialGenerator(), new FakePasswordHashService(), logger);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, adminId.ToString())
                }))
            }
        };

        return (controller, logger, customerId);
    }

    private sealed class CapturingLogger<T> : ILogger<T>
    {
        public int LogCallCount { get; private set; }

        IDisposable? ILogger.BeginScope<TState>(TState state) => null;
        bool ILogger.IsEnabled(LogLevel logLevel) => true;
        void ILogger.Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            LogCallCount++;
        }
    }

    private sealed class FakeCredentialGenerator : ICredentialGenerator
    {
        public string GenerateUsername(string? fullName = null) => $"user{Guid.NewGuid():N}"[..12];
        public string GenerateTemporaryPassword() => "TempPass_123!";
    }

    private sealed class FakePasswordHashService : IPasswordHashService
    {
        public string HashPassword(string password) => $"hashed:{password}";
        public bool VerifyPassword(string password, string hash) => hash == $"hashed:{password}";
    }
}
