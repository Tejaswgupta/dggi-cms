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
import { getAllUsers } from "@/hooks/useWorkspaceUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import {
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
import { REGISTER_PREFIXES, generateWorkspaceRecordId, exportRegisterToExcel, fetchCaseOptions } from "./register-utils";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser } from "./RegisterRecordDialog";
import { DGGI_GROUPS } from "@/lib/dggi-constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECORD_PREFIX = REGISTER_PREFIXES.INCIDENT_REPORT;

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
  officer_name: string;
  bo_id_no: string;
  sio: string;
  arrest: string;
  digit_id: string;
  gstin: string;
}

type SortDir = "asc" | "desc";

// ─── Constants ────────────────────────────────────────────────────────────────

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
  officer_name: "",
  bo_id_no: "",
  sio: "",
  arrest: "",
  digit_id: "",
  gstin: "",
};

// ─── Column definitions ───────────────────────────────────────────────────────
// Note: "number" type maps to "text" in RegisterColumn; userCombobox maps to "usercombobox" type.

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
  { key: "officer_name", label: "Officer Name", type: "usercombobox", width: "170px" },
  { key: "bo_id_no", label: "BO ID No.", type: "text", width: "130px" },
  { key: "arrest", label: "Arrest", type: "text", width: "120px" },
  { key: "digit_id", label: "DIGIT ID", type: "text", width: "140px" },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
];

const TOTAL_COLS = COLUMNS.length + 1; // +1 for Actions

// ─── Main component ───────────────────────────────────────────────────────────

const IncidentReportComponent = () => {
  const supabase = clientConnectionWithSupabase();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [records, setRecords] = useState<IncidentReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [savingRow, setSavingRow] = useState(false);

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<IncidentReportRecord>>({});

  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

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

      const [, usersRes, cases] = await Promise.all([fetchRecords(wid, role, groups, uid!), getAllUsers(), fetchCaseOptions(supabase, wid)]);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
      setCaseOptions(cases);
      setLoading(false);
    };
    init();
  }, []);

  const fetchRecords = async (wid: string, role?: string, groups?: string[], uid?: string) => {
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
      toast.error("Failed to load records");
      return;
    }
    setRecords(data ?? []);
  };

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const tableRecords = records
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [
        r.company_name,
        r.file_number,
        r.officer_name,
        r.bo_id_no,
        r.group,
        r.int_no,
      ].some((v) => v?.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });

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
        prev.map((r) =>
          r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r,
        ),
      );
      toast.success("Record saved");
      // Backlink: if int_no is set, auto-update ir_date in intel rapid record
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

  const deleteRecord = async (id: string) => {
    const { error } = await supabase
      .from("dggi_incident_report_records")
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
    const { data, error } = await supabase
      .from("dggi_incident_report_records")
      .insert({ ...dialogDraft, record_id: await generateWorkspaceRecordId(supabase, "dggi_incident_report_records", RECORD_PREFIX, workspaceId), workspace_id: workspaceId })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add record: " + error.message);
    } else {
      setRecords((prev) => [...prev, data]);
      toast.success("Record added");
      // Backlink: if int_no is set, auto-update ir_date in intel rapid record
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
    exportRegisterToExcel(tableRecords, COLUMNS, "Incident_Report", (msg) => toast.success(msg));
  };

  // ── Row renderer ───────────────────────────────────────────────────────────

  const renderCell = (value: string, col: RegisterColumn) => {
    if (col.type === "caselink") return <CaseIdCombobox value={value} onChange={() => {}} cases={caseOptions} editing={false} />;
    if (col.type === "usercombobox") return <span>{workspaceUsers.find((u) => u.id === value)?.name || value || "—"}</span>;
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
                Incident Report Register
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, file no., officer, BO ID, group…"
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

            {search && (
              <button
                onClick={() => setSearch("")}
                className="ml-auto flex items-center gap-1 rounded-lg border border-[#EDEDEA] px-3 py-1.5 text-base text-[#6b6b6b] hover:bg-[#F3F2EF] transition-all"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Records table ────────────────────────────────────────────────── */}
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
                  <TableRow key={record.id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
                    {COLUMNS.map((col) => (
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

                {/* ── Empty state ── */}
                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      {search ? (
                        <>
                          No records match your search.{" "}
                          <button
                            className="text-[#4A5FD4] underline"
                            onClick={() => setSearch("")}
                          >
                            Clear search
                          </button>
                        </>
                      ) : (
                        "No incident report records yet. Click Add Record to get started."
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
