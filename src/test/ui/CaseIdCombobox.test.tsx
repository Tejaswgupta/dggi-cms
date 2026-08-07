import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Capture the query chain the combobox builds for server-side search.
const serverRows: any[] = [];
const limitMock = vi.fn().mockResolvedValue({ data: serverRows, error: null });
const orderMock = vi.fn(() => ({ limit: limitMock }));
const orMock = vi.fn(() => ({ order: orderMock }));
const not2Mock = vi.fn(() => ({ or: orMock, order: orderMock }));
const not1Mock = vi.fn(() => ({ not: not2Mock }));
const eqMock = vi.fn(() => ({ not: not1Mock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase/client", () => ({
  default: () => ({ from: fromMock }),
}));

import { CaseIdCombobox } from "@/app/tasks/CaseIdCombobox";

const CASES = [
  { record_id: "DGG/001/25-26", taxpayer_name: "Acme Corp", file_no: "F/001", is_ir: true },
  { record_id: "DGG/002/25-26", taxpayer_name: "Beta Ltd", file_no: "F/002", is_ir: false },
  { record_id: "DGG/003/25-26", taxpayer_name: "Gamma Inc", file_no: "F/003", is_ir: true },
];

describe("CaseIdCombobox — read mode (editing=false)", () => {
  it("renders a dash when value is empty", () => {
    render(<CaseIdCombobox value="" onChange={() => {}} cases={CASES} editing={false} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders a link to the case when value is set", () => {
    render(<CaseIdCombobox value="DGG/001/25-26" onChange={() => {}} cases={CASES} editing={false} />);
    const link = screen.getByRole("link", { name: "DGG/001/25-26" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("DGG%2F001%2F25-26"));
  });

  it("shows taxpayer name badge next to a matched case", () => {
    render(<CaseIdCombobox value="DGG/001/25-26" onChange={() => {}} cases={CASES} editing={false} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("does not show badge for unknown case ID", () => {
    render(<CaseIdCombobox value="DGG/999/25-26" onChange={() => {}} cases={CASES} editing={false} />);
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });
});

describe("CaseIdCombobox — edit mode (editing=true)", () => {
  it("renders a trigger button in edit mode", () => {
    render(<CaseIdCombobox value="" onChange={() => {}} cases={CASES} editing={true} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows placeholder text when no value selected", () => {
    render(<CaseIdCombobox value="" onChange={() => {}} cases={CASES} editing={true} />);
    expect(screen.getByText("Link case…")).toBeInTheDocument();
  });

  it("shows selected record_id in trigger when value is set", () => {
    render(<CaseIdCombobox value="DGG/002/25-26" onChange={() => {}} cases={CASES} editing={true} />);
    expect(screen.getByText("DGG/002/25-26")).toBeInTheDocument();
  });

  it("opens dropdown and lists all cases on click", async () => {
    const user = userEvent.setup();
    render(<CaseIdCombobox value="" onChange={() => {}} cases={CASES} editing={true} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });

  it("filters list when typing in search", async () => {
    const user = userEvent.setup();
    render(<CaseIdCombobox value="" onChange={() => {}} cases={CASES} editing={true} />);
    await user.click(screen.getByRole("button"));
    await user.type(screen.getByPlaceholderText("Search case ID, name, file no…"), "beta");
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("calls onChange with the record_id when a case is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CaseIdCombobox value="" onChange={onChange} cases={CASES} editing={true} />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Acme Corp"));
    expect(onChange).toHaveBeenCalledWith("DGG/001/25-26");
  });
});

describe("CaseIdCombobox — server mode (workspaceId provided)", () => {
  beforeEach(() => {
    serverRows.length = 0;
    [
      limitMock,
      orderMock,
      orMock,
      not2Mock,
      not1Mock,
      eqMock,
      selectMock,
      fromMock,
    ].forEach((m) => m.mockClear());
  });

  it("queries dggi_records (limit 10) on open and reports discovered cases", async () => {
    const user = userEvent.setup();
    serverRows.push({
      record_id: "DGG/010/25-26",
      taxpayer_name: "Server Co",
      file_no: "F/010",
      is_ir: true,
      closure_by: "Closed After Payment of Tax",
    });
    const onCasesDiscovered = vi.fn();
    render(
      <CaseIdCombobox
        value=""
        onChange={() => {}}
        cases={[]}
        editing={true}
        workspaceId="ws-1"
        onCasesDiscovered={onCasesDiscovered}
      />,
    );
    await user.click(screen.getByRole("button"));

    // Debounced server search fires and its results render.
    await waitFor(() => expect(screen.getByText("Server Co")).toBeInTheDocument());
    expect(fromMock).toHaveBeenCalledWith("dggi_records");
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(onCasesDiscovered).toHaveBeenCalledWith(serverRows);
  });

  it("does not filter the client-side `cases` prop in server mode", async () => {
    const user = userEvent.setup();
    // Server returns nothing; a client-side case must NOT leak into the list.
    render(
      <CaseIdCombobox
        value=""
        onChange={() => {}}
        cases={CASES}
        editing={true}
        workspaceId="ws-1"
      />,
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(fromMock).toHaveBeenCalled());
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("still resolves the read-only badge from the `cases` prop", () => {
    render(
      <CaseIdCombobox
        value="DGG/001/25-26"
        onChange={() => {}}
        cases={CASES}
        editing={false}
        workspaceId="ws-1"
      />,
    );
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    // Read mode must not trigger a server query.
    expect(fromMock).not.toHaveBeenCalled();
  });
});
