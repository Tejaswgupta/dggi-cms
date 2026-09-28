import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const recordQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({
    data: [{
      id: "00000000-0000-0000-0000-000000000001",
      record_id: "PAR/16/2025-26",
      attachment_batch_id: "PAR/16/2025-26",
      linked_case_id: "",
      person_name: "Taxpayer",
      date_of_attachment: "2026-01-01",
    }, {
      id: "00000000-0000-0000-0000-000000000002",
      record_id: "PAR/106/2025-26",
      attachment_batch_id: "PAR/16/2025-26",
      linked_case_id: "",
      person_name: "Other taxpayer",
      date_of_attachment: "2026-01-01",
    }],
    error: null,
  }),
};
const supabase = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
  rpc: vi.fn().mockResolvedValue({
    data: [{
      batch_key: "PAR/16/2025-26",
      is_fallback: false,
      date_of_attachment: "2026-01-01",
      total_batches: 1,
    }],
    error: null,
  }),
  from: vi.fn((table: string) => table === "dggi_provisional_attachment_records"
    ? recordQuery
    : {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { dggi_role: "ADG" } }),
        then: (resolve: (value: unknown) => void) => Promise.resolve({ data: [] }).then(resolve),
      }),
};

vi.mock("@/lib/supabase/client", () => ({ default: () => supabase }));
vi.mock("@/lib/action/workspace", () => ({
  getWorkspaceId: () => Promise.resolve("workspace-1"),
}));
vi.mock("@/hooks/useGroupFilteredSioUsers", () => ({
  useGroupFilteredSioUsers: () => ({ allUsers: [], sioUsers: [], loading: false }),
}));
const searchParams = new URLSearchParams("filter=16%2F2025-26");
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));

import ProvisionalAttachmentComponent from "@/app/tasks/ProvisionalAttachmentComponent";

beforeEach(() => {
  searchParams.delete("rowId");
  vi.clearAllMocks();
});

it("loads and displays the attachment batch matched by an ID search", async () => {
  render(<ProvisionalAttachmentComponent />);

  expect(await screen.findByText("Taxpayer")).toBeInTheDocument();
  expect(supabase.rpc).toHaveBeenCalledWith(
    "dggi_provisional_attachment_batch_page",
    expect.objectContaining({ p_search: "16/2025-26" }),
  );
  expect(recordQuery.in).toHaveBeenCalledWith("attachment_batch_id", ["PAR/16/2025-26"]);
});

it("shows only the deadline's exact row when opened from the dashboard", async () => {
  searchParams.set("rowId", "00000000-0000-0000-0000-000000000001");
  render(<ProvisionalAttachmentComponent />);

  expect(await screen.findByRole("button", { name: "PAR/16/2025-26" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "PAR/106/2025-26" })).not.toBeInTheDocument();
  expect(supabase.rpc).toHaveBeenCalledWith(
    "dggi_provisional_attachment_batch_page",
    expect.objectContaining({ p_search: "@00000000-0000-0000-0000-000000000001" }),
  );

  fireEvent.change(screen.getByPlaceholderText("Search person, GSTIN, issue…"), {
    target: { value: "Taxpayer" },
  });
  await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith(
    "dggi_provisional_attachment_batch_page",
    expect.objectContaining({ p_search: "Taxpayer" }),
  ));
});
