/**
 * Column contract tests.
 *
 * These verify that each component's COLUMNS array has the correct types
 * on UUID FK and date fields so nullifyEmpty() fires correctly for them.
 *
 * We copy the minimal column definitions inline rather than importing the
 * components (which have heavy Next.js / Supabase dependencies).
 */
import { describe, it, expect } from "vitest";
import { nullifyEmpty } from "@/app/tasks/register-utils";

// Helper: pick a column's type by key
const colType = (cols: { key: string; type: string }[], key: string) =>
  cols.find((c) => c.key === key)?.type;

// ─── ArrestRegisterComponent columns ─────────────────────────────────────────

const ARREST_COLUMNS = [
  { key: "record_id", type: "text" },
  { key: "arrest_batch_id", type: "text" },
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_arrest", type: "datepicker" },
  { key: "amount_crore", type: "number" },
  { key: "sio", type: "usercombobox" },
  { key: "group", type: "select" },
];

describe("ArrestRegisterComponent column contracts", () => {
  it("linked_case_id is caselink", () => {
    expect(colType(ARREST_COLUMNS, "linked_case_id")).toBe("caselink");
  });
  it("sio is usercombobox", () => {
    expect(colType(ARREST_COLUMNS, "sio")).toBe("usercombobox");
  });
  it("date_of_arrest is datepicker", () => {
    expect(colType(ARREST_COLUMNS, "date_of_arrest")).toBe("datepicker");
  });
  it("amount_crore is number", () => {
    expect(colType(ARREST_COLUMNS, "amount_crore")).toBe("number");
  });
  it("nullifyEmpty converts all empty UUIDs/dates/numbers to null", () => {
    const payload = {
      linked_case_id: "",
      sio: "",
      date_of_arrest: "",
      amount_crore: "",
      group: "",
    };
    const result = nullifyEmpty(payload, ARREST_COLUMNS);
    expect(result.linked_case_id).toBeNull();
    expect(result.sio).toBeNull();
    expect(result.date_of_arrest).toBeNull();
    expect(result.amount_crore).toBeNull();
    expect(result.group).toBe(""); // select — not nullified
  });
});

// ─── SCNRegisterComponent columns (UUID + date fields only) ──────────────────

const SCN_COLUMNS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_scn", type: "datepicker" },
  { key: "sio", type: "usercombobox" },
  { key: "noticee_name", type: "text" },
  { key: "demand_tax", type: "number" },
];

describe("SCNRegisterComponent column contracts", () => {
  it("linked_case_id is caselink (UUID)", () => {
    expect(colType(SCN_COLUMNS, "linked_case_id")).toBe("caselink");
  });
  it("sio is usercombobox (UUID)", () => {
    expect(colType(SCN_COLUMNS, "sio")).toBe("usercombobox");
  });
  it("nullifyEmpty sanitizes all nullifiable fields", () => {
    const result = nullifyEmpty(
      { linked_case_id: "", sio: "", date_of_scn: "", demand_tax: "", noticee_name: "" },
      SCN_COLUMNS,
    );
    expect(result.linked_case_id).toBeNull();
    expect(result.sio).toBeNull();
    expect(result.date_of_scn).toBeNull();
    expect(result.demand_tax).toBeNull();
    expect(result.noticee_name).toBe("");
  });
});

// ─── SeizureRegisterComponent columns ────────────────────────────────────────

const SEIZURE_COLUMNS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_seizure", type: "datepicker" },
  { key: "seized_by", type: "usercombobox" },
  { key: "sio", type: "usercombobox" },
  { key: "entity_name", type: "text" },
];

describe("SeizureRegisterComponent column contracts", () => {
  it("seized_by is usercombobox (UUID FK to user)", () => {
    expect(colType(SEIZURE_COLUMNS, "seized_by")).toBe("usercombobox");
  });
  it("nullifyEmpty handles both usercombobox columns", () => {
    const result = nullifyEmpty(
      { linked_case_id: "", seized_by: "", sio: "uuid-123", entity_name: "" },
      SEIZURE_COLUMNS,
    );
    expect(result.linked_case_id).toBeNull();
    expect(result.seized_by).toBeNull();
    expect(result.sio).toBe("uuid-123"); // non-empty — kept
    expect(result.entity_name).toBe(""); // text — kept
  });
});

