using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

public sealed record AppointmentDto(
    Guid Id,
    Guid BabyId,
    string Title,
    string? Type,
    string Date, // YYYY-MM-DD
    string? Time,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateAppointmentRequest(
    Guid BabyId,
    [Required, StringLength(200)] string Title,
    [StringLength(80)] string? Type,
    [Required, StringLength(10)] string Date, // YYYY-MM-DD
    [StringLength(20)] string? Time,
    [StringLength(2000)] string? Notes);

public sealed record UpdateAppointmentRequest(
    [StringLength(200)] string? Title,
    [StringLength(80)] string? Type,
    [StringLength(10)] string? Date,
    [StringLength(20)] string? Time,
    [StringLength(2000)] string? Notes);
