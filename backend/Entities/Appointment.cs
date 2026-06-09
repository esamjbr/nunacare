using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class Appointment : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid BabyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Type { get; set; }
    public DateOnly Date { get; set; }
    public string? Time { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public BabyProfile Baby { get; set; } = null!;
    public ICollection<DoctorQuestion> DoctorQuestions { get; set; } = [];
}
