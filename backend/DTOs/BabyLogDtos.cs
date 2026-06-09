using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace NunaCare.Api.DTOs;

public sealed record BabyLogDto(
    Guid Id,
    Guid BabyId,
    string Type,
    JsonElement Data,
    DateTimeOffset LoggedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    Guid? CreatedByFamilyMemberId,
    string? CreatedByName);

// ARCH-010: DataAnnotations added for uniform validation.
public sealed record CreateBabyLogRequest(
    Guid BabyId,
    [Required] string Type,
    JsonElement Data,
    DateTimeOffset? LoggedAt,
    Guid? CreatedByFamilyMemberId = null);

public sealed record UpdateBabyLogRequest(
    string? Type,
    JsonElement? Data,
    DateTimeOffset? LoggedAt,
    Guid? CreatedByFamilyMemberId = null);
