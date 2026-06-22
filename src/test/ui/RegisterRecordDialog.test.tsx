import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser, type ArrestOption } from "@/app/tasks/RegisterRecordDialog";

const USERS: WorkspaceUser[] = [
  { id: "user-1", name: "Alice Sharma", email: "alice@test.com" },
  { id: "user-2", name: "Bob Mehta", email: "bob@test.com" },
];

const ARREST_OPTIONS: ArrestOption[] = [
  {
    id: "arr-uuid-1",
    record_id: "ARR/001/25-26",
    arrested_name: "John Doe",
    party_name: "Doe Traders",
    unit_gstin: "27AAABB1234C1Z5",
    arrested_age: "35",
    date_of_arrest: "2025-01-10",
    amount_crore: "2.5",
    role_evidence: "Director",
    sio: "user-1",
    group: "Group A",
  },
];

const BASE_COLS: RegisterColumn[] = [
  { key: "entity_name", label: "Entity Name", type: "text" },
  { key: "date_of_arrest", label: "Date of Arrest", type: "datepicker" },
  { key: "amount", label: "Amount", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Closed"] },
  { key: "sio", label: "SIO", type: "usercombobox" },
];

function renderDialog(overrides: Partial<Parameters<typeof RegisterRecordDialog>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    mode: "add" as const,
    title: "Test Dialog",
    columns: BASE_COLS,
    draft: { entity_name: "", date_of_arrest: "", amount: "", status: "", sio: "" },
    onDraftChange: vi.fn(),
    onSave: vi.fn(),
    saving: false,
    users: USERS,
    caseOptions: [],
  };
  return render(<RegisterRecordDialog {...defaults} {...overrides} />);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("RegisterRecordDialog — rendering", () => {
  it("renders dialog title", () => {
    renderDialog();
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
  });

  it("renders all column labels", () => {
    renderDialog();
    expect(screen.getByText("Entity Name")).toBeInTheDocument();
    expect(screen.getByText("Date of Arrest")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("SIO")).toBeInTheDocument();
  });

  it("does not render readOnly columns", () => {
    renderDialog({
      columns: [
        { key: "record_id", label: "ID", type: "text", readOnly: true },
        { key: "entity_name", label: "Entity Name", type: "text" },
      ],
      draft: { record_id: "ARR/001", entity_name: "" },
    });
    expect(screen.queryByText("ID")).not.toBeInTheDocument();
    expect(screen.getByText("Entity Name")).toBeInTheDocument();
  });

  it("renders Add Record button when not saving (add mode)", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /add record/i })).toBeInTheDocument();
  });

  it("shows saving state on submit button", () => {
    renderDialog({ saving: true });
    expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
  });

  it("disables submit button while saving", () => {
    renderDialog({ saving: true });
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("shows 'Save Changes' button in edit mode", () => {
    renderDialog({ mode: "edit" });
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });
});

// ─── Text field interaction ────────────────────────────────────────────────────

describe("RegisterRecordDialog — text field", () => {
  it("calls onDraftChange when text input changes", async () => {
    const user = userEvent.setup();
    const onDraftChange = vi.fn();
    renderDialog({ onDraftChange });
    // Labels don't have 'for' — find input after the "Entity Name" label
    const label = screen.getByText("Entity Name");
    const input = label.closest("div")!.querySelector("input")!;
    await user.type(input, "Test Corp");
    expect(onDraftChange).toHaveBeenCalledWith("entity_name", expect.stringContaining("T"));
  });

  it("pre-fills text field from draft", () => {
    renderDialog({ draft: { entity_name: "Pre-filled Corp", date_of_arrest: "", amount: "", status: "", sio: "" } });
    expect(screen.getByDisplayValue("Pre-filled Corp")).toBeInTheDocument();
  });
});

// ─── Number field ─────────────────────────────────────────────────────────────

describe("RegisterRecordDialog — number field", () => {
  it("renders number input with decimal inputMode", () => {
    renderDialog();
    const label = screen.getByText("Amount");
    const input = label.closest("div")!.querySelector("input")!;
    expect(input).toHaveAttribute("inputMode", "decimal");
  });
});

// ─── Select field ─────────────────────────────────────────────────────────────

describe("RegisterRecordDialog — select field", () => {
  it("renders select trigger for select-type columns", () => {
    renderDialog();
    // select fields render as combobox role
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });
});

