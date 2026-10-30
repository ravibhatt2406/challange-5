# Production Deployment Guide — EventCraft AI

This document provides complete instructions for deploying **EventCraft AI** to production environments, with primary focus on Render and Supabase.

---

## Live Production Deployment

- **Live URL:** [https://eventcraft-ai-nwwd.onrender.com](https://eventcraft-ai-nwwd.onrender.com)
- **Deployment Platform:** Render (Web Service)
- **Architecture:** Unified Full-Stack (Express 5 backend serves the compiled Vite + React 18 frontend)

---

## Deployment Architecture Overview

EventCraft AI is designed as a unified full-stack TypeScript application:

```
[ Browser / Client ]
        │
        ▼ (HTTPS)
[ Render Web Service ]
 ├── Express 5 Production Server (Port 3001 or $PORT)
 ├── Routes: /api/events, /api/planning, /api/ai, /api/ideas
 └── Static Asset Middleware (serves dist/client/index.html & assets)
        │
        ├──► Database Provider
        │    ├── SQLite (default demo: node:sqlite file-backed)
        │    └── Supabase (production PostgreSQL with RLS)
        │
        └──► AI Provider
             ├── Google Gemini 2.5 Flash (@google/genai SDK)
             ├── Local Ollama / LM Studio (self-hosted)
             └── Deterministic Local Starter Mode (zero-credential fallback)
```

### Key Advantages of This Architecture
1. **Single Service, Single URL:** Frontend and backend share the exact same origin.
2. **Zero CORS Issues:** Browser makes relative requests to `/api/*` directly on the host.
3. **No Cold Starts Between Services:** Client and API run within the same container.
4. **Deterministic Fallbacks:** The app runs even if external AI credentials or database configurations are temporarily unavailable.

---

## Step-by-Step Render Deployment

### 1. Connect Repository
1. Log in to [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `https://github.com/ekjot9105-commits/EVENTCRAFT-AI.git`.

### 2. Configure Build & Runtime Settings
Fill in the configuration fields:

| Field | Value |
|---|---|
| **Name** | `eventcraft-ai` |
| **Region** | Any region (e.g., Frankfurt, Singapore, Oregon) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run server:start` |
| **Plan** | `Free` |

> [!NOTE]
> All build tools (`typescript`, `vite`, `@types/express`, `@types/node`, etc.) are configured in `dependencies` of `package.json`, ensuring clean compilation on Render even when `NODE_ENV=production`.

### 3. Environment Variables

Configure the following variables in the **Environment** tab:

| Variable | Recommended Production Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables Express static asset serving of the React SPA |
| `NODE_VERSION` | `24.0.0` | Ensures native Node 24 runtime support |
| `DATABASE_PROVIDER` | `sqlite` or `supabase` | `sqlite` for zero-setup demo; `supabase` for hosted PostgreSQL |
| `SQLITE_PATH` | `data/eventcraft.sqlite` | Filepath for local SQLite database (when provider is sqlite) |
| `AI_PROVIDER` | `gemini` or `local` | `gemini` for live GenAI; `local` for deterministic demo |
| `GEMINI_API_KEY` | `your-gemini-api-key` | Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Selected Gemini model |
| `AUTH_ENABLED` | `false` | `false` for portfolio/evaluator demo; `true` for Supabase JWT auth |

#### If Using Supabase (Hosted PostgreSQL):
| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://<your-project-id>.supabase.co` |
| `SUPABASE_ANON_KEY` | `your-anon-public-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |

---

## Database Migrations (Supabase)

If using Supabase as the production database, apply the SQL migrations located in `src/server/db/migrations/` sequentially using the Supabase SQL Editor:

1. [`001_initial_schema.sql`](file:///c:/Users/Ekjot%20singh/Desktop/EVENTCRAFT%20AI/src/server/db/migrations/001_initial_schema.sql) — Core events, budget items, timeline items, and vendors tables.
2. [`002_phase2_event_fields.sql`](file:///c:/Users/Ekjot%20singh/Desktop/EVENTCRAFT%20AI/src/server/db/migrations/002_phase2_event_fields.sql) — Extended event properties and ideas table.
3. [`003_event_ownership.sql`](file:///c:/Users/Ekjot%20singh/Desktop/EVENTCRAFT%20AI/src/server/db/migrations/003_event_ownership.sql) — Tenant isolation and owner_id foreign keys.
4. [`004_ai_plans.sql`](file:///c:/Users/Ekjot%20singh/Desktop/EVENTCRAFT%20AI/src/server/db/migrations/004_ai_plans.sql) — AI plan version snapshots and history tracking.

---

## Health Check and Verification

Once deployed, verify the deployment:

1. **Health Check Endpoint:**
   ```bash
   curl -I https://eventcraft-ai-nwwd.onrender.com/api/health
   # Expected: HTTP/1.1 200 OK {"status":"ok","timestamp":"..."}
   ```

2. **Frontend SPA Fallback:**
   ```bash
   curl -I https://eventcraft-ai-nwwd.onrender.com/events
   # Expected: HTTP/1.1 200 OK (serves index.html for client-side routing)
   ```

3. **AI Status Endpoint:**
   ```bash
   curl https://eventcraft-ai-nwwd.onrender.com/api/ai/status
   # Expected: {"provider":"...","model":"...","status":"ready"}
   ```

---

## Troubleshooting & Common Pitfalls

| Issue | Root Cause | Solution |
|---|---|---|
| `Option 'baseUrl' has been removed` | TypeScript 6 deprecation | Removed `"baseUrl"` and used `"./src/*"` relative aliases in `tsconfig.json`. |
| `Could not find declaration file for 'express'` | npm skipped devDependencies in production | Moved compile-time types into `dependencies` in `package.json`. |
| `Cannot find module '@testing-library/jest-dom'` | `tsc -b` compiled test setups | Added `"exclude": ["src/client/test", "**/*.test.*"]` to `tsconfig.json`. |
| Free Render Web Service sleeps | Inactivity timeout on free tier | First request takes ~45 seconds to wake up container; subsequent requests are immediate. |
