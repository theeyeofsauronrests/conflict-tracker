# Conflict Tracker

OSINT-only operational map for Middle East conflict monitoring with a strict 6-hour public visibility delay.

## Architecture

- Monorepo: `pnpm` + `turbo`
- App: Next.js App Router (`apps/web`) for Vercel
- Map: Deck.GL + `@accelint/map-toolkit` layer helpers
- UI: `@accelint/design-toolkit` + `@accelint/icons` with C2 dark theme
- Storage: Supabase Postgres + PostGIS
- Pipeline: RSS ingest plugins -> agent pipeline stages -> Supabase upsert
- Security: no auth, public read-only via delayed views, service-role writes only

## Repository Layout

- `apps/web`: Next.js app, map UI, API routes, cron endpoint
- `packages/data-model`: shared Zod schemas + TS types
- `packages/plugin-registry`: typed plugin registry + feature flags
- `packages/ingest-plugins`: RSS plugin interface + reference implementation
- `packages/agent-pipeline`: stage-based agent pipeline (parse/geo/dedupe/confidence)
- `packages/map-layers`: deck layer plugin functions (strikes, intercepts, forces, assets, heatmap, density)
- `infra/schema.sql`: PostGIS schema + delayed public views
- `infra/policies.sql`: RLS policies + anon grants on delayed views
- `infra/seed/*.json`: seed data
- `scripts/seed.ts`: seed loader script

## Environment Variables

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_BASE_URL` (optional, defaults `http://localhost:3000`)

## Run Locally

1. Install dependencies:
   - `pnpm install`
2. Start local PostGIS:
   - `docker compose up -d`
3. Apply schema/policies in Supabase SQL editor (or your DB migration flow):
   - `infra/schema.sql`
   - `infra/policies.sql`
4. Seed sample data:
   - `pnpm seed`
5. Run app:
   - `pnpm dev`

## Cron Ingestion

- Vercel cron is configured in `vercel.json`:
  - `0 */6 * * *` -> `GET /api/cron/ingest`
- Endpoint validates `x-cron-secret` against `CRON_SECRET`.
- Handler path: `apps/web/app/api/cron/ingest/route.ts`

## Plugin System

### Add RSS ingest plugin

- Implement `IngestPlugin` in `packages/ingest-plugins/src`.
- Register plugin in `apps/web/lib/ingest.ts` using `PluginRegistry`.

### Add agent stage

- Implement `AgentStage` in `packages/agent-pipeline/src/stages`.
- Add stage to `createDefaultStages()` in `packages/agent-pipeline/src/index.ts`.

### Add map layer plugin

- Add layer factory under `packages/map-layers/src/plugins`.
- Export from `packages/map-layers/src/index.ts` and include in app toggles.

## Security Model

- No user auth.
- Public users (anon key) can only `SELECT` from delayed views:
  - `public_events_delayed`
  - `public_force_positions_delayed`
  - `public_asset_positions_delayed`
- No anon writes (`INSERT/UPDATE/DELETE` blocked by revoke + deny policies).
- Ingestion route writes server-side with `SUPABASE_SERVICE_ROLE_KEY` only.
- Analyst notes are local-only in `localStorage` (never persisted in Supabase).

## Testing

- Plugin registry unit test:
  - `packages/plugin-registry/src/index.test.ts`
- API route test:
  - `apps/web/tests/cron-route.test.ts`
- Render smoke test:
  - `apps/web/tests/render-smoke.test.tsx`

Run all tests:

- `pnpm test`

## Architecture Rationale

- Plugin contracts isolate source ingestion, agent parsing, and visualization to support rapid iteration.
- Shared `data-model` package prevents schema drift across API, pipeline, and map packages.
- Delayed read views enforce the 6-hour policy at the database layer (defense in depth beyond client/UI).
- Service-role write path is isolated to cron ingestion endpoint to minimize attack surface.
