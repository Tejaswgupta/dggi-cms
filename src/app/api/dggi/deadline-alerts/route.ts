/**
 * POST /api/dggi/deadline-alerts
 *
 * Background job endpoint. Call once daily (pg_cron, external cron, etc.).
 * Secured by a pre-shared CRON_SECRET header.
 *
 * What it does:
 *  1. Fetches all records from every table referenced in deadline-rules.json
 *  2. Applies the rule engine → ComputedDeadline[]
 *  3. Upserts rows into dggi_computed_deadlines, including sio_user_id and
 *     group_name so the notifications page can filter without re-joining source
 *     tables on every user load.
 *
 * The notifications page queries dggi_computed_deadlines directly — no per-user
 * copies, no bucket-firing, no dggi_notifications rows for deadlines.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import rulesJson from "@/app/dashboard/deadline-rules.json";
import {
  ALL_TABLE_CONFIGS,
  computeDeadlinesForRecords,
} from "@/lib/dggi-deadline-engine";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

// ─── Supabase admin client ────────────────────────────────────────────────────

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TABLE_COLUMNS: Record<string, string> = rulesJson.tableColumns;

const TABLE_RECIPIENTS: Record<string, { sioField: string; groupField: string; officerField: string }> = {
  dggi_scn_records:                    { sioField: "sio",             groupField: "group",          officerField: "adjudication_formation" },
  dggi_provisional_attachment_records: { sioField: "sio",             groupField: "group",          officerField: "sio" },
  dggi_prosecution_arrest_records:     { sioField: "sio",             groupField: "group",          officerField: "sio" },
  dggi_prosecution_non_arrest_records: { sioField: "sio",             groupField: "group",          officerField: "sio" },
  dggi_seizure_records:                { sioField: "sio",             groupField: "group",          officerField: "seized_by" },
  dggi_intel_rapid_records:            { sioField: "sio",             groupField: "assigned_group", officerField: "assigned_group" },
  dggi_str_records:                    { sioField: "sio",             groupField: "assigned_group", officerField: "assigned_group" },
  dggi_records:                        { sioField: "handling_io_sio", groupField: "group",          officerField: "handling_io_sio" },
  dggi_dfl_records:                    { sioField: "sio",             groupField: "group",          officerField: "sio" },
};

const ENTITY_FIELDS: string[] = [
  "noticee_name", "entity_name", "person_name", "taxpayer_name",
  "arrested_person_name", "received_against_entity", "record_id",
];

function getEntityName(rec: Record<string, unknown>): string {
  for (const f of ENTITY_FIELDS) {
    const v = rec[f];
    if (v && typeof v === "string" && v.trim()) return v.trim();
  }
  return (rec.record_id as string | undefined) ?? "";
}

// Strip relation aliases (e.g. "handling_io_sio:votum_users(name)" → raw FK column)
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

  const summary: Record<string, { records: number; upserted: number }> = {};

  for (const config of ALL_TABLE_CONFIGS) {
    const selectCols = TABLE_COLUMNS[config.source_table];
    if (!selectCols) continue;

    // 1. Fetch all records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: records, error: fetchErr } = await supabase
      .from(config.source_table)
      .select(rawColumns(selectCols)) as { data: Record<string, any>[] | null; error: { message: string } | null };

    if (fetchErr) {
      console.error(`[deadline-alerts] fetch error ${config.source_table}:`, fetchErr.message);
      continue;
    }
    if (!records?.length) continue;

    // 2. Compute deadlines
    const computed = computeDeadlinesForRecords(records, config, today);
    if (!computed.length) continue;

    // 3. Batch-resolve officer names for all unique officer user IDs in this table
    const rf = TABLE_RECIPIENTS[config.source_table];
    const officerUserIds = rf
      ? [...new Set(
          records.map((r) => r[rf.officerField]).filter((v) => v && typeof v === "string") as string[],
        )]
      : [];

    const officerNames = new Map<string, string>();
    if (officerUserIds.length) {
      const { data: userRows } = await supabase
        .from("votum_users")
        .select("id,name")
        .in("id", officerUserIds);
      for (const u of (userRows ?? []) as { id: string; name: string }[]) {
        if (u.name) officerNames.set(u.id, u.name);
      }
    }

    // 4. Upsert — all display + recipient fields denormalised so consumers
    //    never need to join back to the source table.
    const upsertRows = computed.map((d) => {
      const rec = records.find((r) => r.id === d.row_id);
      const officerRaw = rec && rf ? (rec[rf.officerField] as string | undefined) : undefined;
      const officerName = officerRaw
        ? (officerNames.get(officerRaw) ?? officerRaw) // fall back to raw value if not a UUID
        : null;
      return {
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
        sio_user_id:      (rec && rf ? (rec[rf.sioField] ?? null) : null) as string | null,
        group_name:       (rec && rf ? (rec[rf.groupField] ?? null) : null) as string | null,
        entity_name:      rec ? getEntityName(rec) : null,
        officer_name:     officerName,
        critical_days:    d.critical_days,
        warning_days:     d.warning_days,
        max_reminder_days: Math.max(...d.reminder_days_before, 0),
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upsertErr } = await supabase
      .from("dggi_computed_deadlines")
      .upsert(upsertRows, {
        onConflict: "workspace_id,rule_id,row_id",
        ignoreDuplicates: false,
      });

    if (upsertErr) {
      console.error(`[deadline-alerts] upsert error ${config.source_table}:`, upsertErr.message);
    }

    summary[config.source_table] = { records: records.length, upserted: upsertRows.length };
  }

  return NextResponse.json({ ok: true, today: today.toISOString().slice(0, 10), summary });
}
