"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ChevronDown, ChevronUp, Download, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { generateWorkspaceRecordId, exportRegisterToExcel, fetchCaseOptions, nullifyEmpty } from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { getAllUsers } from "@/hooks/useWorkspaceUsers";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser, type ArrestOption } from "./RegisterRecordDialog";
import { DGGI_GROUPS } from "@/lib/dggi-constants";

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ── Annexure I: Arrest Cases ──────────────────────────────────────────────────

interface ArrestCaseRecord {
  id: string; record_id: string; linked_case_id: string; linked_arrest_id: string;
  arrested_person_name: string; age: string; date_of_arrest: string; status_of_person: string;
  amount_evaded_crore: string; entity_name: string; gstin: string; brief_modus_operandi: string;
  prosecution_complaint_status: string; date_of_filing: string; reasons_not_filed: string;
  bail_status: string; sio: string; sio_name: string; group: string;
}

const ARREST_COLS: RegisterColumn[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_arrest_id", label: "Arrest Case", type: "arrestlink", width: "180px" },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "arrested_person_name", label: "Arrested Person", type: "text", width: "170px" },
  { key: "age", label: "Age", type: "text", width: "80px" },
  { key: "date_of_arrest", label: "Date of Arrest", type: "datepicker", width: "150px" },
  { key: "bail_status", label: "Bail Status", type: "select", options: ["Bail Given", "Bail Not Given"], width: "140px" },
  { key: "status_of_person", label: "Status", type: "select", options: ["On Bail", "In Custody", "Absconding", "Deceased"], width: "130px" },
  { key: "amount_evaded_crore", label: "Amount Evaded (Cr.)", type: "text", width: "160px" },
  { key: "entity_name", label: "Entity Name", type: "text", width: "170px" },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  { key: "brief_modus_operandi", label: "Modus Operandi", type: "text", width: "240px" },
  { key: "prosecution_complaint_status", label: "Prosecution Status", type: "select", options: ["Filed", "Not Filed", "Pending Sanction"], width: "160px" },
  { key: "date_of_filing", label: "Date of Filing", type: "datepicker", width: "150px" },
  { key: "reasons_not_filed", label: "Reasons if Not Filed", type: "text", width: "220px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
];

const EMPTY_ARREST: Omit<ArrestCaseRecord, "id"> = {
  record_id: "", linked_case_id: "", linked_arrest_id: "", arrested_person_name: "", age: "",
  date_of_arrest: "", bail_status: "", status_of_person: "", amount_evaded_crore: "", entity_name: "",
  gstin: "", brief_modus_operandi: "", prosecution_complaint_status: "", date_of_filing: "", reasons_not_filed: "", sio: "", sio_name: "", group: "",
};

// ── Annexure II: Non-Arrest Cases ─────────────────────────────────────────────

interface NonArrestRecord {
  id: string; record_id: string; linked_case_id: string; date_of_order: string;
  opening_balance: string; cases_examined: string; prosecution_sanctioned_filed: string; no_of_persons: string;
  new_adjudication_orders: string; closing_balance: string; remarks: string;
  sio: string; sio_name: string; group: string;
}

const NON_ARREST_COLS: RegisterColumn[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "date_of_order", label: "Date of Order", type: "datepicker", width: "150px" },
  { key: "opening_balance", label: "Opening Balance (Adj. Orders)", type: "text", width: "220px" },
  { key: "cases_examined", label: "Examined for Prosecution", type: "text", width: "200px" },
  { key: "prosecution_sanctioned_filed", label: "Prosecution Sanctioned & Filed", type: "text", width: "220px" },
  { key: "no_of_persons", label: "No. of Persons", type: "text", width: "130px" },
  { key: "new_adjudication_orders", label: "New Adj. Orders Received", type: "text", width: "200px" },
  { key: "closing_balance", label: "Closing Balance", type: "text", width: "150px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "remarks", label: "Remarks", type: "text", width: "240px" },
];

const EMPTY_NON_ARREST: Omit<NonArrestRecord, "id"> = {
  record_id: "", linked_case_id: "", date_of_order: "", opening_balance: "", cases_examined: "",
  prosecution_sanctioned_filed: "", no_of_persons: "", new_adjudication_orders: "",
  closing_balance: "", remarks: "", sio: "", sio_name: "", group: "",
};

// ── Main Component ────────────────────────────────────────────────────────────

const ProsecutionRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [arrestOptions, setArrestOptions] = useState<ArrestOption[]>([]);

  // Annexure I state
  const [arrestRecords, setArrestRecords] = useState<ArrestCaseRecord[]>([]);
  const [arrestSearch, setArrestSearch] = useState("");
  const [arrestSaving, setArrestSaving] = useState(false);
  const [arrestSort, setArrestSort] = useState<{ col: string | null; dir: "asc" | "desc" }>({ col: null, dir: "asc" });
  const [bailSubTab, setBailSubTab] = useState<"Bail Given" | "Bail Not Given">("Bail Given");

  const [arrestDialogOpen, setArrestDialogOpen] = useState(false);
  const [arrestDialogMode, setArrestDialogMode] = useState<"add" | "edit">("add");
  const [arrestDialogDraft, setArrestDialogDraft] = useState<Partial<ArrestCaseRecord>>({});

  // Annexure II state
  const [nonArrestRecords, setNonArrestRecords] = useState<NonArrestRecord[]>([]);
  const [nonArrestSearch, setNonArrestSearch] = useState("");
  const [nonArrestSaving, setNonArrestSaving] = useState(false);
  const [nonArrestSort, setNonArrestSort] = useState<{ col: string | null; dir: "asc" | "desc" }>({ col: null, dir: "asc" });

  const [nonArrestDialogOpen, setNonArrestDialogOpen] = useState(false);
  const [nonArrestDialogMode, setNonArrestDialogMode] = useState<"add" | "edit">("add");
  const [nonArrestDialogDraft, setNonArrestDialogDraft] = useState<Partial<NonArrestRecord>>({});

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      const [{ data: userRow }, { data: groupRows }] = await Promise.all([
        supabase.from("votum_users").select("dggi_role").eq("id", uid!).single(),
        supabase.from("dggi_user_group_assignments").select("group_name").eq("user_id", uid!),
      ]);
      const role = userRow?.dggi_role ?? "";
      const groups = (groupRows ?? []).map((g: { group_name: string }) => g.group_name);

      let arrestQuery = supabase.from("dggi_prosecution_arrest_records").select("*").eq("workspace_id", wid);
      let nonArrestQuery = supabase.from("dggi_prosecution_non_arrest_records").select("*").eq("workspace_id", wid);
      if (role !== "ADG" && role !== "DD_INT") {
        if (role === "IO" || role === "SIO") {
          arrestQuery = arrestQuery.eq("sio", uid!);
          nonArrestQuery = nonArrestQuery.eq("sio", uid!);
        } else if (groups.length > 0) {
          arrestQuery = arrestQuery.in("group", groups);
          nonArrestQuery = nonArrestQuery.in("group", groups);
        } else {
          arrestQuery = arrestQuery.eq("group", "__none__");
          nonArrestQuery = nonArrestQuery.eq("group", "__none__");
        }
      }
      const [{ data: ad }, { data: nd }, cases, usersRes, { data: arrestRows }] = await Promise.all([
        arrestQuery,
        nonArrestQuery,
        fetchCaseOptions(supabase, wid),
        getAllUsers(),
        supabase.from("dggi_arrest_records").select("id,record_id,arrested_name,arrested_age,date_of_arrest,party_name,unit_gstin,amount_crore,role_evidence,sio,group").eq("workspace_id", wid),
      ]);
      setArrestRecords(ad ?? []);
      setNonArrestRecords(nd ?? []);
      setCaseOptions(cases);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
      setArrestOptions(arrestRows ?? []);
      setLoading(false);
    };
    init();
  }, []);


  // ── Arrest CRUD ──
  const filteredArrest = arrestRecords.filter((r) => {
    if (r.bail_status && r.bail_status !== bailSubTab) return false;
    if (!arrestSearch) return true;
    const q = arrestSearch.toLowerCase();
    return [r.arrested_person_name, r.entity_name, r.gstin].some((v) => v?.toLowerCase().includes(q));
  }).sort((a, b) => {
    if (!arrestSort.col) return 0;
    const cmp = String((a as any)[arrestSort.col] ?? "").localeCompare(String((b as any)[arrestSort.col] ?? ""));
    return arrestSort.dir === "asc" ? cmp : -cmp;
  });

  const saveArrestEdit = async () => {
    if (!arrestDialogDraft.id) return;
    setArrestSaving(true);
    const arrestUpdatePayload = nullifyEmpty({ ...arrestDialogDraft }, ARREST_COLS);
    (arrestUpdatePayload as any).sio_name = workspaceUsers.find((u) => u.id === (arrestDialogDraft.sio ?? ""))?.name || null;
    const { error } = await supabase.from("dggi_prosecution_arrest_records").update(arrestUpdatePayload).eq("id", arrestDialogDraft.id);
    if (error) { toast.error("Failed to save: " + error.message); }
    else { setArrestRecords((prev) => prev.map((r) => r.id === arrestDialogDraft.id ? { ...r, ...arrestDialogDraft } : r)); toast.success("Record saved"); setArrestDialogOpen(false); }
    setArrestSaving(false);
  };

  const makeDelete = <T extends { id: string; record_id: string }>(
    table: string,
    records: T[],
    setRecords: React.Dispatch<React.SetStateAction<T[]>>,
  ) => (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    let toastId: ReturnType<typeof toast.info>;
    const timerId = setTimeout(async () => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) { setRecords((prev) => [...prev, record]); toast.error("Delete failed: " + error.message); }
    }, 5000);
    toastId = toast.info(
      <div className="flex items-center justify-between gap-3 w-full">
        <span>{record.record_id} deleted</span>
        <button onClick={() => { clearTimeout(timerId); setRecords((prev) => [...prev, record]); toast.dismiss(toastId); }} className="font-medium underline underline-offset-2 shrink-0">Undo</button>
      </div>,
      { autoClose: 5000, closeOnClick: false, pauseOnHover: true },
    );
  };

  const deleteArrest = makeDelete("dggi_prosecution_arrest_records", arrestRecords, setArrestRecords);

  const saveArrestNew = async () => {
    if (!workspaceId) return;
    setArrestSaving(true);
    const payload = nullifyEmpty({
      ...arrestDialogDraft,
      bail_status: (arrestDialogDraft as any).bail_status || bailSubTab,
      record_id: await generateWorkspaceRecordId(supabase, "dggi_prosecution_arrest_records", "PRA", workspaceId),
      workspace_id: workspaceId,
    }, ARREST_COLS);
    (payload as any).sio_name = workspaceUsers.find((u) => u.id === (arrestDialogDraft.sio ?? ""))?.name || null;
    const { data, error } = await supabase.from("dggi_prosecution_arrest_records").insert(payload).select().single();
    if (error) { toast.error("Failed to add: " + error.message); }
    else { setArrestRecords((prev) => [...prev, data]); setArrestDialogOpen(false); toast.success("Record added"); }
    setArrestSaving(false);
  };

  // ── Non-Arrest CRUD ──
  const filteredNonArrest = nonArrestRecords.filter((r) => {
    if (!nonArrestSearch) return true;
    const q = nonArrestSearch.toLowerCase();
    return [r.remarks].some((v) => v?.toLowerCase().includes(q));
  }).sort((a, b) => {
    if (!nonArrestSort.col) return 0;
    const cmp = String((a as any)[nonArrestSort.col] ?? "").localeCompare(String((b as any)[nonArrestSort.col] ?? ""));
    return nonArrestSort.dir === "asc" ? cmp : -cmp;
  });

  const saveNonArrestEdit = async () => {
    if (!nonArrestDialogDraft.id) return;
    setNonArrestSaving(true);
    const nonArrestUpdatePayload = nullifyEmpty({ ...nonArrestDialogDraft }, NON_ARREST_COLS);
    (nonArrestUpdatePayload as any).sio_name = workspaceUsers.find((u) => u.id === (nonArrestDialogDraft.sio ?? ""))?.name || null;
    const { error } = await supabase.from("dggi_prosecution_non_arrest_records").update(nonArrestUpdatePayload).eq("id", nonArrestDialogDraft.id);
    if (error) { toast.error("Failed to save: " + error.message); }
    else { setNonArrestRecords((prev) => prev.map((r) => r.id === nonArrestDialogDraft.id ? { ...r, ...nonArrestDialogDraft } : r)); toast.success("Record saved"); setNonArrestDialogOpen(false); }
    setNonArrestSaving(false);
  };

  const deleteNonArrest = makeDelete("dggi_prosecution_non_arrest_records", nonArrestRecords, setNonArrestRecords);

  const saveNonArrestNew = async () => {
    if (!workspaceId) return;
    setNonArrestSaving(true);
    const payload = nullifyEmpty({
      ...nonArrestDialogDraft,
      record_id: await generateWorkspaceRecordId(supabase, "dggi_prosecution_non_arrest_records", "PRN", workspaceId),
      workspace_id: workspaceId,
    }, NON_ARREST_COLS);
    (payload as any).sio_name = workspaceUsers.find((u) => u.id === (nonArrestDialogDraft.sio ?? ""))?.name || null;
    const { data, error } = await supabase.from("dggi_prosecution_non_arrest_records").insert(payload).select().single();
    if (error) { toast.error("Failed to add: " + error.message); }
    else { setNonArrestRecords((prev) => [...prev, data]); setNonArrestDialogOpen(false); toast.success("Record added"); }
    setNonArrestSaving(false);
  };

  const handleArrestExport = () => {
    exportRegisterToExcel(filteredArrest, ARREST_COLS, "Prosecution_Arrest", (msg) => toast.success(msg));
  };

  const handleNonArrestExport = () => {
    exportRegisterToExcel(filteredNonArrest, NON_ARREST_COLS, "Prosecution_Non_Arrest", (msg) => toast.success(msg));
  };

  const makeToggleSort = (
    setSort: React.Dispatch<React.SetStateAction<{ col: string | null; dir: "asc" | "desc" }>>,
  ) => (col: string) =>
    setSort((s) => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });

  const toggleArrestSort = makeToggleSort(setArrestSort);
  const toggleNonArrestSort = makeToggleSort(setNonArrestSort);

  const renderCell = (value: string, type: RegisterColumn["type"], storedName?: string) => {
    if (type === "usercombobox") return <span>{workspaceUsers.find((u) => u.id === value)?.name || storedName || "—"}</span>;
    if (type === "caselink") return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (type === "arrestlink") {
      const arrest = arrestOptions.find((a) => a.id === value);
      return <span>{arrest ? `${arrest.record_id} — ${arrest.arrested_name || arrest.party_name}` : value || "—"}</span>;
    }
    if (type === "datepicker") return <span className="whitespace-nowrap">{fmt(value)}</span>;
    return <span>{value || "—"}</span>;
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" /></div>;

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <h1 className="text-xl font-medium text-[#1a1a1a]">Prosecution Register</h1>
          <p className="text-base text-[#9a9a96]">Arrest Cases & Non-Arrest Cases</p>
        </div>

        <Tabs defaultValue="arrest" className="w-full">
          <TabsList className="mb-4 rounded-xl border border-[#EDEDEA] bg-white h-10 p-1">
            <TabsTrigger value="arrest" className="rounded-lg text-base data-[state=active]:bg-[#EEF2FF] data-[state=active]:text-[#4A5FD4]">Annexure I — Arrest Cases</TabsTrigger>
            <TabsTrigger value="non-arrest" className="rounded-lg text-base data-[state=active]:bg-[#EEF2FF] data-[state=active]:text-[#4A5FD4]">Annexure II — Non-Arrest Cases</TabsTrigger>
          </TabsList>

          {/* ── Arrest Cases ── */}
          <TabsContent value="arrest" className="space-y-4">
            {/* Bail subtabs */}
            <div className="flex gap-0 border-b border-[#EDEDEA] bg-white rounded-t-2xl px-4 pt-3">
              {(["Bail Given", "Bail Not Given"] as const).map((tab) => {
                const tabCount = arrestRecords.filter((r) => !r.bail_status || r.bail_status === tab).length;
                const isActive = bailSubTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setBailSubTab(tab)}
                    className={`relative flex items-center gap-2 pb-2.5 px-1 mr-5 text-[12.5px] font-semibold transition-colors ${isActive ? "text-[#1a1a1a]" : "text-[#9a9a96] hover:text-[#6b6b6b]"}`}
                  >
                    {tab}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-4 rounded-full px-1.5 text-[10px] font-bold ${isActive ? (tab === "Bail Not Given" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700") : "bg-[#EDEDEA] text-[#6b6b6b]"}`}>
                      {tabCount}
                    </span>
                    {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A5FD4] rounded-full" />}
                  </button>
                );
              })}
              <div className="ml-auto pb-2.5 text-[11px] text-[#9a9a96] self-center">
                {bailSubTab === "Bail Not Given" ? "Complaint deadline: 60 days from arrest" : "Complaint deadline: 6 months from arrest"}
              </div>
            </div>
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-base text-[#6b6b6b]"><SlidersHorizontal size={14} /><span className="font-medium">Search</span></div>
                  <div className="relative flex items-center">
                    <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
                    <Input value={arrestSearch} onChange={(e) => setArrestSearch(e.target.value)} placeholder="Search person, entity…" className="h-9 pl-8 pr-3 min-w-[220px] border-[#EDEDEA] text-base rounded-lg" />
                  </div>
                  {arrestSearch && <button onClick={() => setArrestSearch("")} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"><X size={13} />Clear</button>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleArrestExport} disabled={filteredArrest.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
                  <Button size="sm" className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4" onClick={() => { setArrestDialogMode("add"); setArrestDialogDraft({ ...EMPTY_ARREST }); setArrestDialogOpen(true); }}>
                    <Plus size={15} className="mr-1" />Add Record
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white border-b border-[#EDEDEA]">
                      {ARREST_COLS.map((col) => (
                        <TableHead key={col.key} style={{ minWidth: col.width }} className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]"
                          onClick={() => toggleArrestSort(col.key)}>
                          <span className="flex items-center gap-1">{col.label}{arrestSort.col === col.key && (arrestSort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</span>
                        </TableHead>
                      ))}
                      <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArrest.map((record) => (
                      <TableRow key={record.id} data-record-id={record.record_id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
                        {ARREST_COLS.map((col) => (
                          <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
                            {renderCell((record as any)[col.key] ?? "", col.type, col.key === "sio" ? (record as any).sio_name : undefined)}
                          </TableCell>
                        ))}
                        <TableCell className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]" onClick={() => { setArrestDialogMode("edit"); setArrestDialogDraft({ ...record }); setArrestDialogOpen(true); }}><Pencil size={13} /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]" onClick={() => deleteArrest(record.id)}><Trash2 size={13} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredArrest.length === 0 && (
                      <TableRow><TableCell colSpan={ARREST_COLS.length + 1} className="py-12 text-center text-base text-[#9a9a96]">No arrest case records found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ── Non-Arrest Cases ── */}
          <TabsContent value="non-arrest" className="space-y-4">
            {/* Summary note — Non-Arrest data is aggregated, not case-wise */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800">
              <span className="font-semibold">Summary of Non-Arrest Cases:</span> This register tracks aggregated data (opening balance, examined, sanctioned) for non-arrest adjudication orders. Individual case-level deadline tracking is not available for this category.
            </div>
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-base text-[#6b6b6b]"><SlidersHorizontal size={14} /><span className="font-medium">Search</span></div>
                  <div className="relative flex items-center">
                    <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
                    <Input value={nonArrestSearch} onChange={(e) => setNonArrestSearch(e.target.value)} placeholder="Search zonal unit…" className="h-9 pl-8 pr-3 min-w-[220px] border-[#EDEDEA] text-base rounded-lg" />
                  </div>
                  {nonArrestSearch && <button onClick={() => setNonArrestSearch("")} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"><X size={13} />Clear</button>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleNonArrestExport} disabled={filteredNonArrest.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
                  <Button size="sm" className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4" onClick={() => { setNonArrestDialogMode("add"); setNonArrestDialogDraft({ ...EMPTY_NON_ARREST }); setNonArrestDialogOpen(true); }}>
                    <Plus size={15} className="mr-1" />Add Record
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white border-b border-[#EDEDEA]">
                      {NON_ARREST_COLS.map((col) => (
                        <TableHead key={col.key} style={{ minWidth: col.width }} className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]"
                          onClick={() => toggleNonArrestSort(col.key)}>
                          <span className="flex items-center gap-1">{col.label}{nonArrestSort.col === col.key && (nonArrestSort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</span>
                        </TableHead>
                      ))}
                      <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNonArrest.map((record) => (
                      <TableRow key={record.id} data-record-id={record.record_id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
                        {NON_ARREST_COLS.map((col) => (
                          <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
                            {renderCell((record as any)[col.key] ?? "", col.type, col.key === "sio" ? (record as any).sio_name : undefined)}
                          </TableCell>
                        ))}
                        <TableCell className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]" onClick={() => { setNonArrestDialogMode("edit"); setNonArrestDialogDraft({ ...record }); setNonArrestDialogOpen(true); }}><Pencil size={13} /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]" onClick={() => deleteNonArrest(record.id)}><Trash2 size={13} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredNonArrest.length === 0 && (
                      <TableRow><TableCell colSpan={NON_ARREST_COLS.length + 1} className="py-12 text-center text-base text-[#9a9a96]">No non-arrest case records found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <RegisterRecordDialog
        open={arrestDialogOpen}
        onOpenChange={setArrestDialogOpen}
        mode={arrestDialogMode}
        columns={ARREST_COLS}
        draft={arrestDialogDraft as Record<string, string>}
        onDraftChange={(k, v) => {
          setArrestDialogDraft((prev) => {
            const next = { ...prev, [k]: v };
            if (arrestDialogMode === "add") {
              if (k === "linked_arrest_id") {
                const arrest = arrestOptions.find((a) => a.id === v);
                if (arrest) {
                  next.arrested_person_name = arrest.arrested_name || prev.arrested_person_name || "";
                  next.age = arrest.arrested_age || prev.age || "";
                  next.date_of_arrest = arrest.date_of_arrest || prev.date_of_arrest || "";
                  next.entity_name = arrest.party_name || prev.entity_name || "";
                  next.gstin = arrest.unit_gstin || prev.gstin || "";
                  next.amount_evaded_crore = arrest.amount_crore || prev.amount_evaded_crore || "";
                  next.brief_modus_operandi = arrest.role_evidence || prev.brief_modus_operandi || "";
                  next.sio = arrest.sio || prev.sio || "";
                  next.group = arrest.group || prev.group || "";
                }
              }
              if (k === "linked_case_id") {
                const caseRow = caseOptions.find((c) => c.record_id === v);
                if (caseRow) {
                  if (!prev.entity_name) next.entity_name = caseRow.taxpayer_name ?? "";
                  if (!prev.gstin) next.gstin = caseRow.gstins ?? "";
                  if (!prev.sio) next.sio = caseRow.handling_io_sio ?? "";
                  if (!prev.group) next.group = caseRow.group ?? "";
                }
              }
            }
            return next;
          });
        }}
        onMultiDraftChange={(patches) =>
          setArrestDialogDraft((prev) => ({ ...prev, ...patches }))
        }
        onSave={arrestDialogMode === "add" ? saveArrestNew : saveArrestEdit}
        saving={arrestSaving}
        caseOptions={caseOptions}
        arrestOptions={arrestOptions}
        users={workspaceUsers}
      />

      <RegisterRecordDialog
        open={nonArrestDialogOpen}
        onOpenChange={setNonArrestDialogOpen}
        mode={nonArrestDialogMode}
        columns={NON_ARREST_COLS}
        draft={nonArrestDialogDraft as Record<string, string>}
        onDraftChange={(k, v) => {
          setNonArrestDialogDraft((prev) => {
            const next = { ...prev, [k]: v };
            if (k === "linked_case_id" && nonArrestDialogMode === "add") {
              const caseRow = caseOptions.find((c) => c.record_id === v);
              if (caseRow) {
                if (!prev.sio) next.sio = caseRow.handling_io_sio ?? "";
                if (!prev.group) next.group = caseRow.group ?? "";
              }
            }
            return next;
          });
        }}
        onSave={nonArrestDialogMode === "add" ? saveNonArrestNew : saveNonArrestEdit}
        saving={nonArrestSaving}
        caseOptions={caseOptions}
        users={workspaceUsers}
      />
    </div>
  );
};

export default ProsecutionRegisterComponent;
