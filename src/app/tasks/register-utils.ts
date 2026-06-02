import { SupabaseClient } from "@supabase/supabase-js";
import { exportToExcel, type ExcelColumn } from "@/lib/excel-export";
import type { DGGICaseOption } from "./CaseIdCombobox";

export const REGISTER_PREFIXES = {
  DGGI: "DGG",
  SCN: "SCN",
  PROVISIONAL_ATTACHMENT: "PAR",
  INCIDENT_REPORT: "IRR",
  ARREST: "ARR",
  NON_IR: "NIR",
  CLOSURE: "CLR",
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

export const currentFY = (): string => {
  const now = new Date();
  const yr = now.getFullYear();
  const start = now.getMonth() >= 3 ? yr : yr - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
};

/**
 * Queries the DB for the current workspace record count and generates a sequential ID.
 * Safe for concurrent inserts across workspace members.
 */
export const generateWorkspaceRecordId = async (
  supabase: SupabaseClient,
  table: string,
  prefix: string,
  workspaceId: string,
  options?: { filter?: Record<string, string | number | boolean | null>; separator?: string },
): Promise<string> => {
  const sep = options?.separator ?? "/";
  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (options?.filter) {
    for (const [key, val] of Object.entries(options.filter)) {
      query = query.eq(key, val);
    }
  }
  const { count, error } = await query;
  if (error) throw new Error(`Failed to fetch record count: ${error.message}`);
  return `${prefix}${sep}${String((count ?? 0) + 1).padStart(3, "0")}${sep}${currentFY()}`;
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
    .select("record_id, taxpayer_name, file_no, is_ir")
    .eq("workspace_id", workspaceId)
    .not("record_id", "is", null)
    .order("record_id");
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
  toast?: (message: string) => void
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
      `Exported ${records.length} record${records.length !== 1 ? "s" : ""} to Excel`
    );
  }
};
