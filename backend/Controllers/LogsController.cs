using System.Text.Json;
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
[Route("api/logs")]
[Authorize(Policy = "CustomerOnly")]
public sealed class LogsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public LogsController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    // GET /api/logs
    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] Guid? babyId,
        [FromQuery] string? type,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var query = _dbContext.BabyLogs
            .AsNoTracking()
            .Where(log => log.FamilyId == familyId);

        if (babyId is not null)
            query = query.Where(log => log.BabyId == babyId);

        if (!string.IsNullOrWhiteSpace(type))
        {
            var normalizedType = NormalizeType(type);
            query = query.Where(log => log.Type == normalizedType);
        }

        if (from is not null)
            query = query.Where(log => log.LoggedAt >= from);

        if (to is not null)
            query = query.Where(log => log.LoggedAt <= to);

        var logs = await query
            .OrderByDescending(log => log.LoggedAt)
            .ThenByDescending(log => log.CreatedAt)
            .ToListAsync(cancellationToken);

        // Resolve caregiver names at read time (join), batched — never stored on the log.
        var memberIds = logs
            .Where(log => log.CreatedByFamilyMemberId.HasValue)
            .Select(log => log.CreatedByFamilyMemberId!.Value)
            .Distinct()
            .ToList();

        var names = memberIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _dbContext.FamilyMembers
                .AsNoTracking()
                .Where(member => member.FamilyId == familyId && memberIds.Contains(member.Id))
                .ToDictionaryAsync(member => member.Id, member => member.Name, cancellationToken);

        return Ok(logs.Select(log => ToDto(log, ResolveName(log, names))));
    }

    // GET /api/logs/{id}  (API-002)
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLog(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var log = await _dbContext.BabyLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id && l.FamilyId == familyId, cancellationToken);

        if (log is null)
            return ApiError.NotFound("Log was not found.");

        var name = await ResolveMemberNameAsync(log.CreatedByFamilyMemberId, familyId.Value, cancellationToken);
        return Ok(ToDto(log, name));
    }

    // POST /api/logs
    [HttpPost]
    public async Task<IActionResult> CreateLog(CreateBabyLogRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Type))
            return ApiError.BadRequest("Log type is required.");

        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var babyExists = await _dbContext.BabyProfiles
            .AnyAsync(baby => baby.Id == request.BabyId && baby.FamilyId == familyId, cancellationToken);

        if (!babyExists)
            return ApiError.NotFound("Baby profile was not found.");

        var dataError = ValidateData(request.Data);
        if (dataError is not null)
            return ApiError.BadRequest(dataError);

        if (request.CreatedByFamilyMemberId.HasValue)
        {
            var memberExists = await _dbContext.FamilyMembers
                .AnyAsync(m => m.Id == request.CreatedByFamilyMemberId.Value && m.FamilyId == familyId.Value, cancellationToken);
            if (!memberExists)
                return ApiError.NotFound("Family member was not found.");
        }

        var log = new BabyLog
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            BabyId = request.BabyId,
            Type = NormalizeType(request.Type),
            DataJson = NormalizeJson(request.Data),
            LoggedAt = request.LoggedAt ?? DateTimeOffset.UtcNow,
            CreatedByFamilyMemberId = request.CreatedByFamilyMemberId
        };

        _dbContext.BabyLogs.Add(log);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var name = await ResolveMemberNameAsync(log.CreatedByFamilyMemberId, familyId.Value, cancellationToken);
        return CreatedAtAction(nameof(GetLog), new { id = log.Id }, ToDto(log, name));
    }

    // PATCH /api/logs/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateLog(Guid id, UpdateBabyLogRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var log = await _dbContext.BabyLogs
            .FirstOrDefaultAsync(l => l.Id == id && l.FamilyId == familyId, cancellationToken);

        if (log is null)
            return ApiError.NotFound("Log was not found.");

        if (request.Type is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Type))
                return ApiError.BadRequest("Log type cannot be empty.");
            log.Type = NormalizeType(request.Type);
        }

        if (request.Data is not null)
        {
            var dataError = ValidateData(request.Data.Value);
            if (dataError is not null)
                return ApiError.BadRequest(dataError);
            log.DataJson = NormalizeJson(request.Data.Value);
        }

        if (request.LoggedAt is not null)
            log.LoggedAt = request.LoggedAt.Value;

        if (request.CreatedByFamilyMemberId.HasValue)
        {
            var memberExists = await _dbContext.FamilyMembers
                .AnyAsync(m => m.Id == request.CreatedByFamilyMemberId.Value && m.FamilyId == familyId.Value, cancellationToken);
            if (!memberExists)
                return ApiError.NotFound("Family member was not found.");
            log.CreatedByFamilyMemberId = request.CreatedByFamilyMemberId;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        var name = await ResolveMemberNameAsync(log.CreatedByFamilyMemberId, familyId.Value, cancellationToken);
        return Ok(ToDto(log, name));
    }

    // DELETE /api/logs/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteLog(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var log = await _dbContext.BabyLogs
            .FirstOrDefaultAsync(l => l.Id == id && l.FamilyId == familyId, cancellationToken);

        if (log is null)
            return ApiError.NotFound("Log was not found.");

        _dbContext.BabyLogs.Remove(log);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static BabyLogDto ToDto(BabyLog log, string? createdByName) =>
        new(log.Id, log.BabyId, log.Type, ParseJson(log.DataJson), log.LoggedAt, log.CreatedAt, log.UpdatedAt,
            log.CreatedByFamilyMemberId, createdByName);

    private static string? ResolveName(BabyLog log, IReadOnlyDictionary<Guid, string> names) =>
        log.CreatedByFamilyMemberId is Guid memberId && names.TryGetValue(memberId, out var name) ? name : null;

    private async Task<string?> ResolveMemberNameAsync(Guid? memberId, Guid familyId, CancellationToken cancellationToken)
    {
        if (memberId is null)
            return null;

        return await _dbContext.FamilyMembers
            .AsNoTracking()
            .Where(member => member.Id == memberId.Value && member.FamilyId == familyId)
            .Select(member => member.Name)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static string NormalizeType(string type)
    {
        var trimmed = type.Trim();
        return string.Concat(trimmed[..1].ToUpperInvariant(), trimmed[1..].ToLowerInvariant());
    }

    private const int MaxDataJsonLength = 65_536;

    private static string NormalizeJson(JsonElement data) =>
        data.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null ? "{}" : data.GetRawText();

    private static JsonElement ParseJson(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 32 });
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            using var fallback = JsonDocument.Parse("{}");
            return fallback.RootElement.Clone();
        }
    }

    private static string? ValidateData(JsonElement data)
    {
        if (data.ValueKind is not (JsonValueKind.Undefined or JsonValueKind.Null or JsonValueKind.Object))
            return "Data must be a JSON object.";

        if (data.ValueKind is JsonValueKind.Object)
        {
            var raw = data.GetRawText();
            if (raw.Length > MaxDataJsonLength)
                return $"Data exceeds the maximum allowed size of {MaxDataJsonLength} bytes.";
        }

        return null;
    }
}
