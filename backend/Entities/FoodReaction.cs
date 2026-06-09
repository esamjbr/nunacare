using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class FoodReaction : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid BabyId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public DateOnly TriedDate { get; set; }
    public string Liked { get; set; } = string.Empty;
    public bool? Rash { get; set; }
    public bool? Vomiting { get; set; }
    public bool? Constipation { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public BabyProfile Baby { get; set; } = null!;
}
