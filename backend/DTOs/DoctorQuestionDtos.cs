using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

public sealed record DoctorQuestionDto(
    Guid Id,
    Guid BabyId,
    string Text,
    bool Answered,
    Guid? AppointmentId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateDoctorQuestionRequest(
    Guid BabyId,
    [Required, StringLength(4000)] string Text,
    Guid? AppointmentId);

public sealed record UpdateDoctorQuestionRequest(
    [StringLength(4000)] string? Text,
    bool? Answered,
    Guid? AppointmentId);
