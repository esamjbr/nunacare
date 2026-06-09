using NunaCare.Api.Entities;

namespace NunaCare.Api.DTOs;

// SEC-011: PhoneNumber is PII — excluded from the bulk list, available only in the detail endpoint.
public sealed record CustomerSummaryDto(
    Guid Id,
    string Username,
    string? FullName,
    bool IsActive,
    bool MustChangePassword,
    AccessType AccessType,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLoginAt);

public sealed record CustomerDetailDto(
    Guid Id,
    string Username,
    string? FullName,
    string? PhoneNumber,
    bool IsActive,
    bool MustChangePassword,
    AccessType AccessType,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLoginAt,
    Guid? FamilyId,
    string? FamilyName);

public sealed record CreateCustomerRequest(
    string? Username,
    string? FullName,
    string? PhoneNumber,
    AccessType? AccessType,
    DateTimeOffset? ExpiresAt,
    string? FamilyName);

public sealed record CreateCustomerResponse(
    CustomerDetailDto Customer,
    string Username,
    string TemporaryPassword);

public sealed record UpdateCustomerRequest(
    string? FullName,
    string? PhoneNumber,
    AccessType? AccessType,
    DateTimeOffset? ExpiresAt);

public sealed record ResetPasswordResponse(string TemporaryPassword);
