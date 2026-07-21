"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "@/hooks/useDebounce";
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
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
import { exportRegisterToExcel, generateWorkspaceRecordId, REGISTER_PREFIXES, fetchCaseOptions, nullifyEmpty } from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser } from "./RegisterRecordDialog";
import { DGGI_GROUPS } from "@/lib/dggi-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeizureRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  case_file_no: string;
  entity_name: string;
  goods_description: string;
  date_of_seizure: string;
  seized_by: string;
  seizure_value: string;
  storage_location: string;
  mahazar_no: string;
  seizure_type: string;
  quantity: string;
  scn_issued: string;
  scn_issue_date: string;
  extended_by_commissioner: string;
  extension_order_date: string;
  goods_returned: string;
  return_date: string;
  remarks: string;
  sio: string;
  sio_name: string;
  group: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_NAME = "dggi_seizure_records";
const RECORD_PREFIX = REGISTER_PREFIXES.SEIZURE;

const EMPTY_RECORD: Omit<SeizureRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  case_file_no: "",
  entity_name: "",
  goods_description: "",
  date_of_seizure: "",
  seized_by: "",
  seizure_value: "",
  storage_location: "",
  mahazar_no: "",
  seizure_type: "",
  quantity: "",
  scn_issued: "",
  scn_issue_date: "",
  extended_by_commissioner: "",
  extension_order_date: "",
  goods_returned: "",
  return_date: "",
  remarks: "",
  sio: "",
  sio_name: "",
  group: "",
};

const COLUMNS: RegisterColumn[] = [
  { key: "record_id",               label: "ID",                        type: "text",        width: "140px",  readOnly: true },
  { key: "linked_case_id",          label: "Linked Case",               type: "caselink",    width: "180px" },
  { key: "case_file_no",            label: "Case File No.",             type: "text",        width: "150px" },
  { key: "entity_name",             label: "Entity Name",               type: "text",        width: "180px" },
  { key: "goods_description",       label: "Goods Description",         type: "text",        width: "220px" },
  { key: "date_of_seizure",         label: "Date of Seizure",           type: "datepicker",  width: "160px" },
  { key: "seized_by",               label: "Seized By",                 type: "usercombobox",width: "170px" },
  { key: "seizure_type",            label: "Seizure Type",              type: "select",      options: ["Goods", "Documents", "Cash", "Vehicles", "Digital", "Other"], width: "140px" },
  { key: "quantity",                label: "Quantity",                  type: "text",        width: "110px" },
  { key: "seizure_value",           label: "Value (Cr.)",               type: "text",        width: "120px" },
  { key: "storage_location",        label: "Storage Location",          type: "text",        width: "160px" },
  { key: "mahazar_no",              label: "Mahazar No.",               type: "text",        width: "140px" },
  { key: "scn_issued",              label: "SCN Issued?",               type: "select",      options: ["Yes", "No"], width: "120px" },
  { key: "scn_issue_date",          label: "SCN Issue Date",            type: "datepicker",  width: "150px" },
  { key: "extended_by_commissioner",label: "Extended by Commissioner?", type: "select",      options: ["Yes", "No"], width: "190px" },
  { key: "extension_order_date",    label: "Extension Order Date",      type: "datepicker",  width: "170px" },
  { key: "goods_returned",          label: "Goods Returned?",           type: "select",      options: ["Yes", "No"], width: "140px" },
  { key: "return_date",             label: "Return Date",               type: "datepicker",  width: "150px" },
  { key: "sio",                     label: "SIO",                       type: "usercombobox",width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "remarks",                 label: "Remarks",                   type: "text",        width: "220px" },
];

const TOTAL_COLS = COLUMNS.length + 1;

// ─── Alarm logic (Sec. 67(7) CGST) ───────────────────────────────────────────

type AlarmLevel = "overdue" | "critical" | "warning" | null;

