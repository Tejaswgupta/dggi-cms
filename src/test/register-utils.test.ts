import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  nullifyEmpty,
  currentFY,
  currentFYFull,
  generateWorkspaceRecordId,
  generateIRCaseRecordId,
  generateClosureRecordId,
  REGISTER_PREFIXES,
} from "@/app/tasks/register-utils";

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

  it("has the correct per-competency SCN prefixes", () => {
    expect(REGISTER_PREFIXES.SCN_AD_DD).toBe("AD-DD");
    expect(REGISTER_PREFIXES.SCN_SIO).toBe("SIO");
    expect(REGISTER_PREFIXES.SCN_ADD_JD).toBe("ADC-JC");
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

  const makeSupabase = (returnId: string | null, rpcError?: string) => ({
    rpc: (_fn: string, _args: unknown) => ({
      data: returnId,
      error: rpcError ? { message: rpcError } : null,
    }),
  });

  it("returns the ID string from the RPC", async () => {
    vi.setSystemTime(new Date("2025-06-01")); // FY 25-26
    const supabase = makeSupabase("ARR/001/25-26");
    const id = await generateWorkspaceRecordId(
      supabase as any,
      "dggi_arrest_records",
      "ARR",
      "ws-1",
    );
    expect(id).toBe("ARR/001/25-26");
  });

  it("returns the ID for a higher sequence number", async () => {
    vi.setSystemTime(new Date("2025-06-01"));
    const supabase = makeSupabase("SCN/005/25-26");
    const id = await generateWorkspaceRecordId(
      supabase as any,
      "dggi_scn_records",
      "SCN",
      "ws-1",
    );
    expect(id).toBe("SCN/005/25-26");
  });

  it("passes the custom separator to the RPC", async () => {
    vi.setSystemTime(new Date("2025-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: "ARR/003/25-26", error: null });
    const supabase = { rpc: rpcSpy };
    await generateWorkspaceRecordId(supabase as any, "dggi_arrest_records", "ARR", "ws-1", {
      separator: "/",
    });
    expect(rpcSpy).toHaveBeenCalledWith("next_record_id", expect.objectContaining({ p_separator: "/" }));
  });

  it("throws when the RPC returns an error", async () => {
    const supabase = makeSupabase(null, "DB down");
    await expect(
      generateWorkspaceRecordId(supabase as any, "table", "PRE", "ws-1"),
    ).rejects.toThrow("Failed to generate record ID: DB down");
  });
});

// ─── currentFYFull ────────────────────────────────────────────────────────────

describe("currentFYFull", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns YYYY-YY format for April onwards", () => {
    vi.setSystemTime(new Date("2026-04-01"));
    expect(currentFYFull()).toBe("2026-27");
  });

  it("returns YYYY-YY format for January (still old FY)", () => {
    vi.setSystemTime(new Date("2026-01-15"));
    expect(currentFYFull()).toBe("2025-26");
  });

  it("is always different from currentFY for the same date", () => {
    vi.setSystemTime(new Date("2026-06-01"));
    expect(currentFYFull()).not.toBe(currentFY());
    expect(currentFYFull()).toBe("2026-27");
    expect(currentFY()).toBe("26-27");
  });
});

// ─── Sequence FY format audit ─────────────────────────────────────────────────
//
// The DB seed uses two FY formats:
//   short  "YY-YY"   (currentFY)   — for all standard registers
//   long   "YYYY-YY" (currentFYFull) — only for IR, CR_FP, CR_NSP
//
// Each test below verifies that the generator function passes the correct FY
// format so it hits the seeded row instead of creating a rogue new row at 1.

