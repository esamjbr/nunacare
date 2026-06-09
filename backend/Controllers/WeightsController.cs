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
[Route("api/weights")]
[Authorize(Policy = "CustomerOnly")]
public sealed class WeightsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public WeightsController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    [HttpGet]
    public async Task<IActionResult> GetWeightEntries([FromQuery] Guid? babyId, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var query = _dbContext.WeightEntries
            .AsNoTracking()
            .Where(w => w.FamilyId == familyId.Value);

        if (babyId.HasValue)
            query = query.Where(w => w.BabyId == babyId.Value);

        var weights = await query
            .OrderBy(w => w.Date)
            .ToListAsync(cancellationToken);

        return Ok(weights.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWeightEntry(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var weight = await _dbContext.WeightEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id && w.FamilyId == familyId.Value, cancellationToken);

        if (weight is null)
            return ApiError.NotFound("Weight entry was not found.");

        return Ok(ToDto(weight));
    }

    [HttpPost]
    public async Task<IActionResult> CreateWeightEntry(CreateWeightEntryRequest request, CancellationToken cancellationToken)
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

        if (!DateOnly.TryParse(request.Date, out var date))
            return ApiError.BadRequest("Invalid date format. Expected YYYY-MM-DD.");

        var unit = request.Unit.Trim().ToLowerInvariant();
        if (unit is not ("kg" or "lb"))
            return ApiError.BadRequest("Invalid unit. Expected: kg or lb.");

        var weight = new WeightEntry
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            BabyId = request.BabyId,
            Value = request.Value,
            Unit = unit,
            Date = date,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        _dbContext.WeightEntries.Add(weight);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetWeightEntry), new { id = weight.Id }, ToDto(weight));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateWeightEntry(Guid id, UpdateWeightEntryRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var weight = await _dbContext.WeightEntries
            .FirstOrDefaultAsync(w => w.Id == id && w.FamilyId == familyId.Value, cancellationToken);

        if (weight is null)
            return ApiError.NotFound("Weight entry was not found.");

        if (request.Value.HasValue)
            weight.Value = request.Value.Value;

        if (request.Unit is not null)
        {
            var unit = request.Unit.Trim().ToLowerInvariant();
            if (unit is not ("kg" or "lb"))
                return ApiError.BadRequest("Invalid unit. Expected: kg or lb.");
            weight.Unit = unit;
        }

        if (request.Date is not null)
        {
            if (!DateOnly.TryParse(request.Date, out var date))
                return ApiError.BadRequest("Invalid date format. Expected YYYY-MM-DD.");
            weight.Date = date;
        }

        if (request.Notes is not null)
            weight.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(weight));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWeightEntry(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var weight = await _dbContext.WeightEntries
            .FirstOrDefaultAsync(w => w.Id == id && w.FamilyId == familyId.Value, cancellationToken);

        if (weight is null)
            return ApiError.NotFound("Weight entry was not found.");

        _dbContext.WeightEntries.Remove(weight);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static WeightEntryDto ToDto(WeightEntry w) =>
        new(w.Id, w.BabyId, w.Value, w.Unit, w.Date.ToString("yyyy-MM-dd"),
            w.Notes, w.CreatedAt, w.UpdatedAt);
}
