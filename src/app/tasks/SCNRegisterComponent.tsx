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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import { DGGI_GROUPS } from "@/lib/dggi-constants";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarIcon,
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
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import {
  currentFY,
  deletedRowClass,
  exportRegisterToExcel,
  fetchCaseOptionsByIds,
  fmtLakhs,
  isDeleted,
  mergeCaseOptions,
  nullifyEmpty,
  REGISTER_PREFIXES,
  restoreRecord,
  softDeleteRecord,
} from "./register-utils";
import {
  RegisterRecordDialog,
  type RegisterColumn,
} from "./RegisterRecordDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SCNRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  date_of_scn: string;
  noticee_name: string;
  gstin_pan: string;
  demand_tax: string;
  demand_penalty: string;
  demand_interest: string;
  period_involved: string;
  last_date_oio: string;
  issue: string;
  adjudicating_authority: string;
  adjudication_formation: string;
  file_no: string;
  date_uploading_bo: string;
  adjudication_status: string;
  remarks: string;
  sio: string;
  sio_name: string;
  scn_issuing_authority: string;
  scn_issuing_authority_name: string;
  group: string;
  competency: string;
  common_adjudicating_authority: string;
  division_and_range: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  oioDateFrom: string;
  oioDateTo: string;
  noOioDate: boolean;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  oioDateFrom: "",
  oioDateTo: "",
  noOioDate: false,
};

const today = () => format(new Date(), "yyyy-MM-dd");

const EMPTY_RECORD: Omit<SCNRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  date_of_scn: today(),
  noticee_name: "",
  gstin_pan: "",
  demand_tax: "",
  demand_penalty: "",
  demand_interest: "",
  period_involved: "",
  last_date_oio: "",
  issue: "",
  adjudicating_authority: "",
  adjudication_formation: "",
  file_no: "",
  date_uploading_bo: "",
  adjudication_status: "",
  remarks: "",
  sio: "",
  sio_name: "",
  scn_issuing_authority: "",
  scn_issuing_authority_name: "",
  group: "",
  competency: "",
  common_adjudicating_authority: "",
  division_and_range: "",
  deleted_at: null,
  deleted_by: null,
};

// ─── Column definitions ───────────────────────────────────────────────────────

const APPEAL_STAGE_OPTIONS = [
  "Review",
  "GSTAT",
  "Commissioner Appeal",
  "High Court",
  "Supreme Court",
  "Lower Court",
];

const ADJUDICATING_AUTHORITY_OPTIONS = [
  "SIO/Superintendent",
  "DC/AC (Adjudication)",
  "JC/ADC (Adjudication)",
  "Commissioner (Adjudication)",
  "Principal Commissioner (Adjudication)",
  "CESTAT",
];