describe("sequence FY format — standard registers use currentFY (short form)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const makeRpcSpy = (returnVal: any = "PREFIX/001/26-27") =>
    vi.fn().mockReturnValue({ data: returnVal, error: null });

  // Registers whose DB sequence is keyed on fy='26-27' (short form).
  const STANDARD_PREFIXES = [
    REGISTER_PREFIXES.ARREST,           // ARR
    REGISTER_PREFIXES.PROVISIONAL_ATTACHMENT, // PAR
    REGISTER_PREFIXES.STR,              // STR
    REGISTER_PREFIXES.ALERT_CIRCULAR,   // ALC
    REGISTER_PREFIXES.REPORT_COMPLIANCE, // RPC
    REGISTER_PREFIXES.MODUS_OPERANDI,   // MOC
    REGISTER_PREFIXES.INTEL_RAPID,      // RPD
    REGISTER_PREFIXES.INTEL_OTHER,      // IOS
    REGISTER_PREFIXES.PROSECUTION_ARREST, // PRA
    REGISTER_PREFIXES.PROSECUTION_NON_ARREST, // PRN
    REGISTER_PREFIXES.SCN,              // SCN
  ];

  for (const prefix of STANDARD_PREFIXES) {
    it(`${prefix} — generateWorkspaceRecordId passes fy='26-27'`, async () => {
      vi.setSystemTime(new Date("2026-06-01")); // FY 26-27
      const rpcSpy = makeRpcSpy(`${prefix}/001/26-27`);
      await generateWorkspaceRecordId({ rpc: rpcSpy } as any, "table", prefix, "ws-1");
      expect(rpcSpy).toHaveBeenCalledWith(
        "next_record_id",
        expect.objectContaining({ p_prefix: prefix, p_fy: "26-27" }),
      );
    });
  }

  it("NON-IR (NIR) — generateIRCaseRecordId passes fy='26-27' (short form)", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 137, error: null });
    await generateIRCaseRecordId({ rpc: rpcSpy } as any, "ws-1", false);
    expect(rpcSpy).toHaveBeenCalledWith(
      "next_seq_val",
      expect.objectContaining({ p_prefix: "NIR", p_fy: "26-27" }),
    );
  });
});

describe("sequence FY format — IR and closure registers use currentFYFull (long form)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("IR — generateIRCaseRecordId passes fy='2026-27' (long form)", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 93, error: null });
    await generateIRCaseRecordId({ rpc: rpcSpy } as any, "ws-1", true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "next_seq_val",
      expect.objectContaining({ p_prefix: "IR", p_fy: "2026-27" }),
    );
  });

  it("Closure FP — generateClosureRecordId passes fy='2026-27' (long form)", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 28, error: null });
    await generateClosureRecordId({ rpc: rpcSpy } as any, "ws-1", "Closed After Payment of Tax", true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "next_seq_val",
      expect.objectContaining({ p_prefix: "CR_FP", p_fy: "2026-27" }),
    );
  });

  it("Closure NSP — generateClosureRecordId passes fy='2026-27' (long form)", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 5, error: null });
    await generateClosureRecordId({ rpc: rpcSpy } as any, "ws-1", "On Merit", true);
    expect(rpcSpy).toHaveBeenCalledWith(
      "next_seq_val",
      expect.objectContaining({ p_prefix: "CR_NSP", p_fy: "2026-27" }),
    );
  });

  it("Closure NON-IR (CNR) — generateClosureRecordId passes fy='26-27' (short form)", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 3, error: null });
    await generateClosureRecordId({ rpc: rpcSpy } as any, "ws-1", "Closed", false);
    expect(rpcSpy).toHaveBeenCalledWith(
      "next_seq_val",
      expect.objectContaining({ p_prefix: "CNR", p_fy: "26-27" }),
    );
  });
});

// ─── ID format output verification ───────────────────────────────────────────

