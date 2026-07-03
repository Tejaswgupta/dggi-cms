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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DGGI_GROUPS, type GroupName } from "@/lib/dggi-constants";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { format, isValid, parseISO } from "date-fns";
import {
  AlertCircle,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Columns2,
  Download,
  FolderOpen,
  Layers,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { type DGGICaseOption } from "./CaseIdCombobox";
import {
  exportRegisterToExcel,
  generateWorkspaceRecordId,
  REGISTER_PREFIXES,
} from "./register-utils";
import {
  RegisterRecordDialog,
  type RegisterColumn,
  type ScnOption,
} from "./RegisterRecordDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUPS = DGGI_GROUPS;

type ModeOfInitiation =
  | "Letter"
  | "Email"
  | "Summons"
  | "Inspection"
  | "Search";

const MODE_OPTIONS: ModeOfInitiation[] = [
  "Letter",
  "Email",
  "Summons",
  "Inspection",
  "Search",
];

const OTHER_SENTINEL = "__other__";

type GroupByField =
  | "group"
  | "mode_of_initiation"
  | "handling_io_sio"
  | "is_ir";

const GROUP_BY_OPTIONS: { value: GroupByField; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "mode_of_initiation", label: "Mode of Initiation" },
  { value: "handling_io_sio", label: "Handling SIO" },
  { value: "is_ir", label: "IR / NON-IR" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DGGIRecord {
  id: string;
  record_id: string;
  group: GroupName;
  intel_source: string;
  date_of_receipt: string;
  taxpayer_name: string;
  gstins: string;
  file_no: string;
  date_of_initiation: string;
  intel_approved_date: string;
  mode_of_initiation: ModeOfInitiation | "";
  intelligence_action_date: string;
  handling_io_sio: string;
  handling_io_sio_name: string;
  issue_involved: string;
  latest_status: string;
  pr_adg_comments: string;
  due_date: string;
  closure_by: string;
  closure_reason: string;
  transferred_to: string;
  is_ir: boolean;
  date_of_ir: string;
  date_of_non_ir: string;
  detection_amount: string;
  recovery_itc: string;
  recovery_cash: string;
  digit_id: string;
  bo_id: string;
  hsn_code: string;
  converted_from_non_ir: string;
  pr_adg_comments_updated_at: string | null;
}

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
}

interface Filters {
  search: string;
  modes: string[];
  handlingIo: string;
  dateFrom: string;
  dateTo: string;
  dueDateYear: string;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  modes: [],
  handlingIo: "",
  dateFrom: "",
  dateTo: "",
  dueDateYear: "",
};

type TopFilter = "ir" | "non-ir";

const today = () => format(new Date(), "yyyy-MM-dd");

const IR_CLOSURE_OPTIONS = [
  "On Merit",
  "Closed After Payment of Tax",
  "Transfer To",
  "Show Cause Notice",
];
const NON_IR_CLOSURE_OPTIONS = ["Closed", "Transferred", "Convert to IR"];
const CLOSURE_NEEDS_REASON = new Set([
  "Closed",
  "On Merit",
  "Closed After Payment of Tax",
  "Show Cause Notice",
]);
const SOURCE_OPTIONS = ["Int", "Group", "STR"];
const DUE_DATE_YEAR_OPTIONS = ["2026", "2027", "2028"];
const ISSUE_INVOLVED_OPTIONS = [
  "Fake ITC",
  "Clandestine Supply",
  "Misclassification",
  "Online Gaming",
];

export const EMPTY_RECORD: Omit<DGGIRecord, "id"> = {
  record_id: "",
  group: "Group A",
  intel_source: "",
  date_of_receipt: today(),
  taxpayer_name: "",
  gstins: "",
  file_no: "",
  date_of_initiation: today(),
  intel_approved_date: "",
  mode_of_initiation: "",
  intelligence_action_date: "",
  handling_io_sio: "",
  handling_io_sio_name: "",
  issue_involved: "",
  latest_status: "",
  pr_adg_comments: "",
  due_date: "",
  closure_by: "",
  closure_reason: "",
  transferred_to: "",
  is_ir: true,
  date_of_ir: "",
  date_of_non_ir: "",
  detection_amount: "",
  recovery_itc: "",
  recovery_cash: "",
  digit_id: "",
  bo_id: "",
  hsn_code: "",
  converted_from_non_ir: "",
  pr_adg_comments_updated_at: null,
};

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

const groupKeyLabel = (field: GroupByField, raw: string) => {
  if (field === "is_ir") return raw === "true" ? "IR" : "NON-IR";
  return raw || "—";
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: {
  key: keyof Omit<DGGIRecord, "id">;
  label: string;
  type:
    | "text"
    | "datepicker"
    | "select"
    | "select-with-other"
    | "boolean"
    | "usercombobox";
  options?: string[];
  width?: string;
  readOnly?: boolean;
}[] = [
  {
    key: "record_id",
    label: "ID",
    type: "text",
    width: "140px",
    readOnly: true,
  },
  {
    key: "pr_adg_comments",
    label: "Pr.ADG Comments",
    type: "text",
    width: "200px",
  },
  {
    key: "date_of_ir",
    label: "Date of IR",
    type: "datepicker",
    width: "150px",
    readOnly: true,
  },
  {
    key: "converted_from_non_ir",
    label: "Non-IR Ref No.",
    type: "text",
    width: "150px",
    readOnly: true,
  },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: [...GROUPS],
    width: "120px",
  },
  {
    key: "intel_source",
    label: "Source",
    type: "select",
    options: SOURCE_OPTIONS,
    width: "120px",
  },
  {
    key: "taxpayer_name",
    label: "Taxpayer Name",
    type: "text",
    width: "150px",
  },
  { key: "gstins", label: "GSTIN(s) Involved", type: "text", width: "160px" },
  { key: "file_no", label: "File No.", type: "text", width: "110px" },
  {
    key: "mode_of_initiation",
    label: "Mode of Initiation",
    type: "select",
    options: MODE_OPTIONS,
    width: "140px",
  },
  {
    key: "intelligence_action_date",
    label: "Intelligence Action Date",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "handling_io_sio",
    label: "Handling SIO",
    type: "usercombobox",
    width: "170px",
  },
  {
    key: "issue_involved",
    label: "Issue Involved",
    type: "select-with-other",
    options: ISSUE_INVOLVED_OPTIONS,
    width: "160px",
  },
  {
    key: "detection_amount",
    label: "Detection (₹)",
    type: "text",
    width: "150px",
  },
  {
    key: "recovery_itc",
    label: "Recovery ITC (₹)",
    type: "text",
    width: "160px",
  },
  {
    key: "recovery_cash",
    label: "Recovery Cash (₹)",
    type: "text",
    width: "160px",
  },
  {
    key: "digit_id",
    label: "DIGIT ID",
    type: "text",
    width: "140px",
  },
  {
    key: "bo_id",
    label: "BO ID",
    type: "text",
    width: "120px",
  },
  {
    key: "latest_status",
    label: "Latest Status",
    type: "text",
    width: "180px",
  },
];

// Fields shown only in the IR form closure section, not as table columns
const IR_CLOSURE_FORM_COLS: (typeof COLUMNS)[number][] = [
  {
    key: "due_date",
    label: "Due Date / Closure Date",
    type: "datepicker",
    width: "160px",
  },
  {
    key: "closure_by",
    label: "Closure Reason",
    type: "select",
    options: IR_CLOSURE_OPTIONS,
    width: "160px",
  },
];

// ─── NON-IR table column definitions (yellow + green from non-IR02.xlsx) ─────

type ColDef = (typeof COLUMNS)[number];

// Fields used in the NON-IR form but not shown as table columns
const NON_IR_FORM_EXTRA: ColDef[] = [
  {
    key: "date_of_receipt",
    label: "Date of Receipt from Int Section",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "date_of_initiation",
    label: "Date of Initiation of File",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "intel_approved_date",
    label: "Intel Approved Date",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "mode_of_initiation",
    label: "Mode of Initiation",
    type: "select",
    options: MODE_OPTIONS,
    width: "140px",
  },
  {
    key: "intelligence_action_date",
    label: "Intelligence Action Date",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "issue_involved",
    label: "Issue Involved",
    type: "select-with-other",
    options: ISSUE_INVOLVED_OPTIONS,
    width: "160px",
  },
];

const NON_IR_COLUMNS: ColDef[] = [
  {
    key: "record_id",
    label: "NON-IR No.",
    type: "text",
    width: "140px",
    readOnly: true,
  },
  {
    key: "date_of_non_ir",
    label: "Date of NON-IR",
    type: "datepicker",
    width: "150px",
    readOnly: true,
  },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: [...GROUPS],
    width: "120px",
  },
  {
    key: "intel_source",
    label: "Source",
    type: "select",
    options: SOURCE_OPTIONS,
    width: "120px",
  },
  {
    key: "taxpayer_name",
    label: "Taxpayer Name",
    type: "text",
    width: "150px",
  },
  { key: "gstins", label: "GSTIN(s) Involved", type: "text", width: "160px" },
  { key: "file_no", label: "File No.", type: "text", width: "110px" },
  {
    key: "date_of_initiation",
    label: "Date of Initiation of File",
    type: "datepicker",
    width: "180px",
  },
  {
    key: "intel_approved_date",
    label: "Intel Approved Date",
    type: "datepicker",
    width: "160px",
  },
  {
    key: "mode_of_initiation",
    label: "Mode of Initiation",
    type: "select",
    options: MODE_OPTIONS,
    width: "160px",
  },
  {
    key: "intelligence_action_date",
    label: "Intelligence Action Date",
    type: "datepicker",
    width: "180px",
  },
  {
    key: "handling_io_sio",
    label: "Handling SIO",
    type: "usercombobox",
    width: "170px",
  },
  {
    key: "latest_status",
    label: "Latest Status",
    type: "text",
    width: "160px",
  },
  {
    key: "pr_adg_comments",
    label: "Pr.ADG Comments",
    type: "text",
    width: "200px",
  },
  // { key: "is_ir", label: "IR", type: "boolean", width: "90px" },
  // {
  //   key: "date_of_ir",
  //   label: "Date of IR",
  //   type: "datepicker",
  //   width: "150px",
  //   readOnly: true,
  // },
];

const NON_IR_CLOSURE_FORM_COLS: ColDef[] = [
  {
    key: "due_date",
    label: "Date of Closure",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "closure_by",
    label: "Closure Reason",
    type: "select",
    options: NON_IR_CLOSURE_OPTIONS,
    width: "160px",
  },
];

const LS_HIDDEN_COLS_KEY = "dggi_hidden_columns";
const LS_ADG_COMMENT_SEEN_KEY = "dggi_adg_comment_seen";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-2xl border px-6 py-4 text-left transition-all shadow-none min-w-[160px] ${
        active
          ? "border-[#4A5FD4] bg-[#EEF2FF]"
          : "border-[#EDEDEA] bg-white hover:bg-[#F3F2EF]"
      }`}
    >
      <span
        className={`text-3xl font-semibold ${active ? "text-[#4A5FD4]" : "text-[#1a1a1a]"}`}
      >
        {count}
      </span>
      <span
        className={`text-base font-medium ${active ? "text-[#4A5FD4]" : "text-[#6b6b6b]"}`}
      >
        {label}
      </span>
    </button>
  );
}

function GroupCard({
  name,
  count,
  active,
  onClick,
}: {
  name: GroupName;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-2xl border px-5 py-4 text-left shadow-none transition-all group ${
        active
          ? "border-[#4A5FD4] bg-[#EEF2FF]"
          : "border-[#EDEDEA] bg-white hover:border-[#4A5FD4] hover:bg-[#EEF2FF]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-base font-medium ${active ? "text-[#4A5FD4]" : "text-[#1a1a1a] group-hover:text-[#4A5FD4]"}`}
        >
          {name}
        </span>
        <FolderOpen
          size={16}
          className={
            active
              ? "text-[#4A5FD4]"
              : "text-[#9a9a96] group-hover:text-[#4A5FD4]"
          }
        />
      </div>
      <span className="text-2xl font-semibold text-[#4A5FD4]">{count}</span>
    </button>
  );
}

