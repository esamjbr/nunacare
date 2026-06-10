# Build stage — the .NET 8 SDK image has the dotnet CLI that Render's native runtimes lack
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/ ./backend/
RUN dotnet restore backend/NunaCare.Api.csproj
RUN dotnet publish backend/NunaCare.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage — smaller image, just the ASP.NET runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
# Render injects the port via $PORT at runtime; bind to it (8080 fallback for local runs)
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet NunaCare.Api.dll"]
