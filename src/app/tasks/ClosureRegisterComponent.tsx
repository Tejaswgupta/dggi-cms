"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  deletedRowClass,
  exportRegisterToExcel,
  isDeleted,
  restoreRecord,
  softDeleteRecord,
} from "./register-utils";
import { type WorkspaceUser } from "./RegisterRecordDialog";

const TABLE_NAME = "dggi_closure_records";

interface ClosureRecord {
  id: string;
  record_id: string;
  source_record_id: string;
  is_ir: boolean;
  group: string;
  intel_source: string;
  date_of_receipt: string;
  taxpayer_name: string;
  gstins: string;
  file_no: string;
  date_of_initiation: string;
  intel_approved_date: string;
  mode_of_initiation: string;
  intelligence_action_date: string;
  handling_io_sio: string;
  issue_involved: string;
  latest_status: string;
  pr_adg_comments: { text: string; timestamp: string }[] | null;
  detection_amount: string;
  recovery_itc: string;
  recovery_cash: string;
  total_recovery: string;
  digit_id: string;
  bo_id: string;
  hsn_code: string;
  closure_by: string;
  closure_reason: string;
  transferred_to: string;
  due_date: string;
  date_of_ir: string;
  date_of_non_ir: string;
  converted_from_non_ir: string;
  created_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

type ActiveTab = "non-ir" | "ir";

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  closureBy: string;
  fy: string;
}

const EMPTY_FILTERS: Filters = { search: "", dateFrom: "", dateTo: "", closureBy: "", fy: "" };

