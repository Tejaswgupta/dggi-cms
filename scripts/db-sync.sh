#!/usr/bin/env bash
set -euo pipefail

DB_HOST="db.zrkvvedwycdcjjheewef.supabase.co"
# Force IPv4 — machine may lack IPv6 connectivity
DB_HOST=$(getent ahostsv4 "$DB_HOST" | awk 'NR==1{print $1}')
DB_URL="postgresql://postgres:inVAIFRtVEmU4RQ5@${DB_HOST}:5432/postgres?sslmode=require"

# Dump roles (globals only, no schema/data)
pg_dumpall --globals-only --no-role-passwords \
  -d "$DB_URL" \
  -f roles.sql

# Dump schema only (no data)
pg_dump --schema-only \
  -d "$DB_URL" \
  -f schema.sql

# Dump data only
pg_dump --data-only --column-inserts \
  -d "$DB_URL" \
  -f data.sql
