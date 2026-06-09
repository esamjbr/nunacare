using System.ComponentModel.DataAnnotations;
using System.Reflection;
using NunaCare.Api.DTOs;

namespace NunaCare.Api.Tests;

// ARCH-010: Key request DTOs must carry DataAnnotations so the framework rejects
// malformed requests before controller code executes.
public sealed class Arch010ValidationAnnotationsTests
{
    private static bool HasRequired(Type type, string paramName)
    {
        // Records expose parameters as properties. Check constructor params for [Required].
        var ctor = type.GetConstructors().First();
        var param = ctor.GetParameters().FirstOrDefault(p =>
            p.Name != null && string.Equals(p.Name, paramName, StringComparison.OrdinalIgnoreCase));
        if (param is null) return false;
        return param.GetCustomAttribute<RequiredAttribute>() is not null ||
               // Also check the property (positional record properties also carry the attribute).
               type.GetProperty(char.ToUpper(paramName[0]) + paramName[1..])
                   ?.GetCustomAttribute<RequiredAttribute>() is not null;
    }

    // Proves: LoginRequest.Username has [Required].
    [Fact]
    public void LoginRequest_Username_HasRequired()
    {
        Assert.True(HasRequired(typeof(LoginRequest), "Username"),
            "LoginRequest.Username must be [Required]");
    }

    // Proves: LoginRequest.Password has [Required].
    [Fact]
    public void LoginRequest_Password_HasRequired()
    {
        Assert.True(HasRequired(typeof(LoginRequest), "Password"),
            "LoginRequest.Password must be [Required]");
    }

    // Proves: CreateBabyRequest.Name has [Required].
    [Fact]
    public void CreateBabyRequest_Name_HasRequired()
    {
        Assert.True(HasRequired(typeof(CreateBabyRequest), "Name"),
            "CreateBabyRequest.Name must be [Required]");
    }

    // Proves: CreateBabyLogRequest.Type has [Required].
    [Fact]
    public void CreateBabyLogRequest_Type_HasRequired()
    {
        Assert.True(HasRequired(typeof(CreateBabyLogRequest), "Type"),
            "CreateBabyLogRequest.Type must be [Required]");
    }
}
