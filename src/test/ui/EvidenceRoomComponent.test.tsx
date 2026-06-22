/**
 * UI tests for EvidenceRoomComponent.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSupabase = { from: vi.fn() };

vi.mock("@/lib/supabase/client", () => ({ default: () => mockSupabase }));
vi.mock("@/lib/action/workspace", () => ({
  getWorkspaceId: vi.fn().mockResolvedValue("ws-1"),
}));
vi.mock("@/hooks/useWorkspaceUsers.tsx", () => ({
  getAllUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [{ id: "user-1", name: "Alice Sharma", email: "alice@test.com" }],
  }),
}));

import EvidenceRoomComponent from "@/app/tasks/EvidenceRoomComponent";

const RECORDS = [
  {
    id: "ev-1",
    record_id: "EVR/001/25-26",
    linked_case_id: "case-1",
    case_file_no: "F/001",
    entity_name: "Acme Corp",
    evidence_description: "Seized documents",
    date_of_seizure: "2025-01-10",
    seized_by: "user-1",
    evidence_type: "Documents",
    quantity: "5 boxes",
    storage_location: "Room 3B",
    condition: "Sealed",
    date_released: "",
    released_to: "",
    court_order_ref: "",
    sio: "user-1",
    group: "Group A",
    remarks: "",
    workspace_id: "ws-1",
  },
  {
    id: "ev-2",
    record_id: "EVR/002/25-26",
    linked_case_id: "",
    case_file_no: "F/002",
    entity_name: "Beta Ltd",
    evidence_description: "Seized cash",
    date_of_seizure: "2025-02-20",
    seized_by: "",
    evidence_type: "Cash",
    quantity: "₹2 lakh",
    storage_location: "Safe",
    condition: "Sealed",
    date_released: "2025-03-01",
    released_to: "Court",
    court_order_ref: "CO/123",
    sio: "",
    group: "Group B",
    remarks: "Released by court order",
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
  render(<EvidenceRoomComponent />);
  await waitFor(() =>
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument(),
    { timeout: 3000 },
  );
}

describe("EvidenceRoomComponent — table", () => {
  it("renders column headers", async () => {
    await renderAndWait();
    expect(screen.getByText("Evidence Description")).toBeInTheDocument();
    expect(screen.getByText("Storage Location")).toBeInTheDocument();
    expect(screen.getByText("Evidence Type")).toBeInTheDocument();
  });

  it("renders both records", async () => {
    await renderAndWait();
    expect(screen.getByText("Seized documents")).toBeInTheDocument();
    expect(screen.getByText("Seized cash")).toBeInTheDocument();
  });

  it("shows record IDs", async () => {
    await renderAndWait();
    expect(screen.getByText("EVR/001/25-26")).toBeInTheDocument();
    expect(screen.getByText("EVR/002/25-26")).toBeInTheDocument();
  });

  it("shows entity names", async () => {
    await renderAndWait();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
  });

  it("shows storage locations", async () => {
    await renderAndWait();
    expect(screen.getByText("Room 3B")).toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
  });
});

describe("EvidenceRoomComponent — search", () => {
  it("filters by entity name", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.type(screen.getByPlaceholderText("Search file no., entity, location…"), "Acme");
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument();
  });

  it("filters by storage location", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.type(screen.getByPlaceholderText("Search file no., entity, location…"), "Safe");
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.queryByText("Room 3B")).not.toBeInTheDocument();
  });

  it("filters by evidence description", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.type(screen.getByPlaceholderText("Search file no., entity, location…"), "cash");
    expect(screen.getByText("Seized cash")).toBeInTheDocument();
    expect(screen.queryByText("Seized documents")).not.toBeInTheDocument();
  });
});

describe("EvidenceRoomComponent — add dialog", () => {
  it("opens dialog on Add click", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dialog shows Evidence Description field", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Evidence Description")).toBeInTheDocument();
  });

  it("dialog shows Storage Location field", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole("button", { name: /add record/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Storage Location")).toBeInTheDocument();
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

describe("EvidenceRoomComponent — edit dialog", () => {
  it("clicking a row's action button opens edit dialog", async () => {
    const user = userEvent.setup();
    await renderAndWait();
    // Icon-only action buttons inside table rows
    const rows = screen.getAllByRole("row");
    const firstDataRow = rows[1]; // skip header row
    const actionBtn = within(firstDataRow).getAllByRole("button")[0];
    await user.click(actionBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
