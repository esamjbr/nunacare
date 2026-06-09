using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

public sealed record MedicineDto(
    Guid Id,
    Guid BabyId,
    string Name,
    string Dose,
    string? Frequency,
    string? Time,
    string? StartDate, // YYYY-MM-DD or null
    string? EndDate,   // YYYY-MM-DD or null
    bool ReminderEnabled,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateMedicineRequest(
    Guid BabyId,
    [Required, StringLength(160)] string Name,
    [Required, StringLength(120)] string Dose,
    [StringLength(120)] string? Frequency,
    [StringLength(20)] string? Time,
    string? StartDate, // YYYY-MM-DD
    string? EndDate,   // YYYY-MM-DD
    bool ReminderEnabled,
    [StringLength(2000)] string? Notes);

public sealed record UpdateMedicineRequest(
    [StringLength(160)] string? Name,
    [StringLength(120)] string? Dose,
    [StringLength(120)] string? Frequency,
    [StringLength(20)] string? Time,
    string? StartDate,
    string? EndDate,
    bool? ReminderEnabled,
    [StringLength(2000)] string? Notes);

public sealed record MedicineDoseDto(
    Guid Id,
    Guid MedicineId,
    Guid BabyId,
    DateTimeOffset ScheduledTime,
    string Status, // scheduled|taken|missed|skipped
    DateTimeOffset? TakenAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateMedicineDoseRequest(
    Guid MedicineId,
    DateTimeOffset ScheduledTime,
    [Required, StringLength(40)] string Status);

public sealed record UpdateMedicineDoseRequest(
    DateTimeOffset? ScheduledTime,
    [StringLength(40)] string? Status,
    DateTimeOffset? TakenAt);
