"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllUsers } from "@/hooks/useWorkspaceUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { REGISTER_PREFIXES, generateWorkspaceRecordId, exportRegisterToExcel, fetchCaseOptions, nullifyEmpty } from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser } from "./RegisterRecordDialog";
import { DGGI_GROUPS } from "@/lib/dggi-constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECORD_PREFIX = REGISTER_PREFIXES.NON_IR;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NonIRRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  file_number: string;
  date_of_initiation: string;
  group_name: string;
  remarks: string;
  sio: string;
  sio_name: string;
  group: string;
}

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FILTERS: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
};

const today = () => format(new Date(), "yyyy-MM-dd");

const EMPTY_RECORD: Omit<NonIRRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  file_number: "",
  date_of_initiation: today(),
  group_name: "",
  remarks: "",
  sio: "",
  sio_name: "",
  group: "",
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: {
  key: keyof Omit<NonIRRecord, "id">;
  label: string;
  type: "text" | "datepicker" | "usercombobox" | "caselink" | "select";
  width?: string;
  options?: string[];
  readOnly?: boolean;
}[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "file_number", label: "File Number", type: "text", width: "160px" },
  {
    key: "date_of_initiation",
    label: "Date of Initiation",
    type: "datepicker",
    width: "160px",
  },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group_name", label: "Group Name", type: "text", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "remarks", label: "Remarks", type: "text", width: "240px" },
];

