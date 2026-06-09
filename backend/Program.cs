using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Microsoft.IdentityModel.Tokens;
using NunaCare.Api.Auth;
using NunaCare.Api.Common;
using NunaCare.Api.Data;
using NunaCare.Api.ExceptionHandling;
using NunaCare.Api.Middleware;
using NunaCare.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .ToDictionary(
                    entry => entry.Key,
                    entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());

            return ApiError.BadRequest("Validation failed.", errors);
        };
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "NunaCare API",
        Version = "v1",
        Description = "Backend foundation for NunaCare."
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is required.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? ["http://localhost:5173"];

// SEC-006: reject localhost/wildcard origins and AllowedHosts wildcard in production.
if (builder.Environment.IsProduction())
{
    foreach (var origin in allowedOrigins)
    {
        if (origin == "*" || origin.Contains("localhost") || origin.Contains("127.0.0.1"))
            throw new InvalidOperationException(
                $"Cors:AllowedOrigins contains '{origin}' which is not valid in Production. " +
                "Set Cors__AllowedOrigins to the actual frontend URL via environment variable.");
    }
    var allowedHostsValue = builder.Configuration["AllowedHosts"] ?? "";
    if (string.IsNullOrWhiteSpace(allowedHostsValue) || allowedHostsValue.Trim() == "*")
        throw new InvalidOperationException(
            "AllowedHosts must be set to explicit host names in Production, not '*'.");
}

// ARCH-014: policy renamed from "FrontendDev" to "Frontend" — it is used in all environments.
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .WithHeaders("Content-Type", "Authorization")
            .WithMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS");
    });
});

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(JwtOptions.SectionName));
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration is required.");

const string knownPlaceholderKey = "dev-only-change-this-signing-key-before-production-32chars";
if (string.IsNullOrWhiteSpace(jwtOptions.SigningKey) || jwtOptions.SigningKey.Length < 32)
    throw new InvalidOperationException("Jwt:SigningKey must be at least 32 characters. Set it via environment variable or user secrets.");
if (jwtOptions.SigningKey == knownPlaceholderKey)
    throw new InvalidOperationException("Jwt:SigningKey is the default development placeholder and must not be used.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(ApiError.Create("Authentication is required.")));
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(ApiError.Create("You do not have permission to perform this action.")));
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(nameof(NunaCare.Api.Entities.UserRole.Admin)));
    options.AddPolicy("CustomerOnly", policy => policy.RequireRole(nameof(NunaCare.Api.Entities.UserRole.Customer)));
});

builder.Services.Configure<AdminSeedOptions>(
    builder.Configuration.GetSection(AdminSeedOptions.SectionName));
builder.Services.Configure<DatabaseOptions>(
    builder.Configuration.GetSection(DatabaseOptions.SectionName));
builder.Services.AddSingleton<IPasswordHashService, Pbkdf2PasswordHashService>();
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services.AddSingleton<ICredentialGenerator, CredentialGenerator>();
builder.Services.AddScoped<IFamilyScopeService, FamilyScopeService>(); // ARCH-001
builder.Services.AddScoped<DatabaseInitializer>();

// SEC-004: rate limit login and refresh endpoints to 10 requests/min per IP.
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth_rate_limit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            JsonSerializer.Serialize(ApiError.Create("Too many requests. Please try again later.")),
            cancellationToken);
    };
});

// SEC-009: global exception handler catches unhandled exceptions before they leak stack traces.
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    await initializer.InitializeAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(); // SEC-009
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseMiddleware<MustChangePasswordMiddleware>(); // SEC-002: gate blocked before authorization runs
app.UseAuthorization();
app.MapControllers();

// SEC-010: swagger hint is dev-only to avoid advertising the API surface in production.
app.MapGet("/", (IWebHostEnvironment env) => Results.Ok(
    env.IsDevelopment()
        ? (object)new { name = "NunaCare API", status = "running", swagger = "/swagger" }
        : (object)new { name = "NunaCare API", status = "running" }
));

app.Run();

public partial class Program;
