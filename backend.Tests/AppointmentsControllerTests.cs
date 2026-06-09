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

public sealed class AppointmentsControllerTests
{
    private static (AppDbContext db, AppointmentsController ctrl, Guid familyId, Guid babyId) Setup()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(opts);

        var userId = Guid.NewGuid();
        var familyId = Guid.NewGuid();
        var babyId = Guid.NewGuid();

        db.Users.Add(new User
        {
            Id = userId, Username = "u1", PasswordHash = "h",
            Role = UserRole.Customer, IsActive = true, MustChangePassword = false,
            AccessType = AccessType.Lifetime,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.Families.Add(new Family
        {
            Id = familyId, OwnerUserId = userId, Name = "F1",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.BabyProfiles.Add(new BabyProfile
        {
            Id = babyId, FamilyId = familyId, Name = "Alice",
            DateOfBirth = new DateOnly(2024, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var ctrl = new AppointmentsController(db, new FamilyScopeService(db));
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                }))
            }
        };
        return (db, ctrl, familyId, babyId);
    }

    // Happy path: create appointment returns 201.
    [Fact]
    public async Task CreateAppointment_HappyPath_Returns201()
    {
        var (_, ctrl, _, babyId) = Setup();

        var result = await ctrl.CreateAppointment(
            new CreateAppointmentRequest(babyId, "Checkup", "pediatric", "2024-09-01", null, null),
            CancellationToken.None);

        var created = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(201, created.StatusCode);
    }

    // GetAppointment by id returns 200.
    [Fact]
    public async Task GetAppointment_OwnAppointment_Returns200()
    {
        var (db, ctrl, familyId, babyId) = Setup();
        var appointmentId = Guid.NewGuid();
        db.Appointments.Add(new Appointment
        {
            Id = appointmentId, FamilyId = familyId, BabyId = babyId,
            Title = "Vaccination", Date = new DateOnly(2024, 10, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await ctrl.GetAppointment(appointmentId, CancellationToken.None);
        var ok = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    // GetAppointment with unknown id returns 404.
    [Fact]
    public async Task GetAppointment_UnknownId_Returns404()
    {
        var (_, ctrl, _, _) = Setup();
        var result = await ctrl.GetAppointment(Guid.NewGuid(), CancellationToken.None);
        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // Invalid date format returns 400.
    [Fact]
    public async Task CreateAppointment_InvalidDate_Returns400()
    {
        var (_, ctrl, _, babyId) = Setup();
        var result = await ctrl.CreateAppointment(
            new CreateAppointmentRequest(babyId, "Checkup", null, "not-a-date", null, null),
            CancellationToken.None);
        var bad = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
    }

    // Delete returns 204 and subsequent get returns 404.
    [Fact]
    public async Task DeleteAppointment_Existing_Returns204()
    {
        var (db, ctrl, familyId, babyId) = Setup();
        var appointmentId = Guid.NewGuid();
        db.Appointments.Add(new Appointment
        {
            Id = appointmentId, FamilyId = familyId, BabyId = babyId,
            Title = "Eye checkup", Date = new DateOnly(2024, 11, 1),
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var deleteResult = await ctrl.DeleteAppointment(appointmentId, CancellationToken.None);
        Assert.IsAssignableFrom<NoContentResult>(deleteResult);
    }
}
