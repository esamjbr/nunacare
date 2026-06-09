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
[Route("api/family-members")]
[Authorize(Policy = "CustomerOnly")]
public sealed class FamilyMembersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public FamilyMembersController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    // GET /api/family-members
    [HttpGet]
    public async Task<IActionResult> GetFamilyMembers(CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var members = await _dbContext.FamilyMembers
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId.Value)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(members.Select(ToDto).ToList());
    }

    // POST /api/family-members
    [HttpPost]
    public async Task<IActionResult> CreateFamilyMember(CreateFamilyMemberRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var role = request.Role.Trim().ToLowerInvariant();
        if (role is not ("parent" or "caregiver" or "readonly"))
            return ApiError.BadRequest("Invalid role.");

        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiError.BadRequest("Name is required.");

        var member = new FamilyMember
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            Name = request.Name.Trim(),
            Role = role
        };

        // ARCH-004: use typed FamilyMemberPermissions instead of anonymous JSON
        member.Permissions = new FamilyMemberPermissions(
            request.CanAddLogs,
            request.CanViewLogs,
            request.CanManageMedicines,
            request.CanExportReports);

        _dbContext.FamilyMembers.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetFamilyMembers), new { id = member.Id }, ToDto(member));
    }

    // PATCH /api/family-members/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateFamilyMember(Guid id, UpdateFamilyMemberRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var member = await _dbContext.FamilyMembers
            .FirstOrDefaultAsync(m => m.Id == id && m.FamilyId == familyId.Value, cancellationToken);

        if (member is null)
            return ApiError.NotFound("Family member was not found.");

        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return ApiError.BadRequest("Name cannot be empty.");
            member.Name = request.Name.Trim();
        }

        if (request.Role is not null)
        {
            var role = request.Role.Trim().ToLowerInvariant();
            if (role is not ("parent" or "caregiver" or "readonly"))
                return ApiError.BadRequest("Invalid role.");
            member.Role = role;
        }

        if (request.CanAddLogs is not null ||
            request.CanViewLogs is not null ||
            request.CanManageMedicines is not null ||
            request.CanExportReports is not null)
        {
            // ARCH-004: typed permissions merge — Parse handles corrupt existing JSON gracefully
            var existing = member.Permissions;
            member.Permissions = new FamilyMemberPermissions(
                request.CanAddLogs ?? existing.CanAddLogs,
                request.CanViewLogs ?? existing.CanViewLogs,
                request.CanManageMedicines ?? existing.CanManageMedicines,
                request.CanExportReports ?? existing.CanExportReports);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(member));
    }

    // DELETE /api/family-members/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFamilyMember(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var member = await _dbContext.FamilyMembers
            .FirstOrDefaultAsync(m => m.Id == id && m.FamilyId == familyId.Value, cancellationToken);

        if (member is null)
            return ApiError.NotFound("Family member was not found.");

        _dbContext.FamilyMembers.Remove(member);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ARCH-008: FamilyId not included in outward DTO
    private static FamilyMemberDto ToDto(FamilyMember m)
    {
        var p = m.Permissions;
        return new FamilyMemberDto(
            m.Id,
            m.Name,
            m.Role,
            p.CanAddLogs,
            p.CanViewLogs,
            p.CanManageMedicines,
            p.CanExportReports,
            m.CreatedAt,
            m.UpdatedAt);
    }
}
