/**
 * UI tests for InformerRewardComponent.
 * A simpler register — single-level records, no batch concept.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({ default: () => mockSupabase }));
vi.mock("@/lib/action/workspace", () => ({
  getWorkspaceId: vi.fn().mockResolvedValue("ws-1"),
}));
vi.mock("@/hooks/useWorkspaceUsers.tsx", () => ({
  getAllUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: "sio-1", name: "Alice Sharma", email: "alice@test.com" }],
  }),
}));

import InformerRewardComponent from "@/app/tasks/InformerRewardComponent";

const RECORDS = [
  {
    id: "rec-1",
    record_id: "IFR/001/25-26",
    linked_case_id: "case-uuid-1",
    informer_code: "IC-001",
    date_of_information: "2025-02-01",
    file_no: "F/101",
    entity_name: "Acme Corp",
    amount_detected: "5000000",
    amount_recovered: "3000000",
    reward_percentage: "10",
    reward_amount: "300000",
    reward_sanctioned_date: "",
    reward_paid_date: "",
    sio: "sio-1",
    group: "Group A",
    remarks: "Test remark",
    workspace_id: "ws-1",
  },
  {
    id: "rec-2",
    record_id: "IFR/002/25-26",
    linked_case_id: "",
    informer_code: "IC-002",
    date_of_information: "2025-03-10",
    file_no: "F/202",
    entity_name: "Beta Ltd",
    amount_detected: "1000000",
    amount_recovered: "",
    reward_percentage: "",
    reward_amount: "",
    reward_sanctioned_date: "",
    reward_paid_date: "",
    sio: "",
    group: "Group B",
    remarks: "",
    workspace_id: "ws-1",
  },
];

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.then = (resolve: any) => Promise.resolve({ data, error: null }).then(resolve);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.from.mockImplementation(() => makeChain(RECORDS));
});

async function renderAndWait() {
  render(<InformerRewardComponent />);
  await waitFor(() =>
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument(),
    { timeout: 3000 },
  );
}

describe("InformerRewardComponent — table", () => {
  it("renders column headers", async () => {
    await renderAndWait();
    expect(screen.getByText("Informer Code")).toBeInTheDocument();
    expect(screen.getByText("Entity Name")).toBeInTheDocument();
    expect(screen.getByText("Reward Amount")).toBeInTheDocument();
  });

  it("renders both records", async () => {
    await renderAndWait();
    expect(screen.getByText("IC-001")).toBeInTheDocument();
    expect(screen.getByText("IC-002")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
  });

  it("shows record IDs", async () => {
    await renderAndWait();
    expect(screen.getByText("IFR/001/25-26")).toBeInTheDocument();
    expect(screen.getByText("IFR/002/25-26")).toBeInTheDocument();
  });
});

describe("InformerRewardComponent — search", () => {
  it("filters table by entity name", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.type(screen.getByPlaceholderText("Search informer code, file no., entity…"), "Acme");
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument();
  });

  it("filters by informer code", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.type(screen.getByPlaceholderText("Search informer code, file no., entity…"), "IC-002");
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
    expect(screen.getByText("IC-002")).toBeInTheDocument();
  });

  it("shows all records when search cleared", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.type(screen.getByPlaceholderText("Search informer code, file no., entity…"), "Acme");
    await user.clear(screen.getByPlaceholderText("Search informer code, file no., entity…"));
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
  });
});

describe("InformerRewardComponent — add dialog", () => {
  it("has Add Record button", async () => {
    await renderAndWait();
    expect(screen.getByRole("button", { name: /add record/i })).toBeInTheDocument();
  });

  it("opens dialog on Add click", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dialog has Informer Code field", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Informer Code")).toBeInTheDocument();
  });

  it("Cancel closes dialog", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("InformerRewardComponent — sort", () => {
  it("renders sort chevrons on column headers", async () => {
    await renderAndWait();
    // Every sortable column header has a chevron button
    const sortButtons = screen.getAllByRole("button", { name: "" });
    expect(sortButtons.length).toBeGreaterThan(0);
  });
});
