using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class MomCheckIn : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public DateOnly Date { get; set; }
    public string Mood { get; set; } = string.Empty;
    public int? PainLevel { get; set; }
    public string? BleedingNote { get; set; }
    public int? WaterCups { get; set; }
    public int? WalkingMinutes { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Family Family { get; set; } = null!;
}
