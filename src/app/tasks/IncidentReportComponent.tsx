"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DGGI_GROUPS } from "@/lib/dggi-constants";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Columns2,
  Download,
  Layers,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { REGISTER_PREFIXES, generateWorkspaceRecordId, exportRegisterToExcel, fetchCaseOptions } from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser } from "./RegisterRecordDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECORD_PREFIX = REGISTER_PREFIXES.INCIDENT_REPORT;
const LS_HIDDEN_COLS_KEY = "ir_hidden_columns";

type GroupByField = "group" | "sio";
const GROUP_BY_OPTIONS: { value: GroupByField; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "sio", label: "SIO" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncidentReportRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  int_no: string;
  incident_date: string;
  file_number: string;
  company_name: string;
  detection_amount: string;
  recovery_itc: string;
  recovery_cash: string;
  description: string;
  group: string;
  bo_id_no: string;
  sio: string;
  digit_id: string;
  gstin: string;
}

type SortDir = "asc" | "desc";

// ─── Empty record ─────────────────────────────────────────────────────────────

const EMPTY_RECORD: Omit<IncidentReportRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  int_no: "",
  incident_date: "",
  file_number: "",
  company_name: "",
  detection_amount: "",
  recovery_itc: "",
  recovery_cash: "",
  description: "",
  group: "",
  bo_id_no: "",
  sio: "",
  digit_id: "",
  gstin: "",
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: RegisterColumn[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "int_no", label: "Int. No.", type: "text", width: "140px" },
  { key: "incident_date", label: "Date", type: "datepicker", width: "130px" },
  { key: "file_number", label: "File Number", type: "text", width: "140px" },
  { key: "company_name", label: "Trade Name", type: "text", width: "180px" },
  { key: "detection_amount", label: "Detection (₹)", type: "number", width: "150px" },
  { key: "recovery_itc", label: "Recovery ITC (₹)", type: "number", width: "160px" },
  { key: "recovery_cash", label: "Recovery Cash (₹)", type: "number", width: "160px" },
  { key: "description", label: "Description", type: "text", width: "220px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "bo_id_no", label: "BO ID No.", type: "text", width: "130px" },
  { key: "digit_id", label: "DIGIT ID", type: "text", width: "140px" },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
];

// ─── Main component ───────────────────────────────────────────────────────────