const TOTAL_COLS = COLUMNS.length + 1; // +1 for Actions

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterDatePicker({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const parsed =
    value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-9 min-w-[130px] items-center gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF]">
          <CalendarIcon size={13} className="text-[#9a9a96] shrink-0" />
          {parsed ? (
            format(parsed, "dd/MM/yyyy")
          ) : (
            <span className="text-[#9a9a96]">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-[#EDEDEA] shadow-none rounded-xl"
        align="start"
      >
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const NonIRCaseRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [records, setRecords] = useState<NonIRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });

  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<NonIRRecord>>({});

  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const [, usersRes, cases] = await Promise.all([fetchRecords(wid), getAllUsers(), fetchCaseOptions(supabase, wid)]);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
      setCaseOptions(cases);
      setLoading(false);
    };
    init();
  }, []);

  const fetchRecords = async (wid: string) => {
    const { data, error } = await supabase
      .from("dggi_non_ir_case_records")
      .select("*")
      .eq("workspace_id", wid);
    if (error) {
      console.error("fetchRecords error:", error);
      return;
    }
    setRecords(data ?? []);
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const tableRecords = records
    .filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hit = [r.file_number, r.group_name].some((v) =>
          v?.toLowerCase().includes(q),
        );
        if (!hit) return false;
      }

      if (filters.dateFrom && r.date_of_initiation < filters.dateFrom)
        return false;
      if (filters.dateTo && r.date_of_initiation > filters.dateTo) return false;

      return true;
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const updatePayload = nullifyEmpty({ ...dialogDraft }, COLUMNS);
    (updatePayload as any).sio_name = workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null;
    const { error } = await supabase
      .from("dggi_non_ir_case_records")
      .update(updatePayload)
      .eq("id", dialogDraft.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r,
        ),
      );
      toast.success("Record saved");
      setDialogOpen(false);
    }
    setSavingRow(false);
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase
      .from("dggi_non_ir_case_records")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.success("Record deleted");
    }
  };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const payload = nullifyEmpty({ ...dialogDraft, record_id: await generateWorkspaceRecordId(supabase, "dggi_non_ir_case_records", RECORD_PREFIX, workspaceId), workspace_id: workspaceId }, COLUMNS);
    (payload as any).sio_name = workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null;
    const { data, error } = await supabase
      .from("dggi_non_ir_case_records")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add record: " + error.message);
    } else {
      setRecords((prev) => [...prev, data]);
      setDialogOpen(false);
      toast.success("Record added");
    }
    setSavingRow(false);
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "Non_IR_Case", (msg) => toast.success(msg));
  };

  // ── Row renderer ───────────────────────────────────────────────────────────

  const renderCell = (value: string, type: "text" | "datepicker" | "usercombobox" | "caselink" | "select", storedName?: string) => {
    if (type === "caselink") return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (type === "datepicker") return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (type === "usercombobox") return <span>{workspaceUsers.find((u) => u.id === value)?.name || storedName || "—"}</span>;
    return <span>{value || "—"}</span>;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">
                NON-IR Case Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                {tableRecords.length} record
                {tableRecords.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleExport} disabled={tableRecords.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
              <Button
                size="sm"
                className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4"
                onClick={() => {
                  setDialogMode("add");
                  setDialogDraft({ ...EMPTY_RECORD });
                  setDialogOpen(true);
                }}
              >
                <Plus size={15} className="mr-1" />
                Add Record
              </Button>
            </div>
          </div>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <SlidersHorizontal size={14} />
              <span className="font-medium">Filters</span>
            </div>

            {/* Search */}
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-3 text-[#9a9a96] pointer-events-none"
              />
              <Input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search file number, SIO, group…"
                className="h-9 pl-8 pr-3 min-w-[240px] border-[#EDEDEA] text-base rounded-lg"
              />
              {filters.search && (
                <button
                  onClick={() => setFilter("search", "")}
                  className="absolute right-2 text-[#9a9a96] hover:text-[#1a1a1a]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Date of Initiation range */}
            <div className="flex items-center gap-1">
              <span className="text-base text-[#9a9a96] shrink-0">
                Initiated:
              </span>
              <FilterDatePicker
                value={filters.dateFrom}
                placeholder="From"
                onChange={(v) => setFilter("dateFrom", v)}
              />
              <span className="text-[#9a9a96]">—</span>
              <FilterDatePicker
                value={filters.dateTo}
                placeholder="To"
                onChange={(v) => setFilter("dateTo", v)}
              />
              {(filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={() => {
                    setFilter("dateFrom", "");
                    setFilter("dateTo", "");
                  }}
                  className="ml-0.5 text-[#9a9a96] hover:text-[#1a1a1a]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ ...EMPTY_FILTERS })}
                className="ml-auto flex items-center gap-1 rounded-lg border border-[#EDEDEA] px-3 py-1.5 text-base text-[#6b6b6b] hover:bg-[#F3F2EF] transition-all"
              >
                <X size={12} />
                Clear all
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6b6b6b] text-xs text-white font-medium">
                  {activeFilterCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Records table ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-b border-[#EDEDEA]">
                  {COLUMNS.map((col) => (
                    <TableHead
                      key={col.key}
                      style={{ minWidth: col.width }}
                      className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]"
                      onClick={() => toggleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {sortCol === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          ))}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tableRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-b border-[#EDEDEA] text-base hover:bg-white"
                  >
                    {COLUMNS.map((col) => (
                      <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
                        {renderCell((record as any)[col.key] ?? "", col.type, col.key === "sio" ? (record as any).sio_name : undefined)}
                      </TableCell>
                    ))}
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]"
                          onClick={() => { setDialogMode("edit"); setDialogDraft({ ...record }); setDialogOpen(true); }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]"
                          onClick={() => deleteRecord(record.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      No records match the current filters.{" "}
                      {activeFilterCount > 0 && (
                        <button
                          className="text-[#4A5FD4] underline"
                          onClick={() => setFilters({ ...EMPTY_FILTERS })}
                        >
                          Clear filters
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <RegisterRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        columns={COLUMNS as RegisterColumn[]}
        draft={dialogDraft as Record<string, string>}
        onDraftChange={(k, v) => setDialogDraft((prev) => ({ ...prev, [k]: v }))}
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        users={workspaceUsers}
        caseOptions={caseOptions}
      />
    </div>
  );
};

export default NonIRCaseRegisterComponent;