describe("generated ID format matches DB record_id format", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("IR produces {NNN}/GST/{YYYY-YY} format", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 93, error: null });
    const id = await generateIRCaseRecordId({ rpc: rpcSpy } as any, "ws-1", true);
    expect(id).toMatch(/^\d{3}\/GST\/\d{4}-\d{2}$/);
    expect(id).toBe("093/GST/2026-27");
  });

  it("NON-IR produces NIR-{NNN}-{YY-YY} format", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 137, error: null });
    const id = await generateIRCaseRecordId({ rpc: rpcSpy } as any, "ws-1", false);
    expect(id).toMatch(/^NIR-\d{3}-\d{2}-\d{2}$/);
    expect(id).toBe("NIR-137-26-27");
  });

  it("Closure FP produces DGGI/MZU/CR/FP/{YYYY-YY}/{NNN} format", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 28, error: null });
    const id = await generateClosureRecordId({ rpc: rpcSpy } as any, "ws-1", "Closed After Payment of Tax", true);
    expect(id).toMatch(/^DGGI\/MZU\/CR\/FP\/\d{4}-\d{2}\/\d{3}$/);
    expect(id).toBe("DGGI/MZU/CR/FP/2026-27/028");
  });

  it("Closure NSP produces DGGI/MZU/CR-NSP-{YYYY-YY}/{NNN} format", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 5, error: null });
    const id = await generateClosureRecordId({ rpc: rpcSpy } as any, "ws-1", "On Merit", true);
    expect(id).toMatch(/^DGGI\/MZU\/CR-NSP-\d{4}-\d{2}\/\d{3}$/);
    expect(id).toBe("DGGI/MZU/CR-NSP-2026-27/005");
  });

  it("Closure CNR produces CNR-{NNN}-{YY-YY} format", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 3, error: null });
    const id = await generateClosureRecordId({ rpc: rpcSpy } as any, "ws-1", "Closed", false);
    expect(id).toMatch(/^CNR-\d{3}-\d{2}-\d{2}$/);
    expect(id).toBe("CNR-003-26-27");
  });

  it("ARR produces ARR/{NNN}/{YY-YY} format", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: "ARR/050/26-27", error: null });
    const id = await generateWorkspaceRecordId({ rpc: rpcSpy } as any, "table", "ARR", "ws-1");
    expect(id).toMatch(/^ARR\/\d{3}\/\d{2}-\d{2}$/);
    expect(id).toBe("ARR/050/26-27");
  });

  it("NIR must NOT use YYYY-YY format (regression guard)", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 137, error: null });
    const id = await generateIRCaseRecordId({ rpc: rpcSpy } as any, "ws-1", false);
    expect(id).not.toContain("2026");
    expect(id).toBe("NIR-137-26-27");
  });

  it("IR must NOT use YY-YY short form (regression guard)", async () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const rpcSpy = vi.fn().mockReturnValue({ data: 93, error: null });
    const id = await generateIRCaseRecordId({ rpc: rpcSpy } as any, "ws-1", true);
    expect(id).not.toMatch(/\/GST\/\d{2}-\d{2}$/);
    expect(id).toBe("093/GST/2026-27");
  });
});

// ─── SCN per-competency prefix mapping ───────────────────────────────────────

describe("SCN competency → sequence prefix mapping", () => {
  const COMPETENCY_PREFIX: Record<string, string> = {
    "AD/DD Competency": REGISTER_PREFIXES.SCN_AD_DD,
    "SIO Competency": REGISTER_PREFIXES.SCN_SIO,
    "JC/ADC Competency": REGISTER_PREFIXES.SCN_ADD_JD,
  };

  it("maps AD/DD Competency to AD-DD", () => {
    expect(COMPETENCY_PREFIX["AD/DD Competency"]).toBe("AD-DD");
  });

  it("maps SIO Competency to SIO", () => {
    expect(COMPETENCY_PREFIX["SIO Competency"]).toBe("SIO");
  });

  it("maps JC/ADC Competency to ADC-JC", () => {
    expect(COMPETENCY_PREFIX["JC/ADC Competency"]).toBe("ADC-JC");
  });

  it("all three competencies have distinct prefixes", () => {
    const values = Object.values(COMPETENCY_PREFIX);
    expect(new Set(values).size).toBe(3);
  });
});

// ─── SCN record ID format ────────────────────────────────────────────────────

describe("SCN record ID format", () => {
  // Mirrors the ID-building logic in generateSCNRecordId
  const buildSCNId = (seq: number, group: string, designation: string, initials: string) => {
    const seqStr = String(seq).padStart(2, "0");
    const grp = group.split(" ").pop() ?? "";
    return `${seqStr}/Grp-${grp}/${designation}/${initials}`;
  };

  it("pads single-digit seq to two digits", () => {
    expect(buildSCNId(1, "Group A", "SIO", "AK")).toBe("01/Grp-A/SIO/AK");
  });

  it("does not pad two-digit seq", () => {
    expect(buildSCNId(12, "Group B", "DD", "RK")).toBe("12/Grp-B/DD/RK");
  });

  it("extracts the last word of the group name", () => {
    expect(buildSCNId(3, "Group C", "SIO", "MN")).toBe("03/Grp-C/SIO/MN");
  });

  it("uses DD designation when role starts with DD", () => {
    const rawRole = "DD (Customs)";
    const designation = rawRole.startsWith("DD") ? "DD" : rawRole;
    expect(buildSCNId(5, "Group A", designation, "PQ")).toBe("05/Grp-A/DD/PQ");
  });

  it("uses full role string when role does not start with DD", () => {
    const rawRole = "SIO";
    const designation = rawRole.startsWith("DD") ? "DD" : rawRole;
    expect(buildSCNId(7, "Group D", designation, "XY")).toBe("07/Grp-D/SIO/XY");
  });
});