function dateToFy(iso: string): string {
  const year = parseInt(iso.slice(0, 4), 10);
  const month = parseInt(iso.slice(5, 7), 10);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

function fyToDateRange(fy: string): { from: string; to: string } {
  const start = parseInt(fy.slice(0, 4), 10);
  return { from: `${start}-04-01`, to: `${start + 1}-03-31` };
}

type ColDef = {
  key: keyof Omit<ClosureRecord, "id" | "is_ir">;
  label: string;
  type: "text" | "datepicker" | "usercombobox";
  width?: string;
};

const SHARED_COLUMNS: ColDef[] = [
  { key: "record_id", label: "Closure ID", type: "text", width: "150px" },
  { key: "source_record_id", label: "IR No.", type: "text", width: "150px" },
  {
    key: "taxpayer_name",
    label: "Taxpayer / Entity",
    type: "text",
    width: "200px",
  },
  { key: "gstins", label: "GSTINs", type: "text", width: "180px" },
  { key: "file_no", label: "File No.", type: "text", width: "160px" },
  { key: "group", label: "Group", type: "text", width: "110px" },
  {
    key: "handling_io_sio",
    label: "Handling SIO",
    type: "usercombobox",
    width: "170px",
  },
  { key: "closure_by", label: "Closure Type", type: "text", width: "160px" },
  { key: "closure_reason", label: "Closure Reason", type: "text", width: "200px" },
  { key: "transferred_to", label: "Transferred To", type: "text", width: "180px" },
  {
    key: "due_date",
    label: "Closure Date",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "issue_involved",
    label: "Issue Involved",
    type: "text",
    width: "180px",
  },
  {
    key: "mode_of_initiation",
    label: "Mode of Initiation",
    type: "text",
    width: "170px",
  },
  {
    key: "detection_amount",
    label: "Detection Amount",
    type: "text",
    width: "170px",
  },
  { key: "recovery_itc", label: "Recovery ITC", type: "text", width: "150px" },
  {
    key: "recovery_cash",
    label: "Recovery Cash",
    type: "text",
    width: "150px",
  },
  {
    key: "total_recovery",
    label: "Total Recovery",
    type: "text",
    width: "160px",
  },
  { key: "digit_id", label: "DIGIT ID", type: "text", width: "140px" },
  { key: "bo_id", label: "BO ID", type: "text", width: "130px" },
  {
    key: "latest_status",
    label: "Latest Status",
    type: "text",
    width: "170px",
  },
  {
    key: "date_of_receipt",
    label: "Date of Receipt",
    type: "datepicker",
    width: "155px",
  },
  {
    key: "date_of_initiation",
    label: "Date of Initiation",
    type: "datepicker",
    width: "165px",
  },
  {
    key: "intel_approved_date",
    label: "Intel Approved Date",
    type: "datepicker",
    width: "175px",
  },
];

const NON_IR_EXCLUDED_KEYS = new Set<keyof ClosureRecord>([
  "detection_amount",
  "recovery_itc",
  "recovery_cash",
  "total_recovery",
  "digit_id",
  "bo_id",
  "date_of_receipt",
]);

const NON_IR_COLUMNS: ColDef[] = [
  ...SHARED_COLUMNS
    .filter((c) => !NON_IR_EXCLUDED_KEYS.has(c.key as keyof ClosureRecord))
    .map((c) =>
      c.key === "source_record_id" ? { ...c, label: "NON-IR No." } : c
    ),
  {
    key: "date_of_non_ir",
    label: "Date of NON-IR",
    type: "datepicker",
    width: "160px",
  },
];

const IR_COLUMNS: ColDef[] = [
  ...SHARED_COLUMNS,
  {
    key: "date_of_ir",
    label: "Date of IR",
    type: "datepicker",
    width: "150px",
  },
];

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

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
            format(parsed, "dd-MM-yyyy")
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

const EDITABLE_CLOSURE_KEYS: (keyof ClosureRecord)[] = [
  "source_record_id",
  "taxpayer_name",
  "gstins",
  "file_no",
  "group",
  "handling_io_sio",
  "issue_involved",
  "mode_of_initiation",
  "detection_amount",
  "recovery_itc",
  "recovery_cash",
  "total_recovery",
  "digit_id",
  "bo_id",
  "closure_by",
  "closure_reason",
  "transferred_to",
  "due_date",
  "latest_status",
  "date_of_ir",
  "date_of_non_ir",
];

const ClosureRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<ClosureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const initialTab = (searchParams?.get("tab") === "ir" ? "ir" : "non-ir") as ActiveTab;
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: searchParams?.get("caseId") ?? "",
  });
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [editingRecord, setEditingRecord] = useState<ClosureRecord | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ClosureRecord>>({});
  const [saving, setSaving] = useState(false);
  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (uid) setCurrentUserId(uid);
      const [{ data: userRow }, { data: groupRows }] = await Promise.all([
        supabase
          .from("votum_users")
          .select("dggi_role")
          .eq("id", uid!)
          .single(),
        supabase
          .from("dggi_user_group_assignments")
          .select("group_name")
          .eq("user_id", uid!),
      ]);
      const role = userRow?.dggi_role ?? "";
      setUserRole(role);
      const groups = (groupRows ?? []).map(
        (g: { group_name: string }) => g.group_name,
      );

      let query = supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid);
      if (role !== "ADG" && role !== "DD_INT") {
        if (role === "IO" || role === "SIO") {
          query = query.eq("handling_io_sio", uid!);
        } else if (groups.length > 0) {
          query = query.in("group", groups);
        } else {
          query = query.eq("group", "__none__");
        }
      }
      const [{ data, error }] = await Promise.all([
        query.order("created_at", { ascending: false }),
      ]);
      if (!error) setRecords(data ?? []);
      setLoading(false);
    };
    init();
  }, []);

  const openEdit = (record: ClosureRecord) => {
    setEditingRecord(record);
    setEditDraft({ ...record });
  };

  const restoreRecordRow = async (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deleted_at: null } : r)),
    );
    const { error } = await restoreRecord(supabase, TABLE_NAME, id);
    if (error) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, deleted_at: new Date().toISOString() } : r,
        ),
      );
      toast.error("Restore failed: " + error.message);
    }
  };

  const deleteRecord = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    const stamp = new Date().toISOString();
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deleted_at: stamp } : r)),
    );
    const { error } = await softDeleteRecord(supabase, TABLE_NAME, id, currentUserId || null);
    if (error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, deleted_at: null } : r)),
      );
      toast.error("Delete failed: " + error.message);
      return;
    }
    toast.info(
      ({ closeToast }: { closeToast: () => void }) => (
        <div className="flex items-center justify-between gap-3 w-full">
          <span>{record.record_id} deleted</span>
          <button
            onClick={() => { restoreRecordRow(id); closeToast(); }}
            className="font-medium underline underline-offset-2 shrink-0"
          >
            Undo
          </button>
        </div>
      ),
      { autoClose: 5000, closeOnClick: false, pauseOnHover: true },
    );
  };

  const saveEdit = async () => {
    if (!editingRecord) return;
    setSaving(true);
    const payload: Partial<ClosureRecord> = {};
    for (const key of EDITABLE_CLOSURE_KEYS) {
      (payload as any)[key] = (editDraft as any)[key] ?? (editingRecord as any)[key];
    }
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", editingRecord.id);
    if (error) {
      toast.error("Failed to save changes.");
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === editingRecord.id ? { ...r, ...payload } : r)),
      );
      toast.success("Closure record updated.");
      setEditingRecord(null);
      setEditDraft({});
    }
    setSaving(false);
  };

  const isIr = activeTab === "ir";
  const COLUMNS = isIr ? IR_COLUMNS : NON_IR_COLUMNS;
  const TOTAL_COLS = COLUMNS.length;

  const nonIrTotal = records.filter((r) => !r.is_ir).length;
  const irTotal = records.filter((r) => r.is_ir).length;

  const closureByOptions = Array.from(
    new Set(records.filter((r) => r.is_ir === isIr && r.closure_by).map((r) => r.closure_by))
  ).sort();

  const availableFYs = Array.from(
    new Set(
      records
        .filter((r) => r.is_ir === isIr && r.due_date)
        .map((r) => dateToFy(r.due_date)),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const activeFyRange = filters.fy ? fyToDateRange(filters.fy) : null;

  const tableRecords = records
    .filter((r) => {
      if (r.is_ir !== isIr) return false;
      if (filters.fy && activeFyRange) {
        if (!r.due_date) return false;
        if (r.due_date < activeFyRange.from || r.due_date > activeFyRange.to) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          ![
            r.record_id,
            r.source_record_id,
            r.taxpayer_name,
            r.file_no,
            r.gstins,
            r.closure_by,
            r.closure_reason,
            r.transferred_to,
          ].some((v) => v?.toLowerCase().includes(q))
        )
          return false;
      }
      if (filters.closureBy && r.closure_by !== filters.closureBy) return false;
      if (filters.dateFrom && r.due_date && r.due_date < filters.dateFrom)
        return false;
      if (filters.dateTo && r.due_date && r.due_date > filters.dateTo)
        return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortCol) return b.created_at.localeCompare(a.created_at);
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const na = Number(av);
      const nb = Number(bv);
      const cmp =
        !isNaN(na) && !isNaN(nb)
          ? na - nb
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "Closure", (msg) =>
      toast.success(msg),
      workspaceUsers,
    );
  };

  const LEGACY_CUTOFF = "2026-08-01";

  const renderCell = (record: ClosureRecord, col: ColDef) => {
    if (col.key === "total_recovery") {
      if (record.total_recovery) return <span>{record.total_recovery}</span>;
      // Aug 1 2026 onwards: sum recovery_cash + recovery_itc
      if (record.created_at >= LEGACY_CUTOFF) {
        const cash = parseFloat(record.recovery_cash) || 0;
        const itc = parseFloat(record.recovery_itc) || 0;
        const sum = cash + itc;
        return <span>{sum ? sum.toLocaleString("en-IN") : "—"}</span>;
      }
      return <span>—</span>;
    }
    const value = (record as any)[col.key] ?? "";
    if (col.type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (col.type === "usercombobox")
      return (
        <span>
          {workspaceUsers.find((u) => u.id === value)?.name || value || "—"}
        </span>
      );
    return <span>{value || "—"}</span>;
  };

  if (loading || usersLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" />
      </div>
    );

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">
                Closure Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                {isIr ? "IR" : "NON-IR"} Closures · {tableRecords.length} record
                {tableRecords.length !== 1 ? "s" : ""}
                {filters.fy ? ` · FY ${filters.fy}` : " · All Financial Years"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4"
              onClick={handleExport}
              disabled={tableRecords.length === 0}
            >
              <Download size={15} className="mr-1" />
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-3">
          {(["non-ir", "ir"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setFilters({ ...EMPTY_FILTERS });
              }}
              className={`flex flex-col gap-1 rounded-2xl border px-6 py-4 text-left transition-all shadow-none min-w-[160px] ${activeTab === tab ? "border-[#4A5FD4] bg-[#EEF2FF]" : "border-[#EDEDEA] bg-white hover:bg-[#F3F2EF]"}`}
            >
              <span
                className={`text-3xl font-semibold ${activeTab === tab ? "text-[#4A5FD4]" : "text-[#1a1a1a]"}`}
              >
                {tab === "non-ir" ? nonIrTotal : irTotal}
              </span>
              <span
                className={`text-base font-medium ${activeTab === tab ? "text-[#4A5FD4]" : "text-[#6b6b6b]"}`}
              >
                {tab === "non-ir" ? "NON-IR Closures" : "IR Closures"}
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <SlidersHorizontal size={14} />
              <span className="font-medium">Filters</span>
            </div>
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-3 text-[#9a9a96] pointer-events-none"
              />
              <Input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search case ID, taxpayer, GSTIN…"
                className="h-9 pl-8 pr-3 min-w-[240px] border-[#EDEDEA] text-base rounded-lg"
              />
            </div>
            <FilterDatePicker
              value={filters.dateFrom}
              placeholder="From date"
              onChange={(v) => setFilter("dateFrom", v)}
            />
            <FilterDatePicker
              value={filters.dateTo}
              placeholder="To date"
              onChange={(v) => setFilter("dateTo", v)}
            />
            <select
              value={filters.fy}
              onChange={(e) => setFilter("fy", e.target.value)}
              className={`h-9 rounded-lg border px-3 text-base focus:outline-none ${filters.fy ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]" : "border-[#EDEDEA] bg-white text-[#1a1a1a] hover:bg-[#F3F2EF]"}`}
            >
              <option value="">All FYs</option>
              {availableFYs.map((fy) => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
            <select
              value={filters.closureBy}
              onChange={(e) => setFilter("closureBy", e.target.value)}
              className="h-9 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] focus:outline-none"
            >
              <option value="">All Closure Types</option>
              {closureByOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {(filters.search || filters.dateFrom || filters.dateTo || filters.closureBy || filters.fy) && (
              <button
                onClick={() => setFilters({ ...EMPTY_FILTERS })}
                className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-auto max-h-[90vh]">
          <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
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
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className={deletedRowClass(record, "border-b border-[#EDEDEA] text-base hover:bg-white")}
                  >
                    {COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className="px-3 py-2 text-[#1a1a1a]"
                      >
                        {renderCell(record, col)}
                      </TableCell>
                    ))}
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {isDeleted(record) ? (
                          <button
                            onClick={() => restoreRecordRow(record.id)}
                            title="Restore"
                            className="rounded-lg p-1.5 text-[#9a9a96] hover:bg-[#F3F2EF] hover:text-[#4A5FD4] transition-all"
                          >
                            <RotateCcw size={13} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEdit(record)}
                              title="Edit"
                              className="rounded-lg p-1.5 text-[#9a9a96] hover:bg-[#EEF2FF] hover:text-[#4A5FD4] transition-all"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteRecord(record.id)}
                              title="Delete"
                              className="rounded-lg p-1.5 text-[#9a9a96] hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS + 1}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      No {isIr ? "IR" : "NON-IR"} closure records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
      </div>

      {/* Edit dialog — ADG/DD_INT only */}
      {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={(o) => { if (!o) { setEditingRecord(null); setEditDraft({}); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Closure Record — {editingRecord.record_id}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {EDITABLE_CLOSURE_KEYS.filter((key) => {
                if (key === "date_of_ir" && !editingRecord.is_ir) return false;
                if (key === "date_of_non_ir" && editingRecord.is_ir) return false;
                return true;
              }).map((key) => {
                const activeColumns = editingRecord.is_ir ? IR_COLUMNS : NON_IR_COLUMNS;
                const colDef = activeColumns.find((c) => c.key === key) ?? [...IR_COLUMNS, ...NON_IR_COLUMNS].find((c) => c.key === key);
                const label = colDef?.label ?? String(key);
                const value = (editDraft as any)[key] ?? "";
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#6b6b6b]">{label}</label>
                    {colDef?.type === "usercombobox" ? (
                      <select
                        value={value}
                        onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
                        className="h-9 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] focus:outline-none"
                      >
                        <option value="">— Select —</option>
                        {workspaceUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    ) : colDef?.type === "datepicker" ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex h-9 w-full items-center gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF]">
                            <CalendarIcon size={13} className="text-[#9a9a96] shrink-0" />
                            {value && isValid(parseISO(value)) ? (
                              format(parseISO(value), "dd-MM-yyyy")
                            ) : (
                              <span className="text-[#9a9a96]">DD-MM-YYYY</span>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 border border-[#EDEDEA] shadow-none rounded-xl"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={value && isValid(parseISO(value)) ? parseISO(value) : undefined}
                            onSelect={(d) => setEditDraft((dr) => ({ ...dr, [key]: d ? format(d, "yyyy-MM-dd") : "" }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
                        className="h-9 border-[#EDEDEA] text-base rounded-lg"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingRecord(null); setEditDraft({}); }}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClosureRegisterComponent;
