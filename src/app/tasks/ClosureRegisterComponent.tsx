"use client";

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
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { exportRegisterToExcel } from "./register-utils";
import { type WorkspaceUser } from "./RegisterRecordDialog";

const TABLE_NAME = "dggi_closure_records";

interface ClosureRecord {
  id: string;
  record_id: string;
  source_record_id: string;
  is_ir: boolean;
  group: string;
  intel_source: string;
  date_of_receipt: string;
  taxpayer_name: string;
  gstins: string;
  file_no: string;
  date_of_initiation: string;
  intel_approved_date: string;
  mode_of_initiation: string;
  intelligence_action_date: string;
  handling_io_sio: string;
  issue_involved: string;
  latest_status: string;
  pr_adg_comments: string;
  detection_amount: string;
  recovery_itc: string;
  recovery_cash: string;
  digit_id: string;
  bo_id: string;
  hsn_code: string;
  closure_by: string;
  closure_reason: string;
  transferred_to: string;
  due_date: string;
  date_of_ir: string;
  date_of_non_ir: string;
  converted_from_non_ir: string;
  created_at: string;
}

type ActiveTab = "non-ir" | "ir";

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = { search: "", dateFrom: "", dateTo: "" };

type ColDef = {
  key: keyof Omit<ClosureRecord, "id" | "is_ir">;
  label: string;
  type: "text" | "datepicker" | "usercombobox";
  width?: string;
};

const SHARED_COLUMNS: ColDef[] = [
  { key: "record_id", label: "Closure ID", type: "text", width: "150px" },
  { key: "source_record_id", label: "Case ID", type: "text", width: "150px" },
  {
    key: "taxpayer_name",
    label: "Taxpayer / Entity",
    type: "text",
    width: "200px",
  },
  { key: "gstins", label: "GSTINs", type: "text", width: "180px" },
  { key: "file_no", label: "File No.", type: "text", width: "160px" },
  { key: "group", label: "Group", type: "text", width: "110px" },
  {
    key: "handling_io_sio",
    label: "Handling SIO",
    type: "usercombobox",
    width: "170px",
  },
  { key: "closure_by", label: "Closure Type", type: "text", width: "160px" },
  { key: "closure_reason", label: "Closure Reason", type: "text", width: "200px" },
  { key: "transferred_to", label: "Transferred To", type: "text", width: "180px" },
  {
    key: "due_date",
    label: "Closure Date",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "issue_involved",
    label: "Issue Involved",
    type: "text",
    width: "180px",
  },
  {
    key: "mode_of_initiation",
    label: "Mode of Initiation",
    type: "text",
    width: "170px",
  },
  {
    key: "detection_amount",
    label: "Detection Amount",
    type: "text",
    width: "170px",
  },
  { key: "recovery_itc", label: "Recovery ITC", type: "text", width: "150px" },
  {
    key: "recovery_cash",
    label: "Recovery Cash",
    type: "text",
    width: "150px",
  },
  { key: "digit_id", label: "DIGIT ID", type: "text", width: "140px" },
  { key: "bo_id", label: "BO ID", type: "text", width: "130px" },
  { key: "hsn_code", label: "HSN Code", type: "text", width: "130px" },
  {
    key: "latest_status",
    label: "Latest Status",
    type: "text",
    width: "170px",
  },
  {
    key: "date_of_receipt",
    label: "Date of Receipt",
    type: "datepicker",
    width: "155px",
  },
  {
    key: "date_of_initiation",
    label: "Date of Initiation",
    type: "datepicker",
    width: "165px",
  },
  {
    key: "intel_approved_date",
    label: "Intel Approved Date",
    type: "datepicker",
    width: "175px",
  },
];

const NON_IR_COLUMNS: ColDef[] = [
  ...SHARED_COLUMNS,
  {
    key: "date_of_non_ir",
    label: "Date of NON-IR",
    type: "datepicker",
    width: "160px",
  },
];

const IR_COLUMNS: ColDef[] = [
  ...SHARED_COLUMNS,
  {
    key: "date_of_ir",
    label: "Date of IR",
    type: "datepicker",
    width: "150px",
  },
];

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

const ClosureRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<ClosureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("non-ir");
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: searchParams?.get("caseId") ?? "",
  });
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
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

      let query = supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid);
      if (role !== "ADG" && role !== "DD_INT") {
        if (role === "IO" || role === "SIO") {
          query = query.eq("handling_io_sio", uid!);
        } else if (groups.length > 0) {
          query = query.in("group", groups);
        } else {
          query = query.eq("group", "__none__");
        }
      }
      const [{ data, error }] = await Promise.all([
        query,
      ]);
      if (!error) setRecords(data ?? []);
      setLoading(false);
    };
    init();
  }, []);

  const isIr = activeTab === "ir";
  const COLUMNS = isIr ? IR_COLUMNS : NON_IR_COLUMNS;
  const TOTAL_COLS = COLUMNS.length;

  const nonIrTotal = records.filter((r) => !r.is_ir).length;
  const irTotal = records.filter((r) => r.is_ir).length;

  const tableRecords = records
    .filter((r) => {
      if (r.is_ir !== isIr) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          ![
            r.source_record_id,
            r.taxpayer_name,
            r.file_no,
            r.gstins,
            r.closure_by,
          ].some((v) => v?.toLowerCase().includes(q))
        )
          return false;
      }
      if (filters.dateFrom && r.due_date && r.due_date < filters.dateFrom)
        return false;
      if (filters.dateTo && r.due_date && r.due_date > filters.dateTo)
        return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortCol) {
        const numOf = (id: string) => parseInt(id.split("-")[1] ?? "0", 10) || 0;
        return numOf(a.record_id) - numOf(b.record_id);
      }
      const cmp = String((a as any)[sortCol] ?? "").localeCompare(
        String((b as any)[sortCol] ?? ""),
      );
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "Closure", (msg) =>
      toast.success(msg),
    );
  };

  const renderCell = (record: ClosureRecord, col: ColDef) => {
    const value = (record as any)[col.key] ?? "";
    if (col.type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (col.type === "usercombobox")
      return (
        <span>
          {workspaceUsers.find((u) => u.id === value)?.name || value || "—"}
        </span>
      );
    return <span>{value || "—"}</span>;
  };

  if (loading || usersLoading)
    return (
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
              <h1 className="text-xl font-medium text-[#1a1a1a]">
                Closure Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                {isIr ? "IR" : "NON-IR"} Closures · {tableRecords.length} record
                {tableRecords.length !== 1 ? "s" : ""}
              </p>
            </div>
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
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-3">
          {(["non-ir", "ir"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setFilters({ ...EMPTY_FILTERS });
              }}
              className={`flex flex-col gap-1 rounded-2xl border px-6 py-4 text-left transition-all shadow-none min-w-[160px] ${activeTab === tab ? "border-[#4A5FD4] bg-[#EEF2FF]" : "border-[#EDEDEA] bg-white hover:bg-[#F3F2EF]"}`}
            >
              <span
                className={`text-3xl font-semibold ${activeTab === tab ? "text-[#4A5FD4]" : "text-[#1a1a1a]"}`}
              >
                {tab === "non-ir" ? nonIrTotal : irTotal}
              </span>
              <span
                className={`text-base font-medium ${activeTab === tab ? "text-[#4A5FD4]" : "text-[#6b6b6b]"}`}
              >
                {tab === "non-ir" ? "NON-IR Closures" : "IR Closures"}
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <SlidersHorizontal size={14} />
              <span className="font-medium">Filters</span>
            </div>
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-3 text-[#9a9a96] pointer-events-none"
              />
              <Input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search case ID, taxpayer, GSTIN…"
                className="h-9 pl-8 pr-3 min-w-[240px] border-[#EDEDEA] text-base rounded-lg"
              />
            </div>
            <FilterDatePicker
              value={filters.dateFrom}
              placeholder="From date"
              onChange={(v) => setFilter("dateFrom", v)}
            />
            <FilterDatePicker
              value={filters.dateTo}
              placeholder="To date"
              onChange={(v) => setFilter("dateTo", v)}
            />
            {(filters.search || filters.dateFrom || filters.dateTo) && (
              <button
                onClick={() => setFilters({ ...EMPTY_FILTERS })}
                className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"
              >
                <X size={13} />
                Clear
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
                        {sortCol === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          ))}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-b border-[#EDEDEA] text-base hover:bg-white"
                  >
                    {COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className="px-3 py-2 text-[#1a1a1a]"
                      >
                        {renderCell(record, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      No {isIr ? "IR" : "NON-IR"} closure records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosureRegisterComponent;