function seizureAlarm(
  dateOfSeizure: string,
  scnIssued: string,
  extendedByCommissioner: string,
  scnIssueDate: string,
): { level: AlarmLevel; label: string; daysLeft: number | null } {
  if (!dateOfSeizure) return { level: null, label: "", daysLeft: null };
  const base = parseISO(dateOfSeizure);
  if (!isValid(base)) return { level: null, label: "", daysLeft: null };
  // Stop tracking when SCN is issued (either the flag is set or the date is entered)
  if (scnIssued === "Yes" || !!scnIssueDate) return { level: null, label: "", daysLeft: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceSeizure = differenceInCalendarDays(today, base);

  if (extendedByCommissioner === "Yes") {
    // 12-month extended deadline
    const daysLeft = 365 - daysSinceSeizure;
    if (daysLeft < 0) return { level: "overdue", label: "SCN Overdue (12m)", daysLeft };
    if (daysLeft <= 14) return { level: "critical", label: "SCN Due (12m)", daysLeft };
    if (daysLeft <= 30) return { level: "warning", label: "SCN Due Soon (12m)", daysLeft };
    // Also show warning if approaching 330-day threshold
    if (daysSinceSeizure >= 330) return { level: "warning", label: "SCN Due Soon (12m)", daysLeft };
    return { level: null, label: "", daysLeft: null };
  }

  // Primary 6-month deadline
  const daysLeft = 180 - daysSinceSeizure;
  if (daysLeft < 0) return { level: "overdue", label: "SCN Overdue", daysLeft };
  if (daysLeft <= 14) return { level: "critical", label: "SCN Due", daysLeft };
  if (daysLeft <= 30) return { level: "warning", label: "SCN Due Soon", daysLeft };
  if (daysSinceSeizure >= 150) return { level: "warning", label: "SCN Due Soon", daysLeft };
  return { level: null, label: "", daysLeft: null };
}

function AlarmBadge({ level, label, daysLeft }: { level: AlarmLevel; label: string; daysLeft: number | null }) {
  if (!level) return null;
  const cfg = {
    overdue:  { cls: "bg-red-100 text-red-700 border border-red-200",     icon: <AlertTriangle size={10} className="shrink-0" /> },
    critical: { cls: "bg-orange-100 text-orange-700 border border-orange-200", icon: <AlertTriangle size={10} className="shrink-0" /> },
    warning:  { cls: "bg-amber-100 text-amber-700 border border-amber-200",   icon: <Clock size={10} className="shrink-0" /> },
  }[level];
  const text = daysLeft !== null && daysLeft < 0
    ? `${Math.abs(daysLeft)}d overdue`
    : daysLeft !== null
      ? `${daysLeft}d left`
      : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.icon}
      {label}{text ? `: ${text}` : ""}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE_DEFAULT = 50;
const SEARCH_COLS = ["case_file_no", "entity_name", "goods_description", "mahazar_no"];

const SeizureRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [records, setRecords] = useState<SeizureRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<SeizureRecord>>({});

  const buildQuery = (wid: string) => {
    let q = supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid);
    if (debouncedSearch) {
      q = q.or(SEARCH_COLS.map((c) => `${c}.ilike.%${debouncedSearch}%`).join(","));
    }
    return q;
  };

  const fetchPage = async (wid: string) => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let q = buildQuery(wid);
      if (sortCol) q = q.order(sortCol, { ascending: sortDir === "asc" });
      const { data, error, count } = await q.range(from, to);
      if (error) { toast.error("Failed to load records: " + error.message); return; }
      setRecords(data ?? []);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const wid = await getWorkspaceId();
        if (!wid) { toast.error("Could not determine workspace. Please refresh."); return; }
        setWorkspaceId(wid);
        const [, cases] = await Promise.all([
          fetchPage(wid),
          fetchCaseOptions(supabase, wid),
        ]);
        setCaseOptions(cases);
      } catch (err) {
        toast.error("Failed to initialize: " + String(err));
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortCol, sortDir, pageSize]);

  useEffect(() => {
    if (!workspaceId) return;
    fetchPage(workspaceId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, page, pageSize, debouncedSearch, sortCol, sortDir]);

  const tableRecords = records;

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const updatePayload = nullifyEmpty({ ...dialogDraft }, COLUMNS);
    (updatePayload as any).sio_name = workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null;
    const { error } = await supabase.from(TABLE_NAME).update(updatePayload).eq("id", dialogDraft.id);
    if (error) { toast.error("Failed to save: " + error.message); }
    else { setRecords((prev) => prev.map((r) => r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r)); toast.success("Record saved"); setDialogOpen(false); }
    setSavingRow(false);
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) { toast.error("Delete failed: " + error.message); }
    else { await fetchPage(workspaceId); toast.success("Record deleted"); }
  };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const payload = nullifyEmpty({
      ...dialogDraft,
      record_id: await generateWorkspaceRecordId(supabase, TABLE_NAME, RECORD_PREFIX, workspaceId),
      workspace_id: workspaceId,
    }, COLUMNS);
    (payload as any).sio_name = workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null;
    const { error } = await supabase.from(TABLE_NAME).insert(payload).select().single();
    if (error) { toast.error("Failed to add: " + error.message); }
    else { await fetchPage(workspaceId); setDialogOpen(false); toast.success("Record added"); }
    setSavingRow(false);
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleExport = async () => {
    if (!workspaceId) return;
    let q = buildQuery(workspaceId);
    if (sortCol) q = q.order(sortCol, { ascending: sortDir === "asc" });
    const { data, error } = await q;
    if (error) { toast.error("Export failed: " + error.message); return; }
    exportRegisterToExcel(data ?? [], COLUMNS, "Seizure_Register", (msg) => toast.success(msg));
  };

  const renderCell = (value: string, type: RegisterColumn["type"], storedName?: string) => {
    if (type === "caselink") return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (type === "datepicker") return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (type === "usercombobox") return <span>{workspaceUsers.find((u) => u.id === value)?.name || storedName || "—"}</span>;
    return <span>{value || "—"}</span>;
  };

  if (loading || usersLoading) return (
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
              <h1 className="text-xl font-medium text-[#1a1a1a]">Seizure Register</h1>
              <p className="text-base text-[#9a9a96]">{tableRecords.length} record{tableRecords.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4"
                onClick={handleExport}
                disabled={tableRecords.length === 0}
              >
                <Download size={15} className="mr-1" />Export to Excel
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4"
                onClick={() => { setDialogMode("add"); setDialogDraft({ ...EMPTY_RECORD }); setDialogOpen(true); }}
              >
                <Plus size={15} className="mr-1" />Add Record
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <SlidersHorizontal size={14} /><span className="font-medium">Search</span>
            </div>
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search file no., entity, goods, mahazar…"
                className="h-9 pl-8 pr-3 min-w-[260px] border-[#EDEDEA] text-base rounded-lg"
              />
            </div>
            {search && (
              <button onClick={() => setSearch("")} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]">
                <X size={13} />Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
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
                        {sortCol === col.key && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRecords.map((record) => {
                  const alarm = seizureAlarm(record.date_of_seizure, record.scn_issued, record.extended_by_commissioner, record.scn_issue_date);
                  return (
                    <TableRow
                      key={record.id}
                      data-record-id={record.record_id}
                      className="border-b border-[#EDEDEA] text-base hover:bg-white"
                    >
                      {COLUMNS.map((col) => (
                        <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
                          {/* Show alarm badge under date_of_seizure */}
                          {col.key === "date_of_seizure" && alarm.level ? (
                            <div className="flex flex-col gap-0.5">
                              {renderCell((record as any)[col.key] ?? "", col.type)}
                              <AlarmBadge level={alarm.level} label={alarm.label} daysLeft={alarm.daysLeft} />
                            </div>
                          ) : (
                            renderCell((record as any)[col.key] ?? "", col.type, col.key === "sio" ? (record as any).sio_name : undefined)
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]" onClick={() => { setDialogMode("edit"); setDialogDraft({ ...record }); setDialogOpen(true); }}><Pencil size={13} /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]" onClick={() => deleteRecord(record.id)}><Trash2 size={13} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={TOTAL_COLS} className="py-12 text-center text-base text-[#9a9a96]">
                      No seizure records found.
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
        columns={COLUMNS}
        draft={dialogDraft as Record<string, string>}
        onDraftChange={(k, v) => setDialogDraft((prev) => ({ ...prev, [k]: v }))}
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        users={sioUsers}
        caseOptions={caseOptions}
      />
    </div>
  );
};

export default SeizureRegisterComponent;
