# Conflict Tracker

OSINT-only operational map for conflict monitoring in West Asia and nearby regions, with a strict 6-hour public visibility delay.

## Architecture

- Monorepo: `pnpm` + `turbo`
- App: Next.js App Router (`apps/web`) for Vercel
- Map: MapLibre basemap with projected event icons at target coordinates, toggleable pulsing arcs, and plugin-backed layer contracts from `packages/map-layers`
- UI: map-first Accelint C2 workspace (compact top nav, status strip, integrated timeline control bar, contextual analysis panel) powered by `@accelint/design-toolkit` + `@accelint/icons`
- UI wrappers: shared toolkit wrapper components in `apps/web/lib/ui.tsx` (`Tabs`, `Table`, `DrawerPanel`, `Button`, `Badge`, `Input`, `Checkbox`, `Icon`)
- Storage: local Postgres + PostGIS (`docker-compose.yml`)
- Pipeline: web RSS scrape plugins -> local heuristic agent stages -> Postgres upsert
- Security: no auth, API serves delayed views only, write path is cron-only
- Timeline UX: interactive start/end slider constrained to available event records only
- Cluster UX: click cluster count bubble to open a list modal and select individual events
- Local analyst state: notes and bookmarks are browser-only (never written to database)

## Repository Layout

- `apps/web`: Next.js app, map UI, API routes, cron endpoint
- `apps/web/lib/docs.ts` + `apps/web/lib/markdown-renderer.tsx`: knowledge-base loading and markdown rendering for the in-app docs page
- `packages/data-model`: shared Zod schemas + TS types
- `packages/plugin-registry`: typed plugin registry + feature flags
- `packages/ingest-plugins`: RSS plugin interface + reference implementation
- `packages/agent-pipeline`: stage-based agent pipeline (parse/geo/dedupe/confidence)
- `packages/map-layers`: layer plugin factories (strikes, intercepts, forces, assets, heatmap, density) with `SymbolLayer`-style contracts for 2D maps
- `infra/schema.sql`: PostGIS schema + delayed public views
- `infra/policies.sql`: local Postgres grants/revokes for delayed-view-only public access
- `infra/seed/*.json`: seed data
- `scripts/seed.ts`: seed loader script
- `scripts/ingest.ts`: manual local ingestion runner
- `scripts/backfill-iran-week.ts`: 7-day multi-query backfill runner for larger local datasets
- `scripts/reparse-existing-events.ts`: enrich existing rows with improved actor/target parsing and fallback-geometry repair

## Environment Variables

Copy `.env.example` to `apps/web/.env.local`:

- `DATABASE_URL` (or `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD`)
- `CRON_SECRET`
- `NEXT_PUBLIC_BASE_URL` (optional, defaults `http://localhost:3000`)

## Run Locally

Fast path:

- `pnpm local:up` (starts DB, seeds, ingests, and launches dev server)

1. Install dependencies:
   - `pnpm install`
2. Start local PostGIS:
   - `docker compose up -d`
3. Optional seed sample data:
   - `pnpm seed`
4. Pull and ingest live Iran strike/intercept reports from last 4 days:
   - `pnpm ingest`
   - or `curl -H "x-cron-secret: <CRON_SECRET>" http://localhost:3000/api/cron/ingest`
5. Optional: backfill a larger 7-day dataset (targeting 100+ events):
   - `pnpm ingest:backfill`
6. Optional: reparse existing records after parser improvements:
   - `pnpm ingest:reparse`
7. Run app:
   - `pnpm dev`
8. Open user documentation in-app:
   - `http://localhost:3000/docs`

## Cron Ingestion

- Vercel cron is configured in `vercel.json`:
  - `0 */6 * * *` -> `GET /api/cron/ingest`
- Endpoint validates `x-cron-secret` against `CRON_SECRET`.
- Ingest source is web RSS scraping focused on Iran strike/intercept terms with a 4-day lookback.
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
- Prefer `SymbolLayer` contract inputs (`getPosition`, `getSidc`, `getSize`) so plugins stay consistent.
- Export from `packages/map-layers/src/index.ts` and include in app toggles or app-level layer orchestration.

## Security Model

- No user auth.
- Public readers can only query delayed views:
  - `public_events_delayed`
  - `public_force_positions_delayed`
  - `public_asset_positions_delayed`
- No direct writes from public role (`PUBLIC` table privileges revoked).
- Ingestion route writes server-side through local Postgres connection only.
- Analyst notes are local-only in `localStorage` (never persisted in DB).

## Testing

- Plugin registry unit test:
  - `packages/plugin-registry/src/index.test.ts`
- API route test:
  - `apps/web/tests/cron-route.test.ts`
- Render smoke test:
  - `apps/web/tests/render-smoke.test.tsx`

Run all tests:

- `pnpm test`
- `pnpm typecheck`

## Architecture Rationale

- Plugin contracts isolate source ingestion, agent parsing, and visualization to support rapid iteration.
- Shared `data-model` package prevents schema drift across API, pipeline, and map packages.
- Toolkit wrapper components centralize DevTK adoption while keeping test/local fallbacks stable.
- Map view rendering keeps timestamp parsing and range filtering memoized to reduce hot-path allocations during timeline interaction.
- Delayed read views enforce the 6-hour policy at the database layer (defense in depth beyond client/UI).
- Local-only cron write path is isolated to a secret-protected endpoint to minimize attack surface.

## Delivery Playbook (Reusable)

This project converged faster once we used strict milestone gating and forced quality passes between milestones.

### Core loop

1. Implement one milestone only.
2. Run quality pass and regression tests.
3. Resolve issues immediately (do not stack known defects).
4. Update docs in the same change set.
5. Prep PR with concise validation metrics.

### Major pivots that improved outcomes

- Prioritize interaction reliability over feature count:
  - clickable map entities, clear hover cursor, cluster drill-down modal, stable zoom behavior.
- Prefer simplification over exposing internals:
  - hide/rename controls that are ambiguous to operators (for example plugin-facing toggles).
- Keep map-first hierarchy:
  - compact status strip + integrated timeline controls + contextual detail panel.
- Enforce design-system primitives over ad hoc UI:
  - use DevTK wrappers for tabs, controls, badges, panels, and tables.
- Treat attribution as probabilistic:
  - avoid false actor assignment when wording is negated or uncertain.

### Data quality gates

- Sample live rows after parser changes (not just unit tests).
- Track before/after counts for known bad patterns.
- Reparse historical rows when heuristics change.
- Prefer unknown actor/target over confident-but-wrong attribution.

### PR readiness checklist

- Tests pass in affected packages.
- Any backfill/reparse command and scope documented.
- Before/after metrics included for user-visible data quality fixes.
- Known limitations explicitly listed (for example duplicate story normalization).
