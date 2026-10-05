#!/usr/bin/env bash
# Dump Supabase Postgres and upload to Google Drive via rclone.
# Needs: docker (SUPABASE_DB_CONTAINER=supabase-db) or pg_dump (same major version as the DB), rclone with a crypt remote "gdrive-crypt" wrapping gdrive:supabase-backups.
# Restore: rclone copy gdrive-crypt:<file>.dump . && pg_restore --no-owner -d "$TARGET_DB_URL" --clean --if-exists <file>.dump
# SUPABASE_DB_URL =postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres (or the pooler URL)
set -euo pipefail

set -a; . "$(dirname "$0")/../.env.local"; set +a
REMOTE="${RCLONE_REMOTE:-gdrive-crypt:}"
KEEP_DAYS="${KEEP_DAYS:-30}"

f="$(mktemp -d)/supabase-$(date +%Y%m%d-%H%M%S).dump"
trap 'rm -rf "$(dirname "$f")"' EXIT

if [ -n "${SUPABASE_DB_CONTAINER:-}" ]; then  # dockerised DB: dump with the container's own pg_dump
  docker exec "$SUPABASE_DB_CONTAINER" pg_dump -U postgres -d postgres --format=custom --no-owner --no-privileges > "$f"
else
  : "${SUPABASE_DB_URL:?set SUPABASE_DB_CONTAINER or SUPABASE_DB_URL in .env.local}"
  pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges -f "$f"
fi
rclone copy "$f" "$REMOTE"
rclone delete "$REMOTE" --min-age "${KEEP_DAYS}d"
echo "$(date -u +%FT%TZ) backup ok: $(basename "$f")"
