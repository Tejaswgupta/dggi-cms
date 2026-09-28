import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const recordQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({
    data: [{
      id: "property-1",
      record_id: "PAR/16/2025-26",
      attachment_batch_id: "PAR/16/2025-26",
      linked_case_id: "",
      person_name: "Taxpayer",
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
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("filter=16%2F2025-26"),
}));

import ProvisionalAttachmentComponent from "@/app/tasks/ProvisionalAttachmentComponent";

it("loads and displays the attachment batch matched by an ID search", async () => {
  render(<ProvisionalAttachmentComponent />);

  expect(await screen.findByRole("button", { name: "PAR/16/2025-26" })).toBeInTheDocument();
  expect(supabase.rpc).toHaveBeenCalledWith(
    "dggi_provisional_attachment_batch_page",
    expect.objectContaining({ p_search: "16/2025-26" }),
  );
  expect(recordQuery.in).toHaveBeenCalledWith("attachment_batch_id", ["PAR/16/2025-26"]);
});
