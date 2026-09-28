import { exportRegisterToExcel } from "@/app/tasks/register-utils";
import { exportToExcel } from "@/lib/excel-export";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/excel-export", () => ({ exportToExcel: vi.fn() }));

it("marks deleted rows in every register export without replacing an existing Status column", () => {
  const live = { record_id: "IR/1", status: "Open", deleted_at: null };
  const deleted = { record_id: "IR/2", status: "Open", deleted_at: "2026-09-28T10:00:00Z" };

  exportRegisterToExcel(
    [live, deleted],
    [{ key: "status", label: "Status" }],
    "IR",
  );

  const columns = vi.mocked(exportToExcel).mock.calls[0][1];
  expect(columns.map((column) => column.label)).toEqual(["Status", "Deletion Status"]);
  const marker = columns[1];
  expect(marker.format?.(live.deleted_at, live)).toBe("Active");
  expect(marker.format?.(deleted.deleted_at, deleted)).toBe("Deleted");
});
