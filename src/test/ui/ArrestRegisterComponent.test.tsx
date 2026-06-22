/**
 * UI tests for ArrestRegisterComponent.
 *
 * We mock all external dependencies (Supabase, getWorkspaceId, getAllUsers)
 * so the component can be mounted without a real server.
 * Tests drive the UI as a user would: check the table renders, search filters,
 * the Add dialog opens, batch/person fields are present, etc.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks must be declared before imports that use them ──────────────────────

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-uuid-1" } } }),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  default: () => mockSupabase,
}));

vi.mock("@/lib/action/workspace", () => ({
  getWorkspaceId: vi.fn().mockResolvedValue("ws-1"),
}));

vi.mock("@/hooks/useWorkspaceUsers.tsx", () => ({
  getAllUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "sio-uuid-1", name: "Alice Sharma", email: "alice@test.com" },
    ],
  }),
}));

// Must import AFTER mocks
import ArrestRegisterComponent from "@/app/tasks/ArrestRegisterComponent";

// ─── Fixture data ─────────────────────────────────────────────────────────────

const ARREST_RECORDS = [
  {
    id: "row-1",
    record_id: "ARR/001/25-26-1",
    arrest_batch_id: "ARR/001/25-26",
    linked_case_id: "case-uuid-1",
    arrested_name: "John Doe",
    arrested_designation: "Director",
    arrested_age: "42",
    date_of_arrest: "2025-03-15",
    party_name: "Acme Corp",
    unit_gstin: "27AAABB1234C1Z5",
    amount_crore: "3.5",
    prosecution_filed: "Yes",
    sio: "sio-uuid-1",
    group: "Group A",
    workspace_id: "ws-1",
  },
  {
    id: "row-2",
    record_id: "ARR/002/25-26-1",
    arrest_batch_id: "ARR/002/25-26",
    linked_case_id: "case-uuid-2",
    arrested_name: "Jane Smith",
    arrested_designation: "CFO",
    arrested_age: "38",
    date_of_arrest: "2025-04-01",
    party_name: "Beta Ltd",
    unit_gstin: "29BBBCC5678D2Z9",
    amount_crore: "1.2",
    prosecution_filed: "No",
    sio: "sio-uuid-1",
    group: "Group B",
    workspace_id: "ws-1",
  },
];

function makeSupabaseChain(data: any, count?: number) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
  };
  // make awaiting the chain resolve to { data, error: null }
  chain[Symbol.toStringTag] = "Promise";
  chain.then = (resolve: any) => Promise.resolve({ data, error: null }).then(resolve);
  chain.count = count ?? null;
  return chain;
}

function setupMocks() {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "dggi_arrest_records") return makeSupabaseChain(ARREST_RECORDS);
    if (table === "votum_users") return makeSupabaseChain({ dggi_role: "ADG" });
    if (table === "dggi_user_group_assignments") return makeSupabaseChain([]);
    if (table === "dggi_records") return makeSupabaseChain([]);
    return makeSupabaseChain([]);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ArrestRegisterComponent — loading state", () => {
  it("renders a spinner while loading", () => {
    render(<ArrestRegisterComponent />);
    // The spinner is a div with animate-spin class
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

describe("ArrestRegisterComponent — loaded state", () => {
  async function renderAndWait() {
    render(<ArrestRegisterComponent />);
    // Wait for loading to finish — spinner disappears
    await waitFor(() =>
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
  }

  it("renders table headers", async () => {
    await renderAndWait();
    expect(screen.getByText("Arrest No.")).toBeInTheDocument();
    expect(screen.getByText("Name of Arrested Person")).toBeInTheDocument();
    expect(screen.getByText("Date of Arrest")).toBeInTheDocument();
  });

  it("renders arrest records in the table", async () => {
    await renderAndWait();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders batch IDs", async () => {
    await renderAndWait();
    expect(screen.getByText("ARR/001/25-26")).toBeInTheDocument();
    expect(screen.getByText("ARR/002/25-26")).toBeInTheDocument();
  });

  it("shows Add Arrest Record button", async () => {
    await renderAndWait();
    expect(
      screen.getByRole("button", { name: /add record/i }),
    ).toBeInTheDocument();
  });

  it("filters records by search — shows matching record", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const searchInput = screen.getByPlaceholderText("Search person, unit…");
    await user.type(searchInput, "John");
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("shows both records again when search is cleared", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const searchInput = screen.getByPlaceholderText("Search person, unit…");
    await user.type(searchInput, "John");
    await user.clear(searchInput);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("opens Add Arrest dialog when button clicked", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add Arrest Record")).toBeInTheDocument();
  });

  it("dialog contains Arrest Details and Arrested Person sections", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Arrest Details")).toBeInTheDocument();
    // "Arrested Person" section heading (may also match label "Name of Arrested Person")
    expect(within(dialog).getAllByText(/Arrested Person/).length).toBeGreaterThan(0);
  });

  it("dialog has Add Another Person button", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    expect(screen.getByText("Add Another Person")).toBeInTheDocument();
  });

  it("clicking Add Another Person adds a second person card", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    expect(screen.queryByText("Person 2")).not.toBeInTheDocument();
    await user.click(screen.getByText("Add Another Person"));
    expect(screen.getByText("Person 2")).toBeInTheDocument();
  });

  it("Save button label updates when multiple persons added", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    await user.click(screen.getByText("Add Another Person"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /add 2 persons/i })).toBeInTheDocument();
  });

  it("Cancel closes the dialog", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