const IncidentReportComponent = () => {
  const supabase = clientConnectionWithSupabase();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [records, setRecords] = useState<IncidentReportRecord[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [savingRow, setSavingRow] = useState(false);

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByField | "none">("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(LS_HIDDEN_COLS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [colPickerOpen, setColPickerOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<IncidentReportRecord>>({});

  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

  const visibleColumns = COLUMNS.filter((c) => !hiddenColumns.has(c.key));
  const totalCols = visibleColumns.length + 1;

  const toggleColumn = (key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(LS_HIDDEN_COLS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);

      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id ?? "";
      setCurrentUserId(uid);

      const [userRow, groupRows] = await Promise.all([
        supabase.from("votum_users").select("dggi_role").eq("id", uid).single(),
        supabase.from("dggi_user_group_assignments").select("group_name").eq("user_id", uid),
      ]);
      const role = userRow.data?.dggi_role ?? "";
      const groups = (groupRows.data ?? []).map((g: { group_name: string }) => g.group_name);
      setUserRole(role);
      setUserGroups(groups);

      const [, usersRes, cases] = await Promise.all([
        fetchRecords(wid, role, groups, uid),
        getAllUsers(),
        fetchCaseOptions(supabase, wid),
      ]);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
      setCaseOptions(cases);
      setLoading(false);
    };
    init();
  }, []);

  const fetchRecords = async (
    wid: string,
    role?: string,
    groups?: string[],
    uid?: string,
  ) => {
    let query = supabase
      .from("dggi_incident_report_records")
      .select("*")
      .eq("workspace_id", wid);

    if (role && role !== "ADG" && role !== "DD_INT") {
      if (role === "IO" || role === "SIO") {
        query = query.eq("sio", uid ?? "__none__");
      } else if (groups && groups.length > 0) {
        query = query.in("group", groups);
      } else {
        query = query.eq("group", "__none__");
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("fetchRecords error:", error);
      return;
    }
    setRecords(data ?? []);
  };

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const tableRecords = records
    .filter((r) => {
      if (groupFilter && r.group !== groupFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return [r.company_name, r.file_number, r.bo_id_no, r.group, r.int_no, r.gstin].some(
        (v) => v?.toLowerCase().includes(q),
      );
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── Grouped buckets ────────────────────────────────────────────────────────

  const groupedBuckets: { key: string; label: string; rows: IncidentReportRecord[] }[] =
    groupBy === "none"
      ? []
      : (() => {
          const map = new Map<string, IncidentReportRecord[]>();
          for (const r of tableRecords) {
            const raw = String((r as any)[groupBy] ?? "");
            if (!map.has(raw)) map.set(raw, []);
            map.get(raw)!.push(r);
          }
          return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, rows]) => ({
              key,
              label:
                groupBy === "sio"
                  ? workspaceUsers.find((u) => u.id === key)?.name || key || "—"
                  : key || "—",
              rows,
            }));
        })();

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const { error } = await supabase
      .from("dggi_incident_report_records")
      .update({ ...dialogDraft })
      .eq("id", dialogDraft.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r)),
      );
      toast.success("Record saved");
      const savedInt = ((dialogDraft.int_no as string) ?? "").trim();
      if (savedInt) {
        await supabase
          .from("dggi_intel_rapid_records")
          .update({ ir_date: new Date().toISOString().split("T")[0] })
          .eq("rapid_id", savedInt)
          .eq("workspace_id", workspaceId)
          .is("ir_date", null);
      }
      setDialogOpen(false);
    }
    setSavingRow(false);
  };

  const deleteRecord = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    let toastId: ReturnType<typeof toast.info>;
    const timerId = setTimeout(async () => {
      const { error } = await supabase
        .from("dggi_incident_report_records")
        .delete()
        .eq("id", id);
      if (error) {
        setRecords((prev) => [...prev, record]);
        toast.error("Delete failed: " + error.message);
      }
    }, 5000);
    toastId = toast.info(
      <div className="flex items-center justify-between gap-3 w-full">
        <span>{record.record_id} deleted</span>
        <button
          onClick={() => {
            clearTimeout(timerId);
            setRecords((prev) => [...prev, record]);
            toast.dismiss(toastId);
          }}
          className="font-medium underline underline-offset-2 shrink-0"
        >
          Undo
        </button>
      </div>,
      { autoClose: 5000, closeOnClick: false, pauseOnHover: true },
    );
  };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const { data, error } = await supabase
      .from("dggi_incident_report_records")
      .insert({
        ...dialogDraft,
        record_id: await generateWorkspaceRecordId(
          supabase,
          "dggi_incident_report_records",
          RECORD_PREFIX,
          workspaceId,
        ),
        workspace_id: workspaceId,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add record: " + error.message);
    } else {
      setRecords((prev) => [...prev, data]);
      toast.success("Record added");
      const savedInt = ((dialogDraft.int_no as string) ?? "").trim();
      if (savedInt) {
        await supabase
          .from("dggi_intel_rapid_records")
          .update({ ir_date: new Date().toISOString().split("T")[0] })
          .eq("rapid_id", savedInt)
          .eq("workspace_id", workspaceId)
          .is("ir_date", null);
      }
      setDialogOpen(false);
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

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, visibleColumns, "Incident_Report", (msg) =>
      toast.success(msg),
    );
  };

  const activeFilterCount = (search ? 1 : 0) + (groupFilter ? 1 : 0);

  // ── Row renderer ───────────────────────────────────────────────────────────

  const renderCell = (value: string, col: RegisterColumn) => {
    if (col.type === "caselink")
      return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (col.type === "usercombobox")
      return <span>{workspaceUsers.find((u) => u.id === value)?.name || value || "—"}</span>;
    return <span>{value || "—"}</span>;
  };

  const renderRow = (record: IncidentReportRecord) => (
    <TableRow key={record.id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
      {visibleColumns.map((col) => (
        <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
          {renderCell((record as any)[col.key] ?? "", col)}
        </TableCell>
      ))}
      <TableCell className="px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]"
            onClick={() => {
              setDialogMode("edit");
              setDialogDraft({ ...record });
              setDialogOpen(true);
            }}
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
  );

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
              <h1 className="text-xl font-medium text-[#1a1a1a]">Incident Report Register</h1>
              <p className="text-base text-[#9a9a96]">
                {tableRecords.length} record{tableRecords.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
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

              {/* ── Column picker ─────────────────────────────────────────── */}
              <Popover open={colPickerOpen} onOpenChange={setColPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-9 rounded-lg text-base shadow-none px-4 ${
                      hiddenColumns.size > 0
                        ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
                        : "border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"
                    }`}
                  >
                    <Columns2 size={15} className="mr-1" />
                    Columns
                    {hiddenColumns.size > 0 && (
                      <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#4A5FD4] text-xs text-white font-medium">
                        {hiddenColumns.size}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[220px] p-2 border border-[#EDEDEA] shadow-none rounded-xl max-h-[400px] overflow-y-auto"
                >
                  <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <span className="text-sm font-medium text-[#1a1a1a]">Toggle columns</span>
                    {hiddenColumns.size > 0 && (
                      <button
                        onClick={() => {
                          setHiddenColumns(new Set());
                          try {
                            localStorage.removeItem(LS_HIDDEN_COLS_KEY);
                          } catch {}
                        }}
                        className="text-xs text-[#4A5FD4] hover:underline"
                      >
                        Show all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {COLUMNS.map((col) => {
                      const visible = !hiddenColumns.has(col.key);
                      return (
                        <button
                          key={col.key}
                          onClick={() => toggleColumn(col.key)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base text-left transition-all ${
                            visible ? "text-[#1a1a1a] hover:bg-[#F3F2EF]" : "text-[#9a9a96] hover:bg-[#F3F2EF]"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              visible ? "border-[#4A5FD4] bg-[#4A5FD4]" : "border-[#EDEDEA]"
                            }`}
                          >
                            {visible && <Check size={10} className="text-white" />}
                          </span>
                          <span className="truncate">{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

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

        {/* ── Filter + Group-by bar ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3 space-y-3">
          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <SlidersHorizontal size={14} />
              <span className="font-medium">Filters</span>
            </div>

            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, file no., BO ID, GSTIN…"
                className="h-9 pl-8 pr-3 min-w-[300px] border-[#EDEDEA] text-base rounded-lg"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-[#9a9a96] hover:text-[#1a1a1a]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <Select
              value={groupFilter ?? "all"}
              onValueChange={(v) => setGroupFilter(v === "all" ? null : v)}
            >
              <SelectTrigger
                className={`h-9 w-[130px] rounded-lg text-base border ${
                  groupFilter
                    ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
                    : "border-[#EDEDEA] text-[#1a1a1a]"
                }`}
              >
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {DGGI_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setGroupFilter(null);
                }}
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

          <div className="border-t border-[#EDEDEA]" />

          {/* Group-by row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <Layers size={14} />
              <span className="font-medium">Group by</span>
            </div>

            <Select
              value={groupBy}
              onValueChange={(v) => {
                setGroupBy(v as GroupByField | "none");
                setCollapsedGroups(new Set());
              }}
            >
              <SelectTrigger
                className={`h-9 w-[160px] rounded-lg text-base border ${
                  groupBy !== "none"
                    ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
                    : "border-[#EDEDEA] text-[#1a1a1a]"
                }`}
              >
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {GROUP_BY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {groupBy !== "none" && groupedBuckets.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => setCollapsedGroups(new Set())}
                  className="text-base text-[#6b6b6b] hover:text-[#4A5FD4] transition-all px-2 py-1 rounded-lg hover:bg-[#EEF2FF]"
                >
                  Expand all
                </button>
                <span className="text-[#EDEDEA]">·</span>
                <button
                  onClick={() => setCollapsedGroups(new Set(groupedBuckets.map((b) => b.key)))}
                  className="text-base text-[#6b6b6b] hover:text-[#4A5FD4] transition-all px-2 py-1 rounded-lg hover:bg-[#EEF2FF]"
                >
                  Collapse all
                </button>
                <span className="ml-2 text-base text-[#9a9a96]">
                  {groupedBuckets.length} group{groupedBuckets.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Records table ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-b border-[#EDEDEA]">
                  {visibleColumns.map((col) => (
                    <TableHead
                      key={col.key}
                      style={{ minWidth: col.width }}
                      className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]"
                      onClick={() => toggleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {sortCol === col.key &&
                          (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {groupBy === "none" ? (
                  <>
                    {tableRecords.map(renderRow)}
                    {tableRecords.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={totalCols}
                          className="py-12 text-center text-base text-[#9a9a96]"
                        >
                          No records match the current filters.{" "}
                          {activeFilterCount > 0 && (
                            <button
                              className="text-[#4A5FD4] underline"
                              onClick={() => {
                                setSearch("");
                                setGroupFilter(null);
                              }}
                            >
                              Clear filters
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ) : (
                  <>
                    {groupedBuckets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={totalCols}
                          className="py-12 text-center text-base text-[#9a9a96]"
                        >
                          No records match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedBuckets.map(({ key, label, rows }) => {
                        const collapsed = collapsedGroups.has(key);
                        return (
                          <>
                            <TableRow
                              key={`hdr-${key}`}
                              className="bg-white border-b border-[#EDEDEA] cursor-pointer select-none hover:bg-[#F0EEFA]"
                              onClick={() => toggleGroupCollapse(key)}
                            >
                              <TableCell colSpan={totalCols} className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {collapsed ? (
                                    <ChevronRight size={14} className="text-[#6b6b6b] shrink-0" />
                                  ) : (
                                    <ChevronDown size={14} className="text-[#6b6b6b] shrink-0" />
                                  )}
                                  <span className="text-base font-semibold text-[#1a1a1a]">
                                    {label}
                                  </span>
                                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#4A5FD4] px-1.5 text-xs text-white font-medium">
                                    {rows.length}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                            {!collapsed && rows.map(renderRow)}
                          </>
                        );
                      })
                    )}
                  </>
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
        columns={COLUMNS}
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

export default IncidentReportComponent;
