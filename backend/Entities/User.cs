using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class User : IAuditableEntity
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public bool MustChangePassword { get; set; }
    public AccessType AccessType { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }

    public ICollection<Family> OwnedFamilies { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
