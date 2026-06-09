using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

// ARCH-008: FamilyId removed from outward DTO — callers must not trust it for auth.
public sealed record FoodReactionDto(
    Guid Id,
    Guid BabyId,
    string FoodName,
    string TriedDate, // YYYY-MM-DD
    string Liked, // yes|no|neutral
    bool Rash,
    bool Vomiting,
    bool Constipation,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record CreateFoodReactionRequest(
    Guid BabyId,
    [Required, StringLength(200)] string FoodName,
    [Required, StringLength(10)] string TriedDate, // YYYY-MM-DD
    [Required, StringLength(10)] string Liked,
    bool Rash,
    bool Vomiting,
    bool Constipation,
    string? Notes
);

public sealed record UpdateFoodReactionRequest(
    [StringLength(200)] string? FoodName,
    [StringLength(10)] string? TriedDate, // YYYY-MM-DD
    [StringLength(10)] string? Liked, // yes|no|neutral
    bool? Rash,
    bool? Vomiting,
    bool? Constipation,
    string? Notes
);
