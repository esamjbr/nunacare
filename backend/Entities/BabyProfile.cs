using NunaCare.Api.Common;

namespace NunaCare.Api.Entities;

public sealed class BabyProfile : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? FeedingType { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Family Family { get; set; } = null!;
    public ICollection<BabyLog> Logs { get; set; } = [];
    public ICollection<Medicine> Medicines { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<WeightEntry> WeightEntries { get; set; } = [];
    public ICollection<DoctorQuestion> DoctorQuestions { get; set; } = [];
    public ICollection<FoodReaction> FoodReactions { get; set; } = [];
}