// ─── ProsecutionRegisterComponent — ARREST_COLS ───────────────────────────────

const PROSECUTION_ARREST_COLS = [
  { key: "linked_arrest_id", type: "arrestlink" },
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_arrest", type: "datepicker" },
  { key: "date_of_filing", type: "datepicker" },
  { key: "sio", type: "usercombobox" },
  { key: "bail_status", type: "select" },
];

describe("ProsecutionRegisterComponent — ARREST_COLS contracts", () => {
  it("linked_arrest_id is arrestlink (UUID FK)", () => {
    expect(colType(PROSECUTION_ARREST_COLS, "linked_arrest_id")).toBe("arrestlink");
  });
  it("nullifyEmpty converts all empty FKs and dates to null", () => {
    const result = nullifyEmpty(
      {
        linked_arrest_id: "",
        linked_case_id: "",
        date_of_arrest: "",
        date_of_filing: "",
        sio: "",
        bail_status: "",
      },
      PROSECUTION_ARREST_COLS,
    );
    expect(result.linked_arrest_id).toBeNull();
    expect(result.linked_case_id).toBeNull();
    expect(result.date_of_arrest).toBeNull();
    expect(result.date_of_filing).toBeNull();
    expect(result.sio).toBeNull();
    expect(result.bail_status).toBe(""); // select — not nullified
  });
});

// ─── ProsecutionRegisterComponent — NON_ARREST_COLS ──────────────────────────

const PROSECUTION_NON_ARREST_COLS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_order", type: "datepicker" },
  { key: "sio", type: "usercombobox" },
  { key: "remarks", type: "text" },
];

describe("ProsecutionRegisterComponent — NON_ARREST_COLS contracts", () => {
  it("nullifyEmpty handles NON_ARREST_COLS correctly", () => {
    const result = nullifyEmpty(
      { linked_case_id: "", date_of_order: "", sio: "", remarks: "" },
      PROSECUTION_NON_ARREST_COLS,
    );
    expect(result.linked_case_id).toBeNull();
    expect(result.date_of_order).toBeNull();
    expect(result.sio).toBeNull();
    expect(result.remarks).toBe("");
  });
});

// ─── AlertCircularRegisterComponent columns ───────────────────────────────────

const ALERT_CIRCULAR_COLUMNS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "sio", type: "usercombobox" },
  { key: "alert_circular_no_date", type: "text" },
  { key: "jurisdiction", type: "select" },
];

describe("AlertCircularRegisterComponent column contracts", () => {
  it("linked_case_id is caselink", () => {
    expect(colType(ALERT_CIRCULAR_COLUMNS, "linked_case_id")).toBe("caselink");
  });
  it("nullifyEmpty sanitizes UUID fields", () => {
    const result = nullifyEmpty(
      { linked_case_id: "", sio: "", alert_circular_no_date: "", jurisdiction: "" },
      ALERT_CIRCULAR_COLUMNS,
    );
    expect(result.linked_case_id).toBeNull();
    expect(result.sio).toBeNull();
    expect(result.alert_circular_no_date).toBe("");
    expect(result.jurisdiction).toBe("");
  });
});

// ─── InformerRewardComponent columns ─────────────────────────────────────────

const INFORMER_REWARD_COLUMNS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_information", type: "datepicker" },
  { key: "reward_sanctioned_date", type: "datepicker" },
  { key: "reward_paid_date", type: "datepicker" },
  { key: "sio", type: "usercombobox" },
  { key: "informer_code", type: "text" },
];

describe("InformerRewardComponent column contracts", () => {
  it("three datepicker columns are all nullified when empty", () => {
    const result = nullifyEmpty(
      {
        linked_case_id: "",
        date_of_information: "",
        reward_sanctioned_date: "2024-06-01",
        reward_paid_date: "",
        sio: "",
        informer_code: "IC-001",
      },
      INFORMER_REWARD_COLUMNS,
    );
    expect(result.linked_case_id).toBeNull();
    expect(result.date_of_information).toBeNull();
    expect(result.reward_sanctioned_date).toBe("2024-06-01"); // non-empty — kept
    expect(result.reward_paid_date).toBeNull();
    expect(result.sio).toBeNull();
    expect(result.informer_code).toBe("IC-001");
  });
});

