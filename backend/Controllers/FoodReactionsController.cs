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
[Route("api/food-reactions")]
[Authorize(Policy = "CustomerOnly")]
public sealed class FoodReactionsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public FoodReactionsController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    // GET /api/food-reactions
    [HttpGet]
    public async Task<IActionResult> GetFoodReactions([FromQuery] Guid? babyId, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var query = _dbContext.FoodReactions
            .AsNoTracking()
            .Where(r => r.FamilyId == familyId.Value);

        if (babyId.HasValue)
            query = query.Where(r => r.BabyId == babyId.Value);

        var entities = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(entities.Select(ToDto));
    }

    // GET /api/food-reactions/{id}  (API-002)
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetFoodReaction(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var reaction = await _dbContext.FoodReactions
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id && r.FamilyId == familyId.Value, cancellationToken);

        if (reaction is null)
            return ApiError.NotFound("Food reaction was not found.");

        return Ok(ToDto(reaction));
    }

    // POST /api/food-reactions
    [HttpPost]
    public async Task<IActionResult> CreateFoodReaction(CreateFoodReactionRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var babyExists = await _dbContext.BabyProfiles
            .AsNoTracking()
            .AnyAsync(b => b.Id == request.BabyId && b.FamilyId == familyId.Value, cancellationToken);

        if (!babyExists)
            return ApiError.NotFound("Baby was not found.");

        // ARCH-009: DateOnly.TryParse avoids the DateTimeOffset→UtcDateTime round-trip that
        // can shift the calendar day on servers in positive UTC-offset timezones.
        if (!DateOnly.TryParse(request.TriedDate, out var triedDate))
            return ApiError.BadRequest("Invalid triedDate format. Expected YYYY-MM-DD.");

        var liked = request.Liked.Trim().ToLowerInvariant();
        if (liked is not ("yes" or "no" or "neutral"))
            return ApiError.BadRequest("Invalid liked value.");

        var reaction = new FoodReaction
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            BabyId = request.BabyId,
            FoodName = request.FoodName.Trim(),
            TriedDate = triedDate,
            Liked = liked,
            Rash = request.Rash,
            Vomiting = request.Vomiting,
            Constipation = request.Constipation,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        _dbContext.FoodReactions.Add(reaction);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetFoodReaction), new { id = reaction.Id }, ToDto(reaction));
    }

    // PATCH /api/food-reactions/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateFoodReaction(Guid id, UpdateFoodReactionRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var reaction = await _dbContext.FoodReactions
            .FirstOrDefaultAsync(r => r.Id == id && r.FamilyId == familyId.Value, cancellationToken);

        if (reaction is null)
            return ApiError.NotFound("Food reaction was not found.");

        if (request.FoodName is not null)
        {
            if (string.IsNullOrWhiteSpace(request.FoodName))
                return ApiError.BadRequest("Food name cannot be empty.");
            reaction.FoodName = request.FoodName.Trim();
        }

        if (request.TriedDate is not null)
        {
            // ARCH-009: DateOnly.TryParse for safe, timezone-independent parsing
            if (!DateOnly.TryParse(request.TriedDate, out var triedDate))
                return ApiError.BadRequest("Invalid triedDate format. Expected YYYY-MM-DD.");
            reaction.TriedDate = triedDate;
        }

        if (request.Liked is not null)
        {
            var liked = request.Liked.Trim().ToLowerInvariant();
            if (liked is not ("yes" or "no" or "neutral"))
                return ApiError.BadRequest("Invalid liked value.");
            reaction.Liked = liked;
        }

        if (request.Rash.HasValue) reaction.Rash = request.Rash.Value;
        if (request.Vomiting.HasValue) reaction.Vomiting = request.Vomiting.Value;
        if (request.Constipation.HasValue) reaction.Constipation = request.Constipation.Value;

        if (request.Notes is not null)
            reaction.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(reaction));
    }

    // DELETE /api/food-reactions/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFoodReaction(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var reaction = await _dbContext.FoodReactions
            .FirstOrDefaultAsync(r => r.Id == id && r.FamilyId == familyId.Value, cancellationToken);

        if (reaction is null)
            return ApiError.NotFound("Food reaction was not found.");

        _dbContext.FoodReactions.Remove(reaction);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ARCH-008: FamilyId not included in outward DTO
    private static FoodReactionDto ToDto(FoodReaction r) =>
        new(r.Id, r.BabyId, r.FoodName, r.TriedDate.ToString("yyyy-MM-dd"), r.Liked,
            r.Rash ?? false, r.Vomiting ?? false, r.Constipation ?? false, r.Notes, r.CreatedAt, r.UpdatedAt);
}
