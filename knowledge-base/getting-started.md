# Getting Started

This guide gets Conflict Tracker running on your machine with minimal setup.

## Before you begin

You need:

- Docker Desktop installed and running
- Node.js installed
- `pnpm` installed

## 1) Open the project folder

In a terminal, go to the project directory:

```bash
cd /Users/scrumlord/Documents/ProdDeli
```

## 2) Install project dependencies

```bash
pnpm install
```

## 3) Start the local database

```bash
docker compose up -d
```

This starts local Postgres/PostGIS for map data.

## 4) Set environment values

Copy the example environment file:

```bash
cp .env.example apps/web/.env.local
```

Open `apps/web/.env.local` and set `CRON_SECRET` to any private value you choose.

## Quick all-in-one startup

If you want one command instead of manual steps, run:

```bash
pnpm local:up
```

This will start DB, seed, ingest, and launch the app automatically.

## 5) (Optional) Load sample data

```bash
pnpm seed
```

Use this if you want instant demo data before running live ingest.

## 6) Ingest recent Iran conflict reports (last 4 days)

```bash
pnpm ingest
```

This pulls RSS/web sources, filters for Iran strike/intercept signals, and stores results locally.

## 6b) (Optional) Backfill a larger 7-day dataset

If you want a fuller operating picture (for example 100+ events), run:

```bash
pnpm ingest:backfill
```

This runs multiple RSS searches and inserts a much larger set of deduped events from the last 7 days.

## 6c) (Optional) Reparse existing records

If actor/target fields look too often unknown, run:

```bash
pnpm ingest:reparse
```

This revisits recent stored records and applies the latest parser heuristics to improve attribution.

## 7) Start the app

```bash
pnpm dev
```

Then open:

- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3000/docs](http://localhost:3000/docs) for in-app user documentation

## 8) Refresh data later

Run `pnpm ingest` whenever you want a manual refresh.

## Common issues

- If map is empty: run `pnpm ingest` again and refresh browser.
- If DB errors appear: make sure Docker Desktop is running.
- If port conflict appears: check if another app is using `54322` or `3000`.
