/**
 * DGGI Deadline Rule Engine
 *
 * Single source of truth for applying deadline-rules.json to any set of
 * records. Used by:
 *  - the dashboard (client-side display)
 *  - the /api/dggi/deadline-alerts route (server-side persistence + alerting)
 */

import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import rulesJson from "@/app/dashboard/deadline-rules.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeadlineRule {
  rule_id: string;
  label: string;
  legal_reference: string;
  reference_field: string;
  offset_days: number;
  reminder_days_before: number[];
  critical_days: number;
  warning_days: number;
  skip_if?:
    | { field: string; value: string }
    | { field: string; value: string }[];
  skip_if_not_null?: string[];
  apply_only_if?: { field: string; value: string };
}

export interface TableDeadlineConfig {
  source_table: string;
  deadlines: DeadlineRule[];
}

export type Urgency = "expired" | "critical" | "warning" | "safe";

export interface ComputedDeadline {
  rule_id: string;
  source_table: string;
  record_id: string;   // record_id text (human-readable ID)
  row_id: string;      // uuid (id column)
  workspace_id: string;
  reference_date: string;   // ISO date string of the reference field
  deadline_date: string;    // ISO date string of computed deadline
  days_until: number;
  urgency: Urgency;
  label: string;
  legal_reference: string;
  reminder_days_before: number[];
  critical_days: number;
  warning_days: number;
  skipped: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

// ─── Load rules ───────────────────────────────────────────────────────────────

export const ALL_TABLE_CONFIGS: TableDeadlineConfig[] =
  rulesJson.deadlineRules as TableDeadlineConfig[];

// ─── Core computation ─────────────────────────────────────────────────────────

/**
 * For a set of records from one table, compute all deadline rows (one per
 * rule per record, including skipped ones so they can be upserted with
 * skipped=true to stop alerting).
 */
export function computeDeadlinesForRecords(
  records: AnyRecord[],
  config: TableDeadlineConfig,
  today: Date = new Date(),
): ComputedDeadline[] {
  const todayNorm = new Date(today);
  todayNorm.setHours(0, 0, 0, 0);

  const results: ComputedDeadline[] = [];

  for (const rule of config.deadlines) {
    for (const record of records) {
      if (
        record.out_of_monitoring === "true" ||
        record.out_of_monitoring === true
      )
        continue;

      const workspaceId: string = record.workspace_id ?? "";
      const recordId: string = record.record_id ?? record.id ?? "";
      const rowId: string = record.id ?? "";

      const refRaw = record[rule.reference_field];
      if (!refRaw) continue;

      const refDate = parseISO(String(refRaw));
      if (!isValid(refDate)) continue;

      // Determine if this deadline is skipped (already resolved)
      let skipped = false;

      if (rule.apply_only_if) {
        if (String(record[rule.apply_only_if.field]) !== rule.apply_only_if.value) {
          skipped = true;
        }
      }
      if (!skipped && rule.skip_if) {
        const skips = Array.isArray(rule.skip_if) ? rule.skip_if : [rule.skip_if];
        if (skips.some((s) => record[s.field] === s.value)) skipped = true;
      }
      if (!skipped && rule.skip_if_not_null?.some((f) => !!record[f])) {
        skipped = true;
      }

      const deadlineDate = new Date(refDate);
      deadlineDate.setDate(deadlineDate.getDate() + rule.offset_days);

      const daysUntil = differenceInCalendarDays(deadlineDate, todayNorm);

      const urgency: Urgency = skipped
        ? "safe"
        : daysUntil < 0
          ? "expired"
          : daysUntil <= rule.critical_days
            ? "critical"
            : daysUntil <= rule.warning_days
              ? "warning"
              : "safe";

      results.push({
        rule_id: rule.rule_id,
        source_table: config.source_table,
        record_id: recordId,
        row_id: rowId,
        workspace_id: workspaceId,
        reference_date: refDate.toISOString().slice(0, 10),
        deadline_date: deadlineDate.toISOString().slice(0, 10),
        days_until: daysUntil,
        urgency,
        label: rule.label,
        legal_reference: rule.legal_reference,
        reminder_days_before: rule.reminder_days_before,
        critical_days: rule.critical_days,
        warning_days: rule.warning_days,
        skipped,
      });
    }
  }

  return results;
}

/**
 * Which reminder_bucket values should fire today for a computed deadline?
 * A bucket fires if daysUntil <= bucket and no larger bucket also matches
 * (we only want the most specific bucket per run — the dedup table handles
 * ensuring each bucket fires exactly once).
 */
export function bucketsToFireToday(
  daysUntil: number,
  reminderDaysBefore: number[],
): number[] {
  return reminderDaysBefore.filter((b) => daysUntil <= b);
}
