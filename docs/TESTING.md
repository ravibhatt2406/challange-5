# Testing Guide

## Commands

| Command | Coverage |
|---|---|
| `npm test` | Runs the deterministic Vitest suite |
| `npm run test:coverage` | Runs Vitest with the V8 coverage provider |
| `npm run type-check` | Runs strict TypeScript checking |
| `npm run lint` | Runs ESLint over source and tests |
| `npm run build` | Runs the production TypeScript/Vite build |

## Test categories

- **Schema tests:** Event, wizard, budget, timeline, vendor, and AI output validation boundaries.
- **Deterministic business tests:** Integer-cent budget arithmetic, paid/actual totals, zero-budget behavior, and over-budget detection.
- **Client regression tests:** Application shell, routes, wizard validation, and preserved wizard values.
- **AI provider tests:** Provider injection allows tests to run without credentials.
- **SQLite persistence smoke test:** With `DATABASE_PROVIDER=sqlite`, the API can be exercised locally without Supabase; the adapter creates its schema and persists events and planning records in `SQLITE_PATH`.
- **Integration limitations:** Supabase persistence and hosted Gemini requests are not required for the normal suite. Keyless local AI can be verified with Ollama or LM Studio when a local model service is installed.

## Mocking policy

The AI provider is injected through `setAiProviderForTests`; tests do not call Gemini or spend quota. Browser tests stub `fetch` at the transport boundary for shell and wizard workflows. These tests intentionally do not claim live database or provider coverage.

## Known gaps

- No Playwright end-to-end project is configured yet.
- No automated axe scan is configured.
- No authenticated multi-user integration test exists because authentication/ownership is not implemented.
- Supabase service tests should use a repository mock or disposable test project before release.
- SQLite uses Node 24's experimental built-in `node:sqlite`; pin Node 24+ for the credential-free demo path.
- Coverage is reported only when `@vitest/coverage-v8` is installed and the command completes; percentages must be taken from the generated report, not estimated.
