import { exportToExcel, type ExcelColumn } from "@/lib/excel-export";
import { SupabaseClient } from "@supabase/supabase-js";
import type { DGGICaseOption } from "./CaseIdCombobox";

export const REGISTER_PREFIXES = {
  DGGI: "DGG",
  SCN: "SCN",
  SCN_AD_DD: "AD-DD",
  SCN_SIO: "SIO",
  SCN_ADD_JD: "ADC-JC",
  PROVISIONAL_ATTACHMENT: "PAR",
  INCIDENT_REPORT: "IRR",
  ARREST: "ARR",
  NON_IR: "NIR",
  CLOSURE_IR: "CIR",
  CLOSURE_NON_IR: "CNR",
  INTEL_RAPID: "RPD",
  INTEL_OTHER: "IOS",
  ALERT_CIRCULAR: "ALC",
  MODUS_OPERANDI: "MOC",
  PROSECUTION_ARREST: "PRA",
  PROSECUTION_NON_ARREST: "PRN",
  STR: "STR",
  CPGRAM: "CPG",
  INFORMER_REWARD: "IFR",
  DFL: "DFL",
  REPORT_COMPLIANCE: "RPC",
  EVIDENCE_ROOM: "EVR",
  SEIZURE: "SZR",
} as const;

// Columns whose empty-string values must become null before hitting Postgres.
// - caselink / usercombobox / arrestlink → UUID FK columns
// - datepicker → DATE/TIMESTAMPTZ columns
// - number → NUMERIC columns
const NULL_ON_EMPTY_TYPES = new Set([
  "caselink",
  "usercombobox",
  "arrestlink",
  "datepicker",
  "number",
]);

export const nullifyEmpty = (
  payload: Record<string, unknown>,
  columns: { key: string; type: string }[],
): Record<string, unknown> => {
  const out = { ...payload };
  for (const col of columns) {
    if (NULL_ON_EMPTY_TYPES.has(col.type) && out[col.key] === "") {
      out[col.key] = null;
    }
  }
  return out;
};

export const currentFY = (): string => {
  const now = new Date();
  const yr = now.getFullYear();
  const start = now.getMonth() >= 3 ? yr : yr - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
};

export const currentFYFull = (): string => {
  const now = new Date();
  const yr = now.getFullYear();
  const start = now.getMonth() >= 3 ? yr : yr - 1;
  return `${start}-${String(start + 1).slice(2)}`;
};

/**
 * Atomically generates the next sequential record ID via a Postgres sequence table.
 * Race-safe: DB uses SELECT FOR UPDATE so concurrent inserts cannot produce the same ID.
 * The `_table` and `filter` params are accepted but ignored — the sequence is keyed
 * by (workspace_id, prefix, fy), not by row count.
 */
export const generateWorkspaceRecordId = async (
  supabase: SupabaseClient,
  _table: string,
  prefix: string,
  workspaceId: string,
  options?: {
    filter?: Record<string, string | number | boolean | null>;
    separator?: string;
  },
): Promise<string> => {
  const sep = options?.separator ?? "/";
  const { data, error } = await supabase.rpc("next_record_id", {
    p_workspace_id: workspaceId,
    p_prefix: prefix,
    p_fy: currentFY(),
    p_separator: sep,
  });
  if (error) throw new Error(`Failed to generate record ID: ${error.message}`);
  return data as string;
};

/**
 * Atomically generates N sequential record IDs in a single DB round-trip.
 * Returns IDs like ["ARR/050/26-27", "ARR/051/26-27"] for a batch of 2.
 */
export const generateWorkspaceRecordIds = async (
  supabase: SupabaseClient,
  _table: string,
  prefix: string,
  workspaceId: string,
  n: number,
  options?: { separator?: string },
): Promise<string[]> => {
  const sep = options?.separator ?? "/";
  const { data, error } = await supabase.rpc("next_record_ids_batch", {
    p_workspace_id: workspaceId,
    p_prefix: prefix,
    p_fy: currentFY(),
    p_n: n,
    p_separator: sep,
  });
  if (error) throw new Error(`Failed to generate record IDs: ${error.message}`);
  return data as string[];
};

