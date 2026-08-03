#!/usr/bin/env bash
# Dump remote Supabase and restore to local Docker-based Supabase (supabase start).
# Restores everything: pg roles, schema, auth users, and all app data.
#
# Usage:
#   cd <project-root>
#   ./scripts/db-sync.sh
#
# Requirements:
#   - supabase CLI  (brew install supabase/tap/supabase)
#   - Docker running
#   - psql          (brew install libpq)
#   - You must be logged in: supabase login

set -euo pipefail

REMOTE_PROJECT_REF="zrkvvedwycdcjjheewef"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DUMP_DIR="$PROJECT_ROOT/.dumps/$(date +%Y%m%d_%H%M%S)"

# ── prereq checks ──────────────────────────────────────────────────────────────
for cmd in supabase psql docker; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found."
    [[ "$cmd" == "supabase" ]] && echo "  Install: brew install supabase/tap/supabase"
    [[ "$cmd" == "psql" ]]     && echo "  Install: brew install libpq && brew link libpq --force"
    exit 1
  fi
done

# Override DB_URL here if your Docker Postgres uses non-default credentials/port.
# Leave blank to auto-detect from running Docker containers.
LOCAL_DB_URL="${LOCAL_DB_URL:-}"

if ! docker info &>/dev/null; then
  echo "ERROR: Docker is not running. Start Docker Desktop first."
  exit 1
fi

mkdir -p "$DUMP_DIR"
echo "Dump directory: $DUMP_DIR"

# ── 1. dump from remote (three separate passes) ───────────────────────────────
echo ""
echo "→ Dumping remote project $REMOTE_PROJECT_REF ..."

# Schema only (includes all objects, no data)
echo "  [1/3] Schema ..."
supabase db dump \
  --project-ref "$REMOTE_PROJECT_REF" \
  --schema-only \
  -f "$DUMP_DIR/schema.sql"

# Data only (all schemas: public + auth + storage)
echo "  [2/3] Data ..."
supabase db dump \
  --project-ref "$REMOTE_PROJECT_REF" \
  --data-only \
  -f "$DUMP_DIR/data.sql"

# Auth roles (Supabase creates pg roles that must exist before schema restore)
echo "  [3/3] Roles ..."
supabase db dump \
  --project-ref "$REMOTE_PROJECT_REF" \
  --role-only \
  -f "$DUMP_DIR/roles.sql"

echo "  Dumps saved to $DUMP_DIR"

# ── 3. detect local Docker-based Supabase DB ──────────────────────────────────
echo ""
echo "→ Detecting local DB connection (Docker) ..."

if [[ -n "$LOCAL_DB_URL" ]]; then
  DB_URL="$LOCAL_DB_URL"
  echo "  Using LOCAL_DB_URL from environment: $DB_URL"
else
  # Find the Supabase Postgres container by image name
  CONTAINER_ID=$(docker ps --filter "name=supabase-db" --format "{{.ID}}" | head -1)
  if [[ -z "$CONTAINER_ID" ]]; then
    # Try common alternative container names used by Docker-based Supabase setups
    CONTAINER_ID=$(docker ps --filter "ancestor=supabase/postgres" --format "{{.ID}}" | head -1)
  fi

  if [[ -n "$CONTAINER_ID" ]]; then
    HOST_PORT=$(docker inspect "$CONTAINER_ID" \
      --format '{{range $p, $conf := .NetworkSettings.Ports}}{{if eq $p "5432/tcp"}}{{(index $conf 0).HostPort}}{{end}}{{end}}')
    DB_URL="postgresql://postgres:postgres@localhost:${HOST_PORT:-5432}/postgres"
    echo "  Detected container $CONTAINER_ID on port ${HOST_PORT:-5432}: $DB_URL"
  else
    DB_URL="postgresql://postgres:postgres@localhost:5432/postgres"
    echo "  Could not find a running Supabase DB container, using default: $DB_URL"
    echo "  Set LOCAL_DB_URL env var to override."
  fi
fi

# ── 4. wipe existing local data ───────────────────────────────────────────────
echo ""
echo "→ Wiping existing local data ..."
psql "$DB_URL" --no-password -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# ── 5. restore ────────────────────────────────────────────────────────────────
echo ""
echo "→ Restoring roles ..."
# Roles must go in first; ignore errors for roles that already exist
psql "$DB_URL" --no-password -v ON_ERROR_STOP=0 -f "$DUMP_DIR/roles.sql" 2>&1 \
  | grep -v "^ERROR:.*already exists" || true

echo "→ Restoring schema ..."
psql "$DB_URL" --no-password -v ON_ERROR_STOP=1 -f "$DUMP_DIR/schema.sql"

echo "→ Restoring data (including auth.users) ..."
# Temporarily disable triggers so FK constraints don't block out-of-order inserts
psql "$DB_URL" --no-password -v ON_ERROR_STOP=1 \
  -c "SET session_replication_role = replica;" \
  -f "$DUMP_DIR/data.sql" \
  -c "SET session_replication_role = DEFAULT;"

echo ""
echo "✓ Done. Local DB is now a full copy of remote $REMOTE_PROJECT_REF."
echo "  Dumps kept at: $DUMP_DIR"
echo ""
echo "  To connect to local DB:"
echo "    psql \"$DB_URL\""
