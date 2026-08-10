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
  if (req.headers.get("x-internal-cron") === "1") return true;
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.get("x-cron-secret") === secret;
  return false;
}

// ─── Supabase admin client ────────────────────────────────────────────────────

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TABLE_COLUMNS: Record<string, string> = rulesJson.tableColumns;

// sioFields / officerFields are tried in order; the first non-empty wins.
// dggi_records keeps the officer in handling_io_sio (the canonical assignment
// column); nameField is a plain-text display fallback used when the UUID does
// not resolve to a votum_users name (e.g. seeded rows carrying only sio_name).
interface RecipientConfig {
  sioFields: string[];
  groupField: string;
  officerFields: string[];
  nameField?: string;
}

const TABLE_RECIPIENTS: Record<string, RecipientConfig> = {
  dggi_scn_records:                    { sioFields: ["sio"],             groupField: "group",          officerFields: ["adjudication_formation"] },
  dggi_provisional_attachment_records: { sioFields: ["sio"],             groupField: "group",          officerFields: ["sio"] },
  dggi_prosecution_arrest_records:     { sioFields: ["sio"],             groupField: "group",          officerFields: ["sio"] },
  dggi_prosecution_non_arrest_records: { sioFields: ["sio"],             groupField: "group",          officerFields: ["sio"] },
  dggi_seizure_records:                { sioFields: ["sio"],             groupField: "group",          officerFields: ["seized_by"] },
  dggi_intel_rapid_records:            { sioFields: ["sio"],             groupField: "assigned_group", officerFields: ["assigned_group"] },
  dggi_str_records:                    { sioFields: ["sio"],             groupField: "assigned_group", officerFields: ["assigned_group"] },
  dggi_records:                        { sioFields: ["handling_io_sio"], groupField: "group",          officerFields: ["handling_io_sio"], nameField: "sio_name" },
  dggi_dfl_records:                    { sioFields: ["sio"],             groupField: "group",          officerFields: ["sio"] },
};

// First non-empty value across the given candidate columns.
function firstVal(
  rec: Record<string, unknown> | undefined,
  fields: string[],
): string | null {
  if (!rec) return null;
  for (const f of fields) {
    const v = rec[f];
    if (v && typeof v === "string" && v.trim()) return v;
  }
  return null;
}

const ENTITY_FIELDS: string[] = [
  "noticee_name", "entity_name", "person_name", "taxpayer_name",
  "arrested_person_name", "received_against_entity", "linked_case_id", "record_id",
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

    // Exclude closed/transferred records — a non-empty closure_by means the case
    // is terminal and no further deadlines should be tracked.
    const openRecords = config.source_table === "dggi_records"
      ? records.filter((r) => !r.closure_by || !String(r.closure_by).trim())
      : records;

    // 2. Compute deadlines
    const computed = computeDeadlinesForRecords(openRecords, config, today);
    if (!computed.length) continue;

    // 3. Batch-resolve officer names for all unique officer user IDs in this table
    const rf = TABLE_RECIPIENTS[config.source_table];
    const officerUserIds = rf
      ? [...new Set(
          records
            .map((r) => firstVal(r, rf.officerFields))
            .filter((v): v is string => !!v),
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
      const officerRaw = rf ? firstVal(rec, rf.officerFields) : null;
      const nameFallback =
        rf?.nameField && rec ? firstVal(rec, [rf.nameField]) : null;
      const officerName = officerRaw
        ? (officerNames.get(officerRaw) ?? nameFallback ?? officerRaw) // resolved name → plain-text name col → raw value
        : nameFallback;
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
        sio_user_id:      (rf ? firstVal(rec, rf.sioFields) : null),
        group_name:       (rec && rf ? (rec[rf.groupField] ?? null) : null) as string | null,
        entity_name:      rec ? getEntityName(rec) : null,
        linked_case_id:   (rec?.linked_case_id as string | undefined) ?? null,
        officer_name:     officerName,
        critical_days:    d.critical_days,
        warning_days:     d.warning_days,
        max_reminder_days: Math.max(...d.reminder_days_before, 0),
        updated_at: new Date().toISOString(),
      };
    });

    // For deduped tables, wipe all existing rows before inserting the clean set.
    if (config.dedup_field) {
      const { error: delErr } = await supabase
        .from("dggi_computed_deadlines")
        .delete()
        .eq("source_table", config.source_table);
      if (delErr) {
        console.error(`[deadline-alerts] cleanup error ${config.source_table}:`, delErr.message);
      }
    }

    // Purge stale rows for closed dggi_records — they were filtered out above so
    // they won't be upserted, but previous runs may have left rows behind.
    if (config.source_table === "dggi_records") {
      const closedIds = records
        .filter((r) => r.closure_by && String(r.closure_by).trim())
        .map((r) => r.id as string)
        .filter(Boolean);
      if (closedIds.length) {
        await supabase
          .from("dggi_computed_deadlines")
          .delete()
          .eq("source_table", "dggi_records")
          .in("row_id", closedIds);
      }
    }

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
