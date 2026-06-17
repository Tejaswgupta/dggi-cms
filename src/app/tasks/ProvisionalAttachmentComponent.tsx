"use client";

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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { DGGI_GROUPS } from "@/lib/dggi-constants";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";
import {
  AlertTriangle,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Link2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import {
  REGISTER_PREFIXES,
  exportRegisterToExcel,
  fetchCaseOptions,
  generateWorkspaceRecordId,
} from "./register-utils";
import {
  RegisterRecordDialog,
  type RegisterColumn,
  type ScnOption,
  type WorkspaceUser,
} from "./RegisterRecordDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECORD_PREFIX = REGISTER_PREFIXES.PROVISIONAL_ATTACHMENT;

const SCN_DUE_DAYS = 273; // 9 months ≈ 273 days
const EXPIRY_DAYS = 365; // 1 year

const DATE_FIELDS: (keyof ProvisionalAttachmentRecord)[] = [
  "date_of_attachment",
  "date_of_scn_issuance",
  "date_of_release",
];

const NUMERIC_FIELDS: (keyof ProvisionalAttachmentRecord)[] = [
  "expected_liability",
  "value_immovable",
  "value_movable",
  "value_shares",
  "value_bank",
  "value_third_party",
  "value_others",
  "value_total",
];

function sanitizeForDb(
  draft: Partial<ProvisionalAttachmentRecord>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...draft };
  for (const f of DATE_FIELDS) if (out[f] === "") out[f] = null;
  for (const f of NUMERIC_FIELDS) if (out[f] === "") out[f] = null;
  return out;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProvisionalAttachmentRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  person_name: string;
  gstin_pan: string;
  person_status: string;
  expected_liability: string;
  entity_gstin: string;
  issue_involved: string;
  person_involvement: string;
  arrest: string;
  description_of_property: string;
  value_immovable: string;
  value_movable: string;
  value_shares: string;
  value_bank: string;
  value_third_party: string;
  value_others: string;
  value_total: string;
  investigation_completed: string;
  scn_issued: string;
  date_of_scn_issuance: string;
  letter_issued: string;
  oio_issued: string;
  date_of_release: string;
  group_sio: string;
  date_of_attachment: string;
  linked_scn_no: string;
  sio: string;
  group: string;
}

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  alarmOnly: boolean;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  alarmOnly: false,
};

const today = () => format(new Date(), "yyyy-MM-dd");

