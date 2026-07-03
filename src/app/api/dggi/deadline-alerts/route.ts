/**
 * POST /api/dggi/deadline-alerts
 *
 * Background job endpoint. Call once daily (pg_cron, external cron, etc.).
 * Secured by a pre-shared CRON_SECRET header.
 *
 * What it does:
 *  1. Fetches all records from every table referenced in deadline-rules.json
 *  2. Applies the rule engine → ComputedDeadline[]
 *  3. Upserts rows into dggi_computed_deadlines (persists current state)
 *  4. For each non-skipped deadline, checks which reminder_bucket values fire
 *     today and haven't been sent yet (dggi_deadline_alerts_sent dedup)
 *  5. Inserts dggi_notifications rows for in-app delivery
 *  6. Marks buckets as sent in dggi_deadline_alerts_sent
 *
 * Returns a JSON summary of what was processed.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import rulesJson from "@/app/dashboard/deadline-rules.json";
import {
  ALL_TABLE_CONFIGS,
  bucketsToFireToday,
  computeDeadlinesForRecords,
} from "@/lib/dggi-deadline-engine";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // must be configured
  return req.headers.get("x-cron-secret") === secret;
}

// ─── Supabase admin client ────────────────────────────────────────────────────

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Column map from JSON ─────────────────────────────────────────────────────

const TABLE_COLUMNS: Record<string, string> = rulesJson.tableColumns;

// Strip relation aliases (e.g. "handling_io_sio:votum_users(name)" → just keep
// the column name without the join, since we query the raw FK value here)
function rawColumns(selectStr: string): string {
  return selectStr
    .split(",")
    .map((col) => {
      const joinIdx = col.indexOf(":");
      return joinIdx === -1 ? col.trim() : col.slice(0, joinIdx).trim();
    })
    .join(",");
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary: Record<string, { records: number; deadlines: number; notified: number }> = {};
  let totalNotified = 0;

  for (const config of ALL_TABLE_CONFIGS) {
    const selectCols = TABLE_COLUMNS[config.source_table];
    if (!selectCols) continue;

    // 1. Fetch all records for this table
    const { data: records, error: fetchErr } = await supabase
      .from(config.source_table)
      .select(rawColumns(selectCols));

    if (fetchErr) {
      console.error(`[deadline-alerts] fetch error ${config.source_table}:`, fetchErr.message);
      continue;
    }
    if (!records?.length) continue;

    // 2. Compute deadlines
    const computed = computeDeadlinesForRecords(records, config, today);

    // 3. Upsert into dggi_computed_deadlines
    if (computed.length) {
      const upsertRows = computed.map((d) => ({
        workspace_id: d.workspace_id,
        rule_id: d.rule_id,
        source_table: d.source_table,
        record_id: d.record_id,
        row_id: d.row_id,
        reference_date: d.reference_date,
        deadline_date: d.deadline_date,
        label: d.label,
        legal_reference: d.legal_reference,
        skipped: d.skipped,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from("dggi_computed_deadlines")
        .upsert(upsertRows, {
          onConflict: "workspace_id,rule_id,row_id",
          ignoreDuplicates: false,
        });

      if (upsertErr) {
        console.error(`[deadline-alerts] upsert error ${config.source_table}:`, upsertErr.message);
      }
    }

    // 4. Fire notifications for active (non-skipped) deadlines
    let tableNotified = 0;

    const activeDeadlines = computed.filter((d) => !d.skipped && d.row_id);

    for (const d of activeDeadlines) {
      const bucketsToday = bucketsToFireToday(d.days_until, d.reminder_days_before);
      if (!bucketsToday.length) continue;

      // Check which buckets haven't been sent yet
      const { data: alreadySent } = await supabase
        .from("dggi_deadline_alerts_sent")
        .select("reminder_bucket")
        .eq("workspace_id", d.workspace_id)
        .eq("rule_id", d.rule_id)
        .eq("record_id", d.record_id)
        .in("reminder_bucket", bucketsToday);

      const sentBuckets = new Set((alreadySent ?? []).map((r) => r.reminder_bucket));
      const newBuckets = bucketsToday.filter((b) => !sentBuckets.has(b));
      if (!newBuckets.length) continue;

      // 5. Insert notification rows (one per bucket, workspace-wide for now)
      const notifRows = newBuckets.map((bucket) => ({
        workspace_id: d.workspace_id,
        user_id: null, // workspace-wide; can be scoped to SIO later
        rule_id: d.rule_id,
        source_table: d.source_table,
        record_id: d.record_id,
        row_id: d.row_id || null,
        deadline_date: d.deadline_date,
        days_until: d.days_until,
        label: `${d.label} — ${d.record_id}`,
        legal_reference: d.legal_reference,
      }));

      const { error: notifErr } = await supabase
        .from("dggi_notifications")
        .insert(notifRows);

      if (notifErr) {
        console.error(`[deadline-alerts] notification insert error:`, notifErr.message);
        continue;
      }

      // 6. Mark buckets as sent
      const sentRows = newBuckets.map((bucket) => ({
        workspace_id: d.workspace_id,
        rule_id: d.rule_id,
        record_id: d.record_id,
        reminder_bucket: bucket,
        last_sent_date: today.toISOString().slice(0, 10),
      }));

      await supabase
        .from("dggi_deadline_alerts_sent")
        .upsert(sentRows, {
          onConflict: "workspace_id,rule_id,record_id,reminder_bucket",
          ignoreDuplicates: true,
        });

      tableNotified += newBuckets.length;
      totalNotified += newBuckets.length;
    }

    summary[config.source_table] = {
      records: records.length,
      deadlines: computed.length,
      notified: tableNotified,
    };
  }

  return NextResponse.json({ ok: true, today: today.toISOString().slice(0, 10), summary, totalNotified });
}
