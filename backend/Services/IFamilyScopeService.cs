namespace NunaCare.Api.Services;

// ARCH-001: single authoritative contract for resolving the current user's family scope.
// Authorization uses IsActive + ExpiresAt only; AccessType is a display label (ARCH-005).
public interface IFamilyScopeService
{
    // Returns (IsBlocked=true) when account is inactive or expired (→ 403 renewal message).
    // Returns (IsBlocked=false, FamilyId=null) when active but family record is missing (→ 404).
    // Returns (IsBlocked=false, FamilyId=guid) when fully resolved (→ proceed).
    Task<(bool IsBlocked, Guid? FamilyId)> ResolveAsync(Guid userId, CancellationToken cancellationToken = default);
}
