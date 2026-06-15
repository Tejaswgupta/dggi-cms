"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DateInput } from "@/components/ui/date-input";
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
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarIcon,
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
import { getAllUsers } from "@/hooks/useWorkspaceUsers";
import { RegisterRecordDialog, type RegisterColumn, type WorkspaceUser } from "./RegisterRecordDialog";
import { DGGI_GROUPS } from "@/lib/dggi-constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECORD_PREFIX = REGISTER_PREFIXES.ARREST;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArrestRecord {
  id: string;
  record_id: string;
  arrest_batch_id: string;
  linked_case_id: string;
  arrested_name: string;
  arrested_designation: string;
  arrested_age: string;
  date_of_arrest: string;
  financial_year: string;
  party_name: string;
  unit_gstin: string;
  amount_crore: string;
  role_evidence: string;
  relative_name: string;
  relative_address: string;
  relative_tel: string;
  prosecution_filed: string;
  sio: string;
  group: string;
}

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FILTERS: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
};

const today = () => format(new Date(), "yyyy-MM-dd");

const fyFromDate = (iso: string): string => {
  if (!iso) {
    const now = new Date();
    const yr = now.getFullYear();
    const start = now.getMonth() >= 3 ? yr : yr - 1;
    return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fyFromDate("");
  const yr = d.getFullYear();
  const start = d.getMonth() >= 3 ? yr : yr - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
};

const EMPTY_RECORD: Omit<ArrestRecord, "id"> = {
  record_id: "",
  arrest_batch_id: "",
  linked_case_id: "",
  arrested_name: "",
  arrested_designation: "",
  arrested_age: "",
  date_of_arrest: today(),
  financial_year: "",
  party_name: "",
  unit_gstin: "",
  amount_crore: "",
  role_evidence: "",
  relative_name: "",
  relative_address: "",
  relative_tel: "",
  prosecution_filed: "",
  sio: "",
  group: "",
};

// Fields that belong to the "batch" (shared across all persons in an arrest event)
const BATCH_FIELDS = new Set<keyof ArrestRecord>([
  "arrest_batch_id",
  "linked_case_id",
  "date_of_arrest",
  "financial_year",
  "party_name",
  "unit_gstin",
  "amount_crore",
  "sio",
  "group",
]);

// Fields that belong to the individual person
const PERSON_FIELDS = new Set<keyof ArrestRecord>([
  "arrested_name",
  "arrested_designation",
  "arrested_age",
  "role_evidence",
  "relative_name",
  "relative_address",
  "relative_tel",
  "prosecution_filed",
]);

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: {
  key: keyof Omit<ArrestRecord, "id">;
  label: string;
  type: "text" | "number" | "datepicker" | "caselink" | "usercombobox" | "select";
  width?: string;
  options?: string[];
  readOnly?: boolean;
}[] = [
  { key: "record_id", label: "ID", type: "text", width: "140px", readOnly: true },
  { key: "arrest_batch_id", label: "Arrest No.", type: "text", width: "140px", readOnly: true },
  { key: "linked_case_id", label: "Linked Case", type: "caselink", width: "180px" },
  { key: "arrested_name", label: "Name of Arrested Person", type: "text", width: "180px" },
  { key: "arrested_designation", label: "Designation", type: "text", width: "160px" },
  { key: "arrested_age", label: "Age", type: "text", width: "80px" },
  {
    key: "date_of_arrest",
    label: "Date of Arrest",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "financial_year",
    label: "Financial Year",
    type: "text",
    width: "130px",
  },
  {
    key: "party_name",
    label: "Name of Party",
    type: "text",
    width: "200px",
  },
  {
    key: "unit_gstin",
    label: "GSTIN of Unit",
    type: "text",
    width: "180px",
  },
  {
    key: "amount_crore",
    label: "Amount (Rs. in Crore)",
    type: "number",
    width: "170px",
  },
  {
    key: "role_evidence",
    label: "Role in Evasion & Nature of Evidence",
    type: "text",
    width: "240px",
  },
  { key: "relative_name", label: "Relative Name", type: "text", width: "160px" },
  { key: "relative_address", label: "Relative Address", type: "text", width: "200px" },
  { key: "relative_tel", label: "Relative Tel.", type: "text", width: "140px" },
  {
    key: "prosecution_filed",
    label: "Whether Prosecution Filed",
    type: "select",
    options: ["Yes", "No", "Pending"],
    width: "200px",
  },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  { key: "group", label: "Group", type: "select", options: DGGI_GROUPS, width: "120px" },
];

const TOTAL_COLS = COLUMNS.length + 1; // +1 for Actions

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DatePickerCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed =
    value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-8 w-[150px] items-center gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF]">
          <CalendarIcon size={13} className="text-[#9a9a96] shrink-0" />
          {parsed ? (
            format(parsed, "dd/MM/yyyy")
          ) : (
            <span className="text-[#9a9a96]">Pick date</span>
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

function EditableCell({
  value,
  type,
  onChange,
  editing,
  readOnly,
  cases,
  users,
}: {
  value: string;
  type: "text" | "number" | "datepicker" | "caselink" | "usercombobox" | "select";
  onChange: (v: string) => void;
  editing: boolean;
  readOnly?: boolean;
  cases?: DGGICaseOption[];
  users?: WorkspaceUser[];
}) {
  if (type === "usercombobox") return <span>{users?.find((u) => u.id === value)?.name || value || "—"}</span>;
  if (type === "caselink") return <CaseIdCombobox value={value} onChange={onChange} cases={cases ?? []} editing={editing} />;
  if (!editing || readOnly) {
    if (type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value)}</span>;
    return <span>{value || "—"}</span>;
  }

  if (type === "datepicker") {
    return <DateInput value={value} onChange={onChange} className="min-w-[180px]" />;
  }

  return (
    <Input
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (type === "number" && v !== "" && !/^-?\d*\.?\d*$/.test(v)) return;
        onChange(v);
      }}
      inputMode={type === "number" ? "decimal" : undefined}
      className="h-8 min-w-[120px] border-[#EDEDEA] text-base rounded-lg"
    />
  );
}

