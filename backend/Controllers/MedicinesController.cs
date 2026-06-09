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
[Route("api/medicines")]
[Authorize(Policy = "CustomerOnly")]
public sealed class MedicinesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public MedicinesController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    [HttpGet]
    public async Task<IActionResult> GetMedicines([FromQuery] Guid? babyId, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var query = _dbContext.Medicines
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId.Value);

        if (babyId.HasValue)
            query = query.Where(m => m.BabyId == babyId.Value);

        var medicines = await query
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(medicines.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMedicine(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var medicine = await _dbContext.Medicines
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id && m.FamilyId == familyId.Value, cancellationToken);

        if (medicine is null)
            return ApiError.NotFound("Medicine was not found.");

        return Ok(ToDto(medicine));
    }

    [HttpPost]
    public async Task<IActionResult> CreateMedicine(CreateMedicineRequest request, CancellationToken cancellationToken)
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

        DateOnly? startDate = null;
        DateOnly? endDate = null;

        if (request.StartDate is not null && !DateOnly.TryParse(request.StartDate, out var sd))
            return ApiError.BadRequest("Invalid startDate format. Expected YYYY-MM-DD.");
        else if (request.StartDate is not null)
            startDate = DateOnly.Parse(request.StartDate);

        if (request.EndDate is not null && !DateOnly.TryParse(request.EndDate, out var ed))
            return ApiError.BadRequest("Invalid endDate format. Expected YYYY-MM-DD.");
        else if (request.EndDate is not null)
            endDate = DateOnly.Parse(request.EndDate);

        var medicine = new Medicine
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            BabyId = request.BabyId,
            Name = request.Name.Trim(),
            Dose = request.Dose.Trim(),
            Frequency = string.IsNullOrWhiteSpace(request.Frequency) ? null : request.Frequency.Trim(),
            Time = string.IsNullOrWhiteSpace(request.Time) ? null : request.Time.Trim(),
            StartDate = startDate,
            EndDate = endDate,
            ReminderEnabled = request.ReminderEnabled,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        _dbContext.Medicines.Add(medicine);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetMedicine), new { id = medicine.Id }, ToDto(medicine));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateMedicine(Guid id, UpdateMedicineRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var medicine = await _dbContext.Medicines
            .FirstOrDefaultAsync(m => m.Id == id && m.FamilyId == familyId.Value, cancellationToken);

        if (medicine is null)
            return ApiError.NotFound("Medicine was not found.");

        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return ApiError.BadRequest("Medicine name cannot be empty.");
            medicine.Name = request.Name.Trim();
        }

        if (request.Dose is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Dose))
                return ApiError.BadRequest("Dose cannot be empty.");
            medicine.Dose = request.Dose.Trim();
        }

        if (request.Frequency is not null)
            medicine.Frequency = string.IsNullOrWhiteSpace(request.Frequency) ? null : request.Frequency.Trim();

        if (request.Time is not null)
            medicine.Time = string.IsNullOrWhiteSpace(request.Time) ? null : request.Time.Trim();

        if (request.StartDate is not null)
        {
            if (!DateOnly.TryParse(request.StartDate, out var sd))
                return ApiError.BadRequest("Invalid startDate format. Expected YYYY-MM-DD.");
            medicine.StartDate = sd;
        }

        if (request.EndDate is not null)
        {
            if (!DateOnly.TryParse(request.EndDate, out var ed))
                return ApiError.BadRequest("Invalid endDate format. Expected YYYY-MM-DD.");
            medicine.EndDate = ed;
        }

        if (request.ReminderEnabled.HasValue)
            medicine.ReminderEnabled = request.ReminderEnabled.Value;

        if (request.Notes is not null)
            medicine.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(medicine));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMedicine(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var medicine = await _dbContext.Medicines
            .FirstOrDefaultAsync(m => m.Id == id && m.FamilyId == familyId.Value, cancellationToken);

        if (medicine is null)
            return ApiError.NotFound("Medicine was not found.");

        _dbContext.Medicines.Remove(medicine);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static MedicineDto ToDto(Medicine m) =>
        new(m.Id, m.BabyId, m.Name, m.Dose, m.Frequency, m.Time,
            m.StartDate?.ToString("yyyy-MM-dd"), m.EndDate?.ToString("yyyy-MM-dd"),
            m.ReminderEnabled, m.Notes, m.CreatedAt, m.UpdatedAt);
}
