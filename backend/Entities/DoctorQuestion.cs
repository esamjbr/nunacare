using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class DoctorQuestion : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid BabyId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool Answered { get; set; }
    public Guid? AppointmentId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public BabyProfile Baby { get; set; } = null!;
    public Appointment? Appointment { get; set; }
}