// ─── Filter bar helpers ───────────────────────────────────────────────────────

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
            format(parsed, "dd/MM/yyyy")
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

// ─── Main component ───────────────────────────────────────────────────────────

const ArrestRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [records, setRecords] = useState<ArrestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "add-person" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<ArrestRecord>>({});
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);

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

      const [, cases, usersRes] = await Promise.all([fetchRecords(wid, role, groups, uid!), fetchCaseOptions(supabase, wid), getAllUsers()]);
      setCaseOptions(cases);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
      setLoading(false);
    };
    init();
  }, []);

  const fetchRecords = async (wid: string, role?: string, groups?: string[], uid?: string) => {
    let query = supabase
      .from("dggi_arrest_records")
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

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const tableRecords = records
    .filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hit = [
          r.arrested_name,
          r.arrested_designation,
          r.party_name,
          r.unit_gstin,
        ].some((v) => v?.toLowerCase().includes(q));
        if (!hit) return false;
      }

      if (filters.dateFrom && r.date_of_arrest < filters.dateFrom) return false;
      if (filters.dateTo && r.date_of_arrest > filters.dateTo) return false;

      return true;
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const { error } = await supabase
      .from("dggi_arrest_records")
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
      const { error } = await supabase.from("dggi_arrest_records").delete().eq("id", id);
      if (error) {
        setRecords((prev) => [...prev, record]);
        toast.error("Delete failed: " + error.message);
      }
    }, 5000);
    toastId = toast.info(
      <div className="flex items-center justify-between gap-3 w-full">
        <span>{record.record_id} deleted</span>
        <button
          onClick={() => { clearTimeout(timerId); setRecords((prev) => [...prev, record]); toast.dismiss(toastId); }}
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
    const [record_id, arrest_batch_id] = await Promise.all([
      generateWorkspaceRecordId(supabase, "dggi_arrest_records", RECORD_PREFIX, workspaceId),
      generateWorkspaceRecordId(supabase, "dggi_arrest_records", "ARB", workspaceId, { separator: "/" }),
    ]);
    const payload = {
      ...dialogDraft,
      record_id,
      arrest_batch_id,
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from("dggi_arrest_records")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add record: " + error.message);
    } else {
      setRecords((prev) => [...prev, data]);
      setDialogOpen(false);
      toast.success("Record added");
    }
    setSavingRow(false);
  };

  const saveNewPerson = async () => {
    if (!workspaceId || !dialogDraft.arrest_batch_id) return;
    setSavingRow(true);
    const record_id = await generateWorkspaceRecordId(supabase, "dggi_arrest_records", RECORD_PREFIX, workspaceId);
    const payload = {
      ...dialogDraft,
      record_id,
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from("dggi_arrest_records")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add person: " + error.message);
    } else {
      setRecords((prev) => [...prev, data]);
      setDialogOpen(false);
      toast.success("Person added to batch");
    }
    setSavingRow(false);
  };

  const handleDraftChange = (key: string, val: string) => {
    // In add-person mode, batch-level fields are locked
    if (dialogMode === "add-person" && BATCH_FIELDS.has(key as keyof ArrestRecord)) return;

    if (key === "linked_case_id" && dialogMode === "add") {
      const rec = caseOptions.find((c) => c.record_id === val);
      if (rec) {
        setDialogDraft((prev) => ({
          ...prev,
          linked_case_id: val,
          financial_year: rec.financial_year || fyFromDate(rec.date_of_initiation ?? rec.date_of_receipt ?? ""),
          party_name: rec.taxpayer_name || "",
          unit_gstin: rec.gstins || "",
          amount_crore: rec.detection_amount
            ? String(parseFloat(rec.detection_amount) / 10_000_000 || "")
            : (prev.amount_crore ?? ""),
          sio: rec.handling_io_sio || prev.sio || "",
          group: rec.group || prev.group || "",
        }));
        return;
      }
    }
    setDialogDraft((prev) => ({ ...prev, [key]: val }));
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "Arrest", (msg) => toast.success(msg));
  };

  // ── Batch grouping ─────────────────────────────────────────────────────────

  const toggleBatch = (batchId: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  // Group sorted records by arrest_batch_id, preserving order of first occurrence
  const batches: { batchId: string; persons: ArrestRecord[] }[] = [];
  const batchIndex = new Map<string, number>();
  for (const r of tableRecords) {
    const bid = r.arrest_batch_id || r.id;
    if (!batchIndex.has(bid)) {
      batchIndex.set(bid, batches.length);
      batches.push({ batchId: bid, persons: [] });
    }
    batches[batchIndex.get(bid)!].persons.push(r);
  }

  const renderPersonRow = (record: ArrestRecord, isExpanded: boolean) => (
    <TableRow
      key={record.id}
      className={`border-b border-[#EDEDEA] text-base hover:bg-white ${isExpanded ? "bg-[#FAFAF8]" : ""}`}
    >
      {COLUMNS.map((col) => (
        <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
          <EditableCell
            value={((record as any)[col.key] as string) ?? ""}
            type={col.type}
            editing={false}
            readOnly={col.readOnly}
            onChange={() => {}}
            cases={caseOptions}
            users={workspaceUsers}
          />
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]"
              >
                <Trash2 size={13} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete arrest record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {record.record_id} and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#C0432A] hover:bg-[#a83823] text-white"
                  onClick={() => deleteRecord(record.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );

  const renderBatchGroup = ({ batchId, persons }: { batchId: string; persons: ArrestRecord[] }) => {
    const isMulti = persons.length > 1;
    const isExpanded = expandedBatches.has(batchId);
    const representative = persons[0];

    if (!isMulti) return renderPersonRow(representative, false);

    return (
      <>
        {/* Batch header row */}
        <TableRow
          key={`batch-${batchId}`}
          className="border-b border-[#EDEDEA] text-base bg-[#F7F7F4] hover:bg-[#F3F2EF] cursor-pointer"
          onClick={() => toggleBatch(batchId)}
        >
          {COLUMNS.map((col) => (
            <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
              {col.key === "arrest_batch_id" ? (
                <span className="flex items-center gap-1.5 font-medium">
                  {isExpanded ? <ChevronUp size={13} className="text-[#6b6b6b]" /> : <ChevronDown size={13} className="text-[#6b6b6b]" />}
                  {batchId}
                </span>
              ) : col.key === "arrested_name" ? (
                <span className="text-[#6b6b6b] text-sm">{persons.length} persons</span>
              ) : col.key === "record_id" ? (
                <span className="text-[#9a9a96]">—</span>
              ) : PERSON_FIELDS.has(col.key as keyof ArrestRecord) ? (
                <span className="text-[#9a9a96]">—</span>
              ) : (
                <EditableCell
                  value={((representative as any)[col.key] as string) ?? ""}
                  type={col.type}
                  editing={false}
                  readOnly={col.readOnly}
                  onChange={() => {}}
                  cases={caseOptions}
                  users={workspaceUsers}
                />
              )}
            </TableCell>
          ))}
          <TableCell className="px-3 py-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 rounded-lg text-[#4A5FD4] hover:bg-[#EEF0FB] text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                const batchDraft: Partial<ArrestRecord> = {};
                for (const k of Object.keys(representative) as (keyof ArrestRecord)[]) {
                  if (BATCH_FIELDS.has(k)) (batchDraft as any)[k] = (representative as any)[k];
                }
                // Clear person-level fields
                for (const k of PERSON_FIELDS) (batchDraft as any)[k] = "";
                batchDraft.date_of_arrest = representative.date_of_arrest;
                setDialogMode("add-person");
                setDialogDraft(batchDraft);
                setDialogOpen(true);
              }}
            >
              <Plus size={12} className="mr-1" />
              Add Person
            </Button>
          </TableCell>
        </TableRow>
        {/* Person sub-rows */}
        {isExpanded && persons.map((p) => renderPersonRow(p, true))}
      </>
    );
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
                Arrest Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                Arrest Register &middot;{" "}
                {tableRecords.length} record
                {tableRecords.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4" onClick={handleExport} disabled={tableRecords.length === 0}><Download size={15} className="mr-1" />Export to Excel</Button>
              <Button
                size="sm"
                className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4"
                onClick={() => { setDialogMode("add"); setDialogDraft({ ...EMPTY_RECORD }); setDialogOpen(true); }}
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
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search person, unit…"
                className="h-9 pl-8 pr-3 min-w-[300px] border-[#EDEDEA] text-base rounded-lg"
              />
              {filters.search && (
                <button
                  onClick={() => setFilter("search", "")}
                  className="absolute right-2 text-[#9a9a96] hover:text-[#1a1a1a]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Date of Arrest range */}
            <div className="flex items-center gap-1">
              <span className="text-base text-[#9a9a96] shrink-0">
                Arrest Date:
              </span>
              <FilterDatePicker
                value={filters.dateFrom}
                placeholder="From"
                onChange={(v) => setFilter("dateFrom", v)}
              />
              <span className="text-[#9a9a96]">—</span>
              <FilterDatePicker
                value={filters.dateTo}
                placeholder="To"
                onChange={(v) => setFilter("dateTo", v)}
              />
              {(filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={() => {
                    setFilter("dateFrom", "");
                    setFilter("dateTo", "");
                  }}
                  className="ml-0.5 text-[#9a9a96] hover:text-[#1a1a1a]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ ...EMPTY_FILTERS })}
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
        </div>

        {/* ── Records table ─────────────────────────────────────────────── */}
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
                {batches.map(renderBatchGroup)}

                {/* Empty state */}
                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      No arrest records match the current filters.{" "}
                      {activeFilterCount > 0 && (
                        <button
                          className="text-[#4A5FD4] underline"
                          onClick={() => setFilters({ ...EMPTY_FILTERS })}
                        >
                          Clear filters
                        </button>
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
        title={
          dialogMode === "add-person"
            ? `Add Person — ${dialogDraft.arrest_batch_id ?? "batch"}`
            : undefined
        }
        columns={
          dialogMode === "add-person"
            ? COLUMNS.filter((c) => PERSON_FIELDS.has(c.key as keyof ArrestRecord))
            : COLUMNS
        }
        draft={dialogDraft as Record<string, string>}
        onDraftChange={handleDraftChange}
        onSave={dialogMode === "add" ? saveNew : dialogMode === "add-person" ? saveNewPerson : saveEdit}
        saving={savingRow}
        caseOptions={caseOptions}
        users={workspaceUsers}
      />
    </div>
  );
};

export default ArrestRegisterComponent;
