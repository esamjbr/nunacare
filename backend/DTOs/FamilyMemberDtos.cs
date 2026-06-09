using System.ComponentModel.DataAnnotations;

namespace NunaCare.Api.DTOs;

// ARCH-008: FamilyId removed from outward DTO — callers must not trust it for auth.
public sealed record FamilyMemberDto(
    Guid Id,
    string Name,
    string Role, // parent|caregiver|readonly
    bool CanAddLogs,
    bool CanViewLogs,
    bool CanManageMedicines,
    bool CanExportReports,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record CreateFamilyMemberRequest(
    [Required, StringLength(200)] string Name,
    [Required, StringLength(20)] string Role,
    bool CanAddLogs,
    bool CanViewLogs,
    bool CanManageMedicines,
    bool CanExportReports
);

public sealed record UpdateFamilyMemberRequest(
    [StringLength(200)] string? Name,
    [StringLength(20)] string? Role,
    bool? CanAddLogs,
    bool? CanViewLogs,
    bool? CanManageMedicines,
    bool? CanExportReports
);
