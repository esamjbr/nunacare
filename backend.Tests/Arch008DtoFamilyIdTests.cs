using System.Reflection;
using NunaCare.Api.DTOs;

namespace NunaCare.Api.Tests;

// ARCH-008: FamilyId must not appear in outward-facing DTOs for FoodReaction, MomCheckIn,
// and FamilyMember. A client that receives FamilyId could pass it back and might receive
// data they should not if the server ever naively trusted it.
public sealed class Arch008DtoFamilyIdTests
{
    // Proves: FoodReactionDto has no FamilyId property.
    [Fact]
    public void FoodReactionDto_HasNoFamilyIdProperty()
    {
        var props = typeof(FoodReactionDto).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        Assert.DoesNotContain(props, p =>
            p.Name.Equals("FamilyId", StringComparison.OrdinalIgnoreCase));
    }

    // Proves: MomCheckInDto has no FamilyId property.
    [Fact]
    public void MomCheckInDto_HasNoFamilyIdProperty()
    {
        var props = typeof(MomCheckInDto).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        Assert.DoesNotContain(props, p =>
            p.Name.Equals("FamilyId", StringComparison.OrdinalIgnoreCase));
    }

    // Proves: FamilyMemberDto has no FamilyId property.
    [Fact]
    public void FamilyMemberDto_HasNoFamilyIdProperty()
    {
        var props = typeof(FamilyMemberDto).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        Assert.DoesNotContain(props, p =>
            p.Name.Equals("FamilyId", StringComparison.OrdinalIgnoreCase));
    }
}