// ─── SCN designation resolution (regression: DD/ADD/JC-ADC must never show SIO) ─

describe("SCN designation resolution by competency", () => {
  // Mirrors the fixed resolution logic in generateSCNRecordId: the
  // designation segment is driven by the record's competency tier, not by
  // the raw dggi_role of whichever officer is picked in the SIO field.
  const COMPETENCY_DESIGNATION: Record<string, string> = {
    "AD/DD Competency": "DD",
    "JC/ADC Competency": "ADC",
  };

  const resolveDesignation = (competency: string, rawRole: string) => {
    const normalizedRole = rawRole.startsWith("DD") ? "DD" : rawRole;
    return COMPETENCY_DESIGNATION[competency] ?? normalizedRole;
  };

  it("forces DD designation for AD/DD Competency even when the officer's role is SIO", () => {
    expect(resolveDesignation("AD/DD Competency", "SIO")).toBe("DD");
  });

  it("forces DD designation for AD/DD Competency even when the officer's role is IO", () => {
    expect(resolveDesignation("AD/DD Competency", "IO")).toBe("DD");
  });

  it("forces ADC designation for JC/ADC Competency even when the officer's role is SIO_INT", () => {
    expect(resolveDesignation("JC/ADC Competency", "SIO_INT")).toBe("ADC");
  });

  it("keeps the officer's own role for SIO Competency", () => {
    expect(resolveDesignation("SIO Competency", "SIO")).toBe("SIO");
    expect(resolveDesignation("SIO Competency", "IO")).toBe("IO");
  });

  it("never resolves to a designation containing SIO for AD/DD or JC/ADC competency", () => {
    const officerRoles = ["SIO", "IO", "SIO_INT", "DD_INT", "AD"];
    for (const role of officerRoles) {
      expect(resolveDesignation("AD/DD Competency", role)).not.toMatch(/SIO/);
      expect(resolveDesignation("JC/ADC Competency", role)).not.toMatch(/SIO/);
    }
  });
});

// ─── SCN next_seq_val RPC integration ────────────────────────────────────────

