using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class MedicineDose : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid BabyId { get; set; }
    public Guid MedicineId { get; set; }
    public DateTimeOffset ScheduledTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? TakenAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public BabyProfile Baby { get; set; } = null!;
    public Medicine Medicine { get; set; } = null!;
}
