using Microsoft.AspNetCore.Mvc;

namespace NunaCare.Api.Common;

public static class ApiError
{
    public static ObjectResult BadRequest(string message, IDictionary<string, string[]>? errors = null)
    {
        return new BadRequestObjectResult(Create(message, errors));
    }

    public static ObjectResult Unauthorized(string message = "Invalid or expired credentials.")
    {
        return new UnauthorizedObjectResult(Create(message));
    }

    public static ObjectResult Forbidden(string message)
    {
        return new ObjectResult(Create(message))
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }

    public static ObjectResult NotFound(string message)
    {
        return new NotFoundObjectResult(Create(message));
    }

    public static ObjectResult Conflict(string message, IDictionary<string, string[]>? errors = null)
    {
        return new ConflictObjectResult(Create(message, errors));
    }

    public static object Create(string message, IDictionary<string, string[]>? errors = null)
    {
        return new
        {
            message,
            errors = errors ?? new Dictionary<string, string[]>()
        };
    }
}
