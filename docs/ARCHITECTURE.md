# Architecture — EventCraft AI

## 1. Audit summary and stack

The repository is a TypeScript modular-monolith starter:

- **Client:** React 18, React Router 6, Vite 8, Tailwind CSS 4 configuration, browser `fetch` API.
- **Server:** Node.js ESM, Express 5, `cors`, `helmet`, `dotenv`, and Zod validation.
- **Persistence:** Supabase PostgreSQL through `@supabase/supabase-js`; one SQL migration currently exists.
- **AI:** Server-only `@google/genai` adapter with event-specific prompts, Zod output validation, bounded requests, and explicit copilot proposals.
- **Quality:** Vitest 5, JSDOM, React Testing Library dependencies, ESLint 10. No Playwright configuration or CI workflow exists.

No stack migration is recommended for Phase 0. The existing modular monolith is suitable; the priority is completing its missing vertical slices and correcting configuration drift.

## 2. Actual repository structure

```text
src/
  client/
    App.tsx
    features/dashboard/Dashboard.tsx
    features/events/{CreateEvent,EventDetail}.tsx
    shared/api/client.ts
    shared/components/*
    styles/index.css
  server/
    index.ts
    routes/events.ts
    services/eventService.ts
    middleware/{validate,errorHandler}.ts
    db/{client.ts,migrations/*.sql}
    ai/{provider,prompts,schemas,aiService}.ts
  shared/
    constants/*
    schemas/*
    types/*
tests/unit/schemas/*
```

The documentation describes future feature directories that do not yet exist. New code should add one vertical slice at a time rather than create empty scaffolding.

## 3. Target module responsibilities

| Boundary | Responsibility |
|---|---|
| React feature modules | Rendering, local interaction state, feature-specific API calls, loading/error/empty states |
| Shared UI | Accessible primitives with consistent focus, error, and loading behavior |
| API client | JSON transport, typed responses, normalized request errors |
| Routes | Parse request parameters/body, invoke services, select HTTP status |
| Services | Business rules, ownership checks, deterministic calculations, orchestration |
| Validation | Zod schemas at every external request and AI response boundary |
| Database client/repositories | Supabase access and query-specific persistence |
| AI module | Server-only Gemini or keyless local-model calls, bounded prompts, output parsing, rate limits, and expiring server-side proposal records |

Routes must remain thin. Services must not receive Express `req`/`res`. Shared types should describe persisted and API shapes without making unvalidated client input trusted.

## 4. Data flow

### CRUD

```text
React form
  -> API client
  -> Express route
  -> Zod body/parameter validation
  -> service ownership and business validation
  -> Supabase query
  -> typed response
  -> UI state update and accessible feedback
```

### AI generation or assistant action

```text
User request
  -> event-scoped route (authentication/ownership remains a deployment prerequisite)
  -> load event context through services
  -> redact/minimize prompt context
  -> server-only AI provider (Gemini, Ollama, LM Studio, or deterministic local mode)
  -> strict Zod parse of model output
  -> persist generated result/message
  -> return proposed data/actions
  -> explicit user confirmation
  -> server revalidates and applies mutation
```

AI output is never executable and never trusted merely because it parsed as JSON. Action application must check event ownership, target record ownership, allowed operation, and current record state.

## 5. Persistence model

The migration defines `events`, `budget_items`, `timeline_items`, `vendors`, `ideas`, and `assistant_messages`, with foreign keys and indexes. It currently has no `users`/`user_id`, row-level security policy, or authentication integration. Before multi-user deployment, add an auth/ownership design and enable RLS; until then the API should be treated as a local/demo deployment.

Use database constraints for enum-like statuses and non-negative monetary/date invariants where practical. Keep totals as deterministic application calculations; do not ask the model to calculate authoritative totals.

## 6. Security boundaries and known gaps

Current protections include JSON body size limit, Helmet, Zod body validation, server-side environment loading, no client-side AI call, and a production deny-by-default guard unless `AUTH_ENABLED=true`. Current gaps:

- `cors()` is unrestricted.
- The service-role key is preferred when present, while no authentication or ownership checks exist.
- The migration has no RLS or ownership column; `AUTH_ENABLED` must remain false until those are added.
- Event IDs are not validated as UUIDs at the route boundary.
- `metadata: z.record(z.unknown())` is broad and needs feature-specific schemas before AI or persistence use.
- Development disables Helmet CSP; production CSP policy is not explicitly reviewed.
- AI routes have a small in-memory per-IP rate limit and a 30-second provider timeout; production deployments should use a shared rate limiter.
- AI output is parsed and validated before any persistence. User text is context only, not instruction authority.
- `errorHandler` logs full error messages/stacks; future database/AI errors must be checked for secret or provider-response leakage.

Never put `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` in client-exposed Vite variables. Keep `.env` ignored and rotate any real key if it appears in tracked files; no secret values were printed during this audit.

## 7. Error handling

The current server has a validation response and a global error handler. Future work should standardize:

- `400` for malformed bodies/parameters
- `401/403` for missing or unauthorized ownership
- `404` for missing event-scoped records
- `409` for conflicting state transitions
- `429` for rate limits
- `503` for unavailable AI provider
- generic `500` responses without provider/database details

Client errors should retain field details for forms, show a retryable message for transient failures, and announce async states through an `aria-live` region.

## 8. Accessibility baseline and gaps

Existing positives include a skip link, semantic `main/header/nav`, associated `Input` labels, `aria-invalid`/`aria-describedby`, visible `:focus-visible` styling, reduced-motion CSS, and a native dialog component with focus restoration. Gaps include:

- No automated axe/keyboard testing.
- Event type buttons use radio semantics without a complete roving/fieldset radio-group interaction model.
- The modal does not explicitly identify `role="dialog"`/`aria-modal` and has no robust focus trap fallback.
- Tabs use links with `role="tab"` but do not expose a complete tabpanel relationship.
- Loading and fetch status are not announced.
- Error text may expose raw backend messages.
- Contrast and mobile layouts need measured verification.

## 9. Testing strategy

Keep the existing Vitest/RTL direction. Add:

| Layer | Scope |
|---|---|
| Unit | Budget totals/rounding, date/overdue rules, status transitions, schemas, AI parsers |
| Service/API integration | Event-scoped CRUD, persistence, validation, not-found, authorization, provider failures |
| Component | Forms, inline edits, loading/error states, keyboard and screen-reader semantics |
| E2E | Create each event type, generate/edit/persist each planning area, assistant approval flow |
| Accessibility | axe scans plus keyboard-only workflows at mobile and desktop widths |

Do not claim coverage percentages until a coverage command is run and its artifact is reviewed.

## 10. Deployment boundaries

Development uses Vite on port 5173 and Express on port 3001, with `/api` proxied by Vite. Production compiles the client to `dist/client` and server to `dist/server`; Express serves the client when `NODE_ENV=production`. Deployment should inject environment variables through the platform, use HTTPS, restrict CORS to the deployed origin, and apply database RLS before shared use.

The README currently documents the intended Supabase setup, but setup reproducibility is not verified without real non-secret environment values and a reachable database.
## Local database fallback

The persistence services retain Supabase as the hosted provider and support a
SQLite adapter for local evaluation. `DATABASE_PROVIDER=sqlite` stores the same
event, budget, timeline, vendor, and idea records in the file configured by
`SQLITE_PATH`. When no Supabase credentials are present, SQLite is selected
automatically. This keeps the demo truthful: records are persisted locally
instead of being replaced with mock responses.
