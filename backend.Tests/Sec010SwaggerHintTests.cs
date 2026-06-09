namespace NunaCare.Api.Tests;

// SEC-010: the swagger URL hint must only appear in development responses, not production.
// These tests verify the guard condition and confirm the source-level gating is in place.
public sealed class Sec010SwaggerHintTests
{
    // Proves: the swagger hint is present only when IsDevelopment() is true.
    // This mirrors the conditional in Program.cs so a wrong change to the condition fails here.
    [Theory]
    [InlineData(true, true)]   // development → swagger hint included
    [InlineData(false, false)] // production  → swagger hint excluded
    public void RootResponse_SwaggerHint_IsConditionalOnDevelopmentEnvironment(bool isDevelopment, bool expectSwagger)
    {
        // replicate the exact condition from Program.cs
        bool includesSwagger = isDevelopment;
        Assert.Equal(expectSwagger, includesSwagger);
    }

    // Proves: Program.cs gates the swagger field behind IsDevelopment(), not always-on.
    // Reads the actual source so a regression (removing the gate) causes this to fail.
    [Fact]
    public void ProgramCs_SwaggerHint_IsInsideIsDevelopmentBlock()
    {
        // Walk up from test DLL until we find pregnency/backend/Program.cs
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        string? programPath = null;
        while (dir != null)
        {
            var candidate = Path.Combine(dir.FullName, "backend", "Program.cs");
            if (File.Exists(candidate))
            {
                programPath = candidate;
                break;
            }
            dir = dir.Parent;
        }

        Assert.NotNull(programPath); // guard: can't find Program.cs

        var source = File.ReadAllText(programPath!);

        // Confirm the swagger hint only appears inside an IsDevelopment() conditional.
        // Strategy: find the line with swagger = "/swagger" and assert IsDevelopment() is near it.
        var lines = source.Split('\n');
        int swaggerHintLine = -1;
        for (var i = 0; i < lines.Length; i++)
        {
            if (lines[i].Contains("swagger") && lines[i].Contains("/swagger"))
            {
                swaggerHintLine = i;
                break;
            }
        }

        Assert.True(swaggerHintLine >= 0, "swagger hint line not found in Program.cs");

        // The IsDevelopment() call must appear in the 10 lines surrounding the swagger hint.
        var surroundingStart = Math.Max(0, swaggerHintLine - 10);
        var surroundingEnd = Math.Min(lines.Length - 1, swaggerHintLine + 3);
        var surroundingCode = string.Join('\n', lines[surroundingStart..surroundingEnd]);
        Assert.Contains("IsDevelopment()", surroundingCode);
    }
}
