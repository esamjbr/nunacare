using Microsoft.AspNetCore.Mvc;

namespace NunaCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "NunaCare API",
            timestamp = DateTimeOffset.UtcNow
        });
    }
}
