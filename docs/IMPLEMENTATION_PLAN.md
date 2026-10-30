# Implementation Plan — EventCraft AI

This plan follows the existing React/Express/Supabase modular monolith. It does not introduce a migration unless an existing capability cannot support the requirement.

## Phase 1 — Stabilize the foundation and complete event CRUD

**Dependencies:** Phase 0 approval; Supabase project for live persistence.

**Work**
- Fix TypeScript project references/deprecation settings and align documented versions with installed versions.
- Resolve the two lint errors without changing behavior: unused `location` and state-setting effect pattern in `EventDetail`.
- Add route parameter validation and a consistent API error contract.
- Add event edit UI, typed metadata per event type, and event service/API integration tests using a mocked Supabase boundary.
- Decide and document demo authentication/ownership scope before exposing the API beyond local use.

**Acceptance**
- `npm run type-check`, `npm run lint`, `npm run build`, and `npm test` pass.
- A user can create, list, view, edit, and delete each event type; a reload reads persisted values.
- Validation, not-found, and provider/database failures have tested responses.

**Risks:** Supabase credentials/schema drift; TypeScript 6 configuration changes; no auth design.

## Phase 2 — Budget generation and tracking

**Dependencies:** Phase 1 event IDs and ownership boundary.

**Work**
- Add budget schemas, service, nested routes, API client, and budget UI.
- Current status: persisted event creation, budget/timeline/vendor services and routes, shared validation, deterministic budget calculations, and initial workspace controls are implemented.
- Add deterministic calculation helpers for estimated/actual/paid/category totals.
- Add server-only Gemini adapter, bounded budget prompt, strict output parser, retry/timeout, and AI rate limit.
- Persist generated items only after validation; make regeneration behavior explicit.

**Acceptance**
- Generate, add, edit, pay, and delete budget items; totals update deterministically and persist.
- AI output is schema-validated and malformed/provider-failure paths are tested.
- Budget calculation unit tests cover empty, boundary, rounding, and currency cases.

**Risks:** model cost/latency; malformed output; duplicate generation.

## Phase 3 — Timeline and vendor management

**Dependencies:** Phase 2 AI adapter and event ownership.

**Work**
- Add timeline CRUD/generation and deterministic overdue/date utilities.
- Add vendor CRUD, contact/cost fields, allowed status transitions, and checklist UI.
- Add route/service integration tests and keyboard-accessible editing controls.

**Acceptance**
- Users can generate/add/edit/delete/reorder timeline items and verify overdue behavior with a fixed clock.
- Users can add vendors and move them through a tested booking workflow.
- All mutations persist across reloads and unauthorized event-scoped access is rejected.

**Risks:** timezone semantics; invalid status transitions; vendor PII handling.

## Phase 4 — Personalized ideas and context-aware assistant

Phase 3 AI foundation is now implemented ahead of this original roadmap ordering:

- Server-only `@google/genai` provider with configurable model, timeout, output limits, and missing-credential errors.
- Event-specific prompts for wedding, birthday, and community events.
- Zod-validated structured plan generation with deterministic budget/date reconciliation.
- Event-scoped AI Copilot endpoint and explicit confirmation flow for supported budget proposals.
- Mockable provider boundary and schema tests without requiring live Gemini credentials.

**Dependencies:** Phases 2–3 data and validated AI adapter.

**Work**
- Add ideas generation/save/dismiss with event type, theme, season, and budget context.
- Add assistant history loading and message persistence.
- Add a context builder that supplies only the minimum event-scoped data.
- Return structured proposed actions; require explicit confirmation and revalidate every action server-side.

**Acceptance**
- Ideas are specific to event inputs and save/dismiss choices persist.
- Assistant references actual plan data, conversation history reloads, and an approved action updates exactly one authorized record.
- AI parser, prompt/context builder, action authorization, and provider failure tests pass.

**Risks:** prompt injection; hallucinated IDs; accidental destructive actions; token/cost growth.

## Phase 5 — Accessibility, security, and performance hardening

**Dependencies:** Phases 1–4 feature surfaces.

**Work**
- Add authentication/ownership and Supabase RLS if the app is shared; otherwise enforce an explicit demo boundary.
- Restrict CORS, review CSP, add rate limiting, UUID validation, request limits, log redaction, and safe error mapping.
- Fix modal/tab semantics, live status announcements, keyboard workflows, contrast, responsive layouts, and reduced-motion behavior.
- Measure bundle and network behavior before optimizing; lazy-load only where measurements justify it.

**Acceptance**
- No client bundle contains secret values.
- Security checks cover unauthenticated, cross-event, malformed, oversized, and rate-limited requests.
- Axe plus keyboard checks pass on every implemented page; mobile layout is verified.

**Risks:** auth/RLS migration complexity; accessibility regressions from custom controls.

## Phase 6 — Reproducible evidence and release

**Dependencies:** Phases 1–5.

**Work**
- Add Playwright smoke and full lifecycle workflows for wedding, birthday, and community events.
- Add CI for install, type-check, lint, unit/integration tests, build, and E2E where services are available.
- Update README, alignment matrix, architecture, test evidence, deployment instructions, and demo script.
- Verify all ten requirements and all six judging criteria with executable evidence.

**Acceptance**
- CI is reproducible from a clean install with documented environment setup.
- E2E flows prove create → generate → edit → persist for each major module.
- Final build/test/security/accessibility evidence is recorded without invented coverage claims.

**Risks:** external service flakiness; test data isolation; demo environment secrets.

## Phase dependencies

```text
Phase 0 audit
  -> Phase 1 foundation/events
  -> Phase 2 budget
  -> Phase 3 timeline/vendors
  -> Phase 4 ideas/assistant
  -> Phase 5 security/accessibility/performance
  -> Phase 6 evidence/release
```

## Phase 0 baseline evidence

Commands actually run:

| Command | Result |
|---|---|
| `npm test` | **Pass:** 4 files, 39 tests |
| `npm run lint` | **Fail:** 2 errors in `EventDetail.tsx`; 3 warnings (`Toast.tsx`, server console logging) |
| `npm run type-check` | **Fail:** TypeScript 6 deprecation error for `baseUrl`; invalid `tsconfig.node.json` project reference (`composite`/emit) |
| `npm run build` | **Fail:** same TypeScript project-reference/deprecation errors before Vite build |
| `npm test -- --runInBand` | **Not a repository baseline result:** unsupported Vitest option; rerun with `npm test` passed |
| `git status --short` | All project files are untracked; no prior commit exists; no tracked secret was exposed |

These are baseline findings, not regressions introduced by Phase 0 documentation.
