using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class FamilyMember : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string PermissionsJson { get; set; } = "{}";

    // ARCH-004: typed accessor — serializes/deserializes on demand, no EF Core mapping change.
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public FamilyMemberPermissions Permissions
    {
        get => FamilyMemberPermissions.Parse(PermissionsJson);
        set => PermissionsJson = value.Serialize();
    }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Family Family { get; set; } = null!;
}