function DatePickerCell({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const parsed =
    value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-8 items-center gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] ${className ?? "w-[150px]"}`}
        >
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

function UserCombobox({
  value,
  onChange,
  users,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  users: WorkspaceUser[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-8 items-center justify-between gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] truncate ${className ?? "w-[160px]"}`}
        >
          <span className="truncate">
            {users.find((u) => u.id === value)?.name || (
              <span className="text-[#9a9a96]">Select user…</span>
            )}
          </span>
          <ChevronsUpDown size={12} className="text-[#9a9a96] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0 border border-[#EDEDEA] shadow-none rounded-xl"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search user…"
            value={query}
            onValueChange={setQuery}
            className="text-base"
          />
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty className="py-3 text-center text-base text-[#9a9a96]">
              No users found.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.name}
                  onSelect={() => {
                    onChange(u.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="text-base"
                >
                  <Check
                    size={13}
                    className={`mr-2 shrink-0 ${value === u.id ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{u.name}</span>
                    <span className="truncate text-[#9a9a96] text-sm">
                      {u.email}
                    </span>
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

function EditableCell({
  value,
  type,
  options,
  onChange,
  editing,
  users,
  readOnly,
  storedName,
}: {
  value: string | boolean;
  type:
    | "text"
    | "datepicker"
    | "select"
    | "select-with-other"
    | "boolean"
    | "usercombobox";
  options?: string[];
  onChange: (v: string | boolean) => void;
  editing: boolean;
  users?: WorkspaceUser[];
  readOnly?: boolean;
  storedName?: string;
}) {
  if (!editing || readOnly) {
    if (type === "boolean") {
      return (
        <Badge
          variant={value ? "default" : "secondary"}
          className={`text-base ${
            value
              ? "bg-[#EEF2FF] text-[#4A5FD4] border border-[#4A5FD4]"
              : "bg-[#F3F2EF] text-[#9a9a96] border border-[#EDEDEA]"
          }`}
        >
          {value ? "IR" : "NON-IR"}
        </Badge>
      );
    }
    if (type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value as string)}</span>;
    if (type === "usercombobox")
      return (
        <span>
          {users?.find((u) => u.id === (value as string))?.name ||
            storedName ||
            (value as string) ||
            "—"}
        </span>
      );
    return <span>{(value as string) || "—"}</span>;
  }

  if (type === "usercombobox") {
    return (
      <UserCombobox
        value={value as string}
        onChange={(v) => onChange(v)}
        users={users ?? []}
      />
    );
  }

  if (type === "datepicker") {
    return (
      <DatePickerCell value={value as string} onChange={(v) => onChange(v)} />
    );
  }

  if (type === "boolean") {
    return (
      <Select
        value={value ? "true" : "false"}
        onValueChange={(v) => onChange(v === "true")}
      >
        <SelectTrigger className="h-8 w-[90px] border-[#EDEDEA] text-base rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">IR</SelectItem>
          <SelectItem value="false">NON-IR</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (type === "select-with-other") {
    const knownOptions = options ?? [];
    const isOther = !!value && !knownOptions.includes(value as string);
    const selectValue = isOther ? OTHER_SENTINEL : (value as string) || "";
    return (
      <div className="flex flex-col gap-1">
        <Select
          value={selectValue}
          onValueChange={(v) => {
            if (v === OTHER_SENTINEL) {
              onChange("");
            } else {
              onChange(v);
            }
          }}
        >
          <SelectTrigger className="h-8 w-[150px] border-[#EDEDEA] text-base rounded-lg">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {knownOptions.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_SENTINEL}>Others…</SelectItem>
          </SelectContent>
        </Select>
        {(selectValue === OTHER_SENTINEL || isOther) && (
          <Input
            autoFocus
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter custom value…"
            className="h-8 w-[150px] border-[#EDEDEA] text-base rounded-lg"
          />
        )}
      </div>
    );
  }

  if (type === "select") {
    return (
      <Select value={value as string} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="h-8 w-[130px] border-[#EDEDEA] text-base rounded-lg">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options?.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
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

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-base transition-all ${
            selected.length > 0
              ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
              : "border-[#EDEDEA] bg-white text-[#1a1a1a] hover:bg-[#F3F2EF]"
          }`}
        >
          <span>{label}</span>
          {selected.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4A5FD4] text-xs text-white font-medium">
              {selected.length}
            </span>
          )}
          <ChevronDown size={13} className="text-[#9a9a96]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-2 border border-[#EDEDEA] shadow-none rounded-xl"
        align="start"
      >
        <div className="flex flex-col gap-1">
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base text-left transition-all ${
                  checked
                    ? "bg-[#EEF2FF] text-[#4A5FD4]"
                    : "text-[#1a1a1a] hover:bg-[#F3F2EF]"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked
                      ? "border-[#4A5FD4] bg-[#4A5FD4]"
                      : "border-[#EDEDEA]"
                  }`}
                >
                  {checked && <Check size={10} className="text-white" />}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserFilter({
  value,
  users,
  onChange,
}: {
  value: string;
  users: WorkspaceUser[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-base transition-all ${
            value
              ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
              : "border-[#EDEDEA] bg-white text-[#1a1a1a] hover:bg-[#F3F2EF]"
          }`}
        >
          <span className="max-w-[120px] truncate">
            {value || "Handling SIO"}
          </span>
          {value ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="ml-1 rounded-full hover:bg-[#c7d0f8] p-0.5"
            >
              <X size={11} />
            </span>
          ) : (
            <ChevronDown size={13} className="text-[#9a9a96]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0 border border-[#EDEDEA] shadow-none rounded-xl"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search user…"
            value={query}
            onValueChange={setQuery}
            className="text-base"
          />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-base text-[#9a9a96]">
              No users found.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.name}
                  onSelect={() => {
                    onChange(value === u.name ? "" : u.name);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="text-base"
                >
                  <Check
                    size={13}
                    className={`mr-2 shrink-0 ${value === u.name ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{u.name}</span>
                    <span className="truncate text-[#9a9a96] text-sm">
                      {u.email}
                    </span>
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

// ─── Intel source types ───────────────────────────────────────────────────────

type IntelSourceType = "rapid" | "str";

interface RapidRecord {
  id: string;
  record_id: string;
  rapid_id: string;
  file_no_ref_id: string;
  received_against_entity: string;
  assigned_group: string;
  date_of_action_taken: string;
  status: string;
  ir_date: string;
  adg_putup_date: string;
}

interface STRRecord {
  id: string;
  record_id: string;
  str_reference_no: string;
  date_of_str: string;
  entity_name: string;
  gstin: string;
  amount_involved: string;
  nature_of_offence: string;
  sio_group: string;
  status: string;
}

// ─── Create from Intel dialog ─────────────────────────────────────────────────

function CreateFromIntelDialog({
  open,
  onClose,
  workspaceId,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onConfirm: (
    draft: Omit<DGGIRecord, "id">,
    sourceType: IntelSourceType,
    sourceId: string,
  ) => void;
}) {
  const supabase = clientConnectionWithSupabase();
  const [sourceType, setSourceType] = useState<IntelSourceType>("rapid");
  const [rapidRecords, setRapidRecords] = useState<RapidRecord[]>([]);
  const [strRecords, setStrRecords] = useState<STRRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [confirmDraft, setConfirmDraft] = useState<Omit<
    DGGIRecord,
    "id"
  > | null>(null);
  const [selectedSourceRecord, setSelectedSourceRecord] = useState<
    RapidRecord | STRRecord | null
  >(null);

  useEffect(() => {
    if (!open || !workspaceId) return;
    setStep("select");
    setSelectedId("");
    setSearch("");
    setConfirmDraft(null);
    setSelectedSourceRecord(null);
    loadRecords();
  }, [open, workspaceId, sourceType]);

  const loadRecords = async () => {
    if (!workspaceId) return;
    setLoadingRecords(true);
    if (sourceType === "rapid") {
      const { data } = await supabase
        .from("dggi_intel_rapid_records")
        .select(
          "id, record_id, rapid_id, file_no_ref_id, received_against_entity, assigned_group, date_of_action_taken, status, ir_date, adg_putup_date",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      setRapidRecords(data ?? []);
    } else {
      const { data } = await supabase
        .from("dggi_str_records")
        .select(
          "id, record_id, str_reference_no, date_of_str, entity_name, gstin, amount_involved, nature_of_offence, sio_group, status",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      setStrRecords(data ?? []);
    }
    setLoadingRecords(false);
  };

  const filteredRapid = rapidRecords.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.rapid_id?.toLowerCase().includes(q) ||
      r.received_against_entity?.toLowerCase().includes(q) ||
      r.file_no_ref_id?.toLowerCase().includes(q) ||
      r.record_id?.toLowerCase().includes(q)
    );
  });

  const filteredStr = strRecords.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.str_reference_no?.toLowerCase().includes(q) ||
      r.entity_name?.toLowerCase().includes(q) ||
      r.gstin?.toLowerCase().includes(q) ||
      r.record_id?.toLowerCase().includes(q)
    );
  });

  const buildDraftFromRapid = (r: RapidRecord): Omit<DGGIRecord, "id"> => ({
    ...EMPTY_RECORD,
    taxpayer_name: r.received_against_entity ?? "",
    file_no: r.file_no_ref_id ?? "",
    group: (GROUPS.includes(r.assigned_group as GroupName)
      ? r.assigned_group
      : "Group A") as GroupName,
    intel_source: "Int",
    date_of_initiation: r.ir_date ?? today(),
    intel_approved_date: r.adg_putup_date ?? "",
    intelligence_action_date: r.date_of_action_taken ?? "",
    is_ir: true,
  });

  const buildDraftFromSTR = (r: STRRecord): Omit<DGGIRecord, "id"> => ({
    ...EMPTY_RECORD,
    taxpayer_name: r.entity_name ?? "",
    gstins: r.gstin ?? "",
    intel_source: "STR",
    date_of_receipt: r.date_of_str ?? today(),
    issue_involved: r.nature_of_offence ?? "",
    group: (GROUPS.includes(r.sio_group as GroupName)
      ? r.sio_group
      : "Group A") as GroupName,
    is_ir: false,
  });

  const handleSelectRecord = (id: string) => {
    setSelectedId(id);
    if (sourceType === "rapid") {
      const rec = rapidRecords.find((r) => r.id === id);
      if (rec) {
        setConfirmDraft(buildDraftFromRapid(rec));
        setSelectedSourceRecord(rec);
      }
    } else {
      const rec = strRecords.find((r) => r.id === id);
      if (rec) {
        setConfirmDraft(buildDraftFromSTR(rec));
        setSelectedSourceRecord(rec);
      }
    }
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!confirmDraft || !selectedId) return;
    onConfirm(confirmDraft, sourceType, selectedId);
    onClose();
  };

  const CHECKLIST_RAPID = [
    {
      label: "Received Against Entity",
      field: "received_against_entity" as keyof RapidRecord,
    },
    { label: "File No / Ref ID", field: "file_no_ref_id" as keyof RapidRecord },
    { label: "Assigned Group", field: "assigned_group" as keyof RapidRecord },
    { label: "ADG Putup Date", field: "adg_putup_date" as keyof RapidRecord },
    { label: "IR Date", field: "ir_date" as keyof RapidRecord },
  ];

  const CHECKLIST_STR = [
    { label: "Entity Name", field: "entity_name" as keyof STRRecord },
    { label: "GSTIN", field: "gstin" as keyof STRRecord },
    {
      label: "Nature of Offence",
      field: "nature_of_offence" as keyof STRRecord,
    },
    { label: "SIO Group", field: "sio_group" as keyof STRRecord },
    { label: "Date of STR", field: "date_of_str" as keyof STRRecord },
  ];

  const checklist = sourceType === "rapid" ? CHECKLIST_RAPID : CHECKLIST_STR;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl border border-[#EDEDEA] shadow-none font-['DM_Sans'] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#EDEDEA]">
          <DialogTitle className="text-lg font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Zap size={18} className="text-[#4A5FD4]" />
            Create Case from Intelligence
          </DialogTitle>
          <p className="text-base text-[#9a9a96] mt-1">
            Select an intelligence record to pre-fill a new case. You can edit
            all fields after.
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Source type toggle */}
          <div className="flex items-center gap-2">
            <span className="text-base text-[#6b6b6b] font-medium shrink-0">
              Source:
            </span>
            <div className="flex rounded-lg border border-[#EDEDEA] overflow-hidden">
              {(["rapid", "str"] as IntelSourceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSourceType(t);
                    setSelectedId("");
                    setStep("select");
                    setSearch("");
                  }}
                  className={`px-4 py-1.5 text-base transition-all ${
                    sourceType === t
                      ? "bg-[#4A5FD4] text-white font-medium"
                      : "bg-white text-[#6b6b6b] hover:bg-[#F3F2EF]"
                  }`}
                >
                  {t === "rapid" ? "RAPID" : "STR"}
                </button>
              ))}
            </div>
          </div>

          {step === "select" && (
            <>
              {/* Search */}
              <div className="relative flex items-center">
                <Search
                  size={13}
                  className="absolute left-3 text-[#9a9a96] pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    sourceType === "rapid"
                      ? "Search RAPID ID, entity, file no…"
                      : "Search STR ref, entity, GSTIN…"
                  }
                  className="h-9 w-full pl-8 pr-3 rounded-lg border border-[#EDEDEA] text-base bg-white focus:outline-none focus:ring-1 focus:ring-[#4A5FD4]"
                />
              </div>

              {/* Record list */}
              {loadingRecords ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4A5FD4] border-t-transparent" />
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-xl border border-[#EDEDEA] divide-y divide-[#EDEDEA]">
                  {sourceType === "rapid" && filteredRapid.length === 0 && (
                    <p className="py-8 text-center text-base text-[#9a9a96]">
                      No RAPID records found.
                    </p>
                  )}
                  {sourceType === "str" && filteredStr.length === 0 && (
                    <p className="py-8 text-center text-base text-[#9a9a96]">
                      No STR records found.
                    </p>
                  )}

                  {sourceType === "rapid" &&
                    filteredRapid.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectRecord(r.id)}
                        className="w-full text-left px-4 py-3 hover:bg-[#EEF2FF] transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-[#1a1a1a] truncate">
                                {r.received_against_entity || "—"}
                              </span>
                              {r.rapid_id && (
                                <span className="shrink-0 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-medium text-[#4A5FD4]">
                                  {r.rapid_id}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-3 text-sm text-[#9a9a96]">
                              {r.file_no_ref_id && (
                                <span>File: {r.file_no_ref_id}</span>
                              )}
                              {r.assigned_group && (
                                <span>{r.assigned_group}</span>
                              )}
                              {r.status && (
                                <span className="capitalize">{r.status}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className="shrink-0 text-[#EDEDEA] group-hover:text-[#4A5FD4] mt-1 transition-all"
                          />
                        </div>
                      </button>
                    ))}

                  {sourceType === "str" &&
                    filteredStr.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectRecord(r.id)}
                        className="w-full text-left px-4 py-3 hover:bg-[#EEF2FF] transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-[#1a1a1a] truncate">
                                {r.entity_name || "—"}
                              </span>
                              {r.str_reference_no && (
                                <span className="shrink-0 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-medium text-[#4A5FD4]">
                                  {r.str_reference_no}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-3 text-sm text-[#9a9a96]">
                              {r.gstin && <span>GSTIN: {r.gstin}</span>}
                              {r.sio_group && <span>{r.sio_group}</span>}
                              {r.status && (
                                <span className="capitalize">{r.status}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className="shrink-0 text-[#EDEDEA] group-hover:text-[#4A5FD4] mt-1 transition-all"
                          />
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </>
          )}

          {step === "confirm" && confirmDraft && selectedSourceRecord && (
            <div className="space-y-4">
              {/* Checklist */}
              <div className="rounded-xl border border-[#EDEDEA] overflow-hidden">
                <div className="bg-white px-4 py-2.5 border-b border-[#EDEDEA] flex items-center gap-2">
                  <AlertCircle size={14} className="text-[#4A5FD4]" />
                  <span className="text-base font-medium text-[#1a1a1a]">
                    Fields that will be pre-filled from{" "}
                    {sourceType === "rapid" ? "RAPID" : "STR"} record
                  </span>
                </div>
                <div className="divide-y divide-[#EDEDEA]">
                  {checklist.map(({ label, field }) => {
                    const value = (selectedSourceRecord as any)[field];
                    const filled = !!value;
                    return (
                      <div
                        key={field}
                        className="flex items-center justify-between px-4 py-2.5 gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${filled ? "bg-[#4A5FD4]" : "bg-[#EDEDEA]"}`}
                          >
                            {filled && (
                              <Check size={9} className="text-white" />
                            )}
                          </span>
                          <span className="text-base text-[#1a1a1a]">
                            {label}
                          </span>
                        </div>
                        <span
                          className={`text-base ${filled ? "text-[#1a1a1a] font-medium" : "text-[#9a9a96] italic"}`}
                        >
                          {value || "empty — fill manually"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pre-filled case fields preview */}
              <div className="rounded-xl border border-[#EDEDEA] overflow-hidden">
                <div className="bg-white px-4 py-2.5 border-b border-[#EDEDEA]">
                  <span className="text-base font-medium text-[#1a1a1a]">
                    Case will be created with
                  </span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-[#EDEDEA]">
                  {[
                    ["Taxpayer Name", confirmDraft.taxpayer_name],
                    ["File No.", confirmDraft.file_no],
                    ["GSTINs", confirmDraft.gstins],
                    ["Group", confirmDraft.group],
                    ["Intel Source", confirmDraft.intel_source],
                    ["Case Type", confirmDraft.is_ir ? "IR" : "NON-IR"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="px-4 py-2.5 border-b border-[#EDEDEA]"
                    >
                      <div className="text-sm text-[#9a9a96]">{label}</div>
                      <div className="text-base text-[#1a1a1a] font-medium mt-0.5">
                        {value || (
                          <span className="text-[#9a9a96] italic font-normal">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-[#9a9a96]">
                All fields are editable after the case is created. Click Proceed
                to open a pre-filled form.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EDEDEA] flex items-center justify-between gap-3">
          {step === "confirm" ? (
            <>
              <button
                onClick={() => {
                  setStep("select");
                  setSelectedId("");
                }}
                className="flex items-center gap-1.5 text-base text-[#6b6b6b] hover:text-[#1a1a1a] transition-all"
              >
                <ChevronRight size={14} className="rotate-180" />
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white px-5 py-2 text-base font-medium transition-all"
              >
                <Zap size={14} />
                Proceed & Pre-fill Case
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="text-base text-[#6b6b6b] hover:text-[#1a1a1a] transition-all"
              >
                Cancel
              </button>
              <span className="text-sm text-[#9a9a96]">
                Select a record to continue
              </span>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── DGGIRecordDialog ─────────────────────────────────────────────────────────

export interface DGGIRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  draft: Partial<DGGIRecord>;
  onDraftChange: (key: keyof DGGIRecord, value: string | boolean) => void;
  onSave: () => void;
  saving: boolean;
  users: WorkspaceUser[];
  // Related registers (only meaningful in edit mode once record is saved)
  caseRecordId?: string;
  arrestRecords?: ArrestSubRecord[];
  provisionalRecords?: ProvisionalSubRecord[];
  scnRecords?: SCNSubRecord[];
  onAddArrest?: () => void;
  onAddProvisional?: () => void;
  onAddSCN?: () => void;
  onEditArrest?: (rec: ArrestSubRecord) => void;
  onEditProvisional?: (rec: ProvisionalSubRecord) => void;
  onEditSCN?: (rec: SCNSubRecord) => void;
  onDeleteArrest?: (id: string) => void;
  onDeleteProvisional?: (id: string) => void;
  onDeleteSCN?: (id: string) => void;
  userRole?: string;
}

// ─── Register sub-record types ────────────────────────────────────────────────

interface ArrestSubRecord {
  id?: string;
  record_id?: string;
  linked_case_id: string;
  arrested_name: string;
  arrested_designation: string;
  arrested_age: string;
  date_of_arrest: string;
  financial_year: string;
  unit_name_reg: string;
  amount_crore: string;
  role_evidence: string;
  relative_name: string;
  relative_address: string;
  relative_tel: string;
  sio: string;
  group: string;
}

interface ProvisionalSubRecord {
  id?: string;
  record_id?: string;
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

interface SCNSubRecord {
  id?: string;
  record_id?: string;
  linked_case_id: string;
  scn_no: string;
  date_of_scn: string;
  noticee_name: string;
  gstin_pan: string;
  demand_tax: string;
  demand_interest: string;
  demand_penalty: string;
  period_involved: string;
  last_date_oio: string;
  issue: string;
  adjudication_formation: string;
  file_no: string;
  din_no: string;
  date_uploading_bo: string;
  adjudication_status: string;
  appeal_stage: string;
  remarks: string;
  sio: string;
  group: string;
}

// ─── Register column definitions (inline, no external deps) ──────────────────

const ARREST_COLUMNS: RegisterColumn[] = [
  {
    key: "linked_case_id",
    label: "Linked Case",
    type: "caselink",
    width: "180px",
  },
  {
    key: "arrested_name",
    label: "Name of Arrested Person",
    type: "text",
    width: "180px",
  },
  {
    key: "arrested_designation",
    label: "Designation",
    type: "text",
    width: "160px",
  },
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
    key: "unit_name_reg",
    label: "Name & Reg No. of Unit",
    type: "text",
    width: "210px",
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
  {
    key: "relative_name",
    label: "Relative Name",
    type: "text",
    width: "160px",
  },
  {
    key: "relative_address",
    label: "Relative Address",
    type: "text",
    width: "200px",
  },
  { key: "relative_tel", label: "Relative Tel.", type: "text", width: "140px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: DGGI_GROUPS,
    width: "120px",
  },
];

const PROVISIONAL_COLUMNS: RegisterColumn[] = [
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
    label: "Value – Immovable (Cr.)",
    type: "number",
    width: "180px",
  },
  {
    key: "value_movable",
    label: "Value – Movable (Cr.)",
    type: "number",
    width: "170px",
  },
  {
    key: "value_shares",
    label: "Value – Shares/FD (Cr.)",
    type: "number",
    width: "170px",
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
    label: "Date of Release",
    type: "datepicker",
    width: "160px",
  },
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

const SCN_COLUMNS: RegisterColumn[] = [
  {
    key: "linked_case_id",
    label: "Linked Case",
    type: "caselink",
    width: "180px",
  },
  { key: "scn_no", label: "SCN No.", type: "text", width: "200px" },
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
    label: "Demand - Tax (Rs.)",
    type: "number",
    width: "150px",
  },
  {
    key: "demand_interest",
    label: "Demand - Interest (Rs.)",
    type: "number",
    width: "170px",
  },
  {
    key: "demand_penalty",
    label: "Demand - Penalty (Rs.)",
    type: "number",
    width: "170px",
  },
  {
    key: "period_involved",
    label: "Period Involved (YY-YY)",
    dialogLabel: "Period Involved (YY-YY, e.g. 23-24)",
    type: "text",
    width: "180px",
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
    options: [
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
    ],
    allowOther: true,
    width: "200px",
  },
  {
    key: "adjudication_formation",
    label: "Adjudication Formation",
    type: "select",
    options: [
      "DC/AC (Adjudication)",
      "JC/ADC (Adjudication)",
      "Commissioner (Adjudication)",
      "Principal Commissioner (Adjudication)",
      "CESTAT",
    ],
    allowOther: true,
    width: "200px",
  },
  { key: "file_no", label: "File No.", type: "text", width: "120px" },
  { key: "din_no", label: "DIN No.", type: "text", width: "130px" },
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
    options: [
      "Pending",
      "OIO Issued",
      "Dropped",
      "Partly Confirmed",
      "Fully Confirmed",
      "Remanded Back",
      "Appeal Pending",
      "Disposed",
    ],
    allowOther: true,
    width: "180px",
  },
  {
    key: "appeal_stage",
    label: "Appeal Stage",
    type: "select",
    options: [
      "Review",
      "GSTAT",
      "Commissioner Appeal",
      "High Court",
      "Supreme Court",
      "Lower Court",
    ],
    width: "170px",
  },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: DGGI_GROUPS,
    width: "120px",
  },
  { key: "remarks", label: "Remarks", type: "text", width: "160px" },
];

// ─── Register summary tile component ─────────────────────────────────────────

function RegisterSummaryTile({
  title,
  count,
  icon,
  onAdd,
  records,
  onEdit,
  onDelete,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  onAdd: () => void;
  records?: Array<{ id?: string; record_id?: string; [key: string]: any }>;
  onEdit?: (record: any) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-[#EDEDEA] bg-white overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <button
          className="flex items-center gap-3 flex-1 text-left"
          onClick={() => count > 0 && setExpanded((v) => !v)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4A5FD4]">
            {icon}
          </div>
          <div>
            <div className="text-base font-medium text-[#1a1a1a]">{title}</div>
            <div className="text-sm text-[#9a9a96]">
              {count} linked record{count !== 1 ? "s" : ""}
            </div>
          </div>
          {count > 0 && (
            <span className="ml-1 text-[#9a9a96]">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </button>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg border border-[#EDEDEA] px-3 py-1.5 text-base text-[#4A5FD4] hover:bg-[#EEF2FF] transition-all shrink-0"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
      {expanded && records && records.length > 0 && (
        <div className="border-t border-[#EDEDEA] divide-y divide-[#EDEDEA]">
          {records.map((rec, i) => (
            <div
              key={rec.id ?? i}
              className="flex items-center justify-between px-4 py-2"
            >
              <span className="text-sm font-medium text-[#4A5FD4]">
                {rec.record_id || `Record ${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(rec)}
                    className="flex items-center gap-1 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#F3F2EF] rounded-lg px-2 py-1 transition-all"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
                {onDelete && rec.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="flex items-center gap-1 text-sm text-[#C0432A] hover:bg-[#FEE2E2] rounded-lg px-2 py-1 transition-all">
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete record?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete{" "}
                          {rec.record_id || "this record"} and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-[#C0432A] hover:bg-[#a83823] text-white"
                          onClick={() => onDelete(rec.id!)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NON-IR stage definitions ─────────────────────────────────────────────────

const NON_IR_STAGES: {
  label: string;
  fields: (keyof DGGIRecord)[];
  requiredFields: (keyof DGGIRecord)[];
}[] = [
  {
    label: "Case Details",
    fields: [
      "group",
      "intel_source",
      "date_of_receipt",
      "taxpayer_name",
      "gstins",
      "file_no",
      "handling_io_sio",
      "date_of_initiation",
      "issue_involved",
    ],
    requiredFields: ["group", "taxpayer_name", "file_no", "handling_io_sio"],
  },
  {
    label: "Intelligence Action",
    fields: [
      "intel_approved_date",
      "mode_of_initiation",
      "intelligence_action_date",
      "pr_adg_comments",
    ],
    requiredFields: [],
  },
  {
    label: "Closure",
    fields: ["due_date", "closure_by"],
    requiredFields: [],
  },
];

export function DGGIRecordDialog({
  open,
  onOpenChange,
  mode,
  draft,
  onDraftChange,
  onSave,
  saving,
  users,
  caseRecordId,
  arrestRecords = [],
  provisionalRecords = [],
  scnRecords = [],
  onAddArrest,
  onAddProvisional,
  onAddSCN,
  onEditArrest,
  onEditProvisional,
  onEditSCN,
  onDeleteArrest,
  onDeleteProvisional,
  onDeleteSCN,
  userRole = "",
}: DGGIRecordDialogProps) {
  const FROZEN_ON_EDIT = new Set<keyof DGGIRecord>([
    "group",
    "intel_source",
    "taxpayer_name",
    "gstins",
    "file_no",
    "handling_io_sio",
    "issue_involved",
  ]);

  const isIr = draft.is_ir ?? true;
  const formColumns = isIr ? COLUMNS : NON_IR_COLUMNS;
  const editableColumns = formColumns.filter(
    (col) => !col.readOnly && col.key !== "is_ir",
  );
  const [otherActiveFields, setOtherActiveFields] = useState<Set<string>>(
    new Set(),
  );

  const isStageComplete = (stageIdx: number): boolean => {
    const stage = NON_IR_STAGES[stageIdx];
    if (!stage) return false;
    if (stage.requiredFields.length === 0) return true;
    return stage.requiredFields.every((f) => {
      const val = (draft as any)[f];
      return val !== undefined && val !== null && val !== "";
    });
  };

  const isStageUnlocked = (stageIdx: number): boolean => {
    if (stageIdx === 0) return true;
    // In edit mode, all stages are accessible regardless of completion status
    if (mode === "edit") return true;
    return isStageComplete(stageIdx - 1);
  };

  const renderField = (col: ColDef, disabled?: boolean) => {
    const rawValue = (draft as any)[col.key];
    const value = rawValue ?? "";

    if (disabled) {
      const displayValue =
        col.type === "usercombobox"
          ? users.find((u) => u.id === (value as string))?.name ||
            (col.key === "handling_io_sio"
              ? (draft as any).handling_io_sio_name
              : undefined) ||
            (value as string) ||
            "—"
          : (value as string) || "—";
      return (
        <div className="h-9 flex items-center px-3 rounded-lg border border-[#EDEDEA] bg-[#F9F9F8] text-base text-[#9a9a96]">
          {displayValue}
        </div>
      );
    }

    if (col.type === "text") {
      const isAmountField = [
        "detection_amount",
        "recovery_itc",
        "recovery_cash",
      ].includes(col.key);
      return (
        <Input
          value={value as string}
          onChange={(e) => {
            const v = e.target.value;
            if (isAmountField && v !== "" && !/^-?\d*\.?\d*$/.test(v)) return;
            onDraftChange(col.key, v);
          }}
          inputMode={isAmountField ? "decimal" : undefined}
          className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
        />
      );
    }

    if (col.type === "datepicker") {
      return (
        <DateInput
          value={value as string}
          onChange={(v) => onDraftChange(col.key, v)}
          className="w-full"
        />
      );
    }

    if (col.type === "usercombobox") {
      return (
        <UserCombobox
          value={value as string}
          onChange={(v) => onDraftChange(col.key, v)}
          users={users}
          className="w-full h-9"
        />
      );
    }

    if (col.type === "boolean") {
      return (
        <Select
          value={value ? "true" : "false"}
          onValueChange={(v) => onDraftChange(col.key, v === "true")}
        >
          <SelectTrigger className="h-9 w-full border-[#EDEDEA] text-base rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">IR</SelectItem>
            <SelectItem value="false">NON-IR</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (col.type === "select-with-other") {
      const knownOptions = col.options ?? [];
      const isOther =
        !!(value as string) && !knownOptions.includes(value as string);
      const isOtherActive = otherActiveFields.has(col.key) || isOther;
      const selectValue = isOtherActive
        ? OTHER_SENTINEL
        : (value as string) || "";
      return (
        <div className="flex flex-col gap-1">
          <Select
            value={selectValue}
            onValueChange={(v) => {
              if (v === OTHER_SENTINEL) {
                setOtherActiveFields((prev) => new Set([...prev, col.key]));
                onDraftChange(col.key, "");
              } else {
                setOtherActiveFields((prev) => {
                  const next = new Set(prev);
                  next.delete(col.key);
                  return next;
                });
                onDraftChange(col.key, v);
              }
            }}
          >
            <SelectTrigger className="h-9 w-full border-[#EDEDEA] text-base rounded-lg">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {knownOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
              <SelectItem value={OTHER_SENTINEL}>Others…</SelectItem>
            </SelectContent>
          </Select>
          {isOtherActive && (
            <Input
              autoFocus
              value={value as string}
              onChange={(e) => onDraftChange(col.key, e.target.value)}
              placeholder="Enter custom value…"
              className="h-9 w-full border-[#EDEDEA] text-base rounded-lg"
            />
          )}
        </div>
      );
    }

    // type === "select"
    const options =
      col.key === "closure_by"
        ? isIr
          ? IR_CLOSURE_OPTIONS
          : NON_IR_CLOSURE_OPTIONS
        : (col.options ?? []);
    return (
      <Select
        value={value as string}
        onValueChange={(v) => onDraftChange(col.key, v)}
      >
        <SelectTrigger className="h-9 w-full border-[#EDEDEA] text-base rounded-lg">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderCaseTypeSelector = () => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#6b6b6b]">Case Type</label>
      {mode === "edit" ? (
        // In edit mode, case type is locked to prevent accidental IR/NON-IR toggling.
        // To convert NON-IR → IR, set closure_by = "Convert to IR" instead.
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-lg border px-4 py-2 text-base font-medium ${isIr ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]" : "border-[#EDEDEA] bg-[#F9F9F8] text-[#6b6b6b]"}`}
          >
            {isIr ? "IR" : "NON-IR"}
          </span>
          <span className="text-sm text-[#9a9a96]">
            (locked — use &ldquo;Closure&rdquo; to convert)
          </span>
        </div>
      ) : (
        <div className="flex rounded-lg border border-[#EDEDEA] overflow-hidden w-fit">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => onDraftChange("is_ir", val)}
              className={`px-5 py-2 text-base transition-all ${
                isIr === val
                  ? "bg-[#4A5FD4] text-white font-medium"
                  : "bg-white text-[#6b6b6b] hover:bg-[#F3F2EF]"
              }`}
            >
              {val ? "IR" : "NON-IR"}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderIrForm = () => {
    const mainCols = editableColumns;
    const closureCols = IR_CLOSURE_FORM_COLS;

    return (
      <div className="space-y-4 py-2">
        {renderCaseTypeSelector()}
        {draft.converted_from_non_ir && (
          <div className="flex items-center gap-2 rounded-lg border border-[#4A5FD4]/20 bg-[#EEF2FF] px-4 py-2.5">
            <Zap size={14} className="text-[#4A5FD4] shrink-0" />
            <span className="text-sm text-[#4A5FD4]">
              Converted from NON-IR:{" "}
              <span className="font-semibold">
                {draft.converted_from_non_ir}
              </span>
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {mainCols.map((col) => (
            <div key={col.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#6b6b6b]">
                {col.label}
              </label>
              {renderField(
                col,
                (mode === "edit" &&
                  FROZEN_ON_EDIT.has(col.key as keyof DGGIRecord)) ||
                  (col.key === "pr_adg_comments" && userRole !== "ADG"),
              )}
            </div>
          ))}
        </div>

        {/* Closure section — edit only */}
        {mode === "edit" && (
          <div className="rounded-xl border border-[#EDEDEA] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EDEDEA] bg-white">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4A5FD4] border border-[#4A5FD4] text-xs font-semibold">
                <Check size={12} />
              </span>
              <span className="text-base font-medium text-[#1a1a1a]">
                Closure
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-4">
              {closureCols.map((col) => (
                <div key={col.key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#6b6b6b]">
                    {col.label}
                  </label>
                  {renderField(
                    col,
                    col.key === "pr_adg_comments" && userRole !== "ADG",
                  )}
                </div>
              ))}
              {(draft.closure_by === "Transfer To" ||
                draft.closure_by === "Transferred") && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#6b6b6b]">
                    Transferred To
                  </label>
                  <Input
                    value={(draft.transferred_to as string) ?? ""}
                    onChange={(e) =>
                      onDraftChange("transferred_to", e.target.value)
                    }
                    placeholder="Enter unit / formation name…"
                    className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
                  />
                </div>
              )}
              {CLOSURE_NEEDS_REASON.has(draft.closure_by as string) && (
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-sm font-medium text-[#6b6b6b]">
                    Reason for Closure
                  </label>
                  <Input
                    value={(draft.closure_reason as string) ?? ""}
                    onChange={(e) =>
                      onDraftChange("closure_reason", e.target.value)
                    }
                    placeholder="Enter reason for closure…"
                    className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Registers section for IR — edit only */}
        {/* {mode === "edit" && (
          <div className="rounded-xl border border-[#EDEDEA] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EDEDEA] bg-white">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4A5FD4] border border-[#4A5FD4] text-xs font-semibold">
                <Layers size={12} />
              </span>
              <span className="text-base font-medium text-[#1a1a1a]">
                Related Registers
              </span>
            </div>
            <div className="px-4 py-3 space-y-2">
              <RegisterSummaryTile
                title="Arrest Register"
                count={arrestRecords.length}
                icon={<Layers size={14} />}
                onAdd={onAddArrest ?? (() => {})}
                records={arrestRecords}
                onEdit={onEditArrest}
                onDelete={onDeleteArrest}
              />
              <RegisterSummaryTile
                title="Provisional Attachment"
                count={provisionalRecords.length}
                icon={<Layers size={14} />}
                onAdd={onAddProvisional ?? (() => {})}
                records={provisionalRecords}
                onEdit={onEditProvisional}
                onDelete={onDeleteProvisional}
              />
              <RegisterSummaryTile
                title="SCN Register"
                count={scnRecords.length}
                icon={<Layers size={14} />}
                onAdd={onAddSCN ?? (() => {})}
                records={scnRecords}
                onEdit={onEditSCN}
                onDelete={onDeleteSCN}
              />
            </div>
          </div>
        )} */}
      </div>
    );
  };

  const renderNonIrForm = () => (
    <div className="space-y-4 py-2">
      {renderCaseTypeSelector()}

      {/* Staged layout */}
      <div className="space-y-3">
        {NON_IR_STAGES.filter(
          (stage) =>
            stage.label !== "Related Registers" &&
            (mode === "edit" ||
              (stage.label !== "Closure" &&
                stage.label !== "Intelligence Action")),
        ).map((stage, idx) => {
          const unlocked = isStageUnlocked(idx);
          const complete = isStageComplete(idx);
          const allFormCols = [
            ...NON_IR_COLUMNS,
            ...NON_IR_FORM_EXTRA,
            ...NON_IR_CLOSURE_FORM_COLS,
          ];
          const stageCols = stage.fields
            .map((f) => allFormCols.find((c) => c.key === f))
            .filter(Boolean) as ColDef[];

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all ${
                unlocked
                  ? complete
                    ? "border-[#4A5FD4]/30 bg-[#FAFBFF]"
                    : "border-[#EDEDEA] bg-white"
                  : "border-[#EDEDEA] bg-[#F9F9F8] opacity-60"
              }`}
            >
              {/* Stage header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EDEDEA]">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    complete
                      ? "bg-[#4A5FD4] text-white"
                      : unlocked
                        ? "bg-[#EEF2FF] text-[#4A5FD4] border border-[#4A5FD4]"
                        : "bg-[#EDEDEA] text-[#9a9a96]"
                  }`}
                >
                  {complete ? <Check size={12} /> : idx + 1}
                </span>
                <span
                  className={`text-base font-medium ${
                    unlocked ? "text-[#1a1a1a]" : "text-[#9a9a96]"
                  }`}
                >
                  {stage.label}
                </span>
                {!unlocked && (
                  <span className="ml-auto text-sm text-[#9a9a96] italic">
                    Complete Stage {idx} to unlock
                  </span>
                )}
              </div>

              {/* Stage fields */}
              <div className="px-4 py-3">
                {stage.label === "Related Registers" ? (
                  <div
                    className={`space-y-2 ${!unlocked ? "pointer-events-none" : ""}`}
                  >
                    {mode === "add" ? (
                      <p className="text-sm text-[#9a9a96] italic py-2">
                        Save the record first to link related registers.
                      </p>
                    ) : (
                      <>
                        <RegisterSummaryTile
                          title="Arrest Register"
                          count={arrestRecords.length}
                          icon={<Layers size={14} />}
                          onAdd={onAddArrest ?? (() => {})}
                          records={arrestRecords}
                          onEdit={onEditArrest}
                          onDelete={onDeleteArrest}
                        />
                        <RegisterSummaryTile
                          title="Provisional Attachment"
                          count={provisionalRecords.length}
                          icon={<Layers size={14} />}
                          onAdd={onAddProvisional ?? (() => {})}
                          records={provisionalRecords}
                          onEdit={onEditProvisional}
                          onDelete={onDeleteProvisional}
                        />
                      </>
                    )}
                  </div>
                ) : stage.fields.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-base text-[#9a9a96] italic">
                    To be built
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {stageCols
                      .filter(
                        (col) =>
                          col.key !== "date_of_receipt" ||
                          (draft as any).intel_source === "Int",
                      )
                      .map((col) => (
                      <div key={col.key} className="flex flex-col gap-1.5">
                        <label
                          className={`text-sm font-medium ${unlocked ? "text-[#6b6b6b]" : "text-[#9a9a96]"}`}
                        >
                          {col.label}
                          {stage.requiredFields.includes(
                            col.key as keyof DGGIRecord,
                          ) && <span className="text-[#C0432A] ml-0.5">*</span>}
                        </label>
                        {renderField(
                          col,
                          !unlocked ||
                            (mode === "edit" &&
                              FROZEN_ON_EDIT.has(
                                col.key as keyof DGGIRecord,
                              )) ||
                            (col.key === "pr_adg_comments" &&
                              userRole !== "ADG"),
                        )}
                      </div>
                    ))}
                    {stage.label === "Closure" &&
                      (draft.closure_by === "Transfer To" ||
                        draft.closure_by === "Transferred") && (
                        <div className="flex flex-col gap-1.5">
                          <label
                            className={`text-sm font-medium ${unlocked ? "text-[#6b6b6b]" : "text-[#9a9a96]"}`}
                          >
                            Transferred To
                          </label>
                          <Input
                            value={(draft.transferred_to as string) ?? ""}
                            onChange={(e) =>
                              onDraftChange("transferred_to", e.target.value)
                            }
                            placeholder="Enter unit / formation name…"
                            disabled={!unlocked}
                            className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
                          />
                        </div>
                      )}
                    {stage.label === "Closure" &&
                      CLOSURE_NEEDS_REASON.has(draft.closure_by as string) && (
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label
                            className={`text-sm font-medium ${unlocked ? "text-[#6b6b6b]" : "text-[#9a9a96]"}`}
                          >
                            Reason for Closure
                          </label>
                          <Input
                            value={(draft.closure_reason as string) ?? ""}
                            onChange={(e) =>
                              onDraftChange("closure_reason", e.target.value)
                            }
                            placeholder="Enter reason for closure…"
                            disabled={!unlocked}
                            className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
                          />
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onOpenChange(false);
          setOtherActiveFields(new Set());
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#EDEDEA] shadow-none font-['DM_Sans']">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-[#1a1a1a]">
            {mode === "add"
              ? draft.converted_from_non_ir
                ? "Create IR Case"
                : "Add Record"
              : "Edit Record"}
          </DialogTitle>
        </DialogHeader>
        {isIr ? renderIrForm() : renderNonIrForm()}
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            className="rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white shadow-none"
            onClick={onSave}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : mode === "add"
                ? "Add Record"
                : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const DGGIComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const searchParams = useSearchParams();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [records, setRecords] = useState<DGGIRecord[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const caseOptions = useMemo<DGGICaseOption[]>(
    () =>
      records.map((r) => ({
        record_id: r.record_id,
        taxpayer_name: r.taxpayer_name,
        file_no: r.file_no,
        is_ir: r.is_ir,
      })),
    [records],
  );
  const [loading, setLoading] = useState(true);

  const [topFilter, setTopFilter] = useState<TopFilter>("ir");
  const [groupFilter, setGroupFilter] = useState<GroupName | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [groupBy, setGroupBy] = useState<GroupByField | "none">("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<DGGIRecord>>({});
  const [dialogEditingId, setDialogEditingId] = useState<string | null>(null);
  const [savingRow, setSavingRow] = useState(false);
  // When converting NON-IR → IR, hold the source record's id and draft until the new IR record is saved.
  const [pendingConvertSourceId, setPendingConvertSourceId] = useState<
    string | null
  >(null);
  const [pendingConvertDraft, setPendingConvertDraft] =
    useState<Partial<DGGIRecord> | null>(null);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [intelDialogOpen, setIntelDialogOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(LS_HIDDEN_COLS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [unseenAdgComments, setUnseenAdgComments] = useState<Set<string>>(new Set());

  const toggleColumn = (key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(LS_HIDDEN_COLS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const activeColumns = topFilter === "ir" ? COLUMNS : NON_IR_COLUMNS;
  const visibleColumns = activeColumns.filter((c) => !hiddenColumns.has(c.key));
  const totalCols = visibleColumns.length + 1; // +1 for Actions

  // ── Related registers state ────────────────────────────────────────────────

  const [arrestRecordsMap, setArrestRecordsMap] = useState<
    Map<string, ArrestSubRecord[]>
  >(new Map());
  const [provisionalRecordsMap, setProvisionalRecordsMap] = useState<
    Map<string, ProvisionalSubRecord[]>
  >(new Map());
  const [scnRecordsMap, setScnRecordsMap] = useState<
    Map<string, SCNSubRecord[]>
  >(new Map());
  const [allScnOptions, setAllScnOptions] = useState<ScnOption[]>([]);

  // Sub-dialogs
  const [arrestDialogOpen, setArrestDialogOpen] = useState(false);
  const [arrestDialogMode, setArrestDialogMode] = useState<"add" | "edit">(
    "add",
  );
  const [arrestDialogDraft, setArrestDialogDraft] = useState<
    Record<string, string>
  >({});
  const [savingArrest, setSavingArrest] = useState(false);

  const [provisionalDialogOpen, setProvisionalDialogOpen] = useState(false);
  const [provisionalDialogMode, setProvisionalDialogMode] = useState<
    "add" | "edit"
  >("add");
  const [provisionalDialogDraft, setProvisionalDialogDraft] = useState<
    Record<string, string>
  >({});
  const [savingProvisional, setSavingProvisional] = useState(false);

  const [scnDialogOpen, setScnDialogOpen] = useState(false);
  const [scnDialogMode, setScnDialogMode] = useState<"add" | "edit">("add");
  const [scnDialogDraft, setScnDialogDraft] = useState<Record<string, string>>(
    {},
  );
  const [savingSCN, setSavingSCN] = useState(false);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);

      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id ?? "";
      setCurrentUserId(uid);

      const [userRow, groupRows] = await Promise.all([
        supabase.from("votum_users").select("dggi_role").eq("id", uid).single(),
        supabase
          .from("dggi_user_group_assignments")
          .select("group_name")
          .eq("user_id", uid),
      ]);
      const role = userRow.data?.dggi_role ?? "";
      const groups = (groupRows.data ?? []).map(
        (g: { group_name: string }) => g.group_name,
      );
      setUserRole(role);
      setUserGroups(groups);

      const [, usersRes] = await Promise.all([
        fetchRecords(wid, role, groups, uid),
        getAllUsers(),
      ]);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);

      const caseId = searchParams?.get("caseId");
      if (caseId) {
        setFilters((prev) => ({ ...prev, search: caseId }));
        if (caseId.startsWith("NIR-")) setTopFilter("non-ir");
      }

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
      .from("dggi_records")
      .select("*")
      .eq("workspace_id", wid);

    if (role && role !== "ADG" && role !== "DD_INT") {
      if (role === "IO" || role === "SIO") {
        query = query.eq("handling_io_sio", uid ?? "__none__");
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

  // ── Unseen ADG comments (for IO/SIO only) ────────────────────────────────
  // After records load, mark any record whose pr_adg_comments_updated_at is
  // newer than the timestamp we last stored in localStorage for that record id.
  useEffect(() => {
    if (userRole === "ADG" || !records.length) return;
    let seen: Record<string, string> = {};
    try {
      seen = JSON.parse(localStorage.getItem(LS_ADG_COMMENT_SEEN_KEY) ?? "{}");
    } catch {}
    const unseen = new Set<string>();
    for (const r of records) {
      if (!r.pr_adg_comments || !r.pr_adg_comments_updated_at) continue;
      const seenAt = seen[r.id];
      if (!seenAt || seenAt < r.pr_adg_comments_updated_at) {
        unseen.add(r.id);
      }
    }
    setUnseenAdgComments(unseen);
  }, [records, userRole]);

  // ── Derived counts ─────────────────────────────────────────────────────────

  const irTotal = records.filter((r) => r.is_ir && !r.closure_by).length;
  const nonIrTotal = records.filter((r) => !r.is_ir && !r.closure_by).length;

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.modes.length +
    (filters.handlingIo ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.dueDateYear ? 1 : 0) +
    (groupFilter ? 1 : 0);

  // ── Filtered + sorted rows ─────────────────────────────────────────────────

  const tableRecords = records
    .filter((r) => {
      if (!(topFilter === "ir" ? r.is_ir : !r.is_ir)) return false;
      if (r.closure_by) return false;
      if (groupFilter && r.group !== groupFilter) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hit = [
          r.record_id,
          r.taxpayer_name,
          r.gstins,
          r.file_no,
          r.intel_source,
          r.issue_involved,
          r.latest_status,
        ].some((v) => v?.toLowerCase().includes(q));
        if (!hit) return false;
      }

      if (
        filters.modes.length > 0 &&
        !filters.modes.includes(r.mode_of_initiation)
      )
        return false;

      if (filters.handlingIo && r.handling_io_sio !== filters.handlingIo)
        return false;

      if (filters.dateFrom && r.date_of_receipt < filters.dateFrom)
        return false;
      if (filters.dateTo && r.date_of_receipt > filters.dateTo) return false;

      if (
        filters.dueDateYear &&
        (!r.due_date || !r.due_date.startsWith(filters.dueDateYear))
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      if (sortCol) {
        const av = (a as any)[sortCol] ?? "";
        const bv = (b as any)[sortCol] ?? "";
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      }
      const numOf = (id: string) => parseInt(id.split("-")[1] ?? "0", 10) || 0;
      return numOf(a.record_id) - numOf(b.record_id);
    });

  // ── Grouped buckets (only when groupBy is active) ──────────────────────────

  const groupedBuckets: { key: string; label: string; rows: DGGIRecord[] }[] =
    groupBy === "none"
      ? []
      : (() => {
          const map = new Map<string, DGGIRecord[]>();
          for (const r of tableRecords) {
            const raw = String((r as any)[groupBy] ?? "");
            if (!map.has(raw)) map.set(raw, []);
            map.get(raw)!.push(r);
          }
          return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, rows]) => ({
              key,
              label: groupKeyLabel(groupBy as GroupByField, key),
              rows,
            }));
        })();

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const collapseAll = () =>
    setCollapsedGroups(new Set(groupedBuckets.map((b) => b.key)));
  const expandAll = () => setCollapsedGroups(new Set());

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const startEdit = (record: DGGIRecord) => {
    setDialogDraft({ ...record });
    setDialogEditingId(record.id);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const cancelDialog = () => {
    setDialogOpen(false);
    setDialogDraft({});
    setDialogEditingId(null);
    setPendingConvertSourceId(null);
    setPendingConvertDraft(null);
  };

  const saveEdit = async () => {
    if (!dialogEditingId) return;
    setSavingRow(true);
    const isIrRecord = dialogDraft.is_ir ?? false;
    const isClosedAsConverted = dialogDraft.closure_by === "Convert to IR";
    const sourceRecordId = dialogDraft.record_id;

    // For "Convert to IR": don't close the NON-IR yet — open the IR form first,
    // and only close the source after the new IR record is successfully saved.
    if (isClosedAsConverted && sourceRecordId) {
      const convertSourceId = dialogEditingId;
      const convertDraft = { ...dialogDraft };
      cancelDialog();
      setPendingConvertSourceId(convertSourceId);
      setPendingConvertDraft(convertDraft);
      setDialogDraft({
        ...EMPTY_RECORD,
        is_ir: true,
        group: dialogDraft.group ?? "Group A",
        intel_source: dialogDraft.intel_source ?? "",
        taxpayer_name: dialogDraft.taxpayer_name ?? "",
        gstins: dialogDraft.gstins ?? "",
        file_no: dialogDraft.file_no ?? "",
        handling_io_sio: dialogDraft.handling_io_sio ?? "",
        issue_involved: dialogDraft.issue_involved ?? "",
        mode_of_initiation: dialogDraft.mode_of_initiation ?? "",
        intel_approved_date: dialogDraft.intel_approved_date ?? "",
        intelligence_action_date: dialogDraft.intelligence_action_date ?? "",
        date_of_initiation: today(),
        date_of_ir: today(),
        converted_from_non_ir: sourceRecordId,
      });
      setDialogMode("add");
      setDialogEditingId(null);
      setDialogOpen(true);
      setSavingRow(false);
      toast.info(
        `NON-IR ${sourceRecordId} — fill in the new IR record below. The NON-IR will be closed once IR is saved.`,
      );
      return;
    }

    const existingRecord = records.find((r) => r.id === dialogEditingId);
    const hadClosureBefore = !!existingRecord?.closure_by;
    const isNowClosed = !!dialogDraft.closure_by;
    const shouldWriteClosureEntry = !hadClosureBefore && isNowClosed;
    const commentChanged =
      userRole === "ADG" &&
      (dialogDraft.pr_adg_comments ?? "") !== (existingRecord?.pr_adg_comments ?? "");

    const { error } = await supabase
      .from("dggi_records")
      .update({
        ...dialogDraft,
        ...(commentChanged ? { pr_adg_comments_updated_at: new Date().toISOString() } : {}),
        handling_io_sio: dialogDraft.handling_io_sio || null,
        handling_io_sio_name:
          workspaceUsers.find((u) => u.id === dialogDraft.handling_io_sio)
            ?.name || null,
        mode_of_initiation: dialogDraft.mode_of_initiation || null,
        date_of_receipt: dialogDraft.date_of_receipt || null,
        date_of_initiation: dialogDraft.date_of_initiation || null,
        intel_approved_date: dialogDraft.intel_approved_date || null,
        intelligence_action_date: dialogDraft.intelligence_action_date || null,
        due_date: dialogDraft.due_date || null,
        date_of_non_ir: dialogDraft.date_of_non_ir || null,
      })
      .eq("id", dialogEditingId);
    if (error) {
      toast.error("Failed to save: " + error.message);
      setSavingRow(false);
      return;
    }

    const commentUpdatedAt = commentChanged ? new Date().toISOString() : undefined;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === dialogEditingId
          ? {
              ...r,
              ...dialogDraft,
              handling_io_sio_name:
                workspaceUsers.find((u) => u.id === dialogDraft.handling_io_sio)
                  ?.name || r.handling_io_sio_name,
              ...(commentUpdatedAt ? { pr_adg_comments_updated_at: commentUpdatedAt } : {}),
            }
          : r,
      ),
    );

    if (shouldWriteClosureEntry) {
      const closureRecordId = await generateWorkspaceRecordId(
        supabase,
        "dggi_closure_records",
        isIrRecord
          ? REGISTER_PREFIXES.CLOSURE_IR
          : REGISTER_PREFIXES.CLOSURE_NON_IR,
        workspaceId,
        { filter: { is_ir: isIrRecord } },
      );
      const { error: closureErr } = await supabase
        .from("dggi_closure_records")
        .insert({
          workspace_id: workspaceId,
          record_id: closureRecordId,
          source_record_id: sourceRecordId,
          is_ir: isIrRecord,
          group: dialogDraft.group || null,
          intel_source: dialogDraft.intel_source || null,
          date_of_receipt: dialogDraft.date_of_receipt || null,
          taxpayer_name: dialogDraft.taxpayer_name || null,
          gstins: dialogDraft.gstins || null,
          file_no: dialogDraft.file_no || null,
          date_of_initiation: dialogDraft.date_of_initiation || null,
          intel_approved_date: dialogDraft.intel_approved_date || null,
          mode_of_initiation: dialogDraft.mode_of_initiation || null,
          intelligence_action_date:
            dialogDraft.intelligence_action_date || null,
          handling_io_sio: dialogDraft.handling_io_sio || null,
          issue_involved: dialogDraft.issue_involved || null,
          latest_status: dialogDraft.latest_status || null,
          pr_adg_comments: dialogDraft.pr_adg_comments || null,
          detection_amount: dialogDraft.detection_amount || null,
          recovery_itc: dialogDraft.recovery_itc || null,
          recovery_cash: dialogDraft.recovery_cash || null,
          digit_id: dialogDraft.digit_id || null,
          bo_id: dialogDraft.bo_id || null,
          hsn_code: dialogDraft.hsn_code || null,
          closure_by: dialogDraft.closure_by || null,
          closure_reason: dialogDraft.closure_reason || null,
          transferred_to: dialogDraft.transferred_to || null,
          due_date: dialogDraft.due_date || null,
          date_of_ir: dialogDraft.date_of_ir || null,
          date_of_non_ir: dialogDraft.date_of_non_ir || null,
          converted_from_non_ir: dialogDraft.converted_from_non_ir || null,
        });
      if (closureErr) {
        toast.error(
          "Saved record but failed to write closure entry: " +
            closureErr.message,
        );
      }
    }

    cancelDialog();
    toast.success("Record saved");
    setSavingRow(false);
  };

  const deleteRecord = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    let toastId: ReturnType<typeof toast.info>;
    const timerId = setTimeout(async () => {
      const { error } = await supabase
        .from("dggi_records")
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
    const draft = dialogDraft as Omit<DGGIRecord, "id">;
    const payload = {
      ...draft,
      record_id: await generateWorkspaceRecordId(
        supabase,
        "dggi_records",
        draft.is_ir ? "IR" : "NIR",
        workspaceId,
        { filter: { is_ir: draft.is_ir }, separator: "-" },
      ),
      handling_io_sio: draft.handling_io_sio || null,
      handling_io_sio_name:
        workspaceUsers.find((u) => u.id === draft.handling_io_sio)?.name ||
        null,
      mode_of_initiation: draft.mode_of_initiation || null,
      date_of_receipt: draft.date_of_receipt || null,
      date_of_initiation: draft.date_of_initiation || null,
      intel_approved_date: draft.intel_approved_date || null,
      intelligence_action_date: draft.intelligence_action_date || null,
      due_date: draft.due_date || null,
      date_of_ir:
        draft.is_ir && !draft.date_of_ir ? today() : draft.date_of_ir || null,
      date_of_non_ir:
        !draft.is_ir && !draft.date_of_non_ir
          ? today()
          : draft.date_of_non_ir || null,
      converted_from_non_ir: draft.converted_from_non_ir || null,
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from("dggi_records")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add record: " + error.message);
      setSavingRow(false);
      return;
    }

    setRecords((prev) => [...prev, data]);
    cancelDialog();

    // If this IR was created as part of a NON-IR → IR conversion, now close the source NON-IR.
    if (pendingConvertSourceId && pendingConvertDraft) {
      const sourceDraft = pendingConvertDraft;
      const sourceDbId = pendingConvertSourceId;
      setPendingConvertSourceId(null);
      setPendingConvertDraft(null);

      const { error: updateErr } = await supabase
        .from("dggi_records")
        .update({
          ...sourceDraft,
          handling_io_sio: sourceDraft.handling_io_sio || null,
          handling_io_sio_name:
            workspaceUsers.find((u) => u.id === sourceDraft.handling_io_sio)
              ?.name || null,
          mode_of_initiation: sourceDraft.mode_of_initiation || null,
          date_of_receipt: sourceDraft.date_of_receipt || null,
          date_of_initiation: sourceDraft.date_of_initiation || null,
          intel_approved_date: sourceDraft.intel_approved_date || null,
          intelligence_action_date:
            sourceDraft.intelligence_action_date || null,
          due_date: sourceDraft.due_date || null,
          date_of_non_ir: sourceDraft.date_of_non_ir || null,
        })
        .eq("id", sourceDbId);

      if (updateErr) {
        toast.error(
          "IR created but failed to close the NON-IR: " + updateErr.message,
        );
      } else {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === sourceDbId
              ? {
                  ...r,
                  ...sourceDraft,
                  handling_io_sio_name:
                    workspaceUsers.find(
                      (u) => u.id === sourceDraft.handling_io_sio,
                    )?.name || r.handling_io_sio_name,
                }
              : r,
          ),
        );

        // Write closure entry for the NON-IR.
        const closureRecordId = await generateWorkspaceRecordId(
          supabase,
          "dggi_closure_records",
          REGISTER_PREFIXES.CLOSURE_NON_IR,
          workspaceId,
          { filter: { is_ir: false } },
        );
        const { error: closureErr } = await supabase
          .from("dggi_closure_records")
          .insert({
            workspace_id: workspaceId,
            record_id: closureRecordId,
            source_record_id: sourceDraft.record_id || null,
            is_ir: false,
            group: sourceDraft.group || null,
            intel_source: sourceDraft.intel_source || null,
            date_of_receipt: sourceDraft.date_of_receipt || null,
            taxpayer_name: sourceDraft.taxpayer_name || null,
            gstins: sourceDraft.gstins || null,
            file_no: sourceDraft.file_no || null,
            date_of_initiation: sourceDraft.date_of_initiation || null,
            intel_approved_date: sourceDraft.intel_approved_date || null,
            mode_of_initiation: sourceDraft.mode_of_initiation || null,
            intelligence_action_date:
              sourceDraft.intelligence_action_date || null,
            handling_io_sio: sourceDraft.handling_io_sio || null,
            issue_involved: sourceDraft.issue_involved || null,
            latest_status: sourceDraft.latest_status || null,
            pr_adg_comments: sourceDraft.pr_adg_comments || null,
            detection_amount: sourceDraft.detection_amount || null,
            recovery_itc: sourceDraft.recovery_itc || null,
            recovery_cash: sourceDraft.recovery_cash || null,
            digit_id: sourceDraft.digit_id || null,
            bo_id: sourceDraft.bo_id || null,
            hsn_code: sourceDraft.hsn_code || null,
            closure_by: sourceDraft.closure_by || null,
            closure_reason: sourceDraft.closure_reason || null,
            transferred_to: sourceDraft.transferred_to || null,
            due_date: sourceDraft.due_date || null,
            date_of_ir: sourceDraft.date_of_ir || null,
            date_of_non_ir: sourceDraft.date_of_non_ir || null,
            converted_from_non_ir: sourceDraft.converted_from_non_ir || null,
          });
        if (closureErr) {
          toast.error(
            "IR created, NON-IR closed, but failed to write closure entry: " +
              closureErr.message,
          );
        } else {
          toast.success(
            `IR record created and NON-IR ${sourceDraft.record_id} closed.`,
          );
        }
      }
    } else {
      toast.success("Record added");
    }

    setSavingRow(false);
  };

  const handleCreateFromIntel = (
    draft: Omit<DGGIRecord, "id">,
    _sourceType: IntelSourceType,
    _sourceId: string,
  ) => {
    setDialogDraft(draft);
    setDialogMode("add");
    setDialogOpen(true);
    toast.info("Case pre-filled from intelligence record — review and save.");
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
    exportRegisterToExcel(tableRecords, visibleColumns, "DGGI", (msg) =>
      toast.success(msg),
    );
  };

  // ── Related register fetching ──────────────────────────────────────────────

  const fetchRelatedRegisters = async (recordId: string) => {
    const [arrestRes, provRes, scnRes] = await Promise.all([
      supabase
        .from("dggi_arrest_records")
        .select("*")
        .eq("linked_case_id", recordId),
      supabase
        .from("dggi_provisional_attachment_records")
        .select("*")
        .eq("linked_case_id", recordId),
      supabase
        .from("dggi_scn_records")
        .select("*")
        .eq("linked_case_id", recordId),
    ]);
    setArrestRecordsMap((prev) =>
      new Map(prev).set(recordId, arrestRes.data ?? []),
    );
    setProvisionalRecordsMap((prev) =>
      new Map(prev).set(recordId, provRes.data ?? []),
    );
    setScnRecordsMap((prev) => new Map(prev).set(recordId, scnRes.data ?? []));
  };

  const startEditWithRegisters = async (record: DGGIRecord) => {
    setDialogDraft({ ...record });
    setDialogEditingId(record.id);
    setDialogMode("edit");
    setDialogOpen(true);
    await fetchRelatedRegisters(record.record_id);
    // Mark ADG comment seen for this record
    if (unseenAdgComments.has(record.id)) {
      setUnseenAdgComments((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
      try {
        const seen = JSON.parse(localStorage.getItem(LS_ADG_COMMENT_SEEN_KEY) ?? "{}");
        seen[record.id] = new Date().toISOString();
        localStorage.setItem(LS_ADG_COMMENT_SEEN_KEY, JSON.stringify(seen));
      } catch {}
    }
  };

  // ── Related register saves ─────────────────────────────────────────────────

  // Derive Indian financial year string (e.g. "25-26") from an ISO date string
  const fyFromDate = (iso: string): string => {
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return fyFromDate("");
    const yr = d.getFullYear();
    const start = d.getMonth() >= 3 ? yr : yr - 1;
    return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
  };

  const openEditArrest = (rec: ArrestSubRecord) => {
    setArrestDialogMode("edit");
    setArrestDialogDraft({ ...rec } as Record<string, string>);
    setArrestDialogOpen(true);
  };

  const saveEditArrest = async () => {
    if (!arrestDialogDraft.id) return;
    setSavingArrest(true);
    const { error } = await supabase
      .from("dggi_arrest_records")
      .update({ ...arrestDialogDraft })
      .eq("id", arrestDialogDraft.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      const caseId = arrestDialogDraft.linked_case_id;
      setArrestRecordsMap((prev) => {
        const existing = prev.get(caseId) ?? [];
        return new Map(prev).set(
          caseId,
          existing.map((r) =>
            r.id === arrestDialogDraft.id
              ? ({ ...r, ...arrestDialogDraft } as ArrestSubRecord)
              : r,
          ),
        );
      });
      setArrestDialogOpen(false);
      toast.success("Arrest record saved");
    }
    setSavingArrest(false);
  };

  const openAddArrest = () => {
    setArrestDialogMode("add");
    const rec = records.find((r) => r.id === dialogEditingId);
    setArrestDialogDraft({
      linked_case_id: rec?.record_id ?? "",
      date_of_arrest: today(),
      // Derive FY from date_of_initiation or date_of_receipt
      financial_year: fyFromDate(
        rec?.date_of_initiation ?? rec?.date_of_receipt ?? "",
      ),
      // Unit name = taxpayer name + GSTIN is the closest equivalent
      unit_name_reg: [rec?.taxpayer_name, rec?.gstins]
        .filter(Boolean)
        .join(" / "),
      // Convert detection amount from Rs to Crores (1 Crore = 10,000,000)
      amount_crore: rec?.detection_amount
        ? String(parseFloat(rec.detection_amount) / 10000000 || "")
        : "",
      // Handling IO/SIO pre-fills the record-level SIO.
      sio: rec?.handling_io_sio ?? "",
      group: rec?.group ?? "",
      arrested_name: "",
      arrested_designation: "",
      arrested_age: "",

      role_evidence: "",
      relative_name: "",
      relative_address: "",
      relative_tel: "",
    });
    setArrestDialogOpen(true);
  };

  const saveNewArrest = async () => {
    if (!workspaceId) return;
    setSavingArrest(true);
    const payload = {
      ...arrestDialogDraft,
      record_id: await generateWorkspaceRecordId(
        supabase,
        "dggi_arrest_records",
        REGISTER_PREFIXES.ARREST,
        workspaceId,
      ),
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from("dggi_arrest_records")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add arrest record: " + error.message);
    } else {
      const caseId = arrestDialogDraft.linked_case_id;
      setArrestRecordsMap((prev) =>
        new Map(prev).set(caseId, [...(prev.get(caseId) ?? []), data]),
      );
      setArrestDialogOpen(false);
      toast.success("Arrest record added");
    }
    setSavingArrest(false);
  };

  const openEditProvisional = (rec: ProvisionalSubRecord) => {
    setProvisionalDialogMode("edit");
    setProvisionalDialogDraft({ ...rec } as Record<string, string>);
    setProvisionalDialogOpen(true);
  };

  const saveEditProvisional = async () => {
    if (!provisionalDialogDraft.id) return;
    setSavingProvisional(true);
    const sanitized = { ...provisionalDialogDraft };
    for (const k of [
      "date_of_attachment",
      "date_of_scn_issuance",
      "date_of_release",
      "expected_liability",
      "value_immovable",
      "value_movable",
      "value_shares",
      "value_bank",
      "value_third_party",
      "value_others",
      "value_total",
    ])
      if (sanitized[k] === "") sanitized[k] = null as any;
    const { error } = await supabase
      .from("dggi_provisional_attachment_records")
      .update(sanitized)
      .eq("id", provisionalDialogDraft.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      const caseId = provisionalDialogDraft.linked_case_id;
      setProvisionalRecordsMap((prev) => {
        const existing = prev.get(caseId) ?? [];
        return new Map(prev).set(
          caseId,
          existing.map((r) =>
            r.id === provisionalDialogDraft.id
              ? ({ ...r, ...provisionalDialogDraft } as ProvisionalSubRecord)
              : r,
          ),
        );
      });
      setProvisionalDialogOpen(false);
      toast.success("Provisional attachment saved");
    }
    setSavingProvisional(false);
  };

  const openAddProvisional = () => {
    setProvisionalDialogMode("add");
    const rec = records.find((r) => r.id === dialogEditingId);
    // Total recovery = ITC + Cash
    const itc = parseFloat(rec?.recovery_itc ?? "") || 0;
    const cash = parseFloat(rec?.recovery_cash ?? "") || 0;
    const totalRecovery = itc + cash > 0 ? String(itc + cash) : "";
    setProvisionalDialogDraft({
      linked_case_id: rec?.record_id ?? "",
      // Use intelligence_action_date as the attachment date
      date_of_attachment: rec?.intelligence_action_date ?? today(),
      // Person details
      person_name: rec?.taxpayer_name ?? "",
      gstin_pan: rec?.gstins ?? "",
      entity_gstin: rec?.gstins ?? "",
      // Investigation context — convert detection amount Rs → Crores
      issue_involved: rec?.issue_involved ?? "",
      expected_liability: rec?.detection_amount
        ? String(parseFloat(rec.detection_amount) / 10000000 || "")
        : "",
      // Handling officer pre-fill
      sio: rec?.handling_io_sio ?? "",
      group: rec?.group ?? "",
      group_sio: rec?.group ?? "",
      // Blank fields user must fill in
      person_status: "",
      person_involvement: "",
      arrest: "",
      description_of_property: "",
      value_immovable: "",
      value_movable: "",
      value_shares: "",
      value_bank: "",
      value_third_party: "",
      value_others: "",
      value_total: totalRecovery,
      investigation_completed: "",
      scn_issued: "",
      date_of_scn_issuance: "",
      letter_issued: "",
      oio_issued: "",
      date_of_release: "",
      linked_scn_no: "",
    });
    setProvisionalDialogOpen(true);
  };

  const saveNewProvisional = async () => {
    if (!workspaceId) return;
    setSavingProvisional(true);
    const sanitized = { ...provisionalDialogDraft };
    for (const k of [
      "date_of_attachment",
      "date_of_scn_issuance",
      "date_of_release",
      "expected_liability",
      "value_immovable",
      "value_movable",
      "value_shares",
      "value_bank",
      "value_third_party",
      "value_others",
      "value_total",
    ])
      if (sanitized[k] === "") sanitized[k] = null as any;
    const payload = {
      ...sanitized,
      record_id: await generateWorkspaceRecordId(
        supabase,
        "dggi_provisional_attachment_records",
        REGISTER_PREFIXES.PROVISIONAL_ATTACHMENT,
        workspaceId,
      ),
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from("dggi_provisional_attachment_records")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add provisional attachment: " + error.message);
    } else {
      const caseId = provisionalDialogDraft.linked_case_id;
      setProvisionalRecordsMap((prev) =>
        new Map(prev).set(caseId, [...(prev.get(caseId) ?? []), data]),
      );
      setProvisionalDialogOpen(false);
      toast.success("Provisional attachment record added");
    }
    setSavingProvisional(false);
  };

  const openEditSCN = (rec: SCNSubRecord) => {
    setScnDialogMode("edit");
    setScnDialogDraft({ ...rec } as Record<string, string>);
    setScnDialogOpen(true);
  };

  const saveEditSCN = async () => {
    if (!scnDialogDraft.id) return;
    setSavingSCN(true);
    const sanitized = { ...scnDialogDraft };
    ["last_date_oio", "date_uploading_bo", "date_of_scn"].forEach((k) => {
      if (sanitized[k] === "") sanitized[k] = null as any;
    });
    const { error } = await supabase
      .from("dggi_scn_records")
      .update(sanitized)
      .eq("id", scnDialogDraft.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      const caseId = scnDialogDraft.linked_case_id;
      setScnRecordsMap((prev) => {
        const existing = prev.get(caseId) ?? [];
        return new Map(prev).set(
          caseId,
          existing.map((r) =>
            r.id === scnDialogDraft.id
              ? ({ ...r, ...scnDialogDraft } as SCNSubRecord)
              : r,
          ),
        );
      });
      setScnDialogOpen(false);
      toast.success("SCN record saved");
    }
    setSavingSCN(false);
  };

  const openAddSCN = () => {
    setScnDialogMode("add");
    const rec = records.find((r) => r.id === dialogEditingId);
    setScnDialogDraft({
      linked_case_id: rec?.record_id ?? "",
      // Use IR date as SCN date — closest real trigger date
      date_of_scn: rec?.date_of_ir ?? today(),
      // Noticee identity
      noticee_name: rec?.taxpayer_name ?? "",
      gstin_pan: rec?.gstins ?? "",
      // Detection amount → demand tax (best proxy before adjudication split)
      demand_tax: rec?.detection_amount ?? "",
      demand_interest: "",
      demand_penalty: "",
      // FY as period involved
      period_involved: fyFromDate(rec?.date_of_receipt ?? ""),
      // Investigation details
      issue: rec?.issue_involved ?? "",
      file_no: rec?.file_no ?? "",
      // Handling officer maps to record-level SIO.
      sio: rec?.handling_io_sio ?? "",
      group: rec?.group ?? "",
      // Status/comments from case
      adjudication_status: rec?.latest_status ?? "",
      remarks: rec?.pr_adg_comments ?? "",
      // Blank fields user must fill
      scn_no: "",
      last_date_oio: "",
      adjudication_formation: "",
      din_no: "",
      date_uploading_bo: "",
      appeal_stage: "",
    });
    setScnDialogOpen(true);
  };

  const saveNewSCN = async () => {
    if (!workspaceId) return;
    setSavingSCN(true);
    const sanitized = { ...scnDialogDraft };
    ["last_date_oio", "date_uploading_bo", "date_of_scn"].forEach((k) => {
      if (sanitized[k] === "") sanitized[k] = null as any;
    });
    const payload = {
      ...sanitized,
      record_id: await generateWorkspaceRecordId(
        supabase,
        "dggi_scn_records",
        REGISTER_PREFIXES.SCN,
        workspaceId,
      ),
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from("dggi_scn_records")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add SCN record: " + error.message);
    } else {
      const caseId = scnDialogDraft.linked_case_id;
      setScnRecordsMap((prev) =>
        new Map(prev).set(caseId, [...(prev.get(caseId) ?? []), data]),
      );
      setScnDialogOpen(false);
      toast.success("SCN record added");
    }
    setSavingSCN(false);
  };

  const deleteArrestRecord = (id: string) => {
    let found: ArrestSubRecord | undefined;
    let foundKey: string | undefined;
    for (const [k, v] of arrestRecordsMap) {
      const r = v.find((x) => x.id === id);
      if (r) {
        found = r;
        foundKey = k;
        break;
      }
    }
    if (!found || !foundKey) return;
    const record = found;
    const key = foundKey;
    setArrestRecordsMap((prev) => {
      const next = new Map(prev);
      for (const [k, v] of next)
        next.set(
          k,
          v.filter((r) => r.id !== id),
        );
      return next;
    });
    let toastId: ReturnType<typeof toast.info>;
    const timerId = setTimeout(async () => {
      const { error } = await supabase
        .from("dggi_arrest_records")
        .delete()
        .eq("id", id);
      if (error) {
        setArrestRecordsMap((prev) => {
          const next = new Map(prev);
          next.set(key, [...(next.get(key) ?? []), record]);
          return next;
        });
        toast.error("Delete failed: " + error.message);
      }
    }, 5000);
    toastId = toast.info(
      <div className="flex items-center justify-between gap-3 w-full">
        <span>{record.record_id ?? "Arrest record"} deleted</span>
        <button
          onClick={() => {
            clearTimeout(timerId);
            setArrestRecordsMap((prev) => {
              const next = new Map(prev);
              next.set(key, [...(next.get(key) ?? []), record]);
              return next;
            });
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

  const deleteProvisionalRecord = (id: string) => {
    let found: ProvisionalSubRecord | undefined;
    let foundKey: string | undefined;
    for (const [k, v] of provisionalRecordsMap) {
      const r = v.find((x) => x.id === id);
      if (r) {
        found = r;
        foundKey = k;
        break;
      }
    }
    if (!found || !foundKey) return;
    const record = found;
    const key = foundKey;
    setProvisionalRecordsMap((prev) => {
      const next = new Map(prev);
      for (const [k, v] of next)
        next.set(
          k,
          v.filter((r) => r.id !== id),
        );
      return next;
    });
    let toastId: ReturnType<typeof toast.info>;
    const timerId = setTimeout(async () => {
      const { error } = await supabase
        .from("dggi_provisional_attachment_records")
        .delete()
        .eq("id", id);
      if (error) {
        setProvisionalRecordsMap((prev) => {
          const next = new Map(prev);
          next.set(key, [...(next.get(key) ?? []), record]);
          return next;
        });
        toast.error("Delete failed: " + error.message);
      }
    }, 5000);
    toastId = toast.info(
      <div className="flex items-center justify-between gap-3 w-full">
        <span>{record.record_id ?? "Provisional attachment"} deleted</span>
        <button
          onClick={() => {
            clearTimeout(timerId);
            setProvisionalRecordsMap((prev) => {
              const next = new Map(prev);
              next.set(key, [...(next.get(key) ?? []), record]);
              return next;
            });
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

  const deleteScnRecord = (id: string) => {
    let found: SCNSubRecord | undefined;
    let foundKey: string | undefined;
    for (const [k, v] of scnRecordsMap) {
      const r = v.find((x) => x.id === id);
      if (r) {
        found = r;
        foundKey = k;
        break;
      }
    }
    if (!found || !foundKey) return;
    const record = found;
    const key = foundKey;
    setScnRecordsMap((prev) => {
      const next = new Map(prev);
      for (const [k, v] of next)
        next.set(
          k,
          v.filter((r) => r.id !== id),
        );
      return next;
    });
    let toastId: ReturnType<typeof toast.info>;
    const timerId = setTimeout(async () => {
      const { error } = await supabase
        .from("dggi_scn_records")
        .delete()
        .eq("id", id);
      if (error) {
        setScnRecordsMap((prev) => {
          const next = new Map(prev);
          next.set(key, [...(next.get(key) ?? []), record]);
          return next;
        });
        toast.error("Delete failed: " + error.message);
      }
    }, 5000);
    toastId = toast.info(
      <div className="flex items-center justify-between gap-3 w-full">
        <span>{record.record_id ?? "SCN record"} deleted</span>
        <button
          onClick={() => {
            clearTimeout(timerId);
            setScnRecordsMap((prev) => {
              const next = new Map(prev);
              next.set(key, [...(next.get(key) ?? []), record]);
              return next;
            });
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

  // ── Row renderer (shared between flat and grouped views) ───────────────────

  const renderRow = (record: DGGIRecord) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const isOverdue = record.due_date && record.due_date < todayStr;

    return (
      <TableRow
        key={record.id}
        data-record-id={record.record_id}
        className="border-b border-[#EDEDEA] text-base hover:bg-white"
      >
        {visibleColumns.map((col) => (
          <TableCell
            key={col.key}
            className={`px-3 py-2 ${
              col.key === "due_date" && isOverdue
                ? "text-[#C0432A] font-medium"
                : "text-[#1a1a1a]"
            }`}
          >
            {col.key === "record_id" ? (
              <button
                className="font-medium text-[#4A5FD4] underline underline-offset-2 hover:text-[#3B4EC5] text-left"
                onClick={() => startEditWithRegisters(record)}
              >
                {record.record_id || "—"}
              </button>
            ) : col.key === "converted_from_non_ir" &&
              record.converted_from_non_ir ? (
              (() => {
                const nirRecord = records.find(
                  (r) => r.record_id === record.converted_from_non_ir,
                );
                const href = nirRecord?.closure_by
                  ? `/tasks/closure-register?caseId=${encodeURIComponent(record.converted_from_non_ir)}`
                  : `/tasks/investigation-cases?caseId=${encodeURIComponent(record.converted_from_non_ir)}`;
                return (
                  <a
                    href={href}
                    className="font-medium text-[#4A5FD4] underline underline-offset-2 hover:text-[#3B4EC5]"
                  >
                    {record.converted_from_non_ir}
                  </a>
                );
              })()
            ) : col.key === "pr_adg_comments" &&
              unseenAdgComments.has(record.id) ? (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#4A5FD4]" />
                <EditableCell
                  value={(record as any)[col.key] ?? ""}
                  type={col.type}
                  options={col.options}
                  editing={false}
                  users={workspaceUsers}
                  readOnly={col.readOnly}
                  onChange={() => {}}
                />
              </div>
            ) : (
              <EditableCell
                value={(record as any)[col.key] ?? ""}
                type={col.type}
                options={col.options}
                editing={false}
                users={workspaceUsers}
                readOnly={col.readOnly}
                storedName={
                  col.key === "handling_io_sio"
                    ? record.handling_io_sio_name
                    : undefined
                }
                onChange={() => {}}
              />
            )}
          </TableCell>
        ))}
        <TableCell className="px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]"
              onClick={() => startEditWithRegisters(record)}
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
                  <AlertDialogTitle>Delete record?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {record.record_id} and cannot
                    be undone.
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
      <CreateFromIntelDialog
        open={intelDialogOpen}
        onClose={() => setIntelDialogOpen(false)}
        workspaceId={workspaceId}
        onConfirm={handleCreateFromIntel}
      />
      <DGGIRecordDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) cancelDialog();
        }}
        mode={dialogMode}
        draft={dialogDraft}
        onDraftChange={(k, v) =>
          setDialogDraft((prev) => ({ ...prev, [k]: v }))
        }
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        users={workspaceUsers}
        userRole={userRole}
        caseRecordId={dialogDraft.record_id}
        arrestRecords={arrestRecordsMap.get(dialogDraft.record_id ?? "") ?? []}
        provisionalRecords={
          provisionalRecordsMap.get(dialogDraft.record_id ?? "") ?? []
        }
        scnRecords={scnRecordsMap.get(dialogDraft.record_id ?? "") ?? []}
        onAddArrest={openAddArrest}
        onAddProvisional={openAddProvisional}
        onAddSCN={openAddSCN}
        onEditArrest={openEditArrest}
        onEditProvisional={openEditProvisional}
        onEditSCN={openEditSCN}
        onDeleteArrest={deleteArrestRecord}
        onDeleteProvisional={deleteProvisionalRecord}
        onDeleteSCN={deleteScnRecord}
      />

      {/* ── Arrest sub-dialog ─────────────────────────────────────────────── */}
      <RegisterRecordDialog
        open={arrestDialogOpen}
        onOpenChange={setArrestDialogOpen}
        mode={arrestDialogMode}
        columns={ARREST_COLUMNS}
        draft={arrestDialogDraft}
        onDraftChange={(k, v) =>
          setArrestDialogDraft((prev) => ({ ...prev, [k]: v }))
        }
        onSave={arrestDialogMode === "edit" ? saveEditArrest : saveNewArrest}
        saving={savingArrest}
        users={workspaceUsers}
        caseOptions={caseOptions}
      />

      {/* ── Provisional Attachment sub-dialog ─────────────────────────────── */}
      <RegisterRecordDialog
        open={provisionalDialogOpen}
        onOpenChange={setProvisionalDialogOpen}
        mode={provisionalDialogMode}
        columns={PROVISIONAL_COLUMNS}
        draft={provisionalDialogDraft}
        onDraftChange={(k, v) =>
          setProvisionalDialogDraft((prev) => ({ ...prev, [k]: v }))
        }
        onSave={
          provisionalDialogMode === "edit"
            ? saveEditProvisional
            : saveNewProvisional
        }
        saving={savingProvisional}
        users={workspaceUsers}
        caseOptions={caseOptions}
      />

      {/* ── SCN sub-dialog ────────────────────────────────────────────────── */}
      <RegisterRecordDialog
        open={scnDialogOpen}
        onOpenChange={setScnDialogOpen}
        mode={scnDialogMode}
        columns={SCN_COLUMNS}
        draft={scnDialogDraft}
        onDraftChange={(k, v) =>
          setScnDialogDraft((prev) => ({ ...prev, [k]: v }))
        }
        onSave={scnDialogMode === "edit" ? saveEditSCN : saveNewSCN}
        saving={savingSCN}
        users={workspaceUsers}
        caseOptions={caseOptions}
      />
      <div className="px-3 sm:px-6 space-y-5">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">
                Cases by Group
              </h1>
              <p className="text-base text-[#9a9a96]">
                {topFilter === "ir" ? "Pending IR" : "Pending NON-IR"} ·{" "}
                {tableRecords.length} record
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

              {/* ── Column picker ──────────────────────────────────────── */}
              <Popover open={colPickerOpen} onOpenChange={setColPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-9 rounded-lg text-base shadow-none px-4 ${
                      hiddenColumns.size > 0
                        ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
                        : "border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"
                    }`}
                  >
                    <Columns2 size={15} className="mr-1" />
                    Columns
                    {hiddenColumns.size > 0 && (
                      <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#4A5FD4] text-xs text-white font-medium">
                        {hiddenColumns.size}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[220px] p-2 border border-[#EDEDEA] shadow-none rounded-xl max-h-[400px] overflow-y-auto"
                >
                  <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      Toggle columns
                    </span>
                    {hiddenColumns.size > 0 && (
                      <button
                        onClick={() => {
                          setHiddenColumns(new Set());
                          try {
                            localStorage.removeItem(LS_HIDDEN_COLS_KEY);
                          } catch {}
                        }}
                        className="text-xs text-[#4A5FD4] hover:underline"
                      >
                        Show all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {activeColumns.map((col) => {
                      const visible = !hiddenColumns.has(col.key);
                      return (
                        <button
                          key={col.key}
                          onClick={() => toggleColumn(col.key)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base text-left transition-all ${
                            visible
                              ? "text-[#1a1a1a] hover:bg-[#F3F2EF]"
                              : "text-[#9a9a96] hover:bg-[#F3F2EF]"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              visible
                                ? "border-[#4A5FD4] bg-[#4A5FD4]"
                                : "border-[#EDEDEA]"
                            }`}
                          >
                            {visible && (
                              <Check size={10} className="text-white" />
                            )}
                          </span>
                          <span className="truncate">{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                size="sm"
                className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4"
                onClick={() => {
                  setDialogDraft({
                    ...EMPTY_RECORD,
                    is_ir: topFilter === "ir",
                    group: (userGroups[0] as GroupName) ?? "Group A",
                  });
                  setDialogMode("add");
                  setDialogOpen(true);
                }}
              >
                <Plus size={15} className="mr-1" />
                Add Record
              </Button>
            </div>
          </div>
        </div>

        {/* ── Top summary cards ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <SummaryCard
            label="Pending IR"
            count={irTotal}
            active={topFilter === "ir"}
            onClick={() => {
              setTopFilter("ir");
              setGroupFilter(null);
            }}
          />
          <SummaryCard
            label="Pending NON-IR"
            count={nonIrTotal}
            active={topFilter === "non-ir"}
            onClick={() => {
              setTopFilter("non-ir");
              setGroupFilter(null);
            }}
          />
        </div>

        {/* ── Group filter cards ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {GROUPS.map((name) => {
            const count = records.filter(
              (r) =>
                r.group === name &&
                !r.closure_by &&
                (topFilter === "ir" ? r.is_ir : !r.is_ir),
            ).length;
            if (count === 0) return null;
            return (
              <GroupCard
                key={name}
                name={name}
                count={count}
                active={groupFilter === name}
                onClick={() =>
                  setGroupFilter((prev) => (prev === name ? null : name))
                }
              />
            );
          })}
        </div>

        {/* ── Filter + Group-by bar ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3 space-y-3">
          {/* Filters row */}
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
                placeholder="Search taxpayer, GSTIN, file no…"
                className="h-9 pl-8 pr-3 min-w-[240px] border-[#EDEDEA] text-base rounded-lg"
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

            {/* Mode of Initiation */}
            <MultiSelectFilter
              label="Mode"
              options={MODE_OPTIONS}
              selected={filters.modes}
              onChange={(v) => setFilter("modes", v)}
            />

            {/* Group */}
            <Select
              value={groupFilter ?? "all"}
              onValueChange={(v) =>
                setGroupFilter(v === "all" ? null : (v as GroupName))
              }
            >
              <SelectTrigger
                className={`h-9 w-[130px] rounded-lg text-base border ${
                  groupFilter
                    ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
                    : "border-[#EDEDEA] text-[#1a1a1a]"
                }`}
              >
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Handling IO/SIO */}
            <UserFilter
              value={filters.handlingIo}
              users={workspaceUsers}
              onChange={(v) => setFilter("handlingIo", v)}
            />

            {/* Date of Receipt from Int Section range */}
            <div className="flex items-center gap-1">
              <span className="text-base text-[#9a9a96] shrink-0">
                Receipt:
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

            {/* Due Date Year */}
            <div className="flex items-center gap-1">
              <span className="text-base text-[#9a9a96] shrink-0">
                Due Year:
              </span>
              <Select
                value={filters.dueDateYear || "all"}
                onValueChange={(v) =>
                  setFilter("dueDateYear", v === "all" ? "" : v)
                }
              >
                <SelectTrigger
                  className={`h-9 w-[100px] rounded-lg text-base border ${
                    filters.dueDateYear
                      ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
                      : "border-[#EDEDEA] text-[#1a1a1a]"
                  }`}
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DUE_DATE_YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setFilters({ ...EMPTY_FILTERS });
                  setGroupFilter(null);
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

          {/* Divider */}
          <div className="border-t border-[#EDEDEA]" />

          {/* Group-by row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <Layers size={14} />
              <span className="font-medium">Group by</span>
            </div>

            <Select
              value={groupBy}
              onValueChange={(v) => {
                setGroupBy(v as GroupByField | "none");
                setCollapsedGroups(new Set());
              }}
            >
              <SelectTrigger
                className={`h-9 w-[200px] rounded-lg text-base border ${
                  groupBy !== "none"
                    ? "border-[#4A5FD4] bg-[#EEF2FF] text-[#4A5FD4]"
                    : "border-[#EDEDEA] text-[#1a1a1a]"
                }`}
              >
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {GROUP_BY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {groupBy !== "none" && groupedBuckets.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={expandAll}
                  className="text-base text-[#6b6b6b] hover:text-[#4A5FD4] transition-all px-2 py-1 rounded-lg hover:bg-[#EEF2FF]"
                >
                  Expand all
                </button>
                <span className="text-[#EDEDEA]">·</span>
                <button
                  onClick={collapseAll}
                  className="text-base text-[#6b6b6b] hover:text-[#4A5FD4] transition-all px-2 py-1 rounded-lg hover:bg-[#EEF2FF]"
                >
                  Collapse all
                </button>
                <span className="ml-2 text-base text-[#9a9a96]">
                  {groupedBuckets.length} group
                  {groupedBuckets.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Records table ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-b border-[#EDEDEA]">
                  {visibleColumns.map((col) => (
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
                {groupBy === "none" ? (
                  /* ── Flat view ── */
                  <>
                    {tableRecords.map(renderRow)}

                    {tableRecords.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={totalCols}
                          className="py-12 text-center text-base text-[#9a9a96]"
                        >
                          No {topFilter === "ir" ? "IR" : "NON-IR"} records
                          match the current filters.{" "}
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
                  </>
                ) : (
                  /* ── Grouped view ── */
                  <>
                    {groupedBuckets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={totalCols}
                          className="py-12 text-center text-base text-[#9a9a96]"
                        >
                          No records match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedBuckets.map(({ key, label, rows }) => {
                        const collapsed = collapsedGroups.has(key);
                        return (
                          <>
                            {/* Group header row */}
                            <TableRow
                              key={`hdr-${key}`}
                              className="bg-white border-b border-[#EDEDEA] cursor-pointer select-none hover:bg-[#F0EEFA]"
                              onClick={() => toggleGroupCollapse(key)}
                            >
                              <TableCell
                                colSpan={totalCols}
                                className="px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  {collapsed ? (
                                    <ChevronRight
                                      size={14}
                                      className="text-[#6b6b6b] shrink-0"
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={14}
                                      className="text-[#6b6b6b] shrink-0"
                                    />
                                  )}
                                  <span className="text-base font-semibold text-[#1a1a1a]">
                                    {label}
                                  </span>
                                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#4A5FD4] px-1.5 text-xs text-white font-medium">
                                    {rows.length}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Group rows */}
                            {!collapsed && rows.map(renderRow)}
                          </>
                        );
                      })
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DGGIComponent;

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// ❯ 1. Show case notice number register
//   2. Provsional attachment register
//   3. Incident report register
//   4. arrest register
//   5. NON-IR Case register
//   --------
// ──────────────────────
