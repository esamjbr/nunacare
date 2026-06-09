namespace NunaCare.Api.Services;

public interface ICredentialGenerator
{
    string GenerateUsername(string? fullName = null);
    string GenerateTemporaryPassword();
}
