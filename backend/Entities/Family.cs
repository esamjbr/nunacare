using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class Family : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User OwnerUser { get; set; } = null!;
    public ICollection<FamilyMember> Members { get; set; } = [];
    public ICollection<BabyProfile> BabyProfiles { get; set; } = [];
    public ICollection<MomCheckIn> MomCheckIns { get; set; } = [];
}
