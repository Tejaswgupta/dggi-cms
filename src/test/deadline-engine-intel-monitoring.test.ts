import { describe, it, expect } from "vitest";
import {
  ALL_TABLE_CONFIGS,
  computeDeadlinesForRecords,
} from "@/lib/dggi-deadline-engine";

const TODAY = new Date("2026-07-16");

function configFor(table: string) {
  const config = ALL_TABLE_CONFIGS.find((c) => c.source_table === table);
  if (!config) throw new Error(`no config for ${table}`);
  return config;
}

// parseISO/toISOString round-tripping shifts by the runner's UTC offset, so
// compare via Date arithmetic rather than hardcoded strings.
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

describe("Intelligence Monitoring ADG put-up deadline — reference dates", () => {
  it("Rapid uses date_of_receipt, not created_at", () => {
    const config = configFor("dggi_intel_rapid_records");
    const row = {
      id: "r-1",
      record_id: "RAPID/001",
      workspace_id: "ws-1",
      created_at: "2026-01-01",
      date_of_receipt: "2026-06-20",
    };
    const [d] = computeDeadlinesForRecords([row], config, TODAY);
    expect(d.reference_date).not.toBe("2026-01-01"); // not created_at
    expect(daysBetween(d.reference_date, d.deadline_date)).toBe(30);
  });

  it("STR uses date_of_receipt, not created_at", () => {
    const config = configFor("dggi_str_records");
    const row = {
      id: "s-1",
      record_id: "STR/001",
      workspace_id: "ws-1",
      created_at: "2026-01-01",
      date_of_receipt: "2026-06-20",
    };
    const [d] = computeDeadlinesForRecords([row], config, TODAY);
    expect(d.reference_date).not.toBe("2026-01-01"); // not created_at
    expect(daysBetween(d.reference_date, d.deadline_date)).toBe(30);
  });

  it("Other Sources uses date_of_receipt", () => {
    const config = configFor("dggi_intel_other_source_records");
    const row = {
      id: "o-1",
      record_id: "OTH/001",
      workspace_id: "ws-1",
      created_at: "2026-01-01",
      date_of_receipt: "2026-06-20",
    };
    const [d] = computeDeadlinesForRecords([row], config, TODAY);
    expect(d.reference_date).not.toBe("2026-01-01"); // not created_at
    expect(daysBetween(d.reference_date, d.deadline_date)).toBe(30);
  });

  it("skip_if_not_null keys match real columns (non_ir_date, not the stale date_of_non_ir)", () => {
    const row = {
      id: "r-2",
      record_id: "RAPID/002",
      workspace_id: "ws-1",
      date_of_receipt: "2026-01-01",
      non_ir_date: "2026-01-15",
    };
    const [d] = computeDeadlinesForRecords([row], configFor("dggi_intel_rapid_records"), TODAY);
    expect(d.skipped).toBe(true);
  });
});
