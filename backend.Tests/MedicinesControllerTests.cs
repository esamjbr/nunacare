using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Controllers;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Tests;

public sealed class MedicinesControllerTests
{
    private sealed class Setup
    {
        public AppDbContext Db { get; }
        public MedicinesController Ctrl { get; }
        public Guid FamilyId { get; }
        public Guid OtherFamilyId { get; }
        public Guid BabyId { get; }

        public Setup()
        {
            var opts = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            Db = new AppDbContext(opts);

            var userId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            FamilyId = Guid.NewGuid();
            OtherFamilyId = Guid.NewGuid();
            BabyId = Guid.NewGuid();

            Db.Users.Add(new User
            {
                Id = userId, Username = "u1", PasswordHash = "h",
                Role = UserRole.Customer, IsActive = true, MustChangePassword = false,
                AccessType = AccessType.Lifetime,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.Users.Add(new User
            {
                Id = otherUserId, Username = "u2", PasswordHash = "h",
                Role = UserRole.Customer, IsActive = true, MustChangePassword = false,
                AccessType = AccessType.Lifetime,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.Families.Add(new Family
            {
                Id = FamilyId, OwnerUserId = userId, Name = "F1",
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.Families.Add(new Family
            {
                Id = OtherFamilyId, OwnerUserId = otherUserId, Name = "F2",
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.BabyProfiles.Add(new BabyProfile
            {
                Id = BabyId, FamilyId = FamilyId, Name = "Alice",
                DateOfBirth = new DateOnly(2024, 1, 1),
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            Db.SaveChanges();

            Ctrl = new MedicinesController(Db, new FamilyScopeService(Db));
            Ctrl.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                    }))
                }
            };
        }
    }

    // Happy path: create returns 201 and fetching by id returns 200.
    [Fact]
    public async Task CreateMedicine_HappyPath_Returns201AndGetReturns200()
    {
        var s = new Setup();

        var createResult = await s.Ctrl.CreateMedicine(
            new CreateMedicineRequest(s.BabyId, "Paracetamol", "5ml", null, null, null, null, false, null),
            CancellationToken.None);

        var created = Assert.IsAssignableFrom<ObjectResult>(createResult);
        Assert.Equal(201, created.StatusCode);

        var id = ((MedicineDto)created.Value!).Id;
        var getResult = await s.Ctrl.GetMedicine(id, CancellationToken.None);
        var ok = Assert.IsAssignableFrom<ObjectResult>(getResult);
        Assert.Equal(200, ok.StatusCode);
    }

    // GetMedicine with unknown id returns 404.
    [Fact]
    public async Task GetMedicine_UnknownId_Returns404()
    {
        var s = new Setup();
        var result = await s.Ctrl.GetMedicine(Guid.NewGuid(), CancellationToken.None);
        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // CreateMedicine for a baby that belongs to another family returns 404.
    [Fact]
    public async Task CreateMedicine_OtherFamilyBaby_Returns404()
    {
        var s = new Setup();
        var otherBabyId = Guid.NewGuid();
        s.Db.BabyProfiles.Add(new BabyProfile
        {
            Id = otherBabyId, FamilyId = s.OtherFamilyId, Name = "Bob",
            DateOfBirth = new DateOnly(2024, 2, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var result = await s.Ctrl.CreateMedicine(
            new CreateMedicineRequest(otherBabyId, "Ibuprofen", "2.5ml", null, null, null, null, false, null),
            CancellationToken.None);

        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // Delete removes the medicine and subsequent GetMedicine returns 404.
    [Fact]
    public async Task DeleteMedicine_ExistingMedicine_Returns204AndGone()
    {
        var s = new Setup();
        var medicineId = Guid.NewGuid();
        s.Db.Medicines.Add(new Medicine
        {
            Id = medicineId, FamilyId = s.FamilyId, BabyId = s.BabyId,
            Name = "Vitamin D", Dose = "400IU",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        s.Db.SaveChanges();

        var deleteResult = await s.Ctrl.DeleteMedicine(medicineId, CancellationToken.None);
        Assert.IsAssignableFrom<NoContentResult>(deleteResult);

        var getResult = await s.Ctrl.GetMedicine(medicineId, CancellationToken.None);
        var notFound = Assert.IsAssignableFrom<ObjectResult>(getResult);
        Assert.Equal(404, notFound.StatusCode);
    }

    // Invalid start date string returns 400.
    [Fact]
    public async Task CreateMedicine_InvalidStartDate_Returns400()
    {
        var s = new Setup();
        var result = await s.Ctrl.CreateMedicine(
            new CreateMedicineRequest(s.BabyId, "X", "1ml", null, null, "bad-date", null, false, null),
            CancellationToken.None);

        var bad = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
    }
}
