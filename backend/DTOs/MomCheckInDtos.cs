using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

// ARCH-008: FamilyId removed from outward DTO — callers must not trust it for auth.
public sealed record MomCheckInDto(
    Guid Id,
    string Date, // YYYY-MM-DD
    string Mood, // calm|tired|overwhelmed|sad|in-pain|need-support
    int? PainLevel,
    string? BleedingNote,
    int? WaterCups,
    int? WalkingMinutes,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record CreateMomCheckInRequest(
    [Required, StringLength(10)] string Date, // YYYY-MM-DD
    [Required, StringLength(30)] string Mood,
    int? WaterCups,
    int? WalkingMinutes,
    int PainLevel,
    string? BleedingNote,
    string? Notes
);

public sealed record UpdateMomCheckInRequest(
    [StringLength(10)] string? Date,
    [StringLength(30)] string? Mood,
    int? WaterCups,
    int? WalkingMinutes,
    int? PainLevel,
    string? BleedingNote,
    string? Notes
);