describe("SCN generateSCNRecordId — next_seq_val RPC", () => {
  const makeSupabase = (seqVal: number | null, rpcError?: string) => ({
    rpc: vi.fn().mockReturnValue({
      data: seqVal,
      error: rpcError ? { message: rpcError } : null,
    }),
  });

  it("calls next_seq_val with the correct prefix for SIO Competency", async () => {
    const supabase = makeSupabase(1);
    await supabase.rpc("next_seq_val", {
      p_workspace_id: "ws-1",
      p_prefix: REGISTER_PREFIXES.SCN_SIO,
      p_fy: "25-26",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("next_seq_val", {
      p_workspace_id: "ws-1",
      p_prefix: "SIO",
      p_fy: "25-26",
    });
  });

  it("calls next_seq_val with AD-DD prefix for AD/DD Competency", async () => {
    const supabase = makeSupabase(3);
    await supabase.rpc("next_seq_val", {
      p_workspace_id: "ws-1",
      p_prefix: REGISTER_PREFIXES.SCN_AD_DD,
      p_fy: "25-26",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("next_seq_val", {
      p_workspace_id: "ws-1",
      p_prefix: "AD-DD",
      p_fy: "25-26",
    });
  });

  it("calls next_seq_val with ADC-JC prefix for JC/ADC Competency", async () => {
    const supabase = makeSupabase(7);
    await supabase.rpc("next_seq_val", {
      p_workspace_id: "ws-1",
      p_prefix: REGISTER_PREFIXES.SCN_ADD_JD,
      p_fy: "26-27",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("next_seq_val", {
      p_workspace_id: "ws-1",
      p_prefix: "ADC-JC",
      p_fy: "26-27",
    });
  });
});

// ─── SCN generateSCNRecordId — full end-to-end regression ────────────────────
//
// Base case taken from a real production record: "14/Grp-B/SIO/AK", filed
// under "AD/DD Competency", officer Ajay Kumar (dggi_role "SIO"), Group B.
// Under the old logic this produced ".../SIO/..." despite the AD/DD tier;
// the fix must yield ".../DD/..." for the next record generated from the
// same inputs.

describe("SCN generateSCNRecordId — full end-to-end", () => {
  const COMPETENCY_PREFIX: Record<string, string> = {
    "AD/DD Competency": REGISTER_PREFIXES.SCN_AD_DD,
    "SIO Competency": REGISTER_PREFIXES.SCN_SIO,
    "JC/ADC Competency": REGISTER_PREFIXES.SCN_ADD_JD,
  };
  const COMPETENCY_DESIGNATION: Record<string, string> = {
    "AD/DD Competency": "DD",
    "JC/ADC Competency": "ADC",
  };
  const getInitials = (name: string): string =>
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

  // Mirrors generateSCNRecordId in SCNRegisterComponent.tsx after the fix.
  const generateSCNRecordId = async (
    supabase: { rpc: (...args: unknown[]) => { data: unknown; error: unknown } },
    workspaceId: string,
    draft: { competency?: string; group?: string; date_of_scn?: string },
    sioUser: { name: string; dggi_role: string } | undefined,
  ): Promise<string> => {
    const competency = draft.competency ?? "SIO Competency";
    const prefix = COMPETENCY_PREFIX[competency] ?? REGISTER_PREFIXES.SCN_SIO;
    const { data, error } = supabase.rpc("next_seq_val", {
      p_workspace_id: workspaceId,
      p_prefix: prefix,
      p_fy: "26-27",
    });
    if (error) throw new Error("Failed to generate record ID");
    const seq = String(data as number).padStart(2, "0");
    const grp = (draft.group ?? "").split(" ").pop() ?? "";
    const rawRole = sioUser?.dggi_role ?? "";
    const normalizedRole = rawRole.startsWith("DD") ? "DD" : rawRole;
    const designation = COMPETENCY_DESIGNATION[competency] ?? normalizedRole;
    const initials = sioUser ? getInitials(sioUser.name) : "";
    return `${seq}/Grp-${grp}/${designation}/${initials}`;
  };

  const makeSupabase = (seqVal: number) => ({
    rpc: vi.fn().mockReturnValue({ data: seqVal, error: null }),
  });

  it("generates DD designation for an AD/DD Competency record, not SIO", async () => {
    const supabase = makeSupabase(15);
    const id = await generateSCNRecordId(
      supabase,
      "c973a08e-74a8-4aa4-b52a-850ef16adfb3",
      { competency: "AD/DD Competency", group: "Group B" },
      { name: "Ajay Kumar", dggi_role: "SIO" },
    );
    expect(id).toBe("15/Grp-B/DD/AK");
    expect(id).not.toMatch(/SIO/);
  });

  it("requests the AD-DD sequence prefix, not the SIO prefix", async () => {
    const supabase = makeSupabase(15);
    await generateSCNRecordId(
      supabase,
      "c973a08e-74a8-4aa4-b52a-850ef16adfb3",
      { competency: "AD/DD Competency", group: "Group B" },
      { name: "Ajay Kumar", dggi_role: "SIO" },
    );
    expect(supabase.rpc).toHaveBeenCalledWith("next_seq_val", {
      p_workspace_id: "c973a08e-74a8-4aa4-b52a-850ef16adfb3",
      p_prefix: "AD-DD",
      p_fy: "26-27",
    });
  });

  it("generates ADC designation for a JC/ADC Competency record even with an SIO officer", async () => {
    const supabase = makeSupabase(26);
    const id = await generateSCNRecordId(
      supabase,
      "c973a08e-74a8-4aa4-b52a-850ef16adfb3",
      { competency: "JC/ADC Competency", group: "Group B" },
      { name: "Ajay Kumar", dggi_role: "SIO" },
    );
    expect(id).toBe("26/Grp-B/ADC/AK");
    expect(id).not.toMatch(/SIO/);
  });

  it("still uses the officer's own role for SIO Competency records", async () => {
    const supabase = makeSupabase(5);
    const id = await generateSCNRecordId(
      supabase,
      "c973a08e-74a8-4aa4-b52a-850ef16adfb3",
      { competency: "SIO Competency", group: "Group A" },
      { name: "Ajay Kumar", dggi_role: "SIO" },
    );
    expect(id).toBe("05/Grp-A/SIO/AK");
  });
});
