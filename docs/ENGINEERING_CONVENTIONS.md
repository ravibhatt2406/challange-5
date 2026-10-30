# Engineering conventions

## API contract

- Successful JSON responses contain the resource or a documented collection.
- Errors contain a safe `error` message and a `request_id`; validation errors may also contain field details.
- Routes validate input and resource IDs at the HTTP boundary.
- The client uses `ApiRequestError` so UI code never parses transport failures.

## Module boundaries

- Routes coordinate HTTP concerns only.
- Services own business rules and call database adapters.
- Database adapters own SQL/Supabase access and use parameterized values.
- AI providers return untrusted model output; `AiService` validates it with Zod before use.
- AI providers never mutate persistence directly. Applying a plan is an explicit service operation.
- Client modules may import shared contracts, never server modules.

## Persistence

- Every event-scoped operation must verify event ownership before accessing nested records.
- SQLite is the credential-free local provider.
- Supabase deployments must run all migrations, enable RLS, and provide authenticated JWTs.
- New provider-specific queries belong in the adapter/service layer, not components or routes.

## AI trust boundary

- Event text is untrusted context and cannot issue instructions to the provider.
- Generated plans are previews until explicitly applied.
- Copilot mutations are server-issued, event-bound, expiring proposals.
- Generated output is schema-validated and bounded before persistence.
