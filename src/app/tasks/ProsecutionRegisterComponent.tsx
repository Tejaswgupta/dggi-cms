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
import { ChevronDown, ChevronUp, Download, ExternalLink, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { generateWorkspaceRecordId, exportRegisterToExcel, fetchCaseOptions, nullifyEmpty } from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser, type ArrestOption } from "./RegisterRecordDialog";
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
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
  { key: "amount_evaded_crore", label: "Amount Evaded (Rs.)", type: "rupees", width: "160px" },
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
  id: string; record_id: string; linked_case_id: string;
  person_name: string; age: string; date_of_arrest: string;
  amount_evaded_crore: string; entity_name: string; gstin: string; brief_modus_operandi: string;
  prosecution_complaint_status: string; date_of_filing: string; reasons_not_filed: string;
  sio: string; sio_name: string; group: string;
}

const NON_ARREST_COLS: RegisterColumn[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "person_name", label: "Accused Person", type: "text", width: "170px" },
  { key: "age", label: "Age", type: "text", width: "80px" },
  { key: "date_of_arrest", label: "Date of Detection", type: "datepicker", width: "150px" },
  { key: "amount_evaded_crore", label: "Amount Evaded (Rs.)", type: "rupees", width: "160px" },
  { key: "entity_name", label: "Entity Name", type: "text", width: "170px" },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  { key: "brief_modus_operandi", label: "Modus Operandi", type: "text", width: "240px" },
  { key: "prosecution_complaint_status", label: "Prosecution Status", type: "select", options: ["Filed", "Not Filed", "Pending Sanction"], width: "160px" },
  { key: "date_of_filing", label: "Date of Filing", type: "datepicker", width: "150px" },
  { key: "reasons_not_filed", label: "Reasons if Not Filed", type: "text", width: "220px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
];

const EMPTY_NON_ARREST: Omit<NonArrestRecord, "id"> = {
  record_id: "", linked_case_id: "", person_name: "", age: "",
  date_of_arrest: "", amount_evaded_crore: "", entity_name: "",
  gstin: "", brief_modus_operandi: "", prosecution_complaint_status: "", date_of_filing: "",
  reasons_not_filed: "", sio: "", sio_name: "", group: "",
};

// ── Main Component ────────────────────────────────────────────────────────────

const ProsecutionRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);
  const [arrestOptions, setArrestOptions] = useState<ArrestOption[]>([]);
  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();

  // Annexure I state
  const [arrestRecords, setArrestRecords] = useState<ArrestCaseRecord[]>([]);
  const [arrestSearch, setArrestSearch] = useState("");
  const [arrestSaving, setArrestSaving] = useState(false);
  const [arrestSort, setArrestSort] = useState<{ col: string | null; dir: "asc" | "desc" }>({ col: "created_at", dir: "desc" });

  const [arrestDialogOpen, setArrestDialogOpen] = useState(false);
  const [arrestDialogMode, setArrestDialogMode] = useState<"add" | "edit">("add");
  const [arrestDialogDraft, setArrestDialogDraft] = useState<Partial<ArrestCaseRecord>>({});

  // Annexure II state
  const [nonArrestRecords, setNonArrestRecords] = useState<NonArrestRecord[]>([]);
  const [nonArrestSearch, setNonArrestSearch] = useState("");
  const [nonArrestSaving, setNonArrestSaving] = useState(false);
  const [nonArrestSort, setNonArrestSort] = useState<{ col: string | null; dir: "asc" | "desc" }>({ col: "created_at", dir: "desc" });

  const [nonArrestDialogOpen, setNonArrestDialogOpen] = useState(false);
  const [nonArrestDialogMode, setNonArrestDialogMode] = useState<"add" | "edit">("add");
  const [nonArrestDialogDraft, setNonArrestDialogDraft] = useState<Partial<NonArrestRecord>>({});

  const [arrestPage, setArrestPage] = useState(1);
  const [nonArrestPage, setNonArrestPage] = useState(1);

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
      const [{ data: ad }, { data: nd }, cases, { data: arrestRows }] = await Promise.all([
        arrestQuery.order("created_at", { ascending: false }),
        nonArrestQuery.order("created_at", { ascending: false }),
        fetchCaseOptions(supabase, wid),
        supabase.from("dggi_arrest_records").select("id,record_id,arrested_name,arrested_age,date_of_arrest,party_name,unit_gstin,amount_crore,role_evidence,sio,group").eq("workspace_id", wid),
      ]);
      setArrestRecords(ad ?? []);
      setNonArrestRecords(nd ?? []);
      setCaseOptions(cases);
      setArrestOptions(arrestRows ?? []);
      setLoading(false);
    };
    init();
  }, []);


  // ── Arrest CRUD ──
  const filteredArrest = arrestRecords.filter((r) => {
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
    return [r.person_name, r.entity_name, r.gstin].some((v) => v?.toLowerCase().includes(q));
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

  const PAGE_SIZE = 20;
  const arrestTotalPages = Math.max(1, Math.ceil(filteredArrest.length / PAGE_SIZE));
  const arrestSafePage = Math.min(arrestPage, arrestTotalPages);
  const pagedArrest = filteredArrest.slice((arrestSafePage - 1) * PAGE_SIZE, arrestSafePage * PAGE_SIZE);

  const nonArrestTotalPages = Math.max(1, Math.ceil(filteredNonArrest.length / PAGE_SIZE));
  const nonArrestSafePage = Math.min(nonArrestPage, nonArrestTotalPages);
  const pagedNonArrest = filteredNonArrest.slice((nonArrestSafePage - 1) * PAGE_SIZE, nonArrestSafePage * PAGE_SIZE);

  const handleArrestExport = () => {
    exportRegisterToExcel(filteredArrest, ARREST_COLS, "Prosecution_Arrest", (msg) => toast.success(msg));
  };

  const handleNonArrestExport = () => {
    exportRegisterToExcel(filteredNonArrest, NON_ARREST_COLS, "Prosecution_Non_Arrest", (msg) => toast.success(msg));
  };

  const makeToggleSort = (
    setSort: React.Dispatch<React.SetStateAction<{ col: string | null; dir: "asc" | "desc" }>>,
    setPage: React.Dispatch<React.SetStateAction<number>>,
  ) => (col: string) => {
    setPage(1);
    setSort((s) => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
  };

  const toggleArrestSort = makeToggleSort(setArrestSort, setArrestPage);
  const toggleNonArrestSort = makeToggleSort(setNonArrestSort, setNonArrestPage);

  const renderCell = (value: string, type: RegisterColumn["type"], storedName?: string) => {
    if (type === "usercombobox") return <span>{workspaceUsers.find((u) => u.id === value)?.name || storedName || "—"}</span>;
    if (type === "caselink") return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (type === "arrestlink") {
      const arrest = arrestOptions.find((a) => a.id === value);
      if (!arrest) return <span>{value || "—"}</span>;
      return (
        <a
          href={`/tasks/arrest-register#${arrest.record_id}`}
          className="flex items-center gap-1 text-[#4A5FD4] hover:underline font-medium"
        >
          {arrest.record_id} — {arrest.arrested_name || arrest.party_name}
          <ExternalLink size={12} className="opacity-60" />
        </a>
      );
    }
    if (type === "datepicker") return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (type === "rupees") {
      const n = parseFloat(value);
      if (!value || isNaN(n)) return <span className="text-[#9a9a96]">—</span>;
      return <span>₹{n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>;
    }
    return <span>{value || "—"}</span>;
  };

  if (loading || usersLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" /></div>;

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
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-base text-[#6b6b6b]"><SlidersHorizontal size={14} /><span className="font-medium">Search</span></div>
                  <div className="relative flex items-center">
                    <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
                    <Input value={arrestSearch} onChange={(e) => { setArrestSearch(e.target.value); setArrestPage(1); }} placeholder="Search person, entity…" className="h-9 pl-8 pr-3 min-w-[220px] border-[#EDEDEA] text-base rounded-lg" />
                  </div>
                  {arrestSearch && <button onClick={() => { setArrestSearch(""); setArrestPage(1); }} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"><X size={13} />Clear</button>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#9a9a96]">{filteredArrest.length} record{filteredArrest.length !== 1 ? "s" : ""}</span>
                  <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleArrestExport} disabled={filteredArrest.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
                  <Button size="sm" className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4" onClick={() => { setArrestDialogMode("add"); setArrestDialogDraft({ ...EMPTY_ARREST }); setArrestDialogOpen(true); }}>
                    <Plus size={15} className="mr-1" />Add Record
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-auto max-h-[90vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white">
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
                    {pagedArrest.map((record) => (
                      <TableRow key={record.id} data-record-id={record.record_id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
                        {ARREST_COLS.map((col) => (
                          <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
                            {col.key === "record_id" ? (
                              <button
                                className="text-[#4A5FD4] hover:underline font-medium text-left"
                                onClick={() => { setArrestDialogMode("edit"); setArrestDialogDraft({ ...record }); setArrestDialogOpen(true); }}
                              >
                                {record.record_id || "—"}
                              </button>
                            ) : renderCell((record as any)[col.key] ?? "", col.type, col.key === "sio" ? (record as any).sio_name : undefined)}
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
            {arrestTotalPages > 1 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-base text-[#9a9a96]">
                  Page {arrestSafePage} of {arrestTotalPages} &middot; {filteredArrest.length} record{filteredArrest.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={arrestSafePage === 1} onClick={() => setArrestPage(1)}>«</Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={arrestSafePage === 1} onClick={() => setArrestPage((p) => Math.max(1, p - 1))}>‹ Prev</Button>
                  {Array.from({ length: arrestTotalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === arrestTotalPages || Math.abs(p - arrestSafePage) <= 2)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…"); acc.push(p); return acc; }, [])
                    .map((p, i) => p === "…" ? (
                      <span key={`ea-${i}`} className="px-1 text-[#9a9a96]">…</span>
                    ) : (
                      <Button key={p} size="sm" variant={p === arrestSafePage ? "default" : "outline"}
                        className={`h-8 w-8 rounded-lg text-base shadow-none p-0 ${p === arrestSafePage ? "bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white border-[#4A5FD4]" : "border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"}`}
                        onClick={() => setArrestPage(p as number)}>{p}</Button>
                    ))}
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={arrestSafePage === arrestTotalPages} onClick={() => setArrestPage((p) => Math.min(arrestTotalPages, p + 1))}>Next ›</Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={arrestSafePage === arrestTotalPages} onClick={() => setArrestPage(arrestTotalPages)}>»</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Non-Arrest Cases ── */}
          <TabsContent value="non-arrest" className="space-y-4">
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-base text-[#6b6b6b]"><SlidersHorizontal size={14} /><span className="font-medium">Search</span></div>
                  <div className="relative flex items-center">
                    <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
                    <Input value={nonArrestSearch} onChange={(e) => { setNonArrestSearch(e.target.value); setNonArrestPage(1); }} placeholder="Search person, entity…" className="h-9 pl-8 pr-3 min-w-[220px] border-[#EDEDEA] text-base rounded-lg" />
                  </div>
                  {nonArrestSearch && <button onClick={() => { setNonArrestSearch(""); setNonArrestPage(1); }} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"><X size={13} />Clear</button>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#9a9a96]">{filteredNonArrest.length} record{filteredNonArrest.length !== 1 ? "s" : ""}</span>
                  <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleNonArrestExport} disabled={filteredNonArrest.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
                  <Button size="sm" className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4" onClick={() => { setNonArrestDialogMode("add"); setNonArrestDialogDraft({ ...EMPTY_NON_ARREST }); setNonArrestDialogOpen(true); }}>
                    <Plus size={15} className="mr-1" />Add Record
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-auto max-h-[90vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white">
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
                    {pagedNonArrest.map((record) => (
                      <TableRow key={record.id} data-record-id={record.record_id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
                        {NON_ARREST_COLS.map((col) => (
                          <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
                            {col.key === "record_id" ? (
                              <button
                                className="text-[#4A5FD4] hover:underline font-medium text-left"
                                onClick={() => { setNonArrestDialogMode("edit"); setNonArrestDialogDraft({ ...record }); setNonArrestDialogOpen(true); }}
                              >
                                {record.record_id || "—"}
                              </button>
                            ) : renderCell((record as any)[col.key] ?? "", col.type, col.key === "sio" ? (record as any).sio_name : undefined)}
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
            {nonArrestTotalPages > 1 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-base text-[#9a9a96]">
                  Page {nonArrestSafePage} of {nonArrestTotalPages} &middot; {filteredNonArrest.length} record{filteredNonArrest.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={nonArrestSafePage === 1} onClick={() => setNonArrestPage(1)}>«</Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={nonArrestSafePage === 1} onClick={() => setNonArrestPage((p) => Math.max(1, p - 1))}>‹ Prev</Button>
                  {Array.from({ length: nonArrestTotalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === nonArrestTotalPages || Math.abs(p - nonArrestSafePage) <= 2)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…"); acc.push(p); return acc; }, [])
                    .map((p, i) => p === "…" ? (
                      <span key={`en-${i}`} className="px-1 text-[#9a9a96]">…</span>
                    ) : (
                      <Button key={p} size="sm" variant={p === nonArrestSafePage ? "default" : "outline"}
                        className={`h-8 w-8 rounded-lg text-base shadow-none p-0 ${p === nonArrestSafePage ? "bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white border-[#4A5FD4]" : "border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"}`}
                        onClick={() => setNonArrestPage(p as number)}>{p}</Button>
                    ))}
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={nonArrestSafePage === nonArrestTotalPages} onClick={() => setNonArrestPage((p) => Math.min(nonArrestTotalPages, p + 1))}>Next ›</Button>
                  <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40" disabled={nonArrestSafePage === nonArrestTotalPages} onClick={() => setNonArrestPage(nonArrestTotalPages)}>»</Button>
                </div>
              </div>
            )}
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
        users={sioUsers}
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
                if (!prev.entity_name) next.entity_name = caseRow.taxpayer_name ?? "";
                if (!prev.gstin) next.gstin = caseRow.gstins ?? "";
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
        users={sioUsers}
      />
    </div>
  );
};

export default ProsecutionRegisterComponent;
