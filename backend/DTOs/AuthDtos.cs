using System.ComponentModel.DataAnnotations;
using NunaCare.Api.Entities;

namespace NunaCare.Api.DTOs;

// ARCH-010: DataAnnotations added so InvalidModelStateResponseFactory handles them uniformly.
public sealed record LoginRequest(
    [Required] string Username,
    [Required] string Password);

public sealed record RefreshRequest(string RefreshToken);

public sealed record LogoutRequest(string RefreshToken);

public sealed record ChangePasswordRequest(string? CurrentPassword, string NewPassword);

public sealed record UserInfoDto(
    Guid Id,
    string Username,
    string? FullName,
    string? PhoneNumber,
    UserRole Role,
    bool IsActive,
    bool MustChangePassword,
    AccessType AccessType,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLoginAt);

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserInfoDto User,
    UserRole Role,
    bool MustChangePassword);
