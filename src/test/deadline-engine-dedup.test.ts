import {
  computeDeadlinesForRecords,
  TableDeadlineConfig,
} from "@/lib/dggi-deadline-engine";
import { describe, expect, it } from "vitest";

const TODAY = new Date("2026-07-16");

const PROVISIONAL_CONFIG: TableDeadlineConfig = {
  source_table: "dggi_provisional_attachment_records",
  dedup_field: "attachment_batch_id",
  deadlines: [
    {
      rule_id: "provisional_attachment_lapse",
      label: "Attachment order lapses",
      legal_reference: "Sec 83(2) CGST",
      reference_field: "date_of_attachment",
      offset_days: 365,
      reminder_days_before: [60, 30, 7],
      critical_days: 30,
      warning_days: 60,
      skip_if_not_null: ["date_of_release"],
      skip_if: { field: "out_of_monitoring", value: "true" },
    },
  ],
};

// Three property rows sharing one batch
const BATCH_ROWS = [
  {
    id: "row-1",
    record_id: "PAR/001/25-26-1",
    attachment_batch_id: "PAR/001/25-26",
    workspace_id: "ws-1",
    date_of_attachment: "2026-01-01",
  },
  {
    id: "row-2",
    record_id: "PAR/001/25-26-2",
    attachment_batch_id: "PAR/001/25-26",
    workspace_id: "ws-1",
    date_of_attachment: "2026-01-01",
  },
  {
    id: "row-3",
    record_id: "PAR/001/25-26-3",
    attachment_batch_id: "PAR/001/25-26",
    workspace_id: "ws-1",
    date_of_attachment: "2026-01-01",
  },
];

describe("dedup_field — provisional attachment", () => {
  it("produces exactly one deadline for a batch with three property rows", () => {
    const results = computeDeadlinesForRecords(
      BATCH_ROWS,
      PROVISIONAL_CONFIG,
      TODAY,
    );
    expect(results).toHaveLength(1);
  });

  it("the single deadline uses the first row's id", () => {
    const [d] = computeDeadlinesForRecords(
      BATCH_ROWS,
      PROVISIONAL_CONFIG,
      TODAY,
    );
    expect(d.row_id).toBe("row-1");
  });

  it("deadline date is attachment date + 365 days", () => {
    const [d] = computeDeadlinesForRecords(
      BATCH_ROWS,
      PROVISIONAL_CONFIG,
      TODAY,
    );
    expect(d.deadline_date).toBe("2026-12-31"); // 2026 is not a leap year: Jan 1 + 365 = Dec 31
  });

  it("skips the deadline when date_of_release is set on the representative row", () => {
    const rows = [
      { ...BATCH_ROWS[0], date_of_release: "2026-06-01" },
      ...BATCH_ROWS.slice(1),
    ];
    const [d] = computeDeadlinesForRecords(rows, PROVISIONAL_CONFIG, TODAY);
    expect(d.skipped).toBe(true);
  });

  it("two distinct batches produce two deadlines", () => {
    const secondBatch = [
      {
        id: "row-4",
        record_id: "PAR/002/25-26-1",
        attachment_batch_id: "PAR/002/25-26",
        workspace_id: "ws-1",
        date_of_attachment: "2026-02-01",
      },
      {
        id: "row-5",
        record_id: "PAR/002/25-26-2",
        attachment_batch_id: "PAR/002/25-26",
        workspace_id: "ws-1",
        date_of_attachment: "2026-02-01",
      },
    ];
    const results = computeDeadlinesForRecords(
      [...BATCH_ROWS, ...secondBatch],
      PROVISIONAL_CONFIG,
      TODAY,
    );
    expect(results).toHaveLength(2);
    const batchIds = results.map((r) =>
      r.record_id.split("-").slice(0, 3).join("-"),
    );
    expect(new Set(batchIds).size).toBe(2);
  });
});
