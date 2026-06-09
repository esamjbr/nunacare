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
[Route("api/appointments")]
[Authorize(Policy = "CustomerOnly")]
public sealed class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFamilyScopeService _familyScope;

    public AppointmentsController(AppDbContext dbContext, IFamilyScopeService familyScope)
    {
        _dbContext = dbContext;
        _familyScope = familyScope;
    }

    [HttpGet]
    public async Task<IActionResult> GetAppointments([FromQuery] Guid? babyId, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var query = _dbContext.Appointments
            .AsNoTracking()
            .Where(a => a.FamilyId == familyId.Value);

        if (babyId.HasValue)
            query = query.Where(a => a.BabyId == babyId.Value);

        var appointments = await query
            .OrderBy(a => a.Date)
            .ToListAsync(cancellationToken);

        return Ok(appointments.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAppointment(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var appointment = await _dbContext.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && a.FamilyId == familyId.Value, cancellationToken);

        if (appointment is null)
            return ApiError.NotFound("Appointment was not found.");

        return Ok(ToDto(appointment));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAppointment(CreateAppointmentRequest request, CancellationToken cancellationToken)
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

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId.Value,
            BabyId = request.BabyId,
            Title = request.Title.Trim(),
            Type = string.IsNullOrWhiteSpace(request.Type) ? null : request.Type.Trim(),
            Date = date,
            Time = string.IsNullOrWhiteSpace(request.Time) ? null : request.Time.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        _dbContext.Appointments.Add(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, ToDto(appointment));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateAppointment(Guid id, UpdateAppointmentRequest request, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.FamilyId == familyId.Value, cancellationToken);

        if (appointment is null)
            return ApiError.NotFound("Appointment was not found.");

        if (request.Title is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return ApiError.BadRequest("Title cannot be empty.");
            appointment.Title = request.Title.Trim();
        }

        if (request.Type is not null)
            appointment.Type = string.IsNullOrWhiteSpace(request.Type) ? null : request.Type.Trim();

        if (request.Date is not null)
        {
            if (!DateOnly.TryParse(request.Date, out var date))
                return ApiError.BadRequest("Invalid date format. Expected YYYY-MM-DD.");
            appointment.Date = date;
        }

        if (request.Time is not null)
            appointment.Time = string.IsNullOrWhiteSpace(request.Time) ? null : request.Time.Trim();

        if (request.Notes is not null)
            appointment.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(appointment));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAppointment(Guid id, CancellationToken cancellationToken)
    {
        var (isBlocked, familyId) = await _familyScope.ResolveAsync(User.GetUserId(), cancellationToken);
        if (isBlocked)
            return ApiError.Forbidden("Your account is inactive or has expired. Please contact NunaCare support.");
        if (familyId is null)
            return ApiError.NotFound("Family was not found.");

        var appointment = await _dbContext.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.FamilyId == familyId.Value, cancellationToken);

        if (appointment is null)
            return ApiError.NotFound("Appointment was not found.");

        _dbContext.Appointments.Remove(appointment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static AppointmentDto ToDto(Appointment a) =>
        new(a.Id, a.BabyId, a.Title, a.Type, a.Date.ToString("yyyy-MM-dd"),
            a.Time, a.Notes, a.CreatedAt, a.UpdatedAt);
}
