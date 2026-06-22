/**
 * Tests for the batch record ID derivation pattern used by
 * ArrestRegisterComponent and ProvisionalAttachmentComponent.
 *
 * The rule: individual record IDs are derived as `${batchId}-${index}`
 * where index is 1-based from existing batch members.
 */
import { describe, it, expect } from "vitest";

// ─── Helpers extracted from component logic ───────────────────────────────────

function deriveChildRecordId(batchId: string, existingCount: number): string {
  return `${batchId}-${existingCount + 1}`;
}

function buildBatchPayloads(
  batchId: string,
  batchFields: Record<string, string>,
  items: Record<string, string>[],
  workspaceId: string,
): Record<string, unknown>[] {
  return items.map((item, idx) => ({
    ...batchFields,
    ...item,
    arrest_batch_id: batchId,
    record_id: `${batchId}-${idx + 1}`,
    workspace_id: workspaceId,
  }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("batch record ID derivation", () => {
  it("first child of a batch gets index -1", () => {
    expect(deriveChildRecordId("ARR/001/25-26", 0)).toBe("ARR/001/25-26-1");
  });

  it("second child gets index -2", () => {
    expect(deriveChildRecordId("ARR/001/25-26", 1)).toBe("ARR/001/25-26-2");
  });

  it("correctly increments for PAR batches", () => {
    expect(deriveChildRecordId("PAR/003/25-26", 2)).toBe("PAR/003/25-26-3");
  });
});

describe("batch payload builder", () => {
  const BATCH_ID = "ARR/001/25-26";
  const WS = "ws-abc";
  const batchFields = { linked_case_id: "case-uuid", date_of_arrest: "2025-01-01" };

  it("assigns unique record_id to each person in the batch", () => {
    const persons = [
      { arrested_name: "Alice" },
      { arrested_name: "Bob" },
      { arrested_name: "Charlie" },
    ];
    const payloads = buildBatchPayloads(BATCH_ID, batchFields, persons, WS);
    expect(payloads[0].record_id).toBe("ARR/001/25-26-1");
    expect(payloads[1].record_id).toBe("ARR/001/25-26-2");
    expect(payloads[2].record_id).toBe("ARR/001/25-26-3");
  });

  it("sets arrest_batch_id on every payload", () => {
    const payloads = buildBatchPayloads(BATCH_ID, batchFields, [{ name: "X" }], WS);
    expect(payloads[0].arrest_batch_id).toBe(BATCH_ID);
  });

  it("merges batch fields into every payload", () => {
    const payloads = buildBatchPayloads(
      BATCH_ID,
      batchFields,
      [{ name: "X" }, { name: "Y" }],
      WS,
    );
    for (const p of payloads) {
      expect(p.linked_case_id).toBe("case-uuid");
      expect(p.date_of_arrest).toBe("2025-01-01");
    }
  });

  it("person-level fields override batch fields when key collides", () => {
    const payloads = buildBatchPayloads(
      BATCH_ID,
      { note: "batch-note" },
      [{ note: "person-note" }],
      WS,
    );
    expect(payloads[0].note).toBe("person-note");
  });

  it("sets workspace_id on every payload", () => {
    const payloads = buildBatchPayloads(BATCH_ID, {}, [{ n: "a" }, { n: "b" }], WS);
    for (const p of payloads) expect(p.workspace_id).toBe(WS);
  });

  it("returns empty array for empty items list", () => {
    expect(buildBatchPayloads(BATCH_ID, {}, [], WS)).toEqual([]);
  });
});
