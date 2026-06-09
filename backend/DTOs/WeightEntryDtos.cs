using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

public sealed record WeightEntryDto(
    Guid Id,
    Guid BabyId,
    decimal Value,
    string Unit,      // kg | lb
    string Date,      // YYYY-MM-DD
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateWeightEntryRequest(
    Guid BabyId,
    decimal Value,
    [Required, StringLength(16)] string Unit,
    [Required, StringLength(10)] string Date, // YYYY-MM-DD
    [StringLength(2000)] string? Notes);

public sealed record UpdateWeightEntryRequest(
    decimal? Value,
    [StringLength(16)] string? Unit,
    [StringLength(10)] string? Date,
    [StringLength(2000)] string? Notes);
