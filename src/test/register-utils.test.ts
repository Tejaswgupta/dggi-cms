import { describe, it, expect, vi, beforeEach } from "vitest";
import { nullifyEmpty, currentFY, generateWorkspaceRecordId, REGISTER_PREFIXES } from "@/app/tasks/register-utils";

// ─── nullifyEmpty ─────────────────────────────────────────────────────────────

describe("nullifyEmpty", () => {
  const COLS = [
    { key: "linked_case_id", type: "caselink" },
    { key: "sio", type: "usercombobox" },
    { key: "seized_by", type: "usercombobox" },
    { key: "linked_arrest_id", type: "arrestlink" },
    { key: "date_of_arrest", type: "datepicker" },
    { key: "amount", type: "number" },
    { key: "name", type: "text" },
    { key: "status", type: "select" },
  ];

  it("converts empty strings to null for caselink columns", () => {
    const result = nullifyEmpty({ linked_case_id: "" }, COLS);
    expect(result.linked_case_id).toBeNull();
  });

  it("converts empty strings to null for usercombobox columns", () => {
    const result = nullifyEmpty({ sio: "", seized_by: "" }, COLS);
    expect(result.sio).toBeNull();
    expect(result.seized_by).toBeNull();
  });

  it("converts empty strings to null for arrestlink columns", () => {
    const result = nullifyEmpty({ linked_arrest_id: "" }, COLS);
    expect(result.linked_arrest_id).toBeNull();
  });

  it("converts empty strings to null for datepicker columns", () => {
    const result = nullifyEmpty({ date_of_arrest: "" }, COLS);
    expect(result.date_of_arrest).toBeNull();
  });

  it("converts empty strings to null for number columns", () => {
    const result = nullifyEmpty({ amount: "" }, COLS);
    expect(result.amount).toBeNull();
  });

  it("does NOT nullify empty strings for text columns", () => {
    const result = nullifyEmpty({ name: "" }, COLS);
    expect(result.name).toBe("");
  });

  it("does NOT nullify empty strings for select columns", () => {
    const result = nullifyEmpty({ status: "" }, COLS);
    expect(result.status).toBe("");
  });

  it("does NOT change non-empty values", () => {
    const result = nullifyEmpty(
      { linked_case_id: "uuid-abc", sio: "uuid-xyz", date_of_arrest: "2024-01-01", amount: "5" },
      COLS,
    );
    expect(result.linked_case_id).toBe("uuid-abc");
    expect(result.sio).toBe("uuid-xyz");
    expect(result.date_of_arrest).toBe("2024-01-01");
    expect(result.amount).toBe("5");
  });

  it("returns a shallow copy — does not mutate the input", () => {
    const input = { linked_case_id: "" };
    nullifyEmpty(input, COLS);
    expect(input.linked_case_id).toBe("");
  });

  it("passes through keys not present in columns unchanged", () => {
    const result = nullifyEmpty({ unknown_field: "", workspace_id: "ws-1" }, COLS);
    expect(result.unknown_field).toBe("");
    expect(result.workspace_id).toBe("ws-1");
  });

  it("handles all nullifiable types in a mixed payload", () => {
    const payload = {
      linked_case_id: "",
      sio: "some-uuid",
      date_of_arrest: "",
      amount: "",
      name: "",
      status: "",
    };
    const result = nullifyEmpty(payload, COLS);
    expect(result.linked_case_id).toBeNull();
    expect(result.sio).toBe("some-uuid");
    expect(result.date_of_arrest).toBeNull();
    expect(result.amount).toBeNull();
    expect(result.name).toBe("");
    expect(result.status).toBe("");
  });

  it("handles empty columns array — returns payload unchanged", () => {
    const payload = { linked_case_id: "", date: "" };
    const result = nullifyEmpty(payload, []);
    expect(result).toEqual(payload);
  });
});

// ─── REGISTER_PREFIXES ────────────────────────────────────────────────────────

describe("REGISTER_PREFIXES", () => {
  it("has the correct prefix for each register", () => {
    expect(REGISTER_PREFIXES.ARREST).toBe("ARR");
    expect(REGISTER_PREFIXES.PROVISIONAL_ATTACHMENT).toBe("PAR");
    expect(REGISTER_PREFIXES.SCN).toBe("SCN");
    expect(REGISTER_PREFIXES.SEIZURE).toBe("SZR");
    expect(REGISTER_PREFIXES.PROSECUTION_ARREST).toBe("PRA");
    expect(REGISTER_PREFIXES.PROSECUTION_NON_ARREST).toBe("PRN");
    expect(REGISTER_PREFIXES.ALERT_CIRCULAR).toBe("ALC");
    expect(REGISTER_PREFIXES.INFORMER_REWARD).toBe("IFR");
    expect(REGISTER_PREFIXES.EVIDENCE_ROOM).toBe("EVR");
    expect(REGISTER_PREFIXES.NON_IR).toBe("NIR");
  });
});

// ─── currentFY ───────────────────────────────────────────────────────────────

describe("currentFY", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns YY-YY+1 format for April onwards (new FY)", () => {
    vi.setSystemTime(new Date("2025-04-01"));
    expect(currentFY()).toBe("25-26");
  });

  it("returns YY-1-YY format for January (still old FY)", () => {
    vi.setSystemTime(new Date("2025-01-15"));
    expect(currentFY()).toBe("24-25");
  });

  it("returns correct FY on March 31 (last day of old FY)", () => {
    vi.setSystemTime(new Date("2025-03-31"));
    expect(currentFY()).toBe("24-25");
  });

  it("returns correct FY on April 1 (first day of new FY)", () => {
    vi.setSystemTime(new Date("2026-04-01"));
    expect(currentFY()).toBe("26-27");
  });
});

// ─── generateWorkspaceRecordId ────────────────────────────────────────────────

describe("generateWorkspaceRecordId", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const makeSupabase = (count: number) => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          count,
          error: null,
        }),
      }),
    }),
  });

  it("generates ID with padded count+1 and current FY", async () => {
    vi.setSystemTime(new Date("2025-06-01")); // FY 25-26
    const supabase = makeSupabase(0);
    const id = await generateWorkspaceRecordId(
      supabase as any,
      "dggi_arrest_records",
      "ARR",
      "ws-1",
    );
    expect(id).toBe("ARR/001/25-26");
  });

  it("increments correctly when records exist", async () => {
    vi.setSystemTime(new Date("2025-06-01"));
    const supabase = makeSupabase(4);
    const id = await generateWorkspaceRecordId(
      supabase as any,
      "dggi_scn_records",
      "SCN",
      "ws-1",
    );
    expect(id).toBe("SCN/005/25-26");
  });

  it("uses custom separator when provided", async () => {
    vi.setSystemTime(new Date("2025-06-01"));
    const supabase = makeSupabase(2);
    const id = await generateWorkspaceRecordId(
      supabase as any,
      "dggi_arrest_records",
      "ARR",
      "ws-1",
      { separator: "/" },
    );
    expect(id).toBe("ARR/003/25-26");
  });

  it("throws when supabase returns an error", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ count: null, error: { message: "DB down" } }),
        }),
      }),
    };
    await expect(
      generateWorkspaceRecordId(supabase as any, "table", "PRE", "ws-1"),
    ).rejects.toThrow("Failed to fetch record count: DB down");
  });
});
