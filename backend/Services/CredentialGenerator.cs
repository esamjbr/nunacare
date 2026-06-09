using System.Security.Cryptography;
using System.Text;

namespace NunaCare.Api.Services;

public sealed class CredentialGenerator : ICredentialGenerator
{
    private const string PasswordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private const string UsernameAlphabet = "abcdefghijkmnopqrstuvwxyz23456789";

    public string GenerateUsername(string? fullName = null)
    {
        var prefix = "customer";
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            var cleaned = new string(fullName
                .Trim()
                .ToLowerInvariant()
                .Where(char.IsLetterOrDigit)
                .Take(12)
                .ToArray());

            if (!string.IsNullOrWhiteSpace(cleaned))
            {
                prefix = cleaned;
            }
        }

        return $"{prefix}{RandomString(6, UsernameAlphabet)}";
    }

    public string GenerateTemporaryPassword()
    {
        return RandomString(16, PasswordAlphabet);
    }

    private static string RandomString(int length, string alphabet)
    {
        var builder = new StringBuilder(length);
        for (var i = 0; i < length; i++)
        {
            var index = RandomNumberGenerator.GetInt32(alphabet.Length);
            builder.Append(alphabet[index]);
        }

        return builder.ToString();
    }
}
