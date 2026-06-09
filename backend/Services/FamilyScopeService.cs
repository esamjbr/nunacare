using Microsoft.EntityFrameworkCore;
using NunaCare.Api.Data;

namespace NunaCare.Api.Services;

public sealed class FamilyScopeService : IFamilyScopeService
{
    private readonly AppDbContext _dbContext;

    public FamilyScopeService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<(bool IsBlocked, Guid? FamilyId)> ResolveAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        // Authorization uses IsActive + ExpiresAt. AccessType is a display label (ARCH-005).
        if (user is null || !user.IsActive || (user.ExpiresAt is not null && user.ExpiresAt <= DateTimeOffset.UtcNow))
            return (IsBlocked: true, FamilyId: null);

        var familyId = await _dbContext.Families
            .Where(f => f.OwnerUserId == userId)
            .Select(f => (Guid?)f.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return (IsBlocked: false, FamilyId: familyId);
    }
}
