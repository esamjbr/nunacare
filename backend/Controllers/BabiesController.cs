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
[Route("api/babies")]
[Authorize(Policy = "CustomerOnly")]
public sealed class BabiesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public BabiesController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    // GET /api/babies
    [HttpGet]
    public async Task<IActionResult> GetBabies(CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        // ARCH-007: AsNoTracking for read-only query; project in memory to avoid EF Core
        // translating the ToDto method call as an expression tree node.
        var babies = await _dbContext.BabyProfiles
            .AsNoTracking()
            .Where(baby => baby.FamilyId == familyId)
            .OrderBy(baby => baby.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(babies.Select(ToDto));
    }

    // GET /api/babies/{id}  (API-002: single-resource endpoint for CreatedAtAction)
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBaby(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var baby = await _dbContext.BabyProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id && b.FamilyId == familyId, cancellationToken);

        if (baby is null)
            return ApiError.NotFound("Baby profile was not found.");

        return Ok(ToDto(baby));
    }

    // POST /api/babies
    [HttpPost]
    public async Task<IActionResult> CreateBaby(CreateBabyRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiError.BadRequest("Baby name is required.");

        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var baby = new BabyProfile
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            Name = request.Name.Trim(),
            DateOfBirth = request.DateOfBirth,
            Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim(),
            FeedingType = string.IsNullOrWhiteSpace(request.FeedingType) ? null : request.FeedingType.Trim()
        };

        _dbContext.BabyProfiles.Add(baby);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetBaby), new { id = baby.Id }, ToDto(baby));
    }

    // PATCH /api/babies/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateBaby(Guid id, UpdateBabyRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var baby = await _dbContext.BabyProfiles
            .FirstOrDefaultAsync(b => b.Id == id && b.FamilyId == familyId, cancellationToken);

        if (baby is null)
            return ApiError.NotFound("Baby profile was not found.");

        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return ApiError.BadRequest("Baby name cannot be empty.");
            baby.Name = request.Name.Trim();
        }

        if (request.DateOfBirth is not null)
            baby.DateOfBirth = request.DateOfBirth.Value;

        if (request.Gender is not null)
            baby.Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim();

        if (request.FeedingType is not null)
            baby.FeedingType = string.IsNullOrWhiteSpace(request.FeedingType) ? null : request.FeedingType.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(baby));
    }

    // DELETE /api/babies/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBaby(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var baby = await _dbContext.BabyProfiles
            .FirstOrDefaultAsync(b => b.Id == id && b.FamilyId == familyId, cancellationToken);

        if (baby is null)
            return ApiError.NotFound("Baby profile was not found.");

        _dbContext.BabyProfiles.Remove(baby);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static BabyDto ToDto(BabyProfile baby) =>
        new(baby.Id, baby.Name, baby.DateOfBirth, baby.Gender, baby.FeedingType, baby.CreatedAt, baby.UpdatedAt);
}
