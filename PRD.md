# Conflict Tracker PRD (Local-First)

## Product Summary

Conflict Tracker is an OSINT-only operational map focused on Iran-related strike/intercept activity. The system runs locally with no required third-party hosted services for storage or ingestion orchestration.

## Goals

- Provide a map-based view of recent conflict activity.
- Enforce a strict 6-hour visibility delay for public reads at the database layer.
- Support plugin-based ingestion, pipeline processing, and layer rendering.
- Run fully local using Docker Postgres/PostGIS + Next.js.
- Ingest Iran strike/intercept web data from the last 4 days.

## Non-Goals

- User authentication and role management.
- Real-time (<6h) public visibility.
- Analyst note storage in server database.
- Dependence on Supabase or external LLM APIs for core ingestion.

## Users

- Public viewers: read-only map consumers.
- Analysts: local note-taking and event triage in browser.
- Developers: plugin and pipeline extension.

## Functional Requirements

1. Map UI
- Render events, forces, and assets using Deck.GL.
- Include timeline slider and event detail drawer.
- Show nationality-driven legend coloring.

2. Data Access and Delay
- All public reads must come from delayed views:
  - `public_events_delayed`
  - `public_force_positions_delayed`
  - `public_asset_positions_delayed`
- Delay enforcement must be server-side/database-side.

3. Ingestion and Pipeline
- Trigger ingestion every 6 hours via cron endpoint:
  - `GET /api/cron/ingest`
- Validate `CRON_SECRET`.
- Pull RSS/web data, filter to Iran strike/intercept signals within last 4 days.
- Parse, geo-normalize, dedupe, confidence score, and upsert into `events`.

4. Security and Access
- No auth for end users.
- Public cannot write to source tables.
- Analyst notes remain local (`localStorage`) only.

5. Extensibility
- Plugin packages:
  - `packages/ingest-plugins`
  - `packages/agent-pipeline`
  - `packages/map-layers`
  - `packages/plugin-registry`
  - `packages/data-model`

## Technical Constraints

- Monorepo: pnpm + turbo.
- Frontend/API: Next.js App Router.
- Storage: local Postgres + PostGIS (docker-compose).
- 2D map rendering only.
- TypeScript across app and packages.

## Data Model (Core)

- `events`: strike/intercept records with `event_time`, `ingested_at`, confidence, `sources`, geometry point, radius, raw text, dedupe key.
- `force_positions`: append-only time-versioned position history.
- `assets` + `asset_positions`: asset metadata and append-only positions.

## Success Criteria

- Local startup works with only Docker + pnpm.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` pass.
- `pnpm ingest` inserts new Iran strike/intercept events when DB is up.
- Public reads never return data newer than the 6-hour delay threshold.

