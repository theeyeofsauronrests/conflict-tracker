#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/web/.env.local"
DOCKER_BIN="${DOCKER_BIN:-docker}"

cd "$ROOT_DIR"

if ! command -v "$DOCKER_BIN" >/dev/null 2>&1; then
  # Docker Desktop app-only installs keep CLI binaries inside the app bundle.
  FALLBACK_DOCKER="$HOME/Applications/Docker.app/Contents/Resources/bin/docker"
  if [[ -x "$FALLBACK_DOCKER" ]]; then
    DOCKER_BIN="$FALLBACK_DOCKER"
  else
    echo "Error: docker is required for local:up (Docker Desktop or equivalent)." >&2
    exit 1
  fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  echo "CRON_SECRET=local-dev-secret" >>"$ENV_FILE"
  echo "Created apps/web/.env.local with a default CRON_SECRET."
fi

echo "Starting local Postgres/PostGIS..."
"$DOCKER_BIN" compose up -d

echo "Waiting for database on localhost:54322..."
for _ in {1..120}; do
  # Validate readiness from inside the DB container so this script does not depend on local Node modules.
  if "$DOCKER_BIN" compose exec -T postgres pg_isready -U postgres -d conflict_tracker >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! "$DOCKER_BIN" compose exec -T postgres pg_isready -U postgres -d conflict_tracker; then
  echo "Error: database did not become query-ready on localhost:54322." >&2
  exit 1
fi

echo "Seeding sample data..."
pnpm seed

echo "Ingesting latest Iran strike/intercept reports..."
pnpm ingest

echo "Starting app at http://localhost:3000 ..."
pnpm dev
