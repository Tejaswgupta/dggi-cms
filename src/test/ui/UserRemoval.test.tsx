import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const rpc = vi.fn();
const users = [
  { id: "manager", name: "Manager", email: "manager@test.com", dggi_role: "ADG", workspace_id: "ws" },
  { id: "source", name: "Source", email: "source@test.com", dggi_role: "SIO", workspace_id: "ws" },
  { id: "target", name: "Target", email: "target@test.com", dggi_role: "SIO", workspace_id: "ws" },
];
const supabase = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "manager" } } }) },
  rpc,
  from: vi.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: { dggi_role: "ADG" } }),
        order: async () => ({ data: users }),
      }),
      then: (resolve: (value: { data: unknown[] }) => void) =>
        Promise.resolve({ data: table === "dggi_user_group_assignments"
          ? [{ user_id: "target", group_name: "Group A" }]
          : [] }).then(resolve),
    }),
  })),
};

vi.mock("@/lib/supabase/client", () => ({ default: () => supabase }));
vi.mock("@/lib/action/workspace", () => ({ getWorkspaceId: async () => "ws" }));
vi.mock("@/lib/action/users", () => ({ addUserAction: vi.fn(), resetUserPasswordAction: vi.fn() }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import UsersPage from "@/app/users/component";

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({
    data: { dggi_cases: 2, dggi_registers: 1, cases: 1 },
    error: null,
  });
});

it("requires a replacement SIO and group before removing a user with cases", async () => {
  render(<UsersPage />);
  await screen.findByText("Source");
  fireEvent.click(screen.getAllByTitle("Remove user")[1]);
  await screen.findByText(/must be transferred before removal/);

  const remove = screen.getByRole("button", { name: "Transfer and remove" });
  expect(remove).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Transfer cases to"), { target: { value: "target" } });
  expect(remove).toBeDisabled();
  fireEvent.change(screen.getByLabelText("New group"), { target: { value: "Group A" } });
  fireEvent.click(remove);

  await waitFor(() =>
    expect(rpc).toHaveBeenCalledWith("remove_user_with_case_transfer", {
      p_user_id: "source",
      p_replacement_id: "target",
      p_group: "Group A",
    }),
  );
  await waitFor(() => expect(screen.queryByText("Source")).not.toBeInTheDocument());
});
