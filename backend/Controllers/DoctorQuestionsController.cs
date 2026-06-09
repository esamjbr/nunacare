using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Auth;
using NunaCare.Api.Common;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;
using NunaCare.Api.Services;

namespace NunaCare.Api.Controllers;

[ApiController]
[Route("api/doctor-questions")]
[Authorize(Policy = "CustomerOnly")]
public sealed class DoctorQuestionsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public DoctorQuestionsController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    [HttpGet]
    public async Task<IActionResult> GetDoctorQuestions([FromQuery] Guid? babyId, [FromQuery] Guid? appointmentId, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var query = _dbContext.DoctorQuestions
            .AsNoTracking()
            .Where(q => q.FamilyId == familyId.Value);

        if (babyId.HasValue)
            query = query.Where(q => q.BabyId == babyId.Value);

        if (appointmentId.HasValue)
            query = query.Where(q => q.AppointmentId == appointmentId.Value);

        var questions = await query
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(questions.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDoctorQuestion(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var question = await _dbContext.DoctorQuestions
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == id && q.FamilyId == familyId.Value, cancellationToken);

        if (question is null)
            return ApiError.NotFound("Doctor question was not found.");

        return Ok(ToDto(question));
    }

    [HttpPost]
    public async Task<IActionResult> CreateDoctorQuestion(CreateDoctorQuestionRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var babyExists = await _dbContext.BabyProfiles
            .AnyAsync(b => b.Id == request.BabyId && b.FamilyId == familyId.Value, cancellationToken);
        if (!babyExists)
            return ApiError.NotFound("Baby was not found.");

        if (request.AppointmentId.HasValue)
        {
            var appointmentExists = await _dbContext.Appointments
                .AnyAsync(a => a.Id == request.AppointmentId.Value && a.FamilyId == familyId.Value, cancellationToken);
            if (!appointmentExists)
                return ApiError.NotFound("Appointment was not found.");
        }

        var question = new DoctorQuestion
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            BabyId = request.BabyId,
            Text = request.Text.Trim(),
            Answered = false,
            AppointmentId = request.AppointmentId
        };

        _dbContext.DoctorQuestions.Add(question);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetDoctorQuestion), new { id = question.Id }, ToDto(question));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateDoctorQuestion(Guid id, UpdateDoctorQuestionRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var question = await _dbContext.DoctorQuestions
            .FirstOrDefaultAsync(q => q.Id == id && q.FamilyId == familyId.Value, cancellationToken);

        if (question is null)
            return ApiError.NotFound("Doctor question was not found.");

        if (request.Text is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return ApiError.BadRequest("Text cannot be empty.");
            question.Text = request.Text.Trim();
        }

        if (request.Answered.HasValue)
            question.Answered = request.Answered.Value;

        if (request.AppointmentId is not null)
        {
            if (request.AppointmentId.HasValue)
            {
                var appointmentExists = await _dbContext.Appointments
                    .AnyAsync(a => a.Id == request.AppointmentId.Value && a.FamilyId == familyId.Value, cancellationToken);
                if (!appointmentExists)
                    return ApiError.NotFound("Appointment was not found.");
            }
            question.AppointmentId = request.AppointmentId;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(question));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteDoctorQuestion(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var question = await _dbContext.DoctorQuestions
            .FirstOrDefaultAsync(q => q.Id == id && q.FamilyId == familyId.Value, cancellationToken);

        if (question is null)
            return ApiError.NotFound("Doctor question was not found.");

        _dbContext.DoctorQuestions.Remove(question);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static DoctorQuestionDto ToDto(DoctorQuestion q) =>
        new(q.Id, q.BabyId, q.Text, q.Answered, q.AppointmentId, q.CreatedAt, q.UpdatedAt);
}
