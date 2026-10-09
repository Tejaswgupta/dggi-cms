#!/usr/bin/env bash
# Recompute dggi_computed_deadlines by POSTing the local app's cron endpoint.
# Run daily via systemd/dggi-deadlines.timer. Needs CRON_SECRET in .env.local.
set -euo pipefail

set -a; . "$(dirname "$0")/../.env.local"; set +a
: "${CRON_SECRET:?set CRON_SECRET in .env.local}"

curl -sS --fail-with-body -X POST "${APP_URL:-http://127.0.0.1:3005}/api/dggi/deadline-alerts" \
  -H "x-cron-secret: $CRON_SECRET"
echo