const COMMISSIONERATE_OPTIONS = [
  "AGARTALA - UX",
  "AGRA - ZX",
  "AHMEDABAD NORTH - WT",
  "AHMEDABAD SOUTH - WS",
  "AIZAWL - UW",
  "ALLAHABAD - ZV",
  "ALWAR - WO",
  "AURANGABAD - VJ",
  "BELAGAVI - TC",
  "BELAPUR - VU",
  "BENGALURU EAST - YT",
  "BENGALURU NORTH - YW",
  "BENGALURU NORTH WEST - YX",
  "BENGALURU SOUTH - YV",
  "BENGALURU WEST - YU",
  "BHAVNAGAR - WW",
  "BHIWANDI - VQ",
  "BHOPAL - UI",
  "BHUBANESHWAR - WJ",
  "BOLPUR - WF",
  "CHANDIGARH - ZC",
  "CHENNAI NORTH - TK",
  "CHENNAI OUTER - XL",
  "CHENNAI SOUTH - TL",
  "COIMBATORE - XM",
  "DAMAN - TB",
  "DEHARADUN - YF",
  "DELHI EAST - ZK",
  "DELHI NORTH - ZI",
  "DELHI SOUTH - ZJ",
  "DELHI WEST - ZL",
  "DIBRUGARH - UR",
  "DIMAPUR - UU",
  "FARIDABAD - ZP",
  "GANDHINAGAR - WU",
  "GAUTAM BUDDHA NAGAR - YD",
  "GHAZIABAD - YE",
  "GOA - UF",
  "GUNTUR - YK",
  "GURUGRAM - ZO",
  "GUWAHATI - UQ",
  "HALDIA - WD",
  "HOWRAH - WC",
  "HYDERABAD - YN",
  "IMPHAL - UV",
  "INDORE - UJ",
  "ITANAGAR - UT",
  "JABALPUR - UK",
  "JAIPUR - WM",
  "JALANDHAR - ZE",
  "JAMMU - ZA",
  "JAMSHEDPUR - XX",
  "JODHPUR - WN",
  "KANPUR - ZW",
  "KOCHI - TI",
  "KOLHAPUR - UE",
  "KOLKATA NORTH - WA",
  "KOLKATA SOUTH - WB",
  "KOZHIKODE - TJ",
  "KUTCH (GANDHIDHAM) - WX",
  "LUCKNOW - ZU",
  "LUDHIANA - ZD",
  "MADURAI - XO",
  "MANGALORE - YZ",
  "MEDCHAL - YP",
  "MEERUT - YB",
  "MUMBAI CENTRAL - VO",
  "MUMBAI EAST - VM",
  "MUMBAI SOUTH - VN",
  "MUMBAI WEST - VP",
  "MYSURU - YY",
  "NAGPUR I - VG",
  "NAGPUR II - VH",
  "NASHIK - VI",
  "NAVI MUMBAI - VW",
  "NOIDA - YC",
  "PALGHAR - VV",
  "PANCHKULA - ZQ",
  "PATNA I - XU",
  "PATNA II - XV",
  "PUDUCHERRY - XQ",
  "PUNE I - UC",
  "PUNE II - UD",
  "RAIGARH - VT",
  "RAIPUR - UM",
  "RAJKOT - WV",
  "RANCHI - XW",
  "RANGAREDDY - YQ",
  "ROHTAK - ZR",
  "ROURKELA - WK",
  "SALEM - XP",
  "SECUNDERABAD - YO",
  "SHILLONG - US",
  "SHIMLA - ZB",
  "SILIGURI - WE",
  "SURAT - VC",
  "THANE - VR",
  "THANE RURAL - VS",
  "THIRUVANANTHAPURAM - TH",
  "TIRUCHIRAPALLY - XN",
  "TIRUPATI - YL",
  "UDAIPUR - WP",
  "UJJAIN - UL",
  "VADODARA I - TA",
  "VADODARA II - VB",
  "VARANASI - ZY",
  "VISAKHAPATNAM - YJ",
];

const ISSUE_OPTIONS = [
  "Classification",
  "Valuation",
  "ITC",
  "Fake Invoices",
  "Exports",
  "Refund",
  "Registration",
  "Short Payment",
  "Non-Payment",
  "Others",
];

const COMPETENCY_OPTIONS = [
  "SIO Competency",
  "AD/DD Competency",
  "JC/ADC Competency",
];

const ADJUDICATION_STATUS_OPTIONS = [
  "Pending",
  "OIO Issued",
  "Dropped",
  "Partly Confirmed",
  "Fully Confirmed",
  "Remanded Back",
  "Appeal Pending",
  "Disposed",
];

