#!/usr/bin/env bash
# Dump Supabase Postgres and upload to Google Drive via rclone.
# Needs: pg_dump (same major version as the DB), rclone with a crypt remote "gdrive-crypt" wrapping gdrive:supabase-backups.
# Restore: rclone copy gdrive-crypt:<file>.dump . && pg_restore --no-owner -d "$TARGET_DB_URL" --clean --if-exists <file>.dump
# SUPABASE_DB_URL =postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres (or the pooler URL)
set -euo pipefail

set -a; . "$(dirname "$0")/../.env.local"; set +a
: "${SUPABASE_DB_URL:?add SUPABASE_DB_URL to .env.local}"
REMOTE="${RCLONE_REMOTE:-gdrive-crypt:}"
KEEP_DAYS="${KEEP_DAYS:-30}"

f="$(mktemp -d)/supabase-$(date +%Y%m%d-%H%M%S).dump"
trap 'rm -rf "$(dirname "$f")"' EXIT

pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges -f "$f"
rclone copy "$f" "$REMOTE"
rclone delete "$REMOTE" --min-age "${KEEP_DAYS}d"
echo "$(date -u +%FT%TZ) backup ok: $(basename "$f")"
