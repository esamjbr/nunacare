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

// ARCH-016: MedicineDose carries FamilyId + BabyId for direct query performance.
// Consistency is enforced by the composite FK (BabyId, FamilyId) → BabyProfile (DB-001).
// FamilyId is stamped from the scope service — never trusted from the request body.
[ApiController]
[Route("api/medicine-doses")]
[Authorize(Policy = "CustomerOnly")]
public sealed class MedicineDosesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public MedicineDosesController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    [HttpGet]
    public async Task<IActionResult> GetMedicineDoses([FromQuery] Guid? medicineId, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var query = _dbContext.MedicineDoses
            .AsNoTracking()
            .Where(d => d.FamilyId == familyId.Value);

        if (medicineId.HasValue)
            query = query.Where(d => d.MedicineId == medicineId.Value);

        var doses = await query
            .OrderBy(d => d.ScheduledTime)
            .ToListAsync(cancellationToken);

        return Ok(doses.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMedicineDose(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var dose = await _dbContext.MedicineDoses
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && d.FamilyId == familyId.Value, cancellationToken);

        if (dose is null)
            return ApiError.NotFound("Medicine dose was not found.");

        return Ok(ToDto(dose));
    }

    [HttpPost]
    public async Task<IActionResult> CreateMedicineDose(CreateMedicineDoseRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var medicine = await _dbContext.Medicines
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.MedicineId && m.FamilyId == familyId.Value, cancellationToken);

        if (medicine is null)
            return ApiError.NotFound("Medicine was not found.");

        var status = request.Status.Trim().ToLowerInvariant();
        if (status is not ("scheduled" or "taken" or "missed" or "skipped"))
            return ApiError.BadRequest("Invalid status. Expected: scheduled, taken, missed, or skipped.");

        var dose = new MedicineDose
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            BabyId = medicine.BabyId,
            MedicineId = medicine.Id,
            ScheduledTime = request.ScheduledTime,
            Status = status
        };

        _dbContext.MedicineDoses.Add(dose);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetMedicineDose), new { id = dose.Id }, ToDto(dose));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateMedicineDose(Guid id, UpdateMedicineDoseRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var dose = await _dbContext.MedicineDoses
            .FirstOrDefaultAsync(d => d.Id == id && d.FamilyId == familyId.Value, cancellationToken);

        if (dose is null)
            return ApiError.NotFound("Medicine dose was not found.");

        if (request.ScheduledTime.HasValue)
            dose.ScheduledTime = request.ScheduledTime.Value;

        if (request.Status is not null)
        {
            var status = request.Status.Trim().ToLowerInvariant();
            if (status is not ("scheduled" or "taken" or "missed" or "skipped"))
                return ApiError.BadRequest("Invalid status. Expected: scheduled, taken, missed, or skipped.");
            dose.Status = status;
        }

        if (request.TakenAt.HasValue)
            dose.TakenAt = request.TakenAt;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(dose));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMedicineDose(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var dose = await _dbContext.MedicineDoses
            .FirstOrDefaultAsync(d => d.Id == id && d.FamilyId == familyId.Value, cancellationToken);

        if (dose is null)
            return ApiError.NotFound("Medicine dose was not found.");

        _dbContext.MedicineDoses.Remove(dose);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static MedicineDoseDto ToDto(MedicineDose d) =>
        new(d.Id, d.MedicineId, d.BabyId, d.ScheduledTime, d.Status, d.TakenAt, d.CreatedAt, d.UpdatedAt);
}