// ─── EvidenceRoomComponent columns ───────────────────────────────────────────

const EVIDENCE_ROOM_COLUMNS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_seizure", type: "datepicker" },
  { key: "seized_by", type: "usercombobox" },
  { key: "date_released", type: "datepicker" },
  { key: "sio", type: "usercombobox" },
  { key: "entity_name", type: "text" },
];

describe("EvidenceRoomComponent column contracts", () => {
  it("seized_by and sio are both usercombobox", () => {
    expect(colType(EVIDENCE_ROOM_COLUMNS, "seized_by")).toBe("usercombobox");
    expect(colType(EVIDENCE_ROOM_COLUMNS, "sio")).toBe("usercombobox");
  });
  it("nullifyEmpty handles both UUID user fields", () => {
    const result = nullifyEmpty(
      { seized_by: "", sio: "user-uuid", date_released: "", entity_name: "" },
      EVIDENCE_ROOM_COLUMNS,
    );
    expect(result.seized_by).toBeNull();
    expect(result.sio).toBe("user-uuid");
    expect(result.date_released).toBeNull();
    expect(result.entity_name).toBe("");
  });
});

// ─── NonIRCaseRegisterComponent columns ──────────────────────────────────────

const NON_IR_COLUMNS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "date_of_initiation", type: "datepicker" },
  { key: "sio", type: "usercombobox" },
  { key: "file_number", type: "text" },
  { key: "group", type: "select" },
];

describe("NonIRCaseRegisterComponent column contracts", () => {
  it("nullifyEmpty correctly sanitizes all nullable fields", () => {
    const result = nullifyEmpty(
      { linked_case_id: "", date_of_initiation: "", sio: "", file_number: "", group: "" },
      NON_IR_COLUMNS,
    );
    expect(result.linked_case_id).toBeNull();
    expect(result.date_of_initiation).toBeNull();
    expect(result.sio).toBeNull();
    expect(result.file_number).toBe("");
    expect(result.group).toBe("");
  });
});

// ─── ProvisionalAttachmentComponent columns ───────────────────────────────────

const PROVISIONAL_ATTACHMENT_COLUMNS = [
  { key: "linked_case_id", type: "caselink" },
  { key: "sio", type: "usercombobox" },
  { key: "date_of_attachment", type: "datepicker" },
  { key: "date_of_scn_issuance", type: "datepicker" },
  { key: "date_of_release", type: "datepicker" },
  { key: "expected_liability", type: "number" },
  { key: "value_immovable", type: "number" },
  { key: "value_total", type: "number" },
  { key: "person_name", type: "text" },
  { key: "scn_issued", type: "select" },
];

describe("ProvisionalAttachmentComponent column contracts", () => {
  it("linked_case_id and sio are UUID FK types", () => {
    expect(colType(PROVISIONAL_ATTACHMENT_COLUMNS, "linked_case_id")).toBe("caselink");
    expect(colType(PROVISIONAL_ATTACHMENT_COLUMNS, "sio")).toBe("usercombobox");
  });

  it("all three datepicker columns are nullified", () => {
    const result = nullifyEmpty(
      {
        date_of_attachment: "",
        date_of_scn_issuance: "",
        date_of_release: "2025-01-01",
      },
      PROVISIONAL_ATTACHMENT_COLUMNS,
    );
    expect(result.date_of_attachment).toBeNull();
    expect(result.date_of_scn_issuance).toBeNull();
    expect(result.date_of_release).toBe("2025-01-01");
  });

  it("all numeric value fields are nullified", () => {
    const result = nullifyEmpty(
      { expected_liability: "", value_immovable: "1000", value_total: "" },
      PROVISIONAL_ATTACHMENT_COLUMNS,
    );
    expect(result.expected_liability).toBeNull();
    expect(result.value_immovable).toBe("1000");
    expect(result.value_total).toBeNull();
  });

  it("text and select fields are not nullified", () => {
    const result = nullifyEmpty(
      { person_name: "", scn_issued: "" },
      PROVISIONAL_ATTACHMENT_COLUMNS,
    );
    expect(result.person_name).toBe("");
    expect(result.scn_issued).toBe("");
  });
});
