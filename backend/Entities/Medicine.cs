using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class Medicine : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid BabyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dose { get; set; } = string.Empty;
    public string? Frequency { get; set; }
    public string? Time { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool ReminderEnabled { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public BabyProfile Baby { get; set; } = null!;
    public ICollection<MedicineDose> Doses { get; set; } = [];
}
