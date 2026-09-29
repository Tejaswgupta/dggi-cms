import { countableConvertedIr, filterLiveDeadlineRows } from "@/app/dashboard/DGGIDashboard";
import { expect, it, vi } from "vitest";

it("keeps only live source rows in dashboard pendency", async () => {
  const rows = [
    { source_table: "dggi_records", row_id: "live" },
    { source_table: "dggi_records", row_id: "deleted" },
    { source_table: "dggi_records", row_id: "live" },
    {
      source_table: "dggi_scn_records",
      row_id: "child-1",
      linked_case_id: "deleted-parent",
    },
    {
      source_table: "dggi_scn_records",
      row_id: "child-2",
      linked_case_id: "live-parent",
    },
  ] as Parameters<typeof filterLiveDeadlineRows>[0];
  const from = vi.fn((table: string) => ({
    select: (column: string) => ({
      in: (field: string, ids: string[]) => ({
        is: async (deletedColumn: string, value: null) => {
          expect([column, field, deletedColumn, value]).toEqual([
            "id",
            "id",
            "deleted_at",
            null,
          ]);
          return {
            data: ids
              .filter((id) => table !== "dggi_records" || id !== "deleted")
              .map((id) => ({ id })),
          };
        },
        not: async () => {
          expect([table, column, field]).toEqual([
            "dggi_records",
            "record_id",
            "record_id",
          ]);
          return { data: [{ record_id: "deleted-parent" }] };
        },
      }),
    }),
  }));

  const result = await filterLiveDeadlineRows(rows, { from } as never);

  expect(result).toEqual([rows[0], rows[2], rows[4]]);
});

it("counts a conversion this FY only when its NON-IR source was not already counted", () => {
  const rows = [
    { record_id: "new-1", converted_from_non_ir: "prior-fy" },
    { record_id: "new-2", converted_from_non_ir: "this-fy" },
    { record_id: "duplicate", converted_from_non_ir: "prior-fy" },
  ];

  expect(countableConvertedIr(rows, new Set(["this-fy"]))).toEqual([rows[0]]);
});
