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

public sealed class DoctorQuestionsControllerTests
{
    private static (AppDbContext db, DoctorQuestionsController ctrl, Guid familyId, Guid babyId) Setup()
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

        var ctrl = new DoctorQuestionsController(db, new FamilyScopeService(db));
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

    // Happy path: create returns 201.
    [Fact]
    public async Task CreateDoctorQuestion_HappyPath_Returns201()
    {
        var (_, ctrl, _, babyId) = Setup();
        var result = await ctrl.CreateDoctorQuestion(
            new CreateDoctorQuestionRequest(babyId, "Is this rash normal?", null),
            CancellationToken.None);
        var created = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(201, created.StatusCode);
    }

    // GetDoctorQuestion returns 200 for own question.
    [Fact]
    public async Task GetDoctorQuestion_OwnQuestion_Returns200()
    {
        var (db, ctrl, familyId, babyId) = Setup();
        var questionId = Guid.NewGuid();
        db.DoctorQuestions.Add(new DoctorQuestion
        {
            Id = questionId, FamilyId = familyId, BabyId = babyId,
            Text = "Any concerns?", Answered = false,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await ctrl.GetDoctorQuestion(questionId, CancellationToken.None);
        var ok = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    // GetDoctorQuestion with unknown id returns 404.
    [Fact]
    public async Task GetDoctorQuestion_UnknownId_Returns404()
    {
        var (_, ctrl, _, _) = Setup();
        var result = await ctrl.GetDoctorQuestion(Guid.NewGuid(), CancellationToken.None);
        var notFound = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    // Update: mark question as answered returns 200 and persists.
    [Fact]
    public async Task UpdateDoctorQuestion_MarkAnswered_Persists()
    {
        var (db, ctrl, familyId, babyId) = Setup();
        var questionId = Guid.NewGuid();
        db.DoctorQuestions.Add(new DoctorQuestion
        {
            Id = questionId, FamilyId = familyId, BabyId = babyId,
            Text = "Weight concern?", Answered = false,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await ctrl.UpdateDoctorQuestion(
            questionId,
            new UpdateDoctorQuestionRequest(null, true, null),
            CancellationToken.None);

        var ok = Assert.IsAssignableFrom<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);

        var updated = db.DoctorQuestions.Find(questionId);
        Assert.True(updated!.Answered);
    }

    // Delete returns 204.
    [Fact]
    public async Task DeleteDoctorQuestion_Existing_Returns204()
    {
        var (db, ctrl, familyId, babyId) = Setup();
        var questionId = Guid.NewGuid();
        db.DoctorQuestions.Add(new DoctorQuestion
        {
            Id = questionId, FamilyId = familyId, BabyId = babyId,
            Text = "Diet question", Answered = false,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        db.SaveChanges();

        var result = await ctrl.DeleteDoctorQuestion(questionId, CancellationToken.None);
        Assert.IsAssignableFrom<NoContentResult>(result);
    }
}