const EMPTY_RECORD: Omit<ProvisionalAttachmentRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  person_name: "",
  gstin_pan: "",
  person_status: "",
  expected_liability: "",
  entity_gstin: "",
  issue_involved: "",
  person_involvement: "",
  arrest: "",
  description_of_property: "",
  value_immovable: "",
  value_movable: "",
  value_shares: "",
  value_bank: "",
  value_third_party: "",
  value_others: "",
  value_total: "",
  investigation_completed: "",
  scn_issued: "",
  date_of_scn_issuance: "",
  letter_issued: "",
  oio_issued: "",
  date_of_release: "",
  group_sio: "",
  date_of_attachment: today(),
  linked_scn_no: "",
  sio: "",
  group: "",
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: RegisterColumn[] = [
  {
    key: "record_id",
    label: "ID",
    type: "text",
    width: "140px",
    readOnly: true,
  },
  {
    key: "linked_case_id",
    label: "Linked Case",
    type: "caselink",
    width: "180px",
  },
  {
    key: "person_name",
    label: "Name of Person (Sec. 83)",
    type: "text",
    width: "200px",
  },
  { key: "gstin_pan", label: "GSTIN/PAN", type: "text", width: "160px" },
  {
    key: "person_status",
    label: "Status of Person",
    type: "text",
    width: "180px",
  },
  {
    key: "expected_liability",
    label: "Expected Liability (Cr.)",
    type: "number",
    width: "160px",
  },
  {
    key: "entity_gstin",
    label: "GSTIN of Entity",
    type: "text",
    width: "160px",
  },
  {
    key: "issue_involved",
    label: "Issue Involved",
    type: "text",
    width: "160px",
  },
  {
    key: "person_involvement",
    label: "Brief Description of Involvement",
    type: "text",
    width: "220px",
  },
  { key: "arrest", label: "Arrest (Yes/No)", type: "text", width: "130px" },
  {
    key: "description_of_property",
    label: "Description of Property",
    type: "text",
    width: "220px",
  },
  {
    key: "value_immovable",
    label: "Value – Immovable Property (Cr.)",
    type: "number",
    width: "200px",
  },
  {
    key: "value_movable",
    label: "Value – Movable Property (Cr.)",
    type: "number",
    width: "190px",
  },
  {
    key: "value_shares",
    label: "Value – Share/Insurance/FD (Cr.)",
    type: "number",
    width: "200px",
  },
  {
    key: "value_bank",
    label: "Value – Bank A/c (Cr.)",
    type: "number",
    width: "160px",
  },
  {
    key: "value_third_party",
    label: "Value – Third Party (Cr.)",
    type: "number",
    width: "170px",
  },
  {
    key: "value_others",
    label: "Value – Others (Cr.)",
    type: "number",
    width: "150px",
  },
  {
    key: "value_total",
    label: "Value – Total (Cr.)",
    type: "number",
    width: "150px",
  },
  {
    key: "investigation_completed",
    label: "Investigation Completed?",
    type: "text",
    width: "180px",
  },
  { key: "scn_issued", label: "SCN Issued?", type: "text", width: "120px" },
  {
    key: "date_of_scn_issuance",
    label: "Date of SCN Issuance",
    type: "datepicker",
    width: "180px",
  },
  {
    key: "letter_issued",
    label: "Letter to Commissionerate?",
    type: "text",
    width: "200px",
  },
  { key: "oio_issued", label: "OIO Issued?", type: "text", width: "120px" },
  {
    key: "date_of_release",
    label: "Date of Release of Attachment",
    type: "datepicker",
    width: "210px",
  },
  // { key: "group_sio", label: "Group/SIO", type: "text", width: "130px" },
  {
    key: "date_of_attachment",
    label: "Date of Attachment",
    type: "datepicker",
    width: "160px",
  },
  {
    key: "linked_scn_no",
    label: "Linked SCN No.",
    type: "scncombobox",
    width: "180px",
  },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: DGGI_GROUPS,
    width: "120px",
  },
];

const TOTAL_COLS = COLUMNS.length + 3; // +3 for SCN Due Date, Expiry Date, Actions

// ─── Date-derived computations ────────────────────────────────────────────────

function computedDates(
  dateOfAttachment: string,
  dateOfScnIssuance?: string,
  dateOfRelease?: string,
): {
  expiryDate: Date | null;
  scnDueDate: Date | null;
  daysToExpiry: number | null;
  daysToScnDue: number | null;
} {
  if (!dateOfAttachment)
    return {
      expiryDate: null,
      scnDueDate: null,
      daysToExpiry: null,
      daysToScnDue: null,
    };
  const base = parseISO(dateOfAttachment);
  if (!isValid(base))
    return {
      expiryDate: null,
      scnDueDate: null,
      daysToExpiry: null,
      daysToScnDue: null,
    };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiryDate = addDays(base, EXPIRY_DAYS);
  const scnDueDate = addDays(base, SCN_DUE_DAYS);
  return {
    expiryDate,
    scnDueDate,
    // Suppress SCN alarm if issuance date has been entered
    daysToScnDue: dateOfScnIssuance
      ? null
      : differenceInCalendarDays(scnDueDate, now),
    // Suppress expiry alarm if attachment has been released
    daysToExpiry: dateOfRelease
      ? null
      : differenceInCalendarDays(expiryDate, now),
  };
}

type AlarmLevel = "overdue" | "critical" | "warning" | null;

function alarmLevel(daysLeft: number | null): AlarmLevel {
  if (daysLeft === null) return null;
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 14) return "critical";
  if (daysLeft <= 30) return "warning";
  return null;
}

