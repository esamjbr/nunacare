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
[Route("api/mom-checkins")]
[Authorize(Policy = "CustomerOnly")]
public sealed class MomCheckInsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public MomCheckInsController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    // GET /api/mom-checkins
    [HttpGet]
    public async Task<IActionResult> GetMomCheckIns(CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var entities = await _dbContext.MomCheckIns
            .AsNoTracking()
            .Where(ci => ci.FamilyId == familyId.Value)
            .OrderByDescending(ci => ci.Date)
            .ToListAsync(cancellationToken);

        return Ok(entities.Select(ToDto));
    }

    // GET /api/mom-checkins/{id}  (API-002)
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMomCheckIn(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var checkIn = await _dbContext.MomCheckIns
            .AsNoTracking()
            .FirstOrDefaultAsync(ci => ci.Id == id && ci.FamilyId == familyId.Value, cancellationToken);

        if (checkIn is null)
            return ApiError.NotFound("Mom check-in was not found.");

        return Ok(ToDto(checkIn));
    }

    // POST /api/mom-checkins
    [HttpPost]
    public async Task<IActionResult> CreateMomCheckIn(CreateMomCheckInRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        if (!DateOnly.TryParse(request.Date, out var date))
            return ApiError.BadRequest("Invalid date format. Expected YYYY-MM-DD.");

        // Upsert: if a check-in already exists for this family on this date, update it.
        var existing = await _dbContext.MomCheckIns
            .FirstOrDefaultAsync(ci => ci.FamilyId == familyId.Value && ci.Date == date, cancellationToken);

        if (existing is not null)
        {
            existing.Mood = request.Mood.Trim();
            existing.WaterCups = request.WaterCups;
            existing.WalkingMinutes = request.WalkingMinutes;
            existing.PainLevel = request.PainLevel;
            existing.BleedingNote = string.IsNullOrWhiteSpace(request.BleedingNote) ? null : request.BleedingNote.Trim();
            existing.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

            await _dbContext.SaveChangesAsync(cancellationToken);
            return Ok(ToDto(existing));
        }

        var mood = request.Mood.Trim();
        var checkIn = new MomCheckIn
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            Date = date,
            Mood = mood,
            WaterCups = request.WaterCups,
            WalkingMinutes = request.WalkingMinutes,
            PainLevel = request.PainLevel,
            BleedingNote = string.IsNullOrWhiteSpace(request.BleedingNote) ? null : request.BleedingNote.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        _dbContext.MomCheckIns.Add(checkIn);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetMomCheckIn), new { id = checkIn.Id }, ToDto(checkIn));
    }

    // PATCH /api/mom-checkins/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateMomCheckIn(Guid id, UpdateMomCheckInRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var checkIn = await _dbContext.MomCheckIns
            .FirstOrDefaultAsync(ci => ci.Id == id && ci.FamilyId == familyId.Value, cancellationToken);

        if (checkIn is null)
            return ApiError.NotFound("Mom check-in was not found.");

        if (request.Date is not null)
        {
            if (!DateOnly.TryParse(request.Date, out var date))
                return ApiError.BadRequest("Invalid date format. Expected YYYY-MM-DD.");
            checkIn.Date = date;
        }

        if (request.Mood is not null)
            checkIn.Mood = request.Mood.Trim();

        if (request.WaterCups is not null) checkIn.WaterCups = request.WaterCups;
        if (request.WalkingMinutes is not null) checkIn.WalkingMinutes = request.WalkingMinutes;
        if (request.PainLevel is not null) checkIn.PainLevel = request.PainLevel.Value;

        if (request.BleedingNote is not null)
            checkIn.BleedingNote = string.IsNullOrWhiteSpace(request.BleedingNote) ? null : request.BleedingNote.Trim();

        if (request.Notes is not null)
            checkIn.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(checkIn));
    }

    // DELETE /api/mom-checkins/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMomCheckIn(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var checkIn = await _dbContext.MomCheckIns
            .FirstOrDefaultAsync(ci => ci.Id == id && ci.FamilyId == familyId.Value, cancellationToken);

        if (checkIn is null)
            return ApiError.NotFound("Mom check-in was not found.");

        _dbContext.MomCheckIns.Remove(checkIn);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ARCH-008: FamilyId not included in outward DTO
    private static MomCheckInDto ToDto(MomCheckIn ci) =>
        new(ci.Id, ci.Date.ToString("yyyy-MM-dd"), ci.Mood, ci.PainLevel,
            ci.BleedingNote, ci.WaterCups, ci.WalkingMinutes, ci.Notes, ci.CreatedAt, ci.UpdatedAt);
}
