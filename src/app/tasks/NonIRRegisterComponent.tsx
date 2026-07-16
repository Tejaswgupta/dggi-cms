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
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
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
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { exportRegisterToExcel } from "./register-utils";
import type { RegisterColumn, WorkspaceUser } from "./RegisterRecordDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_HIDDEN_COLS_KEY = "nir_hidden_columns";

type GroupByField = "group" | "handling_io_sio";
const GROUP_BY_OPTIONS: { value: GroupByField; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "handling_io_sio", label: "SIO" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface NonIRRegisterRecord {
  id: string;
  record_id: string;
  intel_source: string;
  date_of_receipt: string;
  file_no: string;
  taxpayer_name: string;
  detection_amount: string;
  recovery_itc: string;
  recovery_cash: string;
  issue_involved: string;
  latest_status: string;
  mode_of_initiation: string;
  group: string;
  bo_id: string;
  handling_io_sio: string;
  digit_id: string;
  gstins: string;
  is_ir: boolean;
}

type SortDir = "asc" | "desc";

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: RegisterColumn[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "intel_source", label: "Intel Source", type: "text", width: "140px" },
  { key: "date_of_receipt", label: "Date", type: "datepicker", width: "130px" },
  { key: "file_no", label: "File No.", type: "text", width: "140px" },
  { key: "taxpayer_name", label: "Trade Name", type: "text", width: "180px" },
  { key: "detection_amount", label: "Detection (₹)", type: "number", width: "150px" },
  { key: "recovery_itc", label: "Recovery ITC (₹)", type: "number", width: "160px" },
  { key: "recovery_cash", label: "Recovery Cash (₹)", type: "number", width: "160px" },
  { key: "issue_involved", label: "Issue Involved", type: "text", width: "220px" },
  { key: "latest_status", label: "Status", type: "text", width: "180px" },
  { key: "mode_of_initiation", label: "Mode", type: "text", width: "140px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "bo_id", label: "BO ID", type: "text", width: "130px" },
  { key: "digit_id", label: "DIGIT ID", type: "text", width: "140px" },
  { key: "gstins", label: "GSTIN(s)", type: "text", width: "160px" },
  { key: "handling_io_sio", label: "SIO", type: "usercombobox", width: "160px" },
];

// ─── Main component ───────────────────────────────────────────────────────────

const NonIRRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [records, setRecords] = useState<NonIRRegisterRecord[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

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

  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();

  const visibleColumns = COLUMNS.filter((c) => !hiddenColumns.has(c.key));
  const totalCols = visibleColumns.length;

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

      await fetchRecords(wid, role, groups, uid);
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
      .from("dggi_records")
      .select("*")
      .eq("workspace_id", wid)
      .eq("is_ir", false);

    if (role && role !== "ADG" && role !== "DD_INT") {
      if (role === "IO" || role === "SIO") {
        query = query.eq("handling_io_sio", uid ?? "__none__");
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
      return [r.taxpayer_name, r.file_no, r.bo_id, r.group, r.intel_source, r.gstins].some(
        (v) => v?.toLowerCase().includes(q),
      );
    })
    .sort((a, b) => {
      if (!sortCol) {
        const numOf = (id: string) => parseInt(id.split("-")[1] ?? "0", 10) || 0;
        return numOf(a.record_id) - numOf(b.record_id);
      }
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── Grouped buckets ────────────────────────────────────────────────────────

  const groupedBuckets: { key: string; label: string; rows: NonIRRegisterRecord[] }[] =
    groupBy === "none"
      ? []
      : (() => {
          const map = new Map<string, NonIRRegisterRecord[]>();
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
                groupBy === "handling_io_sio"
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

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, visibleColumns, "Non_IR_Register", (msg) =>
      toast.success(msg),
    );
  };

  const activeFilterCount = (search ? 1 : 0) + (groupFilter ? 1 : 0);

  // ── Row renderer ───────────────────────────────────────────────────────────

  const renderCell = (value: string, col: RegisterColumn) => {
    if (col.type === "usercombobox")
      return <span>{workspaceUsers.find((u) => u.id === value)?.name || value || "—"}</span>;
    return <span>{value || "—"}</span>;
  };

  const renderRow = (record: NonIRRegisterRecord) => (
    <TableRow key={record.id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
      {visibleColumns.map((col) => (
        <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
          {renderCell((record as any)[col.key] ?? "", col)}
        </TableCell>
      ))}
    </TableRow>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading || usersLoading) {
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
              <h1 className="text-xl font-medium text-[#1a1a1a]">NON-IR Register</h1>
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
                placeholder="Search trade name, file no., BO ID, GSTIN…"
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
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-auto max-h-[90vh]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
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
  );
};

export default NonIRRegisterComponent;