function AlarmBadge({
  daysLeft,
  label,
}: {
  daysLeft: number | null;
  label: string;
}) {
  const level = alarmLevel(daysLeft);
  if (!level) return null;
  const cfg = {
    overdue: {
      cls: "bg-red-100 text-red-700 border border-red-200",
      icon: <AlertTriangle size={10} className="shrink-0" />,
    },
    critical: {
      cls: "bg-orange-100 text-orange-700 border border-orange-200",
      icon: <AlertTriangle size={10} className="shrink-0" />,
    },
    warning: {
      cls: "bg-amber-100 text-amber-700 border border-amber-200",
      icon: <Clock size={10} className="shrink-0" />,
    },
  }[level];
  const text =
    daysLeft! < 0 ? `${Math.abs(daysLeft!)}d overdue` : `${daysLeft}d left`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {label}: {text}
    </span>
  );
}

function DateComputedCell({
  daysLeft,
  date,
}: {
  daysLeft: number | null;
  date: Date | null;
}) {
  if (!date) return <span className="text-[#9a9a96]">—</span>;
  const level = alarmLevel(daysLeft);
  const fmtd = format(date, "dd/MM/yyyy");
  if (!level)
    return (
      <span className="text-base text-[#1a1a1a] whitespace-nowrap">{fmtd}</span>
    );
  const textCls =
    level === "overdue"
      ? "text-red-600"
      : level === "critical"
        ? "text-orange-600"
        : "text-amber-600";
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-base font-medium whitespace-nowrap ${textCls}`}>
        {fmtd}
      </span>
      <AlarmBadge
        daysLeft={daysLeft}
        label={level === "overdue" ? "Overdue" : "Due"}
      />
    </div>
  );
}

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

const ProvisionalAttachmentComponent = () => {
  const supabase = clientConnectionWithSupabase();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [records, setRecords] = useState<ProvisionalAttachmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Map from GSTIN/PAN → SCN no fetched from dggi_scn_records
  const [scnByGstin, setScnByGstin] = useState<Map<string, string>>(new Map());
  const [scnOptions, setScnOptions] = useState<ScnOption[]>([]);

  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<
    Partial<ProvisionalAttachmentRecord>
  >({});

  // ── Bootstrap ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      const [{ data: userRow }, { data: groupRows }] = await Promise.all([
        supabase
          .from("votum_users")
          .select("dggi_role")
          .eq("id", uid!)
          .single(),
        supabase
          .from("dggi_user_group_assignments")
          .select("group_name")
          .eq("user_id", uid!),
      ]);
      const role = userRow?.dggi_role ?? "";
      const groups = (groupRows ?? []).map(
        (g: { group_name: string }) => g.group_name,
      );

      const [cases, , usersRes] = await Promise.all([
        fetchCaseOptions(supabase, wid),
        Promise.all([fetchRecords(wid, role, groups, uid!), fetchScnMap(wid)]),
        getAllUsers(),
      ]);
      setCaseOptions(cases);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
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
      .from("dggi_provisional_attachment_records")
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

  // Fetch SCN numbers keyed by gstin_pan from the SCN register so we can
  // auto-display them as a backlink when the noticee GSTIN/PAN matches.
  const fetchScnMap = async (wid: string) => {
    const { data } = await supabase
      .from("dggi_scn_records")
      .select("gstin_pan,scn_no,date_of_scn,noticee_name")
      .eq("workspace_id", wid);
    if (!data) return;
    const map = new Map<string, string>();
    const opts: ScnOption[] = [];
    for (const row of data) {
      if (row.gstin_pan && row.scn_no) {
        map.set(row.gstin_pan, row.scn_no);
      }
      if (row.scn_no) {
        opts.push({
          scn_no: row.scn_no,
          date_of_scn: row.date_of_scn ?? "",
          noticee_name: row.noticee_name ?? "",
        });
      }
    }
    setScnByGstin(map);
    setScnOptions(opts);
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.alarmOnly ? 1 : 0);

  const tableRecords = records
    .filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hit = [
          r.person_name,
          r.gstin_pan,
          r.entity_gstin,
          r.issue_involved,
          r.group_sio,
        ].some((v) => v?.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (
        filters.dateFrom &&
        r.date_of_attachment &&
        r.date_of_attachment < filters.dateFrom
      )
        return false;
      if (
        filters.dateTo &&
        r.date_of_attachment &&
        r.date_of_attachment > filters.dateTo
      )
        return false;
      if (filters.alarmOnly) {
        const { daysToExpiry, daysToScnDue } = computedDates(
          r.date_of_attachment,
          r.date_of_scn_issuance,
          r.date_of_release,
        );
        const hasAlarm =
          alarmLevel(daysToExpiry) !== null ||
          alarmLevel(daysToScnDue) !== null;
        if (!hasAlarm) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  // Count records with active alarms for the badge
  const alarmCount = records.filter((r) => {
    const { daysToExpiry, daysToScnDue } = computedDates(
      r.date_of_attachment,
      r.date_of_scn_issuance,
      r.date_of_release,
    );
    return (
      alarmLevel(daysToExpiry) !== null || alarmLevel(daysToScnDue) !== null
    );
  }).length;

  // ── CRUD ──────────────────────────────────────────────────────────────────────

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const { error } = await supabase
      .from("dggi_provisional_attachment_records")
      .update(sanitizeForDb(dialogDraft))
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
      const { error } = await supabase
        .from("dggi_provisional_attachment_records")
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
      .from("dggi_provisional_attachment_records")
      .insert({
        ...sanitizeForDb(dialogDraft),
        record_id: await generateWorkspaceRecordId(
          supabase,
          "dggi_provisional_attachment_records",
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
      setDialogOpen(false);
      toast.success("Record added");
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

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    exportRegisterToExcel(
      tableRecords,
      COLUMNS,
      "Provisional_Attachment",
      (msg) => toast.success(msg),
    );
  };

  // ── Row renderer ──────────────────────────────────────────────────────────────

  const renderCell = (
    value: string,
    colKey: string,
    type: RegisterColumn["type"],
    record: ProvisionalAttachmentRecord,
  ) => {
    // Special display for linked_scn_no: show auto-detected or manually-entered SCN
    if (colKey === "linked_scn_no") {
      const autoScn = record.gstin_pan
        ? (scnByGstin.get(record.gstin_pan) ?? null)
        : null;
      const displayLinkedScn = record.linked_scn_no || autoScn;
      return (
        <div className="flex flex-col gap-0.5">
          {displayLinkedScn ? (
            <div className="flex items-center gap-1">
              <Link2 size={11} className="text-[#4A5FD4] shrink-0" />
              <span className="text-base text-[#4A5FD4] font-medium">
                {displayLinkedScn}
              </span>
              {autoScn && !record.linked_scn_no && (
                <span className="text-[10px] text-[#9a9a96] bg-[#F3F2EF] rounded px-1">
                  auto
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#9a9a96]">—</span>
          )}
        </div>
      );
    }
    if (type === "usercombobox")
      return (
        <span>
          {workspaceUsers.find((u) => u.id === value)?.name || value || "—"}
        </span>
      );
    if (type === "caselink")
      return (
        <CaseIdCombobox
          value={value}
          onChange={() => {}}
          cases={caseOptions}
          editing={false}
        />
      );
    if (type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value)}</span>;
    return <span>{value || "—"}</span>;
  };

  // ── Render ────────────────────────────────────────────────────────────────────

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
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">
                Provisional Attachment Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                {tableRecords.length} record
                {tableRecords.length !== 1 ? "s" : ""}
                {alarmCount > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                    <AlertTriangle size={10} />
                    {alarmCount} deadline alert{alarmCount !== 1 ? "s" : ""}
                  </span>
                )}
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

        {/* ── Filter bar ──────────────────────────────────────────────────────── */}
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
                placeholder="Search person, GSTIN, issue, formation…"
                className="h-9 pl-8 pr-3 min-w-[260px] border-[#EDEDEA] text-base rounded-lg"
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

            {/* Date of Attachment range */}
            <div className="flex items-center gap-1">
              <span className="text-base text-[#9a9a96] shrink-0">
                Attachment:
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

            {/* Alarm filter toggle */}
            <button
              onClick={() => setFilter("alarmOnly", !filters.alarmOnly)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-base transition-all ${
                filters.alarmOnly
                  ? "bg-red-50 border-red-200 text-red-700 font-medium"
                  : "border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"
              }`}
            >
              <AlertTriangle size={12} />
              Alarms only
              {alarmCount > 0 && (
                <span
                  className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${filters.alarmOnly ? "bg-red-200 text-red-700" : "bg-[#6b6b6b] text-white"}`}
                >
                  {alarmCount}
                </span>
              )}
            </button>

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

        {/* ── Records table ───────────────────────────────────────────────────── */}
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
                  {/* Computed columns — not sortable */}
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap min-w-[160px]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-amber-500" />
                      SCN Due Date
                      <span className="text-[10px] font-normal text-[#9a9a96]">
                        (9mo)
                      </span>
                    </span>
                  </TableHead>
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap min-w-[160px]">
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={12} className="text-orange-500" />
                      Expiry Date
                      <span className="text-[10px] font-normal text-[#9a9a96]">
                        (1yr)
                      </span>
                    </span>
                  </TableHead>
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tableRecords.map((record) => {
                  const { expiryDate, scnDueDate, daysToExpiry, daysToScnDue } =
                    computedDates(
                      record.date_of_attachment ?? "",
                      record.date_of_scn_issuance,
                      record.date_of_release,
                    );
                  return (
                    <TableRow
                      key={record.id}
                      data-record-id={record.record_id}
                      className="border-b border-[#EDEDEA] text-base hover:bg-white"
                    >
                      {COLUMNS.map((col) => (
                        <TableCell
                          key={col.key}
                          className="px-3 py-2 text-[#1a1a1a]"
                        >
                          {renderCell(
                            (record as any)[col.key] ?? "",
                            col.key,
                            col.type,
                            record,
                          )}
                        </TableCell>
                      ))}

                      {/* Computed: SCN Due Date (9 months) */}
                      <TableCell className="px-3 py-2">
                        <DateComputedCell
                          daysLeft={daysToScnDue}
                          date={scnDueDate}
                        />
                      </TableCell>

                      {/* Computed: Expiry Date (1 year) */}
                      <TableCell className="px-3 py-2">
                        <DateComputedCell
                          daysLeft={daysToExpiry}
                          date={expiryDate}
                        />
                      </TableCell>

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
                                <AlertDialogTitle>
                                  Delete attachment record?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete{" "}
                                  {record.record_id} and cannot be undone.
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
                })}

                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      No records match the current filters.{" "}
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
        columns={COLUMNS}
        draft={dialogDraft as Record<string, string>}
        onDraftChange={(k, v) => {
          setDialogDraft((prev) => {
            const next = { ...prev, [k]: v };
            if (k === "linked_case_id" && dialogMode === "add") {
              const caseRow = caseOptions.find((c) => c.record_id === v);
              if (caseRow) {
                if (!prev.gstin_pan) next.gstin_pan = caseRow.gstins ?? "";
                if (!prev.entity_gstin)
                  next.entity_gstin = caseRow.gstins ?? "";
                if (!prev.group_sio)
                  next.group_sio = caseRow.handling_io_sio ?? "";
                if (!prev.sio) next.sio = caseRow.handling_io_sio ?? "";
                if (!prev.group) next.group = caseRow.group ?? "";
              }
            }
            return next;
          });
        }}
        onMultiDraftChange={(patches) =>
          setDialogDraft((prev) => ({ ...prev, ...patches }))
        }
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        caseOptions={caseOptions}
        users={workspaceUsers}
        scnOptions={scnOptions}
      />
    </div>
  );
};

export default ProvisionalAttachmentComponent;
