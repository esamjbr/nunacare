using System.Text.Json;
using System.Text.Json.Serialization;

namespace NunaCare.Api.Entities;

// ARCH-004: typed value object replacing manual JSON dict parsing in FamilyMembersController.
// Serializes with camelCase property names to match the existing stored JSON format.
public sealed record FamilyMemberPermissions(
    [property: JsonPropertyName("canAddLogs")] bool CanAddLogs,
    [property: JsonPropertyName("canViewLogs")] bool CanViewLogs,
    [property: JsonPropertyName("canManageMedicines")] bool CanManageMedicines,
    [property: JsonPropertyName("canExportReports")] bool CanExportReports)
{
    public static readonly FamilyMemberPermissions Empty = new(false, false, false, false);

    public static FamilyMemberPermissions Parse(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<FamilyMemberPermissions>(json) ?? Empty;
        }
        catch (JsonException)
        {
            return Empty;
        }
    }

    public string Serialize() => JsonSerializer.Serialize(this);
}