const COLUMNS: RegisterColumn[] = [
  {
    key: "record_id",
    label: "ID",
    type: "text",
    width: "200px",
    readOnly: true,
  },
  {
    key: "linked_case_id",
    label: "Linked Case",
    type: "caselink",
    width: "180px",
  },
  {
    key: "date_of_scn",
    label: "Date of SCN",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "noticee_name",
    label: "Name of Noticee",
    type: "text",
    width: "160px",
  },
  { key: "gstin_pan", label: "GSTIN/PAN", type: "text", width: "150px" },
  {
    key: "demand_tax",
    label: "Demand - Tax (₹L)",
    dialogLabel: "Demand - Tax (₹)",
    type: "number",
    width: "150px",
  },
  {
    key: "demand_penalty",
    label: "Demand - Penalty (₹L)",
    dialogLabel: "Demand - Penalty (₹)",
    type: "number",
    width: "170px",
  },
  {
    key: "demand_interest",
    label: "Demand - Interest (₹L)",
    dialogLabel: "Demand - Interest (₹)",
    type: "number",
    width: "170px",
  },
  {
    key: "period_involved",
    label: "Period Involved (YY-YY)",
    type: "text",
    width: "180px",
    dialogLabel: "Period Involved (YY-YY, e.g. 23-24)",
  },
  {
    key: "last_date_oio",
    label: "Last Date of OIO",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "issue",
    label: "Issue",
    type: "select",
    options: ISSUE_OPTIONS,
    allowOther: true,
    width: "220px",
  },
  {
    key: "adjudicating_authority",
    label: "Adjudicating Authority",
    type: "select",
    options: ADJUDICATING_AUTHORITY_OPTIONS,
    allowOther: true,
    width: "200px",
  },
  {
    key: "common_adjudicating_authority",
    label: "Common Adjudicating Authority",
    type: "select",
    options: ["Yes", "No"],
    width: "200px",
  },
  {
    key: "adjudication_formation",
    label: "Adjudication Formation",
    type: "searchcombobox",
    options: COMMISSIONERATE_OPTIONS,
    width: "220px",
  },
  { key: "file_no", label: "File No.", type: "text", width: "120px" },
  {
    key: "division_and_range",
    label: "Division and Range",
    type: "text",
    width: "180px",
  },
  {
    key: "date_uploading_bo",
    label: "Date of Uploading on BO Portal",
    type: "datepicker",
    width: "200px",
  },
  {
    key: "adjudication_status",
    label: "Adjudication Status",
    type: "select",
    options: ADJUDICATION_STATUS_OPTIONS,
    allowOther: true,
    width: "180px",
  },
  {
    key: "sio",
    label: "SIO",
    type: "usercombobox",
    width: "220px",
  },
  {
    key: "scn_issuing_authority",
    label: "SCN Issuing Authority *",
    type: "usercombobox",
    width: "200px",
  },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: DGGI_GROUPS,
    width: "120px",
  },
  {
    key: "competency",
    label: "Competency",
    type: "select",
    options: COMPETENCY_OPTIONS,
    width: "170px",
  },
  { key: "remarks", label: "Remarks", type: "text", width: "160px" },
];

const TOTAL_COLS = COLUMNS.length + 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
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
            format(parsed, "dd-MM-yyyy")
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

const SCNRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const searchParams = useSearchParams();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [records, setRecords] = useState<SCNRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const initialSearch =
    searchParams.get("filter") ?? searchParams.get("highlight") ?? "";
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: initialSearch,
  });

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);
  const {
    allUsers: workspaceUsers,
    sioUsers,
    loading: usersLoading,
  } = useGroupFilteredSioUsers();

  const [activeTab, setActiveTab] = useState<string>("SIO Competency");
  const [currentPage, setCurrentPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<SCNRecord>>({});
  // Map record_id → case details for auto-populating SCN fields

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (uid) setCurrentUserId(uid);
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
      setUserRole(role);
      const groups = (groupRows ?? []).map(
        (g: { group_name: string }) => g.group_name,
      );

      const loadedRecords = await fetchRecords(wid, role, groups, uid!);
      const linkedCases = await fetchCaseOptionsByIds(
        supabase,
        wid,
        (loadedRecords ?? []).map((r) => r.linked_case_id),
      );
      setCaseOptions(linkedCases);
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
      .from("dggi_scn_records")
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
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) {
      console.error("fetchRecords error:", error);
      return [];
    }
    setRecords(data ?? []);
    return data ?? [];
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.oioDateFrom ? 1 : 0) +
    (filters.oioDateTo ? 1 : 0) +
    (filters.noOioDate ? 1 : 0);

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const tableRecords = records
    .filter((r) => {
      const comp = r.competency || "SIO Competency";
      return comp === activeTab;
    })
    .filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hit = [r.noticee_name, r.gstin_pan, r.file_no, r.record_id].some(
          (v) => v?.toLowerCase().includes(q),
        );
        if (!hit) return false;
      }

      if (filters.dateFrom && r.date_of_scn < filters.dateFrom) return false;
      if (filters.dateTo && r.date_of_scn > filters.dateTo) return false;
      if (filters.noOioDate && r.last_date_oio) return false;
      if (
        filters.oioDateFrom &&
        (!r.last_date_oio || r.last_date_oio < filters.oioDateFrom)
      )
        return false;
      if (
        filters.oioDateTo &&
        (!r.last_date_oio || r.last_date_oio > filters.oioDateTo)
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      if (!sortCol) {
        const ac = (a as any).created_at ?? "";
        const bc = (b as any).created_at ?? "";
        return bc.localeCompare(ac);
      }
      const av = (a as any)[sortCol] ?? "";
      const bv = (b as any)[sortCol] ?? "";
      const na = Number(av);
      const nb = Number(bv);
      const cmp =
        !isNaN(na) && !isNaN(nb)
          ? na - nb
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const { record_id: _locked, ...editableFields } = dialogDraft as SCNRecord;
    const updatePayload = nullifyEmpty({ ...editableFields }, COLUMNS);
    (updatePayload as any).sio_name =
      workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name ||
      null;
    (updatePayload as any).scn_issuing_authority_name =
      workspaceUsers.find((u) => u.id === (dialogDraft.scn_issuing_authority ?? ""))?.name ||
      null;
    const { error } = await supabase
      .from("dggi_scn_records")
      .update(updatePayload)
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

  const restoreRecordRow = async (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deleted_at: null, deleted_by: null } : r)),
    );
    const { error } = await restoreRecord(supabase, "dggi_scn_records", id);
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
        r.id === id ? { ...r, deleted_at: stamp, deleted_by: currentUserId || null } : r,
      ),
    );
    const { error } = await softDeleteRecord(
      supabase,
      "dggi_scn_records",
      id,
      currentUserId || null,
    );
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
    if (!dialogDraft.scn_issuing_authority) {
      toast.error("SCN Issuing Authority is required.");
      return;
    }
    setSavingRow(true);
    let recordId: string;
    try {
      recordId = await generateSCNRecordId(dialogDraft);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to generate SCN number.",
      );
      setSavingRow(false);
      return;
    }
    const payload = nullifyEmpty(
      {
        ...dialogDraft,
        record_id: recordId,
        workspace_id: workspaceId,
      },
      COLUMNS,
    );
    (payload as any).sio_name =
      workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name ||
      null;
    (payload as any).scn_issuing_authority_name =
      workspaceUsers.find((u) => u.id === (dialogDraft.scn_issuing_authority ?? ""))?.name ||
      null;
    (payload as any).created_by = currentUserId || null;
    (payload as any).created_by_name =
      workspaceUsers.find((u) => u.id === currentUserId)?.name || null;
    const { data, error } = await supabase
      .from("dggi_scn_records")
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

  const getInitials = (name: string): string =>
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

  const COMPETENCY_PREFIX: Record<string, string> = {
    "AD/DD Competency": REGISTER_PREFIXES.SCN_AD_DD,
    "SIO Competency": REGISTER_PREFIXES.SCN_SIO,
    "JC/ADC Competency": REGISTER_PREFIXES.SCN_ADD_JD,
  };

  // The designation segment carries the issuing authority's actual rank, so
  // AD (Assistant Director) and DD (Deputy Director) stay distinct, as do ADC
  // (Additional Director) and JD (Joint Director). Ranks outside the record's
  // competency tier are rejected outright rather than coerced — an SCN number
  // is an official identifier, so a hard failure beats a plausible-looking
  // but incorrect one.
  const COMPETENCY_DESIGNATIONS: Record<string, string[]> = {
    "AD/DD Competency": ["AD", "DD"],
    "JC/ADC Competency": ["ADC", "JD"],
    "SIO Competency": ["SIO", "IO"],
  };

  const resolveDesignation = (competency: string, rawRole: string): string => {
    // DD_INT / SIO_INT are the intelligence-wing variants of DD / SIO.
    const role = rawRole.replace(/_INT$/, "");
    const allowed = COMPETENCY_DESIGNATIONS[competency];
    if (!allowed)
      throw new Error(
        `Unknown competency "${competency}" — cannot derive the SCN designation.`,
      );
    if (!allowed.includes(role))
      throw new Error(
        `The SCN Issuing Authority's designation (${rawRole || "not set"}) is not valid for ${competency}. Expected ${allowed.join(" or ")}.`,
      );
    return role;
  };

  const generateSCNRecordId = async (
    draft: Partial<SCNRecord>,
  ): Promise<string> => {
    // Every segment is validated before the sequence is consumed: next_seq_val
    // commits its increment immediately, so throwing afterwards would burn a
    // number and leave a permanent gap in the register.
    const competency = draft.competency ?? "";
    const prefix = COMPETENCY_PREFIX[competency];
    if (!prefix)
      throw new Error(
        `Competency is required to generate an SCN number${competency ? ` (unrecognised value "${competency}")` : ""}.`,
      );

    const fy = draft.date_of_scn ? fyFromDate(draft.date_of_scn) : currentFY();
    if (!fy)
      throw new Error(
        `Date of SCN "${draft.date_of_scn}" is not a valid date — cannot determine the financial year.`,
      );

    const grp = (draft.group ?? "").split(" ").pop() ?? "";
    if (!grp) throw new Error("Group is required to generate an SCN number.");

    const issuingUser = workspaceUsers.find(
      (u) => u.id === draft.scn_issuing_authority,
    );
    if (!issuingUser)
      throw new Error(
        "SCN Issuing Authority is required to generate an SCN number.",
      );

    const designation = resolveDesignation(
      competency,
      issuingUser.dggi_role ?? "",
    );

    const initials = getInitials(issuingUser.name);
    if (!initials)
      throw new Error(
        `Cannot derive initials from the SCN Issuing Authority's name ("${issuingUser.name}").`,
      );

    const { data, error } = await supabase.rpc("next_seq_val", {
      p_workspace_id: workspaceId,
      p_prefix: prefix,
      p_fy: fy,
    });
    if (error)
      throw new Error(`Failed to generate record ID: ${error.message}`);
    const seq = String(data as number).padStart(2, "0");
    return `${seq}/Grp-${grp}/${designation}/${initials}`;
  };

  const fyFromDate = (iso: string): string => {
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return "";
    const yr = d.getFullYear();
    const start = d.getMonth() >= 3 ? yr : yr - 1;
    return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
  };

  const handleDraftChange = (key: string, value: string) => {
    setDialogDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "linked_case_id" && dialogMode === "add") {
        const caseRow = caseOptions.find((c) => c.record_id === value);
        if (caseRow) {
          if (!prev.noticee_name)
            next.noticee_name = caseRow.taxpayer_name ?? "";
          if (!prev.gstin_pan) next.gstin_pan = caseRow.gstins ?? "";
          if (!prev.period_involved)
            next.period_involved = fyFromDate(caseRow.date_of_receipt ?? "");
          if (!prev.sio) next.sio = caseRow.handling_io_sio ?? "";
          if (!prev.group) next.group = caseRow.group ?? "";
          if (!prev.file_no) next.file_no = caseRow.file_no ?? "";
        }
      }
      return next;
    });
  };

  const toggleSort = (col: string) => {
    setCurrentPage(1);
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleExport = () => {
    exportRegisterToExcel(
      tableRecords,
      COLUMNS,
      "SCN",
      (msg) => toast.success(msg),
      workspaceUsers,
    );
  };

  // ── Row renderer ───────────────────────────────────────────────────────────

  const renderCell = (
    value: string,
    type: RegisterColumn["type"],
    storedName?: string,
  ) => {
    if (type === "usercombobox")
      return (
        <span>
          {workspaceUsers.find((u) => u.id === value)?.name ||
            storedName ||
            "—"}
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
    if (type === "number") {
      const n = parseFloat(value);
      if (!value || isNaN(n)) return <span className="text-[#9a9a96]">—</span>;
      return <span className="whitespace-nowrap">{fmtLakhs(value)}</span>;
    }
    return <span>{value || "—"}</span>;
  };

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(tableRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRecords = tableRecords.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
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
              <h1 className="text-xl font-medium text-[#1a1a1a]">
                SCN Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                Show Cause Notice Register &middot; {tableRecords.length} record
                {tableRecords.length !== 1 ? "s" : ""}
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
                  setDialogDraft({ ...EMPTY_RECORD, competency: activeTab });
                  setDialogOpen(true);
                }}
              >
                <Plus size={15} className="mr-1" />
                Add Record
              </Button>
            </div>
          </div>
        </div>

        {/* ── Competency Tabs ─────────────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setCurrentPage(1);
          }}
          className="w-full"
        >
          <TabsList className="mb-4 rounded-xl border border-[#EDEDEA] bg-white h-10 p-1">
            {COMPETENCY_OPTIONS.map((opt) => (
              <TabsTrigger
                key={opt}
                value={opt}
                className="rounded-lg text-base data-[state=active]:bg-[#EEF2FF] data-[state=active]:text-[#4A5FD4]"
              >
                {opt}
              </TabsTrigger>
            ))}
          </TabsList>

          {COMPETENCY_OPTIONS.map((opt) => (
            <TabsContent key={opt} value={opt} className="space-y-4">
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
                      placeholder="Search noticee, GSTIN/PAN, SCN no., ID, file no…"
                      className="h-9 pl-8 pr-3 min-w-[280px] border-[#EDEDEA] text-base rounded-lg"
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

                  {/* Date of SCN range */}
                  <div className="flex items-center gap-1">
                    <span className="text-base text-[#9a9a96] shrink-0">
                      SCN Date:
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

                  {/* Last Date of OIO range */}
                  <div className="flex items-center gap-1">
                    <span className="text-base text-[#9a9a96] shrink-0">
                      OIO Date:
                    </span>
                    <FilterDatePicker
                      value={filters.oioDateFrom}
                      placeholder="From"
                      onChange={(v) => setFilter("oioDateFrom", v)}
                    />
                    <span className="text-[#9a9a96]">—</span>
                    <FilterDatePicker
                      value={filters.oioDateTo}
                      placeholder="To"
                      onChange={(v) => setFilter("oioDateTo", v)}
                    />
                    {(filters.oioDateFrom || filters.oioDateTo) && (
                      <button
                        onClick={() => {
                          setFilter("oioDateFrom", "");
                          setFilter("oioDateTo", "");
                        }}
                        className="ml-0.5 text-[#9a9a96] hover:text-[#1a1a1a]"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setFilters({ ...EMPTY_FILTERS });
                        setCurrentPage(1);
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
              </div>

              {/* ── Records table ───────────────────────────────────────────── */}
              <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-auto max-h-[90vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white">
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
                    {pagedRecords.map((record) => {
                      const deleted = isDeleted(record);
                      return (
                      <TableRow
                        key={record.id}
                        data-record-id={record.record_id}
                        className={deletedRowClass(record, "border-b border-[#EDEDEA] text-base hover:bg-white")}
                      >
                        {COLUMNS.map((col) => (
                          <TableCell
                            key={col.key}
                            className="px-3 py-2 text-[#1a1a1a]"
                          >
                            {col.key === "record_id" ? (
                              deleted ? (
                                <span className="font-medium">
                                  {record.record_id || "—"}
                                </span>
                              ) : (
                              <button
                                className="text-[#4A5FD4] hover:underline font-medium text-left"
                                onClick={() => {
                                  setDialogMode("edit");
                                  setDialogDraft({ ...record });
                                  setDialogOpen(true);
                                }}
                              >
                                {record.record_id || "—"}
                              </button>
                              )
                            ) : (
                              renderCell(
                                (record as any)[col.key] ?? "",
                                col.type,
                                col.key === "sio"
                                  ? (record as any).sio_name
                                  : col.key === "scn_issuing_authority"
                                  ? (record as any).scn_issuing_authority_name
                                  : undefined,
                              )
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="px-3 py-2 no-underline">
                          <div className="flex items-center gap-1">
                            {!deleted && (
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
                            )}
                            {userRole === "DD_INT" && (
                              deleted ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-lg text-[#2F855A] hover:bg-[#DCFCE7]"
                                title="Restore"
                                onClick={() => restoreRecordRow(record.id)}
                              >
                                <RotateCcw size={13} />
                              </Button>
                              ) : (
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
                                    Delete SCN record?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will mark {record.record_id} as deleted.
                                    You can restore it afterwards.
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
                              )
                            )}
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
                          No SCN records match the current filters.{" "}
                          {activeFilterCount > 0 && (
                            <button
                              className="text-[#4A5FD4] underline"
                              onClick={() => {
                                setFilters({ ...EMPTY_FILTERS });
                                setCurrentPage(1);
                              }}
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

              {/* ── Pagination ────────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-base text-[#9a9a96]">
                    Page {safePage} of {totalPages} &middot;{" "}
                    {tableRecords.length} record
                    {tableRecords.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      «
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      ‹ Prev
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - safePage) <= 2,
                      )
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                          acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="px-1 text-[#9a9a96]"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            size="sm"
                            variant={p === safePage ? "default" : "outline"}
                            className={`h-8 w-8 rounded-lg text-base shadow-none p-0 ${
                              p === safePage
                                ? "bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white border-[#4A5FD4]"
                                : "border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"
                            }`}
                            onClick={() => setCurrentPage(p as number)}
                          >
                            {p}
                          </Button>
                        ),
                      )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40"
                      disabled={safePage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next ›
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none disabled:opacity-40"
                      disabled={safePage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      »
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <RegisterRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        columns={COLUMNS}
        draft={dialogDraft as Record<string, string>}
        onDraftChange={handleDraftChange}
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        caseOptions={caseOptions}
        workspaceId={workspaceId}
        onCasesDiscovered={(found) =>
          setCaseOptions((prev) => mergeCaseOptions(prev, found))
        }
        users={workspaceUsers}
      />
    </div>
  );
};

export default SCNRegisterComponent;
