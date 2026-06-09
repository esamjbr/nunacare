# NunaCare

A private baby routine tracker for parents and families.

---

## Running Locally

### Prerequisites

Install these before starting:

| Tool | Version | Install |
|---|---|---|
| Node.js | 18 or higher | [nodejs.org](https://nodejs.org) |
| .NET SDK | 8.0 or higher | [dot.net](https://dotnet.microsoft.com/download) |
| Docker + Docker Compose | any recent version | [docker.com](https://www.docker.com) |
| dotnet-ef CLI | 8.0 or higher | `dotnet tool install --global dotnet-ef` |

Verify everything is installed:

```bash
node -v
dotnet --version
docker --version
dotnet ef --version
```

---

### Step 1 — Clone the repo

```bash
git clone <your-repo-url>
cd pregnency
```

---

### Step 2 — Start the database

The project uses a PostgreSQL 16 Docker container. Start it:

```bash
docker compose up -d
```

This creates and starts a container called `nunacare-postgres`:
- Host port: **5433** (mapped to 5432 inside the container)
- Database: `nunacare`
- Username: `nunacare`
- Password: `nunacare_dev_password`

> **Note:** Port 5433 is used intentionally to avoid conflicts with any locally installed PostgreSQL instance that may already be using port 5432.

Wait until the container is healthy before continuing:

```bash
docker compose ps
# The "Status" column should show "healthy"
```

---

### Step 3 — Configure backend secrets

The backend requires a JWT signing key (minimum 32 characters). This is stored in .NET user secrets so it never ends up in the repo.

Run these once from the `backend/` folder:

```bash
cd backend

dotnet user-secrets init

dotnet user-secrets set "Jwt:SigningKey" "nunacare-dev-secret-key-change-in-production-2026"
dotnet user-secrets set "AdminSeed:Username" "admin"
dotnet user-secrets set "AdminSeed:Password" "NunaAdmin@2026!"

cd ..
```

The admin username and password set here are what you will use to log into the admin dashboard the first time.

---

### Step 4 — Install frontend dependencies

From the repo root:

```bash
npm install
```

---

### Step 5 — Install backend dependencies

```bash
cd backend
dotnet restore
cd ..
```

---

### Step 6 — Apply database migrations

Migrations run automatically on `dotnet run` because `Database:AutoMigrateOnStartup` is `true` in `appsettings.Development.json`. You can also apply them manually:

```bash
cd backend
dotnet ef database update
cd ..
```

---

### Step 7 — Start the backend

```bash
cd backend
dotnet run
```

The API starts on **http://localhost:5225**.
Swagger UI is available at **http://localhost:5225/swagger** (Development only).

On first startup the admin account is created automatically from the user secrets you set in Step 3.

Leave this terminal running.

---

### Step 8 — Start the frontend

Open a second terminal in the repo root:

```bash
npm run dev
```

The app opens at **http://localhost:5173**.

---

### Step 9 — Log in

1. Open http://localhost:5173 in your browser.
2. Log in with the admin credentials you set in Step 3 (e.g. `admin` / `NunaAdmin@2026!`).
3. Create a customer account from the admin dashboard.
4. Log out and log in as the customer to use the baby tracker.

---

### Running the test suite

Tests use an in-memory database — no running Postgres or backend server required:

```bash
cd backend.Tests
dotnet test
```

Expected output: `Passed! - Failed: 0, Passed: 131`

---

## Deploying to Production

Target stack: **Supabase** (PostgreSQL) + **Render** (backend API) + **Netlify** (frontend).
All three have free tiers. Deployment is manual — no CI/CD pipeline is configured.

---

### Step 1 — Push the repo to GitHub

If you have not already:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

All three services (Supabase, Render, Netlify) connect directly to your GitHub repo.

---

### Step 2 — Create the production database on Supabase

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**. Choose a name (e.g. `nunacare`), set a strong database password, and pick a region close to your users. Click **Create new project**.
3. Wait for the project to finish provisioning (about 1 minute).
4. Go to **Project Settings → Database → Connection string → URI**.
5. Copy the connection string and convert it to Npgsql format. It will look like this:

   ```
   Host=aws-0-eu-central-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.abcxyz;Password=YourPassword;SSL Mode=Require
   ```

   Save this string — you will need it in Steps 3 and 4.

---

### Step 3 — Run migrations against the production database

Run this once from your local machine **before** the first deploy, and again every time you add new migrations:

```bash
ConnectionStrings__DefaultConnection="<your Supabase connection string>" \
  dotnet ef database update --project backend
```

On Windows (PowerShell):

```powershell
$env:ConnectionStrings__DefaultConnection="<your Supabase connection string>"
dotnet ef database update --project backend
```

This creates all tables in the production database. You only need to do this step once per migration.

---

### Step 4 — Deploy the backend on Render

1. Go to [render.com](https://render.com) and sign in.
2. Click **New → Web Service**.
3. Connect your GitHub account and select your repo.
4. Set the following build settings:
   - **Root Directory:** leave blank
   - **Build Command:**
     ```
     dotnet publish backend/NunaCare.Api.csproj -c Release -o out
     ```
   - **Start Command:**
     ```
     dotnet out/NunaCare.Api.dll
     ```
5. Go to **Environment → Add Environment Variable** and add all of these:

   | Key | Value |
   |---|---|
   | `ASPNETCORE_ENVIRONMENT` | `Production` |
   | `ConnectionStrings__DefaultConnection` | Your Supabase connection string from Step 2 |
   | `Jwt__Issuer` | `NunaCare` |
   | `Jwt__Audience` | `NunaCare.Client` |
   | `Jwt__SigningKey` | A random string of at least 32 characters. Generate one: `openssl rand -base64 48` |
   | `Jwt__AccessTokenMinutes` | `15` |
   | `Jwt__RefreshTokenDays` | `30` |
   | `AdminSeed__Username` | Your admin username |
   | `AdminSeed__Password` | A strong admin password (not the dev password) |
   | `Cors__AllowedOrigins__0` | Your Netlify URL — you will know this after Step 5, e.g. `https://nunacare.netlify.app` |
   | `AllowedHosts` | Your Render hostname, e.g. `nunacare-api.onrender.com` |
   | `Database__AutoMigrateOnStartup` | `false` |

   > The app validates these at startup and refuses to start if `Jwt__SigningKey` is missing, or if `Cors__AllowedOrigins` contains `localhost` or `*` in production.

6. Click **Create Web Service**. Render will build and deploy automatically.
7. Once deployed, note your Render URL (e.g. `https://nunacare-api.onrender.com`). You need it for the next step.

**Verify the backend is running:**

```
GET https://<your-render-hostname>/
```

Expected response:
```json
{ "name": "NunaCare API", "status": "running" }
```

> Swagger is intentionally disabled in Production.

---

### Step 5 — Deploy the frontend on Netlify

1. Go to [netlify.com](https://netlify.com) and sign in.
2. Click **Add new site → Import an existing project** → connect GitHub → select your repo.
3. Set the build settings:
   - **Base directory:** leave blank
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Before deploying, add the environment variable. Go to **Site configuration → Environment variables → Add a variable**:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-hostname>` (from Step 4) |

5. Click **Deploy site**. Netlify builds and publishes automatically.
6. After the first deploy, Netlify gives you a URL like `https://nunacare.netlify.app`. Copy it.

---

### Step 6 — Update CORS on Render with the Netlify URL

Now that you have your Netlify URL, go back to Render and update the CORS environment variable:

1. Open your Render web service → **Environment**.
2. Update `Cors__AllowedOrigins__0` to your exact Netlify URL, e.g. `https://nunacare.netlify.app`.
3. Render will trigger a redeploy automatically.

---

### Step 7 — Verify the full flow

1. Open your Netlify URL in a browser.
2. Log in as admin with the credentials you set in `AdminSeed__Username` / `AdminSeed__Password`.
3. Create a customer account from the admin dashboard.
4. Log out and log in as the customer.
5. Create a baby profile and add a feeding log.
6. Log out and log back in — the data should still be there.

---

### Redeploying after code changes

**Backend:** Push to your connected GitHub branch. Render detects the push and redeploys automatically. If the push includes new migrations, run Step 3 first before or immediately after pushing.

**Frontend:** Push to your connected GitHub branch. Netlify detects the push and rebuilds automatically.

---

### Rolling back

**Backend (Render):** Dashboard → Deploys → click any previous deploy → **Re-deploy**. If the deploy included a database migration, roll the database back first:

```bash
# Replace <MigrationName> with the name of the migration you want to roll back to
ConnectionStrings__DefaultConnection="<prod connection string>" \
  dotnet ef database update <MigrationName> --project backend
```

Current migrations in order:
1. `20260608115853_InitialCreate`
2. `20260608233315_DB001_002_005_SchemaConstraints`

**Frontend (Netlify):** Dashboard → Deploys → click any previous deploy → **Publish deploy**.

---

### Important notes

- **Render Free tier** spins down after 15 minutes of inactivity. The first request after a spin-down has a ~30 second cold-start delay. This is expected on the free plan.
- **Never commit secrets.** The `.env` file at the repo root is for local development only. All production secrets live in Render and Netlify environment variable settings.
- **Supabase free tier** pauses inactive projects after 1 week. If the API starts returning 500 errors, check if your Supabase project is paused and resume it from the Supabase dashboard.
