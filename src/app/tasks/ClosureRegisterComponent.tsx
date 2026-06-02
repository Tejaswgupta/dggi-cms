"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
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

function UserCombobox({ value, onChange, users }: { value: string; onChange: (v: string) => void; users: WorkspaceUser[]; }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = users.filter((u) => u.name?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex h-8 w-[160px] items-center justify-between gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] truncate">
          <span className="truncate">{users.find((u) => u.id === value)?.name || <span className="text-[#9a9a96]">Select user…</span>}</span>
          <ChevronsUpDown size={12} className="text-[#9a9a96] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 border border-[#EDEDEA] shadow-none rounded-xl" align="start">
        <Command>
          <CommandInput placeholder="Search user…" value={query} onValueChange={setQuery} className="text-base" />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-base text-[#9a9a96]">No users found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((u) => (
                <CommandItem key={u.id} value={u.name} onSelect={() => { onChange(u.id); setOpen(false); setQuery(""); }} className="text-base">
                  <Check size={13} className={`mr-2 shrink-0 ${value === u.id ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{u.name}</span>
                    <span className="truncate text-[#9a9a96] text-sm">{u.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const RECORD_PREFIX = REGISTER_PREFIXES.CLOSURE;
const TABLE_NAME = "dggi_closure_records";

interface ClosureRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  is_ir: boolean;
  file_number: string;
  taxpayer_name: string;
  closure_report_no: string;
  closure_date: string;
  closure_under_section: string;
  incident_report_no: string;
  sio_group: string;
  remark: string;
  sio: string;
  group: string;
}

type ActiveTab = "non-ir" | "ir";

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = { search: "", dateFrom: "", dateTo: "" };

const today = () => format(new Date(), "yyyy-MM-dd");

const EMPTY_RECORD = (isIr: boolean): Omit<ClosureRecord, "id"> => ({
  record_id: "",
  linked_case_id: "",
  is_ir: isIr,
  file_number: "",
  taxpayer_name: "",
  closure_report_no: "",
  closure_date: today(),
  closure_under_section: "",
  incident_report_no: "",
  sio_group: "",
  remark: "",
  sio: "",
  group: "",
});

const NON_IR_COLUMNS: { key: keyof Omit<ClosureRecord, "id" | "is_ir">; label: string; type: "text" | "datepicker" | "usercombobox" | "caselink" | "select"; width?: string; options?: string[]; readOnly?: boolean }[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "file_number", label: "File Number", type: "text", width: "160px" },
  { key: "taxpayer_name", label: "Name of Taxpayer/Entity", type: "text", width: "200px" },
  { key: "closure_report_no", label: "Closure Report No.", type: "text", width: "220px" },
  { key: "closure_date", label: "Closure Date", type: "datepicker", width: "150px" },
  { key: "closure_under_section", label: "Closure U/S", type: "text", width: "140px" },
  { key: "sio_group", label: "SIO/Group", type: "usercombobox", width: "170px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "remark", label: "Remark", type: "text", width: "240px" },
];

const IR_COLUMNS: typeof NON_IR_COLUMNS = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "file_number", label: "File Number", type: "text", width: "160px" },
  { key: "taxpayer_name", label: "Name of Taxpayer/Entity", type: "text", width: "200px" },
  { key: "closure_report_no", label: "Closure Report Number", type: "text", width: "240px" },
  { key: "closure_date", label: "Closure Date", type: "datepicker", width: "150px" },
  { key: "closure_under_section", label: "Closure U/S", type: "text", width: "140px" },
  { key: "incident_report_no", label: "Incident Report No.", type: "text", width: "180px" },
  { key: "sio_group", label: "SIO/Group", type: "usercombobox", width: "170px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
  { key: "remark", label: "Remark", type: "text", width: "240px" },
];

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function DatePickerCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-8 w-[150px] items-center gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF]">
          <CalendarIcon size={13} className="text-[#9a9a96] shrink-0" />
          {parsed ? format(parsed, "dd/MM/yyyy") : <span className="text-[#9a9a96]">Pick date</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border border-[#EDEDEA] shadow-none rounded-xl" align="start">
        <Calendar mode="single" selected={parsed} onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

function EditableCell({ value, type, users, cases }: { value: string; type: "text" | "datepicker" | "usercombobox" | "caselink" | "select"; users?: WorkspaceUser[]; cases?: DGGICaseOption[] }) {
  if (type === "caselink") return <CaseIdCombobox value={value} onChange={() => {}} cases={cases ?? []} editing={false} />;
  if (type === "datepicker") return <span className="whitespace-nowrap">{fmt(value)}</span>;
  if (type === "usercombobox") return <span>{users?.find((u) => u.id === value)?.name || value || "—"}</span>;
  return <span>{value || "—"}</span>;
}

function FilterDatePicker({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  const parsed = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-9 min-w-[130px] items-center gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF]">
          <CalendarIcon size={13} className="text-[#9a9a96] shrink-0" />
          {parsed ? format(parsed, "dd/MM/yyyy") : <span className="text-[#9a9a96]">{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border border-[#EDEDEA] shadow-none rounded-xl" align="start">
        <Calendar mode="single" selected={parsed} onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

const ClosureRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [records, setRecords] = useState<ClosureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("non-ir");
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<ClosureRecord>>({});

  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

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

      let query = supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid);
      if (role !== "ADG" && role !== "DD_INT") {
        if (role === "IO" || role === "SIO") {
          query = query.eq("sio", uid!);
        } else if (groups.length > 0) {
          query = query.in("group", groups);
        } else {
          query = query.eq("group", "__none__");
        }
      }
      const [{ data, error }, usersRes, cases] = await Promise.all([query, getAllUsers(), fetchCaseOptions(supabase, wid)]);
      if (!error) setRecords(data ?? []);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
      setCaseOptions(cases);
      setLoading(false);
    };
    init();
  }, []);

  const isIr = activeTab === "ir";
  const COLUMNS = isIr ? IR_COLUMNS : NON_IR_COLUMNS;
  const TOTAL_COLS = COLUMNS.length + 1;

  const nonIrTotal = records.filter((r) => !r.is_ir).length;
  const irTotal = records.filter((r) => r.is_ir).length;

  const tableRecords = records
    .filter((r) => {
      if (r.is_ir !== isIr) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (![r.file_number, r.taxpayer_name, r.closure_report_no, r.sio_group].some((v) => v?.toLowerCase().includes(q))) return false;
      }
      if (filters.dateFrom && r.closure_date < filters.dateFrom) return false;
      if (filters.dateTo && r.closure_date > filters.dateTo) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const cmp = String((a as any)[sortCol] ?? "").localeCompare(String((b as any)[sortCol] ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const { error } = await supabase.from(TABLE_NAME).update({ ...dialogDraft }).eq("id", dialogDraft.id);
    if (error) { toast.error("Failed to save: " + error.message); }
    else { setRecords((prev) => prev.map((r) => r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r)); toast.success("Record saved"); setDialogOpen(false); }
    setSavingRow(false);
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) { toast.error("Delete failed: " + error.message); }
    else { setRecords((prev) => prev.filter((r) => r.id !== id)); toast.success("Record deleted"); }
  };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const payload = { ...dialogDraft, is_ir: isIr, record_id: await generateWorkspaceRecordId(supabase, TABLE_NAME, RECORD_PREFIX, workspaceId), workspace_id: workspaceId };
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();
    if (error) { toast.error("Failed to add: " + error.message); }
    else { setRecords((prev) => [...prev, data]); setDialogOpen(false); toast.success("Record added"); }
    setSavingRow(false);
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => setFilters((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "Closure", (msg) => toast.success(msg));
  };

  const renderRow = (record: ClosureRecord) => (
    <TableRow key={record.id} className="border-b border-[#EDEDEA] text-base hover:bg-white">
      {COLUMNS.map((col) => (
        <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
          <EditableCell value={(record as any)[col.key] ?? ""} type={col.type} users={workspaceUsers} cases={caseOptions} />
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

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" /></div>;

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">Closure Register</h1>
              <p className="text-base text-[#9a9a96]">{isIr ? "IR" : "NON-IR"} Closures · {tableRecords.length} record{tableRecords.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleExport} disabled={tableRecords.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
              <Button size="sm" className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4" onClick={() => { setDialogMode("add"); setDialogDraft({ ...EMPTY_RECORD(isIr) }); setDialogOpen(true); }}>
                <Plus size={15} className="mr-1" />Add Record
              </Button>
            </div>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-3">
          {(["non-ir", "ir"] as ActiveTab[]).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setFilters({ ...EMPTY_FILTERS }); }}
              className={`flex flex-col gap-1 rounded-2xl border px-6 py-4 text-left transition-all shadow-none min-w-[160px] ${activeTab === tab ? "border-[#4A5FD4] bg-[#EEF2FF]" : "border-[#EDEDEA] bg-white hover:bg-[#F3F2EF]"}`}>
              <span className={`text-3xl font-semibold ${activeTab === tab ? "text-[#4A5FD4]" : "text-[#1a1a1a]"}`}>{tab === "non-ir" ? nonIrTotal : irTotal}</span>
              <span className={`text-base font-medium ${activeTab === tab ? "text-[#4A5FD4]" : "text-[#6b6b6b]"}`}>{tab === "non-ir" ? "NON-IR Closures" : "IR Closures"}</span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0"><SlidersHorizontal size={14} /><span className="font-medium">Filters</span></div>
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-[#9a9a96] pointer-events-none" />
              <Input value={filters.search} onChange={(e) => setFilter("search", e.target.value)} placeholder="Search file no., taxpayer…" className="h-9 pl-8 pr-3 min-w-[220px] border-[#EDEDEA] text-base rounded-lg" />
            </div>
            <FilterDatePicker value={filters.dateFrom} placeholder="From date" onChange={(v) => setFilter("dateFrom", v)} />
            <FilterDatePicker value={filters.dateTo} placeholder="To date" onChange={(v) => setFilter("dateTo", v)} />
            {(filters.search || filters.dateFrom || filters.dateTo) && (
              <button onClick={() => setFilters({ ...EMPTY_FILTERS })} className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"><X size={13} />Clear</button>
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
                  <TableRow><TableCell colSpan={TOTAL_COLS} className="py-12 text-center text-base text-[#9a9a96]">No {isIr ? "IR" : "NON-IR"} closure records found.</TableCell></TableRow>
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

export default ClosureRegisterComponent;
