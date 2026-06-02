"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Download, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { REGISTER_PREFIXES, generateWorkspaceRecordId, exportRegisterToExcel, fetchCaseOptions } from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { getAllUsers } from "@/hooks/useWorkspaceUsers";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser } from "./RegisterRecordDialog";
import { DGGI_GROUPS } from "@/lib/dggi-constants";

const TABLE_NAME = "dggi_dfl_records";
const RECORD_PREFIX = REGISTER_PREFIXES.DFL;

interface DFLRecord {
  id: string; record_id: string; linked_case_id: string; dfl_request_no: string; date_of_request: string;
  case_file_no: string; entity_name: string; nature_of_request: string; devices_submitted: string;
  lab_received_date: string; report_received_date: string; findings_summary: string;
  action_taken: string; remarks: string;
  sio: string; group: string;
}

const COLUMNS: { key: keyof Omit<DFLRecord, "id">; label: string; type: "text" | "datepicker" | "caselink" | "usercombobox" | "select"; width?: string; options?: string[]; readOnly?: boolean }[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "dfl_request_no", label: "DFL Request No.", type: "text", width: "160px" },
  { key: "date_of_request", label: "Date of Request", type: "datepicker", width: "150px" },
  { key: "case_file_no", label: "Case File No.", type: "text", width: "150px" },
  { key: "entity_name", label: "Entity Name", type: "text", width: "180px" },
  { key: "nature_of_request", label: "Nature of Request", type: "text", width: "180px" },
  { key: "devices_submitted", label: "Devices Submitted", type: "text", width: "180px" },
  { key: "lab_received_date", label: "Lab Received Date", type: "datepicker", width: "160px" },
  { key: "report_received_date", label: "Report Received Date", type: "datepicker", width: "170px" },
  { key: "findings_summary", label: "Findings Summary", type: "text", width: "240px" },
  { key: "action_taken", label: "Action Taken", type: "text", width: "200px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "remarks", label: "Remarks", type: "text", width: "220px" },
];

const TOTAL_COLS = COLUMNS.length + 1;
const EMPTY_RECORD: Omit<DFLRecord, "id"> = { record_id: "", linked_case_id: "", dfl_request_no: "", date_of_request: "", case_file_no: "", entity_name: "", nature_of_request: "", devices_submitted: "", lab_received_date: "", report_received_date: "", findings_summary: "", action_taken: "", sio: "", group: "", remarks: "" };

const fmt = (iso: string) => { if (!iso) return "—"; const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }); };

// ─── DFL Alarm logic (60-day deadline from date_of_request) ──────────────────

type DFLAlarmLevel = "overdue" | "critical" | "warning" | null;

function dflAlarm(
  dateOfRequest: string,
  reportReceivedDate: string,
): { level: DFLAlarmLevel; daysLeft: number | null } {
  if (!dateOfRequest) return { level: null, daysLeft: null };
  if (reportReceivedDate) return { level: null, daysLeft: null }; // report received — stop tracking
  const base = parseISO(dateOfRequest);
  if (!isValid(base)) return { level: null, daysLeft: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysElapsed = differenceInCalendarDays(today, base);
  const daysLeft = 60 - daysElapsed;
  if (daysLeft < 0) return { level: "overdue", daysLeft };
  if (daysLeft <= 10) return { level: "critical", daysLeft };
  if (daysLeft <= 20) return { level: "warning", daysLeft };
  return { level: null, daysLeft: null };
}

function DFLAlarmBadge({ level, daysLeft }: { level: DFLAlarmLevel; daysLeft: number | null }) {
  if (!level) return null;
  const cfg = {
    overdue:  { cls: "bg-red-100 text-red-700 border border-red-200",         icon: <AlertTriangle size={10} className="shrink-0" /> },
    critical: { cls: "bg-orange-100 text-orange-700 border border-orange-200", icon: <AlertTriangle size={10} className="shrink-0" /> },
    warning:  { cls: "bg-amber-100 text-amber-700 border border-amber-200",    icon: <Clock size={10} className="shrink-0" /> },
  }[level];
  const text = daysLeft !== null && daysLeft < 0
    ? `${Math.abs(daysLeft)}d overdue`
    : daysLeft !== null ? `${daysLeft}d left` : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.icon}
      DFL Deadline{text ? `: ${text}` : ""}
    </span>
  );
}

const DFLRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [records, setRecords] = useState<DFLRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<DFLRecord>>({});

  useEffect(() => { const init = async () => { const wid = await getWorkspaceId(); setWorkspaceId(wid); const [{ data }, cases, usersRes] = await Promise.all([supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid), fetchCaseOptions(supabase, wid), getAllUsers()]); setRecords(data ?? []); setCaseOptions(cases); if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []); setLoading(false); }; init(); }, []);

  const tableRecords = records.filter((r) => { if (!search) return true; const q = search.toLowerCase(); return [r.dfl_request_no, r.case_file_no, r.entity_name].some((v) => v?.toLowerCase().includes(q)); }).sort((a, b) => { if (!sortCol) return 0; const cmp = String((a as any)[sortCol] ?? "").localeCompare(String((b as any)[sortCol] ?? "")); return sortDir === "asc" ? cmp : -cmp; });

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const { error } = await supabase.from(TABLE_NAME).update({ ...dialogDraft }).eq("id", dialogDraft.id);
    if (error) { toast.error("Failed to save: " + error.message); }
    else { setRecords((prev) => prev.map((r) => r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r)); toast.success("Record saved"); setDialogOpen(false); }
    setSavingRow(false);
  };

  const deleteRecord = async (id: string) => { const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id); if (error) { toast.error("Delete failed: " + error.message); } else { setRecords((prev) => prev.filter((r) => r.id !== id)); toast.success("Record deleted"); } };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const payload = { ...dialogDraft, record_id: await generateWorkspaceRecordId(supabase, TABLE_NAME, RECORD_PREFIX, workspaceId), workspace_id: workspaceId };
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();
    if (error) { toast.error("Failed to add: " + error.message); }
    else { setRecords((prev) => [...prev, data]); setDialogOpen(false); toast.success("Record added"); }
    setSavingRow(false);
  };

  const toggleSort = (col: string) => { if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } };

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "DFL", (msg) => toast.success(msg));
  };

  const renderCell = (value: string, type: "text" | "datepicker" | "caselink" | "usercombobox" | "select") => {
    if (type === "usercombobox") return <span>{workspaceUsers.find((u) => u.id === value)?.name || value || "—"}</span>;
    if (type === "caselink") return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (type === "datepicker") return <span className="whitespace-nowrap">{fmt(value)}</span>;
    return <span>{value || "—"}</span>;
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" /></div>;

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-xl font-medium text-[#1a1a1a]">DFL Register</h1><p className="text-base text-[#9a9a96]">Digital Forensic Lab · {tableRecords.length} record{tableRecords.length !== 1 ? "s" : ""}</p></div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleExport} disabled={tableRecords.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
              <Button size="sm" className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4" onClick={() => { setDialogMode("add"); setDialogDraft({ ...EMPTY_RECORD }); setDialogOpen(true); }}><Plus size={15} className="mr-1" />Add Record</Button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0"><SlidersHorizontal size={14} /><span className="font-medium">Search</span></div>
            <div className="relative flex items-center"><Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search request no., file no., entity…" className="h-9 pl-8 pr-3 min-w-[240px] border-[#EDEDEA] text-base rounded-lg" /></div>
            {search && <button onClick={() => setSearch("")} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"><X size={13} />Clear</button>}
          </div>
        </div>
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-white border-b border-[#EDEDEA]">
                {COLUMNS.map((col) => <TableHead key={col.key} style={{ minWidth: col.width }} className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]" onClick={() => toggleSort(col.key)}><span className="flex items-center gap-1">{col.label}{sortCol === col.key && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</span></TableHead>)}
                <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {tableRecords.map((record) => (
                  <TableRow key={record.id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
                    {COLUMNS.map((col) => (
                      <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
                        {col.key === "date_of_request" ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="whitespace-nowrap">{fmt(record.date_of_request)}</span>
                            {(() => { const { level, daysLeft } = dflAlarm(record.date_of_request, record.report_received_date); return <DFLAlarmBadge level={level} daysLeft={daysLeft} />; })()}
                          </div>
                        ) : renderCell((record as any)[col.key] ?? "", col.type)}
                      </TableCell>
                    ))}
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]" onClick={() => { setDialogMode("edit"); setDialogDraft({ ...record }); setDialogOpen(true); }}><Pencil size={13} /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]" onClick={() => deleteRecord(record.id)}><Trash2 size={13} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tableRecords.length === 0 && <TableRow><TableCell colSpan={TOTAL_COLS} className="py-12 text-center text-base text-[#9a9a96]">No DFL records found.</TableCell></TableRow>}
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
        caseOptions={caseOptions}
        users={workspaceUsers}
      />
    </div>
  );
};

export default DFLRegisterComponent;