// ─── User combobox ────────────────────────────────────────────────────────────

describe("RegisterRecordDialog — usercombobox", () => {
  it("shows placeholder when no user selected", () => {
    renderDialog();
    expect(screen.getByText("Select user…")).toBeInTheDocument();
  });

  it("shows selected user name when value is set", () => {
    renderDialog({ draft: { entity_name: "", date_of_arrest: "", amount: "", status: "", sio: "user-1" } });
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
  });

  it("opens user dropdown and lists users", async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByText("Select user…").closest("button")!;
    await user.click(trigger);
    expect(screen.getByText("Bob Mehta")).toBeInTheDocument();
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });

  it("calls onDraftChange with user ID when user selected", async () => {
    const user = userEvent.setup();
    const onDraftChange = vi.fn();
    renderDialog({ onDraftChange });
    const trigger = screen.getByText("Select user…").closest("button")!;
    await user.click(trigger);
    await user.click(screen.getByText("Alice Sharma"));
    expect(onDraftChange).toHaveBeenCalledWith("sio", "user-1");
  });
});

// ─── showWhen conditional columns ─────────────────────────────────────────────

describe("RegisterRecordDialog — showWhen conditional columns", () => {
  const colsWithConditional: RegisterColumn[] = [
    { key: "scn_issued", label: "SCN Issued?", type: "select", options: ["Yes", "No"] },
    { key: "date_of_scn", label: "Date of SCN", type: "datepicker", showWhen: { field: "scn_issued", values: ["Yes"] } },
  ];

  it("hides conditional column when condition not met", () => {
    renderDialog({
      columns: colsWithConditional,
      draft: { scn_issued: "No", date_of_scn: "" },
    });
    expect(screen.queryByText("Date of SCN")).not.toBeInTheDocument();
  });

  it("shows conditional column when condition is met", () => {
    renderDialog({
      columns: colsWithConditional,
      draft: { scn_issued: "Yes", date_of_scn: "" },
    });
    expect(screen.getByText("Date of SCN")).toBeInTheDocument();
  });
});

// ─── ArrestLink auto-fill ─────────────────────────────────────────────────────

describe("RegisterRecordDialog — arrestlink auto-fill", () => {
  const arrestCols: RegisterColumn[] = [
    { key: "linked_arrest_id", label: "Arrest Case", type: "arrestlink" },
    { key: "arrested_person_name", label: "Name", type: "text" },
  ];

  it("shows placeholder when no arrest selected", () => {
    renderDialog({
      columns: arrestCols,
      draft: { linked_arrest_id: "", arrested_person_name: "" },
      arrestOptions: ARREST_OPTIONS,
    });
    expect(screen.getByText("Select arrest case…")).toBeInTheDocument();
  });

  it("shows selected arrest record in trigger", () => {
    renderDialog({
      columns: arrestCols,
      draft: { linked_arrest_id: "arr-uuid-1", arrested_person_name: "John Doe" },
      arrestOptions: ARREST_OPTIONS,
    });
    expect(screen.getByText(/ARR\/001\/25-26/)).toBeInTheDocument();
  });

  it("calls onMultiDraftChange with all person fields when arrest selected", async () => {
    const user = userEvent.setup();
    const onMultiDraftChange = vi.fn();
    renderDialog({
      columns: arrestCols,
      draft: { linked_arrest_id: "", arrested_person_name: "" },
      arrestOptions: ARREST_OPTIONS,
      onMultiDraftChange,
    });
    const trigger = screen.getByText("Select arrest case…").closest("button")!;
    await user.click(trigger);
    await user.click(screen.getByText("ARR/001/25-26"));
    expect(onMultiDraftChange).toHaveBeenCalledWith(
      expect.objectContaining({
        linked_arrest_id: "arr-uuid-1",
        arrested_person_name: "John Doe",
        entity_name: "Doe Traders",
        gstin: "27AAABB1234C1Z5",
        sio: "user-1",
        group: "Group A",
      }),
    );
  });
});

// ─── Cancel button ─────────────────────────────────────────────────────────────

describe("RegisterRecordDialog — cancel", () => {
  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onSave when Add Record is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderDialog({ onSave });
    await user.click(screen.getByRole("button", { name: /add record/i }));
    expect(onSave).toHaveBeenCalled();
  });
});