/**
 * Atomically generates a Closure Register record ID in the prescribed format:
 *   Full-payment closures  ("Closed After Payment of Tax")
 *     → "DGGI/MZU/CR/FP/{YYYY-YY}/{NNN}"   e.g. "DGGI/MZU/CR/FP/2026-27/001"
 *   All other closures
 *     → "DGGI/MZU/CR-NSP-{YYYY-YY}/{NNN}"  e.g. "DGGI/MZU/CR-NSP-2026-27/001"
 */
export const generateClosureRecordId = async (
  supabase: SupabaseClient,
  workspaceId: string,
  closureBy: string,
): Promise<string> => {
  const isFP = closureBy === "Closed After Payment of Tax";
  const fy = currentFYFull();
  // Use distinct prefix keys so FP and NSP counters don't share the same sequence.
  const seqPrefix = isFP ? "CR_FP" : "CR_NSP";
  const { data, error } = await supabase.rpc("next_seq_val", {
    p_workspace_id: workspaceId,
    p_prefix: seqPrefix,
    p_fy: fy,
  });
  if (error) throw new Error(`Failed to generate closure record ID: ${error.message}`);
  const seq = String(data as number).padStart(3, "0");
  return isFP
    ? `DGGI/MZU/CR/FP/${fy}/${seq}`
    : `DGGI/MZU/CR-NSP-${fy}/${seq}`;
};

/**
 * Atomically generates an IR case record ID matching the DGGI Excel convention:
 * IR cases     → "{seq}/GST/{YYYY-YY}"  e.g. "001/GST/2026-27"
 * NON-IR cases → "NIR-{seq}-{YY-YY}"   e.g. "NIR-001-26-27"
 */
export const generateIRCaseRecordId = async (
  supabase: SupabaseClient,
  workspaceId: string,
  isIR: boolean,
): Promise<string> => {
  if (isIR) {
    const fy = currentFYFull();
    const { data, error } = await supabase.rpc("next_seq_val", {
      p_workspace_id: workspaceId,
      p_prefix: "IR",
      p_fy: fy,
    });
    if (error) throw new Error(`Failed to generate IR record ID: ${error.message}`);
    return `${String(data as number).padStart(3, "0")}/GST/${fy}`;
  }
  const fy = currentFY();
  const { data, error } = await supabase.rpc("next_seq_val", {
    p_workspace_id: workspaceId,
    p_prefix: "NIR",
    p_fy: fy,
  });
  if (error) throw new Error(`Failed to generate NIR record ID: ${error.message}`);
  return `NIR-${String(data as number).padStart(3, "0")}-${fy}`;
};

/**
 * Fetches all dggi_records (case IDs) for the workspace — used by subsidiary
 * register components to populate the "Link Case" combobox.
 */
export const fetchCaseOptions = async (
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<DGGICaseOption[]> => {
  const { data, error } = await supabase
    .from("dggi_records")
    .select(
      "record_id, taxpayer_name, file_no, is_ir, handling_io_sio, group, detection_amount, date_of_initiation, date_of_receipt, gstins, closure_by, issue_involved",
    )
    .eq("workspace_id", workspaceId)
    .not("record_id", "is", null)
    .not("closure_by", "is", null)
    .order("record_id");

  console.log("fetchCaseOptions data:", data, "error:", error);
  if (error) {
    console.error("fetchCaseOptions error:", error);
    return [];
  }
  return (data ?? []) as DGGICaseOption[];
};

/**
 * Generic export handler for register components
 * @param records Array of records to export
 * @param columns Column definitions from the component
 * @param registerName Name of the register (e.g., "STR", "DGGI")
 * @param toast Toast notification function
 */
export const exportRegisterToExcel = <T extends Record<string, any>>(
  records: T[],
  columns: Array<{
    key: string;
    label: string;
    type?: "text" | "datepicker" | "date" | "number" | "select" | string;
  }>,
  registerName: string,
  toast?: (message: string) => void,
) => {
  const excelColumns: ExcelColumn<T>[] = columns.map((col) => ({
    key: col.key as keyof T,
    label: col.label,
    type: col.type === "datepicker" || col.type === "date" ? "date" : "text",
  }));

  exportToExcel(records, excelColumns, {
    filename: `${registerName}_Register`,
    sheetName: `${registerName} Records`,
    includeTimestamp: true,
  });

  if (toast) {
    toast(
      `Exported ${records.length} record${records.length !== 1 ? "s" : ""} to Excel`,
    );
  }
};
