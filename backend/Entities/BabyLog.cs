using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class BabyLog : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid BabyId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string DataJson { get; set; } = "{}";
    public DateTimeOffset LoggedAt { get; set; }

    // Caregiver who created this log. Nullable: existing logs and logs created without
    // an acting caregiver carry null. Name is resolved at read time (join), never stored.
    public Guid? CreatedByFamilyMemberId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public BabyProfile Baby { get; set; } = null!;
    public FamilyMember? CreatedByMember { get; set; }
}
