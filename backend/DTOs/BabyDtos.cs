using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

public sealed record BabyDto(
    Guid Id,
    string Name,
    DateOnly DateOfBirth,
    string? Gender,
    string? FeedingType,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

// ARCH-010: DataAnnotations added for uniform validation.
public sealed record CreateBabyRequest(
    [Required, StringLength(160)] string Name,
    DateOnly DateOfBirth,
    [StringLength(40)] string? Gender,
    [StringLength(80)] string? FeedingType);

public sealed record UpdateBabyRequest(
    [StringLength(160)] string? Name,
    DateOnly? DateOfBirth,
    [StringLength(40)] string? Gender,
    [StringLength(80)] string? FeedingType);
