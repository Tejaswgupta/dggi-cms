import { describe, it, expect } from "vitest";
import {
  ALL_TABLE_CONFIGS,
  computeDeadlinesForRecords,
} from "@/lib/dggi-deadline-engine";

const TODAY = new Date("2026-07-16");

const config = (() => {
  const c = ALL_TABLE_CONFIGS.find((t) => t.source_table === "dggi_records");
  if (!c) throw new Error("no config for dggi_records");
  return c;
})();

function conversionRow(rows: Record<string, unknown>[]) {
  return computeDeadlinesForRecords(rows, config, TODAY).find(
    (d) => d.rule_id === "non_ir_conversion_deadline",
  );
}

describe("non_ir_conversion_deadline — NON-IR aging without conversion", () => {
  it("fires (expired) for a NON-IR older than 30 days", () => {
    const d = conversionRow([
      {
        id: "n-1",
        record_id: "NIR/001",
        workspace_id: "ws-1",
        is_ir: false,
        date_of_non_ir: "2026-06-01", // 45 days before TODAY
      },
    ]);
    expect(d?.skipped).toBe(false);
    expect(d?.urgency).toBe("expired");
  });

  it("stays safe inside the 30-day window", () => {
    const d = conversionRow([
      {
        id: "n-2",
        record_id: "NIR/002",
        workspace_id: "ws-1",
        is_ir: false,
        date_of_non_ir: "2026-07-14",
      },
    ]);
    expect(d?.urgency).toBe("safe");
  });

  it("does not apply to IR cases", () => {
    const d = conversionRow([
      {
        id: "i-1",
        record_id: "IR/001",
        workspace_id: "ws-1",
        is_ir: true,
        date_of_non_ir: "2026-06-01",
      },
    ]);
    expect(d?.skipped).toBe(true);
  });
});
