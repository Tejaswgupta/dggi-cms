"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  REGISTER_PREFIXES,
  generateWorkspaceRecordId,
  exportRegisterToExcel,
  fetchCaseOptionsByIds,
  mergeCaseOptions,
  deletedRowClass,
  isDeleted,
  restoreRecord,
  softDeleteRecord,
  nullifyEmpty,
} from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
import { RegisterRecordDialog, type RegisterColumn } from "./RegisterRecordDialog";
import { DGGI_GROUPS } from "@/lib/dggi-constants";
import { parseAdgComments } from "./AdgCommentThread";

const RECORD_PREFIX = REGISTER_PREFIXES.SEIZURE;
const TABLE_NAME = "dggi_seizure_records";

interface SeizureRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  entity_name: string;
  seizure_details: string;
  date_of_seizure: string;
  scn_issued: string;
  date_of_scn_issuance: string;
  latest_status: string;
  pr_adg_comments?: string;
  sio: string;
  sio_name: string;
  group: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

const COLUMNS: RegisterColumn[] = [
  { key: "record_id", label: "Sr. No", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Link Case", type: "caselink", width: "180px" },
  { key: "entity_name", label: "Taxpayer Name", type: "text", width: "200px" },
  { key: "seizure_details", label: "Seizure Details (Quantity, Amt etc)", type: "text", width: "280px" },
  { key: "date_of_seizure", label: "Seizure Date", type: "datepicker", width: "140px" },
  { key: "scn_issued", label: "Whether SCN Issued", type: "select", options: ["Yes", "No"], width: "150px" },
  { key: "date_of_scn_issuance", label: "Date of SCN", type: "datepicker", width: "140px", showWhen: { field: "scn_issued", values: ["Yes"] } },
  { key: "latest_status", label: "Latest Status", type: "text", width: "220px" },
  { key: "pr_adg_comments", label: "Pr.ADG Comments", type: "adgcomments", width: "200px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
];

const TOTAL_COLS = COLUMNS.length + 1;

const EMPTY_RECORD: Omit<SeizureRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  entity_name: "",
  seizure_details: "",
  date_of_seizure: "",
  scn_issued: "No",
  date_of_scn_issuance: "",
  latest_status: "",
  pr_adg_comments: "",
  sio: "",
  sio_name: "",
  group: "",
};

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const SeizureRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [records, setRecords] = useState<SeizureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<SeizureRecord>>({});

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      setCurrentUid(uid ?? null);
      const [{ data: userRow }, { data: groupRows }] = await Promise.all([
        supabase.from("votum_users").select("dggi_role").eq("id", uid!).single(),
        supabase.from("dggi_user_group_assignments").select("group_name").eq("user_id", uid!),
      ]);
      const role = userRow?.dggi_role ?? "";
      setUserRole(role);
      const groups = (groupRows ?? []).map((g: { group_name: string }) => g.group_name);

      let query = supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid);
      if (role !== "ADG" && role !== "DD_INT" && role !== "DD_REPORTS") {
        if (role === "IO" || role === "SIO") {
          query = query.eq("sio", uid!);
        } else if (groups.length > 0) {
          query = query.in("group", groups);
        } else {
          query = query.eq("group", "__none__");
        }
      }
      const { data, error } = await query;
      if (!error) setRecords(data ?? []);
      const linkedCases = await fetchCaseOptionsByIds(
        supabase,
        wid,
        (data ?? []).map((r) => r.linked_case_id),
      );
      setCaseOptions(linkedCases);
      setLoading(false);
    };
    init();
  }, []);

  const tableRecords = records
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [r.record_id, r.entity_name, r.seizure_details, r.latest_status].some((v) => v?.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const cmp = String((a as any)[sortCol] ?? "").localeCompare(String((b as any)[sortCol] ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const updatePayload: any = nullifyEmpty({ ...dialogDraft, sio_name: workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null }, COLUMNS);
    if (userRole !== "ADG") delete updatePayload.pr_adg_comments;
    else if (updatePayload.pr_adg_comments !== undefined) {
      updatePayload.pr_adg_comments = parseAdgComments(updatePayload.pr_adg_comments);
    }
    const { error } = await supabase.from(TABLE_NAME).update(updatePayload).eq("id", dialogDraft.id);
    if (error) { toast.error("Failed to save: " + error.message); }
    else { setRecords((prev) => prev.map((r) => r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r)); toast.success("Record saved"); setDialogOpen(false); }
    setSavingRow(false);
  };

  const restoreRecordRow = async (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deleted_at: null, deleted_by: null } : r)),
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
      prev.map((r) =>
        r.id === id ? { ...r, deleted_at: stamp, deleted_by: currentUid } : r,
      ),
    );
    const { error } = await softDeleteRecord(supabase, TABLE_NAME, id, currentUid);
    if (error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, deleted_at: null, deleted_by: null } : r)),
      );
      toast.error("Delete failed: " + error.message);
      return;
    }
    toast.info(
      ({ closeToast }) => (
        <div className="flex items-center justify-between gap-3 w-full">
          <span>{record.record_id} deleted</span>
          <button
            onClick={() => {
              restoreRecordRow(id);
              closeToast();
            }}
            className="font-medium underline underline-offset-2 shrink-0"
          >
            Undo
          </button>
        </div>
      ),
      { autoClose: 5000, closeOnClick: false, pauseOnHover: true },
    );
  };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const payload: any = nullifyEmpty({
      ...dialogDraft,
      record_id: await generateWorkspaceRecordId(supabase, TABLE_NAME, RECORD_PREFIX, workspaceId),
      workspace_id: workspaceId,
      sio_name: workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null,
    }, COLUMNS);
    if (userRole !== "ADG") delete payload.pr_adg_comments;
    else if (payload.pr_adg_comments) {
      payload.pr_adg_comments = parseAdgComments(payload.pr_adg_comments);
    }
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();
    if (error) { toast.error("Failed to add: " + error.message); }
    else { setRecords((prev) => [...prev, data]); setDialogOpen(false); toast.success("Record added"); }
    setSavingRow(false);
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "Seizure", (msg) => toast.success(msg), workspaceUsers);
  };

  const renderCell = (record: SeizureRecord, col: RegisterColumn) => {
    const value = (record as any)[col.key] ?? "";
    if (col.type === "adgcomments") {
      const comments = parseAdgComments(value);
      if (comments.length === 0) return <span className="text-[#9a9a96]">—</span>;
      const last = comments[comments.length - 1];
      return (
        <div className="flex flex-col gap-0.5 max-w-[190px]">
          <span className="text-base text-[#1a1a1a] truncate" title={last.text}>{last.text}</span>
          {comments.length > 1 && (
            <span className="text-xs text-[#9a9a96]">+{comments.length - 1} more</span>
          )}
        </div>
      );
    }
    if (col.type === "caselink")
      return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (col.type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (col.type === "usercombobox")
      return <span>{workspaceUsers.find((u) => u.id === value)?.name || record.sio_name || "—"}</span>;
    return <span className="whitespace-pre-wrap">{value || "—"}</span>;
  };

  const renderRow = (record: SeizureRecord) => {
    const deleted = isDeleted(record);
    return (
    <TableRow key={record.id} className={deletedRowClass(record, "border-b border-[#EDEDEA] text-base hover:bg-white")}>
      {COLUMNS.map((col) => (
        <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a] align-top">
          {renderCell(record, col)}
        </TableCell>
      ))}
      <TableCell className="px-3 py-2 align-top no-underline">
        <div className="flex items-center gap-1">
          {!deleted && (
          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]" onClick={() => { setDialogMode("edit"); setDialogDraft({ ...record }); setDialogOpen(true); }}><Pencil size={13} /></Button>
          )}
          {userRole === "DD_INT" && (
            deleted ? (
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#2F855A] hover:bg-[#DCFCE7]" title="Restore" onClick={() => restoreRecordRow(record.id)}><RotateCcw size={13} /></Button>
            ) : (
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]" onClick={() => deleteRecord(record.id)}><Trash2 size={13} /></Button>
            )
          )}
        </div>
      </TableCell>
    </TableRow>
    );
  };

  if (loading || usersLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" /></div>;

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">Goods Seizure Register</h1>
              <p className="text-base text-[#9a9a96]">{tableRecords.length} record{tableRecords.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleExport} disabled={tableRecords.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
              <Button size="sm" className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4" onClick={() => { setDialogMode("add"); setDialogDraft({ ...EMPTY_RECORD }); setDialogOpen(true); }}>
                <Plus size={15} className="mr-1" />Add Record
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0"><SlidersHorizontal size={14} /><span className="font-medium">Search</span></div>
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search taxpayer, seizure details…" className="h-9 pl-8 pr-3 min-w-[240px] border-[#EDEDEA] text-base rounded-lg" />
            </div>
            {search && <button onClick={() => setSearch("")} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"><X size={13} />Clear</button>}
          </div>
        </div>
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-auto max-h-[90vh]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
              <TableRow className="bg-white border-b border-[#EDEDEA]">
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} style={{ minWidth: col.width }} className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]" onClick={() => toggleSort(col.key)}>
                    <span className="flex items-center gap-1">{col.label}{sortCol === col.key && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</span>
                  </TableHead>
                ))}
                <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRecords.map(renderRow)}
              {tableRecords.length === 0 && (
                <TableRow><TableCell colSpan={TOTAL_COLS} className="py-12 text-center text-base text-[#9a9a96]">No seizure records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <RegisterRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        title={dialogMode === "add" ? "Add Seizure Record" : "Edit Seizure Record"}
        columns={COLUMNS}
        draft={dialogDraft as Record<string, string>}
        onDraftChange={(k, v) => {
          setDialogDraft((prev) => {
            const next = { ...prev, [k]: v };
            // Auto-fill from linked case
            if (k === "linked_case_id" && v) {
              const caseData = caseOptions.find((c) => c.record_id === v);
              if (caseData) {
                if (!next.entity_name) next.entity_name = caseData.taxpayer_name || "";
                if (!next.sio) next.sio = caseData.handling_io_sio || "";
                if (!next.group) next.group = caseData.group || "";
              }
            }
            return next;
          });
        }}
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        caseOptions={caseOptions}
        workspaceId={workspaceId}
        onCasesDiscovered={(found) => {
          setCaseOptions((prev) => mergeCaseOptions(prev, found));
          // Auto-fill from discovered case if it matches current draft
          if (dialogDraft.linked_case_id) {
            const match = found.find((c) => c.record_id === dialogDraft.linked_case_id);
            if (match) {
              setDialogDraft((prev) => {
                const next = { ...prev };
                if (!next.entity_name) next.entity_name = match.taxpayer_name || "";
                if (!next.sio) next.sio = match.handling_io_sio || "";
                if (!next.group) next.group = match.group || "";
                return next;
              });
            }
          }
        }}
        users={sioUsers}
        userRole={userRole}
      />
    </div>
  );
};

export default SeizureRegisterComponent;
