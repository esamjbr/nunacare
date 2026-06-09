using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Auth;
using NunaCare.Api.Common;
using NunaCare.Api.Data;
using NunaCare.Api.Services;

namespace NunaCare.Api.Controllers;

[ApiController]
[Route("api/account")]
[Authorize(Policy = "CustomerOnly")]
public sealed class AccountController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public AccountController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportData(CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var babies = await _dbContext.BabyProfiles
            .AsNoTracking()
            .Where(b => b.FamilyId == familyId.Value)
            .Select(b => new { b.Id, b.Name, b.DateOfBirth, b.Gender, b.FeedingType })
            .ToListAsync(cancellationToken);

        var babyIds = babies.Select(b => b.Id).ToList();

        var logs = await _dbContext.BabyLogs
            .AsNoTracking()
            .Where(l => l.FamilyId == familyId.Value)
            .Select(l => new { l.Id, l.BabyId, l.Type, l.LoggedAt })
            .ToListAsync(cancellationToken);

        var medicines = await _dbContext.Medicines
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId.Value)
            .Select(m => new { m.Id, m.BabyId, m.Name, m.Dose, m.Frequency, m.StartDate, m.EndDate })
            .ToListAsync(cancellationToken);

        var appointments = await _dbContext.Appointments
            .AsNoTracking()
            .Where(a => a.FamilyId == familyId.Value)
            .Select(a => new { a.Id, a.BabyId, a.Title, a.Type, a.Date, a.Time })
            .ToListAsync(cancellationToken);

        var weights = await _dbContext.WeightEntries
            .AsNoTracking()
            .Where(w => w.FamilyId == familyId.Value)
            .Select(w => new { w.Id, w.BabyId, w.Value, w.Unit, w.Date })
            .ToListAsync(cancellationToken);

        var doctorQuestions = await _dbContext.DoctorQuestions
            .AsNoTracking()
            .Where(q => q.FamilyId == familyId.Value)
            .Select(q => new { q.Id, q.BabyId, q.Text, q.Answered, q.AppointmentId })
            .ToListAsync(cancellationToken);

        var foodReactions = await _dbContext.FoodReactions
            .AsNoTracking()
            .Where(r => r.FamilyId == familyId.Value)
            .Select(r => new { r.Id, r.BabyId, r.FoodName, r.Liked, r.TriedDate, r.Notes })
            .ToListAsync(cancellationToken);

        var momCheckIns = await _dbContext.MomCheckIns
            .AsNoTracking()
            .Where(c => c.FamilyId == familyId.Value)
            .Select(c => new { c.Id, c.Date, c.Mood, c.PainLevel, c.WaterCups, c.WalkingMinutes, c.Notes })
            .ToListAsync(cancellationToken);

        var familyMembers = await _dbContext.FamilyMembers
            .AsNoTracking()
            .Where(m => m.FamilyId == familyId.Value)
            .Select(m => new { m.Id, m.Name, m.Role })
            .ToListAsync(cancellationToken);

        var export = new
        {
            exportedAt = DateTimeOffset.UtcNow,
            babies,
            logs,
            medicines,
            appointments,
            weights,
            doctorQuestions,
            foodReactions,
            momCheckIns,
            familyMembers
        };

        return Ok(export);
    }

    [HttpDelete("delete-data")]
    public async Task<IActionResult> DeleteData(CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        // Delete babies — cascade removes logs, medicines, doses, appointments, weights,
        // doctor questions, and food reactions via DB foreign keys.
        var babies = await _dbContext.BabyProfiles
            .Where(b => b.FamilyId == familyId.Value)
            .ToListAsync(cancellationToken);
        _dbContext.BabyProfiles.RemoveRange(babies);

        var momCheckIns = await _dbContext.MomCheckIns
            .Where(c => c.FamilyId == familyId.Value)
            .ToListAsync(cancellationToken);
        _dbContext.MomCheckIns.RemoveRange(momCheckIns);

        var familyMembers = await _dbContext.FamilyMembers
            .Where(m => m.FamilyId == familyId.Value)
            .ToListAsync(cancellationToken);
        _dbContext.FamilyMembers.RemoveRange(familyMembers);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
