using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Auth;
using NunaCare.Api.Common;
using NunaCare.Api.Data;
using NunaCare.Api.DTOs;
using NunaCare.Api.Entities;

namespace NunaCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    // SEC-012: constant-time login — PBKDF2 runs even when username is not found.
    // Format: PBKDF2-SHA256:{iterations}:{salt_base64}:{hash_base64}
    // Salt = 16 zero bytes, Hash = 32 zero bytes. Never matches any real password.
    private const string DecoyPasswordHash =
        "PBKDF2-SHA256:100000:AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    private readonly AppDbContext _dbContext;
    private readonly IPasswordHashService _passwordHashService;
    private readonly ITokenService _tokenService;

    public AuthController(
        AppDbContext dbContext,
        IPasswordHashService passwordHashService,
        ITokenService tokenService)
    {
        _dbContext = dbContext;
        _passwordHashService = passwordHashService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth_rate_limit")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return ApiError.BadRequest("Username and password are required.");
        }

        var username = request.Username.Trim();
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Username == username, cancellationToken);

        if (user is null)
        {
            // SEC-012: run PBKDF2 against a decoy hash so unknown usernames take the same
            // time as wrong-password attempts, preventing username enumeration via timing.
            _passwordHashService.VerifyPassword(request.Password, DecoyPasswordHash);
            return ApiError.Unauthorized("Invalid username or password.");
        }

        if (!_passwordHashService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return ApiError.Unauthorized("Invalid username or password.");
        }

        var blockedResult = GetBlockedResult(user);
        if (blockedResult is not null)
        {
            return blockedResult;
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        var response = await CreateAuthResponseAsync(user, revokeExisting: false, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth_rate_limit")]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return ApiError.BadRequest("Refresh token is required.");
        }

        var tokenHash = _tokenService.HashRefreshToken(request.RefreshToken);
        var storedToken = await _dbContext.RefreshTokens
            .Include(token => token.User)
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null || storedToken.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return ApiError.Unauthorized("Invalid or expired refresh token.");
        }

        if (storedToken.RevokedAt is not null)
        {
            // Token was already used — possible theft; revoke all sessions for this user.
            await RevokeUserRefreshTokensAsync(storedToken.UserId, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return ApiError.Unauthorized("Invalid or expired refresh token.");
        }

        var blockedResult = GetBlockedResult(storedToken.User);
        if (blockedResult is not null)
        {
            return blockedResult;
        }

        storedToken.RevokedAt = DateTimeOffset.UtcNow;
        var response = await CreateAuthResponseAsync(storedToken.User, revokeExisting: false, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(response);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(LogoutRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return ApiError.BadRequest("Refresh token is required.");
        }

        var userId = User.GetUserId();
        var tokenHash = _tokenService.HashRefreshToken(request.RefreshToken);
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(
                token => token.UserId == userId && token.TokenHash == tokenHash,
                cancellationToken);

        if (storedToken is not null && storedToken.RevokedAt is null)
        {
            storedToken.RevokedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
        {
            return ApiError.Unauthorized();
        }

        var blockedResult = GetBlockedResult(user);
        if (blockedResult is not null)
        {
            return blockedResult;
        }

        return Ok(ToUserInfo(user));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        {
            return ApiError.BadRequest("New password must be at least 8 characters.");
        }

        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
        {
            return ApiError.Unauthorized();
        }

        var blockedResult = GetBlockedResult(user);
        if (blockedResult is not null)
        {
            return blockedResult;
        }

        if (!user.MustChangePassword)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                return ApiError.BadRequest("Current password is required.");
            if (!_passwordHashService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                return ApiError.BadRequest("Current password is incorrect.");
        }

        user.PasswordHash = _passwordHashService.HashPassword(request.NewPassword);
        user.MustChangePassword = false;

        // Revoke old tokens and issue fresh ones so the new JWT carries mustChangePassword=false.
        var response = await CreateAuthResponseAsync(user, revokeExisting: true, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(response);
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(
        User user,
        bool revokeExisting,
        CancellationToken cancellationToken)
    {
        if (revokeExisting)
        {
            await RevokeUserRefreshTokensAsync(user.Id, cancellationToken);
        }

        var refreshToken = _tokenService.CreateRefreshToken();
        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _tokenService.HashRefreshToken(refreshToken),
            ExpiresAt = _tokenService.GetRefreshTokenExpiry(),
            CreatedAt = DateTimeOffset.UtcNow
        });

        return new AuthResponse(
            _tokenService.CreateAccessToken(user),
            refreshToken,
            ToUserInfo(user),
            user.Role,
            user.MustChangePassword);
    }

    private async Task RevokeUserRefreshTokensAsync(Guid userId, CancellationToken cancellationToken)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAt == null)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        foreach (var token in activeTokens)
        {
            token.RevokedAt = now;
        }
    }

    private async Task<User?> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        return await _dbContext.Users.FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);
    }

    private static IActionResult? GetBlockedResult(User user)
    {
        if (!user.IsActive)
        {
            return ApiError.Forbidden("Account is inactive.");
        }

        if (user.ExpiresAt is not null && user.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return ApiError.Forbidden("Account has expired.");
        }

        return null;
    }

    private static UserInfoDto ToUserInfo(User user)
    {
        return new UserInfoDto(
            user.Id,
            user.Username,
            user.FullName,
            user.PhoneNumber,
            user.Role,
            user.IsActive,
            user.MustChangePassword,
            user.AccessType,
            user.ExpiresAt,
            user.CreatedAt,
            user.UpdatedAt,
            user.LastLoginAt);
    }
}
