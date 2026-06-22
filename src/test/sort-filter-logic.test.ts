/**
 * Tests for the sort and filter helpers used across all register components.
 * These are extracted directly from the inline patterns in the components.
 */
import { describe, it, expect } from "vitest";

// ─── Sort logic (shared pattern across all registers) ─────────────────────────

function applySort<T extends Record<string, any>>(
  records: T[],
  sort: { col: string | null; dir: "asc" | "desc" },
): T[] {
  return [...records].sort((a, b) => {
    if (!sort.col) return 0;
    const av = a[sort.col] ?? "";
    const bv = b[sort.col] ?? "";
    const cmp = String(av).localeCompare(String(bv));
    return sort.dir === "asc" ? cmp : -cmp;
  });
}

function makeToggleSort(
  state: { col: string | null; dir: "asc" | "desc" },
): (col: string) => { col: string; dir: "asc" | "desc" } {
  return (col: string) => {
    if (state.col === col) {
      return { col, dir: state.dir === "asc" ? "desc" : "asc" };
    }
    return { col, dir: "asc" };
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const RECORDS = [
  { id: "1", name: "Charlie", date: "2024-03-01" },
  { id: "2", name: "Alice", date: "2024-01-15" },
  { id: "3", name: "Bob", date: "2024-02-10" },
];

describe("applySort", () => {
  it("sorts ascending by string column", () => {
    const sorted = applySort(RECORDS, { col: "name", dir: "asc" });
    expect(sorted.map((r) => r.name)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("sorts descending by string column", () => {
    const sorted = applySort(RECORDS, { col: "name", dir: "desc" });
    expect(sorted.map((r) => r.name)).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("sorts ascending by date string column", () => {
    const sorted = applySort(RECORDS, { col: "date", dir: "asc" });
    expect(sorted.map((r) => r.date)).toEqual([
      "2024-01-15",
      "2024-02-10",
      "2024-03-01",
    ]);
  });

  it("returns original order when col is null", () => {
    const sorted = applySort(RECORDS, { col: null, dir: "asc" });
    expect(sorted.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("does not mutate the input array", () => {
    const original = [...RECORDS];
    applySort(RECORDS, { col: "name", dir: "asc" });
    expect(RECORDS).toEqual(original);
  });

  it("handles undefined field values — treats as empty string", () => {
    const records = [{ id: "1", name: undefined }, { id: "2", name: "Alice" }];
    const sorted = applySort(records as any, { col: "name", dir: "asc" });
    expect(sorted[0].id).toBe("1"); // "" < "Alice"
  });
});

describe("makeToggleSort", () => {
  it("starts ascending when switching to a new column", () => {
    const toggle = makeToggleSort({ col: "name", dir: "asc" });
    expect(toggle("date")).toEqual({ col: "date", dir: "asc" });
  });

  it("flips asc → desc when toggling the same column", () => {
    const toggle = makeToggleSort({ col: "name", dir: "asc" });
    expect(toggle("name")).toEqual({ col: "name", dir: "desc" });
  });

  it("flips desc → asc when toggling the same column again", () => {
    const toggle = makeToggleSort({ col: "name", dir: "desc" });
    expect(toggle("name")).toEqual({ col: "name", dir: "asc" });
  });

  it("returns asc for a new column regardless of current direction", () => {
    const toggle = makeToggleSort({ col: "name", dir: "desc" });
    expect(toggle("date")).toEqual({ col: "date", dir: "asc" });
  });

  it("works when current col is null (no active sort)", () => {
    const toggle = makeToggleSort({ col: null, dir: "asc" });
    expect(toggle("name")).toEqual({ col: "name", dir: "asc" });
  });
});

// ─── Search filter logic (shared pattern) ─────────────────────────────────────

function filterBySearch<T extends Record<string, any>>(
  records: T[],
  search: string,
  fields: (keyof T)[],
): T[] {
  if (!search) return records;
  const q = search.toLowerCase();
  return records.filter((r) =>
    fields.some((f) => r[f]?.toLowerCase().includes(q)),
  );
}

describe("filterBySearch", () => {
  const CASES = [
    { id: "1", entity_name: "Acme Corp", record_id: "ARR/001/25-26" },
    { id: "2", entity_name: "Beta Ltd", record_id: "ARR/002/25-26" },
    { id: "3", entity_name: "Acme Industries", record_id: "SCN/001/25-26" },
  ];

  it("returns all records when search is empty", () => {
    expect(filterBySearch(CASES, "", ["entity_name"])).toHaveLength(3);
  });

  it("filters by partial match on entity_name", () => {
    const result = filterBySearch(CASES, "acme", ["entity_name"]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("matches case-insensitively", () => {
    expect(filterBySearch(CASES, "BETA", ["entity_name"])).toHaveLength(1);
  });

  it("searches across multiple fields", () => {
    const result = filterBySearch(CASES, "scn", ["entity_name", "record_id"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("returns empty array when nothing matches", () => {
    expect(filterBySearch(CASES, "XYZ", ["entity_name"])).toHaveLength(0);
  });

  it("handles undefined field values without throwing", () => {
    const records = [{ id: "1", name: undefined }];
    expect(() => filterBySearch(records as any, "test", ["name"])).not.toThrow();
  });
});
