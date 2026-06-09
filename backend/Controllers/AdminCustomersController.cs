using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Auth;
using NunaCare.Api.Common;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Controllers;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminCustomersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ICredentialGenerator _credentialGenerator;
    private readonly IPasswordHashService _passwordHashService;
    private readonly ILogger<AdminCustomersController> _logger;

    public AdminCustomersController(
        AppDbContext dbContext,
        ICredentialGenerator credentialGenerator,
        IPasswordHashService passwordHashService,
        ILogger<AdminCustomersController> logger)
    {
        _dbContext = dbContext;
        _credentialGenerator = credentialGenerator;
        _passwordHashService = passwordHashService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers(CancellationToken cancellationToken)
    {
        // SEC-011: audit-log bulk customer list access.
        _logger.LogInformation("Admin {AdminId} accessed customer list", User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);

        var customers = await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.Customer)
            .OrderByDescending(user => user.CreatedAt)
            .Select(user => new CustomerSummaryDto(
                user.Id,
                user.Username,
                user.FullName,
                // SEC-011: PhoneNumber omitted from bulk list — available only in GetCustomer detail.
                user.IsActive,
                user.MustChangePassword,
                user.AccessType,
                user.ExpiresAt,
                user.CreatedAt,
                user.UpdatedAt,
                user.LastLoginAt))
            .ToListAsync(cancellationToken);

        return Ok(customers);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustomer(CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var username = string.IsNullOrWhiteSpace(request.Username)
            ? await GenerateUniqueUsernameAsync(request.FullName, cancellationToken)
            : request.Username.Trim();

        if (await _dbContext.Users.AnyAsync(user => user.Username == username, cancellationToken))
        {
            return ApiError.Conflict("Username is already in use.", new Dictionary<string, string[]>
            {
                ["username"] = ["Username is already in use."]
            });
        }

        var temporaryPassword = _credentialGenerator.GenerateTemporaryPassword();
        var now = DateTimeOffset.UtcNow;
        var accessType = request.AccessType ?? AccessType.Trial;
        // ARCH-005: Lifetime accounts don't expire; clear any supplied ExpiresAt.
        var expiresAt = accessType == AccessType.Lifetime ? null : request.ExpiresAt;
        var customer = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            PasswordHash = _passwordHashService.HashPassword(temporaryPassword),
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            Role = UserRole.Customer,
            IsActive = true,
            MustChangePassword = true,
            AccessType = accessType,
            ExpiresAt = expiresAt,
            CreatedAt = now,
            UpdatedAt = now
        };

        var family = new Family
        {
            Id = Guid.NewGuid(),
            OwnerUserId = customer.Id,
            Name = string.IsNullOrWhiteSpace(request.FamilyName)
                ? $"{customer.Username}'s Family"
                : request.FamilyName.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Users.Add(customer);
        _dbContext.Families.Add(family);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var detail = ToDetailDto(customer, family);
        var response = new CreateCustomerResponse(detail, customer.Username, temporaryPassword);
        Response.Headers.CacheControl = "no-store"; // SEC-008
        return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCustomer(Guid id, CancellationToken cancellationToken)
    {
        // SEC-011: audit-log individual customer detail access (includes PhoneNumber).
        _logger.LogInformation("Admin {AdminId} accessed customer detail for {CustomerId}",
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, id);

        var customer = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == id && user.Role == UserRole.Customer, cancellationToken);

        if (customer is null)
        {
            return ApiError.NotFound("Customer was not found.");
        }

        var family = await _dbContext.Families
            .AsNoTracking()
            .FirstOrDefaultAsync(family => family.OwnerUserId == customer.Id, cancellationToken);

        return Ok(ToDetailDto(customer, family));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateCustomer(
        Guid id,
        UpdateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Id == id && user.Role == UserRole.Customer, cancellationToken);

        if (customer is null)
        {
            return ApiError.NotFound("Customer was not found.");
        }

        if (request.FullName is not null)
        {
            customer.FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim();
        }

        if (request.PhoneNumber is not null)
        {
            customer.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        }

        if (request.AccessType is not null)
        {
            customer.AccessType = request.AccessType.Value;
            // ARCH-005: Lifetime overrides any existing expiry.
            if (customer.AccessType == AccessType.Lifetime)
                customer.ExpiresAt = null;
        }

        if (request.ExpiresAt is not null && customer.AccessType != AccessType.Lifetime)
        {
            customer.ExpiresAt = request.ExpiresAt;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var family = await _dbContext.Families
            .AsNoTracking()
            .FirstOrDefaultAsync(family => family.OwnerUserId == customer.Id, cancellationToken);

        return Ok(ToDetailDto(customer, family));
    }

    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Id == id && user.Role == UserRole.Customer, cancellationToken);

        if (customer is null)
        {
            return ApiError.NotFound("Customer was not found.");
        }

        var temporaryPassword = _credentialGenerator.GenerateTemporaryPassword();
        customer.PasswordHash = _passwordHashService.HashPassword(temporaryPassword);
        customer.MustChangePassword = true;

        await RevokeCustomerRefreshTokensAsync(customer.Id, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        Response.Headers.CacheControl = "no-store"; // SEC-008
        return Ok(new ResetPasswordResponse(temporaryPassword));
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken cancellationToken)
    {
        var customer = await GetMutableCustomerAsync(id, cancellationToken);
        if (customer is null)
        {
            return ApiError.NotFound("Customer was not found.");
        }

        customer.IsActive = true;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToSummaryDto(customer));
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var customer = await GetMutableCustomerAsync(id, cancellationToken);
        if (customer is null)
        {
            return ApiError.NotFound("Customer was not found.");
        }

        customer.IsActive = false;
        await RevokeCustomerRefreshTokensAsync(customer.Id, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToSummaryDto(customer));
    }

    private async Task<User?> GetMutableCustomerAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Id == id && user.Role == UserRole.Customer, cancellationToken);
    }

    private async Task<string> GenerateUniqueUsernameAsync(string? fullName, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var username = _credentialGenerator.GenerateUsername(fullName);
            var exists = await _dbContext.Users.AnyAsync(user => user.Username == username, cancellationToken);
            if (!exists)
            {
                return username;
            }
        }

        return $"customer{Guid.NewGuid():N}"[..20];
    }

    private async Task RevokeCustomerRefreshTokensAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(token => token.UserId == customerId && token.RevokedAt == null)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        foreach (var token in activeTokens)
        {
            token.RevokedAt = now;
        }
    }

    private static CustomerSummaryDto ToSummaryDto(User customer)
    {
        return new CustomerSummaryDto(
            customer.Id,
            customer.Username,
            customer.FullName,
            // SEC-011: PhoneNumber not included in summary — detail endpoint only.
            customer.IsActive,
            customer.MustChangePassword,
            customer.AccessType,
            customer.ExpiresAt,
            customer.CreatedAt,
            customer.UpdatedAt,
            customer.LastLoginAt);
    }

    private static CustomerDetailDto ToDetailDto(User customer, Family? family)
    {
        return new CustomerDetailDto(
            customer.Id,
            customer.Username,
            customer.FullName,
            customer.PhoneNumber,
            customer.IsActive,
            customer.MustChangePassword,
            customer.AccessType,
            customer.ExpiresAt,
            customer.CreatedAt,
            customer.UpdatedAt,
            customer.LastLoginAt,
            family?.Id,
            family?.Name);
    }
}
