#!/usr/bin/env bash
# Dump remote Supabase and restore to local Docker-based Supabase.
# Restores everything: pg roles, schema, auth users, and all app data.
#
# Usage:
#   cd <project-root>
#   ./scripts/db-sync.sh
#
# Requirements:
#   - supabase CLI  (curl -fsSL https://supabase.com/install.sh | sh)
#   - Docker running (with sudo if needed)
#   - psql          (sudo apt-get install -y postgresql-client)

set -euo pipefail

# ── CONFIGURE THESE ───────────────────────────────────────────────────────────
# Remote DB URL — Supabase dashboard → Settings → Database → Connection string (URI)
REMOTE_DB_URL="postgresql://postgres:inVAIFRtVEmU4RQ5@db.zrkvvedwycdcjjheewef.supabase.co:5432/postgres"

# Local DB URL — leave blank to auto-detect from Docker containers
# The pooler (supabase-pooler) is what listens on the host; override if needed.
LOCAL_DB_URL="${LOCAL_DB_URL:-}"
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DUMP_DIR="$PROJECT_ROOT/.dumps/$(date +%Y%m%d_%H%M%S)"

# Use sudo for docker if the current user isn't in the docker group
DOCKER="docker"
if ! docker info &>/dev/null 2>&1; then
  if sudo docker info &>/dev/null 2>&1; then
    DOCKER="sudo docker"
    echo "Note: using 'sudo docker' (add your user to the docker group to avoid this)"
  else
    echo "ERROR: Docker is not running or not accessible."
    exit 1
  fi
fi

# ── prereq checks ─────────────────────────────────────────────────────────────
for cmd in supabase psql; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found."
    [[ "$cmd" == "supabase" ]] && echo "  Install: curl -fsSL https://supabase.com/install.sh | sh"
    [[ "$cmd" == "psql" ]]     && echo "  Install: sudo apt-get install -y postgresql-client"
    exit 1
  fi
done

if [[ "$REMOTE_DB_URL" == *"YOUR_PASSWORD_HERE"* ]]; then
  echo "ERROR: Set REMOTE_DB_URL at the top of this script with your real database password."
  exit 1
fi

mkdir -p "$DUMP_DIR"
echo "Dump directory: $DUMP_DIR"

# ── 1. dump from remote ───────────────────────────────────────────────────────
echo ""
echo "→ Dumping remote database ..."

echo "  [1/3] Schema ..."
supabase db dump --db-url "$REMOTE_DB_URL" --schema-only -f "$DUMP_DIR/schema.sql"

echo "  [2/3] Data ..."
supabase db dump --db-url "$REMOTE_DB_URL" --data-only -f "$DUMP_DIR/data.sql"

echo "  [3/3] Roles ..."
supabase db dump --db-url "$REMOTE_DB_URL" --role-only -f "$DUMP_DIR/roles.sql"

echo "  Dumps saved to $DUMP_DIR"

# ── 2. detect local DB ────────────────────────────────────────────────────────
echo ""
echo "→ Detecting local DB connection (Docker) ..."

if [[ -n "$LOCAL_DB_URL" ]]; then
  DB_URL="$LOCAL_DB_URL"
  echo "  Using LOCAL_DB_URL: $DB_URL"
else
  # supabase-pooler exposes 5432 on the host; supabase-db does not
  POOLER_ID=$($DOCKER ps --filter "name=supabase-pooler" --format "{{.ID}}" | head -1)

  if [[ -n "$POOLER_ID" ]]; then
    HOST_PORT=$($DOCKER inspect "$POOLER_ID" \
      --format '{{range $p, $conf := .NetworkSettings.Ports}}{{if eq $p "5432/tcp"}}{{(index $conf 0).HostPort}}{{end}}{{end}}')
    DB_URL="postgresql://postgres:postgres@localhost:${HOST_PORT:-5432}/postgres"
    echo "  Detected supabase-pooler on port ${HOST_PORT:-5432}: $DB_URL"
  else
    DB_URL="postgresql://postgres:postgres@localhost:5432/postgres"
    echo "  Could not find supabase-pooler container, using default: $DB_URL"
    echo "  Set LOCAL_DB_URL env var to override."
  fi
fi

# ── 3. wipe existing local data ───────────────────────────────────────────────
echo ""
echo "→ Wiping existing local data ..."
psql "$DB_URL" --no-password -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# ── 4. restore ────────────────────────────────────────────────────────────────
echo ""
echo "→ Restoring roles ..."
psql "$DB_URL" --no-password -v ON_ERROR_STOP=0 -f "$DUMP_DIR/roles.sql" 2>&1 \
  | grep -v "^ERROR:.*already exists" || true

echo "→ Restoring schema ..."
psql "$DB_URL" --no-password -v ON_ERROR_STOP=1 -f "$DUMP_DIR/schema.sql"

echo "→ Restoring data (including auth.users) ..."
psql "$DB_URL" --no-password -v ON_ERROR_STOP=1 \
  -c "SET session_replication_role = replica;" \
  -f "$DUMP_DIR/data.sql" \
  -c "SET session_replication_role = DEFAULT;"

echo ""
echo "✓ Done. Local DB is now a full copy of the remote database."
echo "  Dumps kept at: $DUMP_DIR"
echo ""
echo "  To connect to local DB:"
echo "    psql \"$DB_URL\""
