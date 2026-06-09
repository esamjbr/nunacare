using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Common;
using NunaCare.Api.Entities;

namespace NunaCare.Api.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<BabyProfile> BabyProfiles => Set<BabyProfile>();
    public DbSet<BabyLog> BabyLogs => Set<BabyLog>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<MedicineDose> MedicineDoses => Set<MedicineDose>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<DoctorQuestion> DoctorQuestions => Set<DoctorQuestion>();
    public DbSet<FoodReaction> FoodReactions => Set<FoodReaction>();
    public DbSet<MomCheckIn> MomCheckIns => Set<MomCheckIn>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public override int SaveChanges()
    {
        ApplyAuditTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureFamilies(modelBuilder);
        ConfigureFamilyMembers(modelBuilder);
        ConfigureBabyProfiles(modelBuilder);
        ConfigureBabyLogs(modelBuilder);
        ConfigureMedicines(modelBuilder);
        ConfigureMedicineDoses(modelBuilder);
        ConfigureAppointments(modelBuilder);
        ConfigureWeightEntries(modelBuilder);
        ConfigureDoctorQuestions(modelBuilder);
        ConfigureFoodReactions(modelBuilder);
        ConfigureMomCheckIns(modelBuilder);
        ConfigureRefreshTokens(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<User>();
        entity.HasKey(user => user.Id);
        entity.HasIndex(user => user.Username).IsUnique();
        entity.Property(user => user.Username).HasMaxLength(120).IsRequired();
        entity.Property(user => user.PasswordHash).HasMaxLength(512).IsRequired();
        entity.Property(user => user.FullName).HasMaxLength(160);
        entity.Property(user => user.PhoneNumber).HasMaxLength(40);
        entity.Property(user => user.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        entity.Property(user => user.AccessType).HasConversion<string>().HasMaxLength(32).IsRequired();
    }

    private static void ConfigureFamilies(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Family>();
        entity.HasKey(family => family.Id);
        entity.HasIndex(family => family.OwnerUserId).IsUnique(); // DB-002
        entity.Property(family => family.Name).HasMaxLength(160).IsRequired();
        entity.HasOne(family => family.OwnerUser)
            .WithMany(user => user.OwnedFamilies)
            .HasForeignKey(family => family.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private static void ConfigureFamilyMembers(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<FamilyMember>();
        entity.HasKey(member => member.Id);
        entity.HasIndex(member => member.FamilyId);
        entity.Property(member => member.Name).HasMaxLength(160).IsRequired();
        entity.Property(member => member.Role).HasMaxLength(80).IsRequired();
        entity.Property(member => member.PermissionsJson).HasColumnType("jsonb").IsRequired();
        entity.HasOne(member => member.Family)
            .WithMany(family => family.Members)
            .HasForeignKey(member => member.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureBabyProfiles(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<BabyProfile>();
        entity.HasKey(baby => baby.Id);
        entity.HasAlternateKey(baby => new { baby.Id, baby.FamilyId }); // DB-001: alternate key supporting composite FKs
        entity.HasIndex(baby => baby.FamilyId);
        entity.Property(baby => baby.Name).HasMaxLength(160).IsRequired();
        entity.Property(baby => baby.Gender).HasMaxLength(40);
        entity.Property(baby => baby.FeedingType).HasMaxLength(80);
        entity.HasOne(baby => baby.Family)
            .WithMany(family => family.BabyProfiles)
            .HasForeignKey(baby => baby.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureBabyLogs(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<BabyLog>();
        entity.HasKey(log => log.Id);
        entity.HasIndex(log => new { log.FamilyId, log.BabyId });
        entity.HasIndex(log => new { log.FamilyId, log.BabyId, log.LoggedAt });
        entity.Property(log => log.Type).HasMaxLength(80).IsRequired();
        entity.Property(log => log.DataJson).HasColumnType("jsonb").IsRequired();
        // DB-001: composite FK enforces log.FamilyId == BabyProfile.FamilyId for that BabyId
        entity.HasOne(log => log.Baby)
            .WithMany(baby => baby.Logs)
            .HasForeignKey(log => new { log.BabyId, log.FamilyId })
            .HasPrincipalKey(baby => new { baby.Id, baby.FamilyId })
            .OnDelete(DeleteBehavior.Cascade);
        // Caregiver attribution: nullable FK to FamilyMember. SetNull on member delete so
        // historical logs survive (creator simply becomes unknown).
        entity.HasOne(log => log.CreatedByMember)
            .WithMany()
            .HasForeignKey(log => log.CreatedByFamilyMemberId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private static void ConfigureMedicines(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Medicine>();
        entity.HasKey(medicine => medicine.Id);
        entity.HasIndex(medicine => new { medicine.FamilyId, medicine.BabyId });
        entity.Property(medicine => medicine.Name).HasMaxLength(160).IsRequired();
        entity.Property(medicine => medicine.Dose).HasMaxLength(120).IsRequired();
        entity.Property(medicine => medicine.Frequency).HasMaxLength(120);
        entity.Property(medicine => medicine.Time).HasMaxLength(20);
        entity.Property(medicine => medicine.Notes).HasMaxLength(2000);
        // DB-001: composite FK enforces medicine.FamilyId == BabyProfile.FamilyId
        entity.HasOne(medicine => medicine.Baby)
            .WithMany(baby => baby.Medicines)
            .HasForeignKey(medicine => new { medicine.BabyId, medicine.FamilyId })
            .HasPrincipalKey(baby => new { baby.Id, baby.FamilyId })
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureMedicineDoses(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<MedicineDose>();
        entity.HasKey(dose => dose.Id);
        entity.HasIndex(dose => new { dose.FamilyId, dose.BabyId });
        entity.HasIndex(dose => dose.MedicineId);
        entity.Property(dose => dose.Status).HasMaxLength(40).IsRequired();
        // DB-001: composite FK enforces dose.FamilyId == BabyProfile.FamilyId
        entity.HasOne(dose => dose.Baby)
            .WithMany()
            .HasForeignKey(dose => new { dose.BabyId, dose.FamilyId })
            .HasPrincipalKey(baby => new { baby.Id, baby.FamilyId })
            .OnDelete(DeleteBehavior.NoAction);
        entity.HasOne(dose => dose.Medicine)
            .WithMany(medicine => medicine.Doses)
            .HasForeignKey(dose => dose.MedicineId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureAppointments(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Appointment>();
        entity.HasKey(appointment => appointment.Id);
        entity.HasIndex(appointment => new { appointment.FamilyId, appointment.BabyId });
        entity.HasIndex(appointment => new { appointment.FamilyId, appointment.BabyId, appointment.Date });
        entity.Property(appointment => appointment.Title).HasMaxLength(200).IsRequired();
        entity.Property(appointment => appointment.Type).HasMaxLength(80);
        entity.Property(appointment => appointment.Time).HasMaxLength(20);
        entity.Property(appointment => appointment.Notes).HasMaxLength(2000);
        // DB-001: composite FK enforces appointment.FamilyId == BabyProfile.FamilyId
        entity.HasOne(appointment => appointment.Baby)
            .WithMany(baby => baby.Appointments)
            .HasForeignKey(appointment => new { appointment.BabyId, appointment.FamilyId })
            .HasPrincipalKey(baby => new { baby.Id, baby.FamilyId })
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureWeightEntries(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<WeightEntry>();
        entity.HasKey(weight => weight.Id);
        entity.HasIndex(weight => new { weight.FamilyId, weight.BabyId });
        entity.HasIndex(weight => new { weight.FamilyId, weight.BabyId, weight.Date });
        entity.Property(weight => weight.Value).HasPrecision(8, 3);
        entity.Property(weight => weight.Unit).HasMaxLength(16).IsRequired();
        entity.Property(weight => weight.Notes).HasMaxLength(2000);
        // DB-001: composite FK enforces weight.FamilyId == BabyProfile.FamilyId
        entity.HasOne(weight => weight.Baby)
            .WithMany(baby => baby.WeightEntries)
            .HasForeignKey(weight => new { weight.BabyId, weight.FamilyId })
            .HasPrincipalKey(baby => new { baby.Id, baby.FamilyId })
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureDoctorQuestions(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<DoctorQuestion>();
        entity.HasKey(question => question.Id);
        entity.HasIndex(question => new { question.FamilyId, question.BabyId });
        entity.HasIndex(question => question.AppointmentId);
        entity.Property(question => question.Text).HasMaxLength(4000).IsRequired();
        // DB-001: composite FK enforces question.FamilyId == BabyProfile.FamilyId
        entity.HasOne(question => question.Baby)
            .WithMany(baby => baby.DoctorQuestions)
            .HasForeignKey(question => new { question.BabyId, question.FamilyId })
            .HasPrincipalKey(baby => new { baby.Id, baby.FamilyId })
            .OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(question => question.Appointment)
            .WithMany(appointment => appointment.DoctorQuestions)
            .HasForeignKey(question => question.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private static void ConfigureFoodReactions(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<FoodReaction>();
        entity.HasKey(reaction => reaction.Id);
        entity.HasIndex(reaction => new { reaction.FamilyId, reaction.BabyId });
        entity.HasIndex(reaction => new { reaction.FamilyId, reaction.BabyId, reaction.FoodName });
        entity.Property(reaction => reaction.FoodName).HasMaxLength(160).IsRequired();
        entity.Property(reaction => reaction.Liked).HasMaxLength(40).IsRequired(); // DB-005
        entity.Property(reaction => reaction.Notes).HasMaxLength(2000);
        // DB-001: composite FK enforces reaction.FamilyId == BabyProfile.FamilyId
        entity.HasOne(reaction => reaction.Baby)
            .WithMany(baby => baby.FoodReactions)
            .HasForeignKey(reaction => new { reaction.BabyId, reaction.FamilyId })
            .HasPrincipalKey(baby => new { baby.Id, baby.FamilyId })
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureMomCheckIns(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<MomCheckIn>();
        entity.HasKey(checkIn => checkIn.Id);
        entity.HasIndex(checkIn => new { checkIn.FamilyId, checkIn.Date }).IsUnique();
        entity.Property(checkIn => checkIn.Mood).HasMaxLength(80).IsRequired(); // DB-005
        entity.Property(checkIn => checkIn.BleedingNote).HasMaxLength(1000);
        entity.Property(checkIn => checkIn.Notes).HasMaxLength(2000);
        entity.HasOne(checkIn => checkIn.Family)
            .WithMany(family => family.MomCheckIns)
            .HasForeignKey(checkIn => checkIn.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureRefreshTokens(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<RefreshToken>();
        entity.HasKey(token => token.Id);
        entity.HasIndex(token => token.UserId);
        entity.HasIndex(token => token.TokenHash).IsUnique();
        entity.Property(token => token.TokenHash).HasMaxLength(512).IsRequired();
        entity.HasOne(token => token.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private void ApplyAuditTimestamps()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
