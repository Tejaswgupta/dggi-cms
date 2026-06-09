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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllUsers } from "@/hooks/useWorkspaceUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import { DGGI_GROUPS } from "@/lib/dggi-constants";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import {
  DGGIRecordDialog,
  EMPTY_RECORD,
  type DGGIRecord,
} from "./DGGIComponent";
import {
  REGISTER_PREFIXES,
  exportRegisterToExcel,
  fetchCaseOptions,
  generateWorkspaceRecordId,
} from "./register-utils";
import {
  RegisterRecordDialog,
  type RegisterColumn,
  type WorkspaceUser,
} from "./RegisterRecordDialog";

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

// ── Rapid sub-register ────────────────────────────────────────────────────────

interface RapidRecord {
  id: string;
  record_id: string;
  linked_case_id: string | null;
  rapid_id: string;
  file_no_ref_id: string;
  receipt_mode: string;
  received_against_entity: string;
  nature_gist: string;
  sender_email: string;
  sender_mobile: string;
  assigned_group: string;
  transferred_to: string;
  group_allocation_date: string;
  last_updated_on: string;
  action_taken: string;
  remarks: string;
  date_of_action_taken: string;
  non_ir_no: string;
  non_ir_date: string;
  sio: string;
}

const RAPID_COLS: RegisterColumn[] = [
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
  { key: "rapid_id", label: "Rapid ID", type: "text", width: "140px" },
  {
    key: "file_no_ref_id",
    label: "F. No./Reference ID",
    type: "text",
    width: "180px",
  },
  { key: "receipt_mode", label: "Receipt Mode", type: "text", width: "140px" },
  {
    key: "received_against_entity",
    label: "Received Against/Entity",
    type: "text",
    width: "200px",
  },
  {
    key: "nature_gist",
    label: "Nature/Gist of Reference",
    type: "text",
    width: "220px",
  },
  {
    key: "sender_email",
    label: "Email",
    type: "text",
    width: "180px",
  },
  {
    key: "sender_mobile",
    label: "Mobile",
    type: "text",
    width: "140px",
  },
  {
    key: "action_taken",
    label: "Action Taken",
    type: "select",
    width: "160px",
    options: ["Allocated", "Transferred", "Closed"],
  },
  {
    key: "assigned_group",
    label: "Allocated To",
    type: "select",
    width: "170px",
    options: DGGI_GROUPS,
    showWhen: { field: "action_taken", values: ["Allocated"] },
  },
  {
    key: "transferred_to",
    label: "Transferred To",
    type: "text",
    width: "160px",
    showWhen: { field: "action_taken", values: ["Transferred"] },
  },
  {
    key: "date_of_action_taken",
    label: "Date of Allocation",
    type: "datepicker",
    width: "160px",
    readOnly: true,
  },
  {
    key: "sio",
    label: "Delegated to IO/SIO",
    type: "usercombobox",
    width: "180px",
    showWhen: { field: "action_taken", values: ["Allocated"] },
  },
  {
    key: "non_ir_no",
    label: "NON-IR No",
    type: "text",
    width: "180px",
    readOnly: true,
  },
  {
    key: "non_ir_date",
    label: "NON-IR Date",
    type: "datepicker",
    width: "150px",
    readOnly: true,
  },
];

const EMPTY_RAPID: Omit<RapidRecord, "id"> = {
  record_id: "",
  linked_case_id: null,
  rapid_id: "",
  file_no_ref_id: "",
  receipt_mode: "",
  received_against_entity: "",
  nature_gist: "",
  sender_email: "",
  sender_mobile: "",
  assigned_group: "",
  transferred_to: "",
  group_allocation_date: "",
  last_updated_on: "",
  action_taken: "",
  remarks: "",
  date_of_action_taken: "",
  non_ir_no: "",
  non_ir_date: "",
  sio: "",
};

// ── Other Sources sub-register ────────────────────────────────────────────────

interface OtherSourceRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  source_name: string;
  e_office_ref_no: string;
  reference_no: string;
  date_of_receipt: string;
  nature_of_intel: string;
  entity_name: string;
  gstin: string;
  action_taken: string;
  assigned_group: string;
  transferred_to: string;
  group_allocation_date: string;
  date_of_action_taken: string;
  remarks: string;
  non_ir_no: string;
  non_ir_date: string;
  sio: string;
}

const OTHER_COLS: RegisterColumn[] = [
  {
    key: "record_id",
    label: "ID",
    type: "text",
    width: "140px",
    readOnly: true,
  },
  // {
  //   key: "linked_case_id",
  //   label: "Linked Case",
  //   type: "caselink",
  //   width: "180px",
  // },
  {
    key: "source_name",
    label: "Source",
    type: "select",
    width: "160px",
    options: ["HQ", "SNU", "Complainant"],
    allowOther: true,
  },
  {
    key: "e_office_ref_no",
    label: "e-Office Ref. No.",
    type: "text",
    width: "170px",
  },
  { key: "reference_no", label: "Reference No.", type: "text", width: "160px" },
  {
    key: "date_of_receipt",
    label: "Date of Receipt",
    type: "datepicker",
    width: "150px",
  },
  {
    key: "nature_of_intel",
    label: "Nature of Intel",
    type: "text",
    width: "200px",
  },
  { key: "entity_name", label: "Entity Name", type: "text", width: "180px" },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  {
    key: "action_taken",
    label: "Action Taken",
    type: "select",
    width: "160px",
    options: ["Allocated", "Transferred", "Closed"],
  },
  {
    key: "assigned_group",
    label: "Allocated To",
    type: "select",
    width: "170px",
    options: DGGI_GROUPS,
    showWhen: { field: "action_taken", values: ["Allocated"] },
  },
  {
    key: "transferred_to",
    label: "Transferred To",
    type: "text",
    width: "160px",
    showWhen: { field: "action_taken", values: ["Transferred"] },
  },
  {
    key: "group_allocation_date",
    label: "Group Allocation Date",
    type: "datepicker",
    width: "180px",
    readOnly: true,
  },
  {
    key: "date_of_action_taken",
    label: "Date of Allocation",
    type: "datepicker",
    width: "160px",
    readOnly: true,
  },
  {
    key: "non_ir_no",
    label: "NON-IR No",
    type: "text",
    width: "180px",
    readOnly: true,
  },
  {
    key: "non_ir_date",
    label: "NON-IR Date",
    type: "datepicker",
    width: "150px",
    readOnly: true,
  },
  {
    key: "sio",
    label: "Delegated to IO/SIO",
    type: "usercombobox",
    width: "180px",
    showWhen: { field: "action_taken", values: ["Allocated"] },
  },
  { key: "remarks", label: "Remarks", type: "text", width: "220px" },
];

const EMPTY_OTHER: Omit<OtherSourceRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  source_name: "",
  e_office_ref_no: "",
  reference_no: "",
  date_of_receipt: "",
  nature_of_intel: "",
  entity_name: "",
  gstin: "",
  action_taken: "",
  assigned_group: "",
  transferred_to: "",
  group_allocation_date: "",
  date_of_action_taken: "",
  remarks: "",
  non_ir_no: "",
  non_ir_date: "",
  sio: "",
};

// ── STR sub-register ──────────────────────────────────────────────────────────

interface STRRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  str_reference_no: string;
  file_no_ref_id: string;
  date_of_str: string;
  receipt_mode: string;
  received_against_entity: string;
  nature_gist: string;
  sender_email_mobile: string;
  assigned_group: string;
  group_allocation_date: string;
  last_updated_on: string;
  entity_name: string;
  gstin: string;
  amount_involved: string;
  nature_of_offence: string;
  fiu_reference_no: string;
  action_taken: string;
  date_of_action_taken: string;
  remarks: string;
  sio_group: string;
  sio: string;
  group: string;
  non_ir_no: string;
  non_ir_date: string;
}

const STR_COLS: RegisterColumn[] = [
  {
    key: "record_id",
    label: "ID",
    type: "text",
    width: "140px",
    readOnly: true,
  },
  // {
  //   key: "linked_case_id",
  //   label: "Linked Case",
  //   type: "caselink",
  //   width: "180px",
  // },
  {
    key: "str_reference_no",
    label: "STR Reference No.",
    type: "text",
    width: "180px",
  },
  {
    key: "file_no_ref_id",
    label: "F. No./Reference ID",
    type: "text",
    width: "180px",
  },
  {
    key: "date_of_str",
    label: "Date of STR",
    type: "datepicker",
    width: "150px",
  },
  { key: "receipt_mode", label: "Receipt Mode", type: "text", width: "140px" },
  {
    key: "received_against_entity",
    label: "Received Against/Entity",
    type: "text",
    width: "200px",
  },
  {
    key: "nature_gist",
    label: "Nature/Gist of Reference",
    type: "text",
    width: "220px",
  },
  {
    key: "sender_email_mobile",
    label: "Email/Mobile",
    type: "text",
    width: "160px",
  },
  {
    key: "group_allocation_date",
    label: "Group Allocation Date",
    type: "datepicker",
    width: "180px",
    readOnly: true,
  },
  {
    key: "last_updated_on",
    label: "Last Updated On",
    type: "datepicker",
    width: "150px",
    readOnly: true,
  },
  { key: "entity_name", label: "Trade Name", type: "text", width: "180px" },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  {
    key: "amount_involved",
    label: "Amount Involved",
    type: "text",
    width: "150px",
  },
  {
    key: "nature_of_offence",
    label: "Nature of Offence",
    type: "text",
    width: "200px",
  },
  {
    key: "fiu_reference_no",
    label: "FIU Reference No.",
    type: "text",
    width: "170px",
  },
  {
    key: "action_taken",
    label: "Action Taken",
    type: "select",
    width: "160px",
    options: ["Allocated", "Transferred", "Closed"],
  },
  {
    key: "assigned_group",
    label: "Transferred To",
    type: "text",
    width: "160px",
    showWhen: { field: "action_taken", values: ["Transferred"] },
  },
  {
    key: "date_of_action_taken",
    label: "Date of Allocation",
    type: "datepicker",
    width: "160px",
    readOnly: true,
  },
  { key: "sio_group", label: "SIO/Group", type: "text", width: "140px" },
  {
    key: "sio",
    label: "Delegated to IO/SIO",
    type: "usercombobox",
    width: "180px",
    showWhen: { field: "action_taken", values: ["Allocated"] },
  },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: DGGI_GROUPS,
    width: "120px",
    showWhen: { field: "action_taken", values: ["Allocated"] },
  },
  {
    key: "non_ir_no",
    label: "NON-IR No",
    type: "text",
    width: "180px",
    readOnly: true,
  },
  {
    key: "non_ir_date",
    label: "NON-IR Date",
    type: "datepicker",
    width: "150px",
    readOnly: true,
  },
  { key: "remarks", label: "Remarks", type: "text", width: "220px" },
];

const EMPTY_STR: Omit<STRRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  str_reference_no: "",
  file_no_ref_id: "",
  date_of_str: "",
  receipt_mode: "",
  received_against_entity: "",
  nature_gist: "",
  sender_email_mobile: "",
  assigned_group: "",
  group_allocation_date: "",
  last_updated_on: "",
  entity_name: "",
  gstin: "",
  amount_involved: "",
  nature_of_offence: "",
  fiu_reference_no: "",
  action_taken: "",
  date_of_action_taken: "",
  remarks: "",
  sio_group: "",
  sio: "",
  group: "",
  non_ir_no: "",
  non_ir_date: "",
};

// ── Intel alarm logic ─────────────────────────────────────────────────────────

type IntelAlarmLevel = "overdue" | "critical" | "warning" | null;

interface IntelAlarm {
  level: IntelAlarmLevel;
  label: string;
  daysLeft: number | null;
}

function intelAlarm(
  referenceDate: string,
  offsetDays: number,
  criticalDays: number,
  warningDays: number,
  closingDate: string,
): IntelAlarm {
  if (!referenceDate || !!closingDate)
    return { level: null, label: "", daysLeft: null };
  const base = parseISO(referenceDate);
  if (!isValid(base)) return { level: null, label: "", daysLeft: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysElapsed = differenceInCalendarDays(today, base);
  const daysLeft = offsetDays - daysElapsed;
  if (daysLeft < 0) return { level: "overdue", label: "", daysLeft };
  if (daysLeft <= criticalDays)
    return { level: "critical", label: "", daysLeft };
  if (daysLeft <= warningDays) return { level: "warning", label: "", daysLeft };
  return { level: null, label: "", daysLeft: null };
}

function IntelAlarmBadge({
  alarm,
  label,
}: {
  alarm: IntelAlarm;
  label: string;
}) {
  if (!alarm.level) return null;
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
  }[alarm.level];
  const text =
    alarm.daysLeft !== null && alarm.daysLeft < 0
      ? `${Math.abs(alarm.daysLeft)}d overdue`
      : alarm.daysLeft !== null
        ? `${alarm.daysLeft}d left`
        : "";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {label}
      {text ? `: ${text}` : ""}
    </span>
  );
}

// Map of colKey → function that returns alarm JSX given the record
type AlarmCellRenderer = (record: Record<string, string>) => React.ReactNode;

// ── Generic read-only table sub-component ─────────────────────────────────────

type CustomCellRenderer<T> = (record: T) => React.ReactNode;

function SubTable<T extends { id: string; record_id: string }>({
  records,
  columns,
  sortCol,
  sortDir,
  search,
  searchPlaceholder,
  onSearch,
  onEdit,
  onDelete,
  onAdd,
  onSort,
  emptyMessage,
  onExport,
  users,
  cases,
  alarmCells,
  customCells,
}: {
  records: T[];
  columns: RegisterColumn[];
  sortCol: string | null;
  sortDir: "asc" | "desc";
  search: string;
  searchPlaceholder: string;
  onSearch: (v: string) => void;
  onEdit: (r: T) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onSort: (col: string) => void;
  emptyMessage: string;
  onExport: () => void;
  users: WorkspaceUser[];
  cases: DGGICaseOption[];
  alarmCells?: Record<string, AlarmCellRenderer>;
  customCells?: Record<string, CustomCellRenderer<T>>;
}) {
  const renderCell = (value: string, type: RegisterColumn["type"]) => {
    if (type === "caselink")
      return (
        <CaseIdCombobox
          value={value}
          onChange={() => {}}
          cases={cases}
          editing={false}
        />
      );
    if (type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (type === "usercombobox")
      return (
        <span>{users.find((u) => u.id === value)?.name || value || "—"}</span>
      );
    return <span>{value || "—"}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b]">
              <SlidersHorizontal size={14} />
              <span className="font-medium">Search</span>
            </div>
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-3 text-[#9a9a96] pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-8 pr-3 min-w-[220px] border-[#EDEDEA] text-base rounded-lg"
              />
            </div>
            {search && (
              <button
                onClick={() => onSearch("")}
                className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4"
              onClick={onExport}
              disabled={records.length === 0}
            >
              <Download size={15} className="mr-1" />
              Export to Excel
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4"
              onClick={onAdd}
            >
              <Plus size={15} className="mr-1" />
              Add Record
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white border-b border-[#EDEDEA]">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    style={{ minWidth: col.width }}
                    className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]"
                    onClick={() => onSort(col.key)}
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
              {records.map((record) => (
                <TableRow
                  key={record.id}
                  data-record-id={record.record_id}
                  className="border-b border-[#EDEDEA] text-base hover:bg-white"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className="px-3 py-2 text-[#1a1a1a]"
                    >
                      {customCells?.[col.key] ? (
                        customCells[col.key](record)
                      ) : alarmCells?.[col.key] ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="whitespace-nowrap">
                            {fmt((record as any)[col.key] ?? "")}
                          </span>
                          {alarmCells[col.key](
                            record as unknown as Record<string, string>,
                          )}
                        </div>
                      ) : (
                        renderCell((record as any)[col.key] ?? "", col.type)
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]"
                        onClick={() => onEdit(record)}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]"
                        onClick={() => onDelete(record.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="py-12 text-center text-base text-[#9a9a96]"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const IntelligenceAllocationComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);

  const [rapidRecords, setRapidRecords] = useState<RapidRecord[]>([]);
  const [rapidSearch, setRapidSearch] = useState("");
  const [rapidSortCol, setRapidSortCol] = useState<string | null>(null);
  const [rapidSortDir, setRapidSortDir] = useState<"asc" | "desc">("asc");
  const [rapidSaving, setRapidSaving] = useState(false);
  const [rapidDialogOpen, setRapidDialogOpen] = useState(false);
  const [rapidDialogMode, setRapidDialogMode] = useState<"add" | "edit">("add");
  const [rapidDialogDraft, setRapidDialogDraft] = useState<
    Partial<RapidRecord>
  >({});

  const [otherRecords, setOtherRecords] = useState<OtherSourceRecord[]>([]);
  const [otherSearch, setOtherSearch] = useState("");
  const [otherSortCol, setOtherSortCol] = useState<string | null>(null);
  const [otherSortDir, setOtherSortDir] = useState<"asc" | "desc">("asc");
  const [otherSaving, setOtherSaving] = useState(false);
  const [otherDialogOpen, setOtherDialogOpen] = useState(false);
  const [otherDialogMode, setOtherDialogMode] = useState<"add" | "edit">("add");
  const [otherDialogDraft, setOtherDialogDraft] = useState<
    Partial<OtherSourceRecord>
  >({});

  const [strRecords, setStrRecords] = useState<STRRecord[]>([]);
  const [strSearch, setStrSearch] = useState("");
  const [strSortCol, setStrSortCol] = useState<string | null>(null);
  const [strSortDir, setStrSortDir] = useState<"asc" | "desc">("asc");
  const [strSaving, setStrSaving] = useState(false);
  const [strDialogOpen, setStrDialogOpen] = useState(false);
  const [strDialogMode, setStrDialogMode] = useState<"add" | "edit">("add");
  const [strDialogDraft, setStrDialogDraft] = useState<Partial<STRRecord>>({});

  const [hideClosed, setHideClosed] = useState(true);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [userRole, setUserRole] = useState("");

  // NON-IR generation dialog
  const [nonIrDialogOpen, setNonIrDialogOpen] = useState(false);
  const [nonIrDialogDraft, setNonIrDialogDraft] = useState<Partial<DGGIRecord>>(
    {},
  );
  const [nonIrSaving, setNonIrSaving] = useState(false);
  const [nonIrSourceTable, setNonIrSourceTable] = useState<string>("");
  const [nonIrSourceId, setNonIrSourceId] = useState<string>("");
  const [nonIrSetRecords, setNonIrSetRecords] = useState<React.Dispatch<
    React.SetStateAction<any[]>
  > | null>(null);

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (uid) setCurrentUserId(uid);

      // Fetch current user's role and group assignments
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

      // Build queries with group-based filtering matching RLS policy
      let rapidQuery = supabase
        .from("dggi_intel_rapid_records")
        .select("*")
        .eq("workspace_id", wid);
      let otherQuery = supabase
        .from("dggi_intel_other_source_records")
        .select("*")
        .eq("workspace_id", wid);
      let strQuery = supabase
        .from("dggi_str_records")
        .select("*")
        .eq("workspace_id", wid);

      if (role !== "ADG" && role !== "DD_INT") {
        if (role === "IO" || role === "SIO") {
          rapidQuery = rapidQuery.eq("sio", uid!);
          otherQuery = otherQuery.eq("sio", uid!);
          strQuery = strQuery.eq("sio", uid!);
        } else if (groups.length > 0) {
          rapidQuery = rapidQuery.in("assigned_group", groups);
          otherQuery = otherQuery.in("assigned_group", groups);
          strQuery = strQuery.in("group", groups);
        } else {
          rapidQuery = rapidQuery.eq("assigned_group", "__none__");
          otherQuery = otherQuery.eq("assigned_group", "__none__");
          strQuery = strQuery.eq("group", "__none__");
        }
      }

      const [{ data: rd }, { data: od }, { data: sd }, usersRes, cases] =
        await Promise.all([
          rapidQuery,
          otherQuery,
          strQuery,
          getAllUsers(),
          fetchCaseOptions(supabase, wid),
        ]);
      setRapidRecords(rd ?? []);
      setOtherRecords(od ?? []);
      setStrRecords(sd ?? []);
      if (usersRes.success) setWorkspaceUsers(usersRes.data ?? []);
      setCaseOptions(cases);
      setLoading(false);
    };
    init();
  }, []);

  const filterSort = <T extends Record<string, any>>(
    records: T[],
    search: string,
    fields: (keyof T)[],
    sortCol: string | null,
    sortDir: "asc" | "desc",
  ) =>
    records
      .filter((r) => {
        if (hideClosed && r.action_taken === "Closed") return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return fields.some((f) =>
          String(r[f] ?? "")
            .toLowerCase()
            .includes(q),
        );
      })
      .sort((a, b) => {
        if (!sortCol) return 0;
        const cmp = String(a[sortCol] ?? "").localeCompare(
          String(b[sortCol] ?? ""),
        );
        return sortDir === "asc" ? cmp : -cmp;
      });

  // ── CRUD helpers ─────────────────────────────────────────────────────────────

  const makeCrud = <T extends { id: string }>(
    table: string,
    prefix: string,
    setRecords: React.Dispatch<React.SetStateAction<T[]>>,
    setSaving: React.Dispatch<React.SetStateAction<boolean>>,
    setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setDialogMode: React.Dispatch<React.SetStateAction<"add" | "edit">>,
    setDialogDraft: React.Dispatch<React.SetStateAction<Partial<T>>>,
    dialogDraft: Partial<T>,
    emptyNew: Omit<T, "id">,
  ) => ({
    onEdit: (r: T) => {
      setDialogMode("edit");
      setDialogDraft({ ...r });
      setDialogOpen(true);
    },
    onAdd: () => {
      setDialogMode("add");
      setDialogDraft({ ...emptyNew } as Partial<T>);
      setDialogOpen(true);
    },
    onDelete: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        toast.error("Delete failed: " + error.message);
      } else {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        toast.success("Record deleted");
      }
    },
    onSave: async () => {
      if (!dialogDraft.id) return;
      setSaving(true);
      const rawDraft = Object.fromEntries(
        Object.entries(dialogDraft).map(([k, v]) => [k, v === "" ? null : v]),
      );
      const { error } = await supabase
        .from(table)
        .update(rawDraft as any)
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
      setSaving(false);
    },
    onSaveNew: async () => {
      if (!workspaceId) return;
      setSaving(true);
      const rawDraft = Object.fromEntries(
        Object.entries(dialogDraft).map(([k, v]) => [k, v === "" ? null : v]),
      );
      const payload = {
        ...rawDraft,
        record_id: await generateWorkspaceRecordId(
          supabase,
          table,
          prefix,
          workspaceId,
        ),
        workspace_id: workspaceId,
      };
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast.error("Failed to add: " + error.message);
      } else {
        setRecords((prev) => [...prev, data as T]);
        setDialogOpen(false);
        toast.success("Record added");
      }
      setSaving(false);
    },
  });

  const rapidCrud = makeCrud(
    "dggi_intel_rapid_records",
    REGISTER_PREFIXES.INTEL_RAPID,
    setRapidRecords,
    setRapidSaving,
    setRapidDialogOpen,
    setRapidDialogMode,
    setRapidDialogDraft,
    rapidDialogDraft,
    EMPTY_RAPID,
  );
  const otherCrud = makeCrud(
    "dggi_intel_other_source_records",
    REGISTER_PREFIXES.INTEL_OTHER,
    setOtherRecords,
    setOtherSaving,
    setOtherDialogOpen,
    setOtherDialogMode,
    setOtherDialogDraft,
    otherDialogDraft,
    EMPTY_OTHER,
  );
  const strCrud = makeCrud(
    "dggi_str_records",
    REGISTER_PREFIXES.STR,
    setStrRecords,
    setStrSaving,
    setStrDialogOpen,
    setStrDialogMode,
    setStrDialogDraft,
    strDialogDraft,
    EMPTY_STR,
  );

  // ── Generate NON-IR Case (opens dialog for manual review before saving) ───────

  const openNonIrDialog = <
    T extends {
      id: string;
      record_id: string;
      non_ir_no: string;
      non_ir_date: string;
    },
  >(
    record: T,
    sourceTable: string,
    setRecords: React.Dispatch<React.SetStateAction<T[]>>,
    entityName?: string,
    gstin?: string,
    intelSource?: string,
    group?: string,
  ) => {
    if (record.non_ir_no) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const draft: Partial<DGGIRecord> = {
      ...EMPTY_RECORD,
      is_ir: false,
      taxpayer_name: entityName || "",
      gstins: gstin || "",
      intel_source: intelSource || "",
      date_of_non_ir: todayStr,
      date_of_receipt: todayStr,
      handling_io_sio: currentUserId || "",
      group: group || "Group A",
    };
    setNonIrDialogDraft(draft);
    setNonIrSourceTable(sourceTable);
    setNonIrSourceId(record.id);
    setNonIrSetRecords(
      () => setRecords as React.Dispatch<React.SetStateAction<any[]>>,
    );
    setNonIrDialogOpen(true);
  };

  const saveNonIrCase = async () => {
    if (!workspaceId || !nonIrSourceId || !nonIrSourceTable || !nonIrSetRecords)
      return;
    setNonIrSaving(true);
    const draft = nonIrDialogDraft as Omit<DGGIRecord, "id">;
    const nonIrRecordId = await generateWorkspaceRecordId(
      supabase,
      "dggi_records",
      "NIR",
      workspaceId,
      { filter: { is_ir: false }, separator: "-" },
    );
    const todayStr = new Date().toISOString().split("T")[0];
    const payload = {
      ...draft,
      record_id: nonIrRecordId,
      is_ir: false,
      mode_of_initiation: draft.mode_of_initiation || null,
      date_of_receipt: draft.date_of_receipt || null,
      date_of_initiation: draft.date_of_initiation || null,
      intel_approved_date: draft.intel_approved_date || null,
      intelligence_action_date: draft.intelligence_action_date || null,
      due_date: draft.due_date || null,
      date_of_ir: null,
      date_of_non_ir: draft.date_of_non_ir || todayStr,
      workspace_id: workspaceId,
    };
    const { error } = await supabase.from("dggi_records").insert(payload);
    if (error) {
      toast.error("Failed to generate NON-IR case: " + error.message);
      setNonIrSaving(false);
      return;
    }
    const { error: linkErr } = await supabase
      .from(nonIrSourceTable)
      .update({ non_ir_no: nonIrRecordId, non_ir_date: todayStr })
      .eq("id", nonIrSourceId);
    if (linkErr) {
      toast.error("NON-IR created but failed to link: " + linkErr.message);
    } else {
      nonIrSetRecords((prev: any[]) =>
        prev.map((r: any) =>
          r.id === nonIrSourceId
            ? { ...r, non_ir_no: nonIrRecordId, non_ir_date: todayStr }
            : r,
        ),
      );
      setCaseOptions((prev) => [
        ...prev,
        {
          record_id: nonIrRecordId,
          taxpayer_name: draft.taxpayer_name || "",
          file_no: "",
          is_ir: false,
        },
      ]);
      toast.success(`NON-IR case ${nonIrRecordId} generated`);
      setNonIrDialogOpen(false);
    }
    setNonIrSaving(false);
  };

  const handleRapidExport = () => {
    const filtered = filterSort(
      rapidRecords,
      rapidSearch,
      ["rapid_id", "file_no_ref_id", "received_against_entity", "nature_gist"],
      rapidSortCol,
      rapidSortDir,
    );
    exportRegisterToExcel(filtered, visibleRapidCols, "Intelligence_Rapid", (msg) =>
      toast.success(msg),
    );
  };

  const handleOtherExport = () => {
    const filtered = filterSort(
      otherRecords,
      otherSearch,
      [
        "source_name",
        "e_office_ref_no",
        "entity_name",
        "gstin",
        "nature_of_intel",
      ],
      otherSortCol,
      otherSortDir,
    );
    exportRegisterToExcel(filtered, visibleOtherCols, "Intelligence_Other", (msg) =>
      toast.success(msg),
    );
  };

  const handleStrExport = () => {
    const filtered = filterSort(
      strRecords,
      strSearch,
      ["str_reference_no", "entity_name", "gstin", "sio_group"],
      strSortCol,
      strSortDir,
    );
    exportRegisterToExcel(filtered, visibleStrCols, "STR", (msg) =>
      toast.success(msg),
    );
  };

  const isDDInt = userRole === "DD_INT" || userRole === "ADG";
  const visibleRapidCols = isDDInt
    ? RAPID_COLS
    : RAPID_COLS.filter((c) => c.key !== "transferred_to");
  const visibleOtherCols = isDDInt
    ? OTHER_COLS
    : OTHER_COLS.filter((c) => c.key !== "transferred_to");
  // In STR_COLS, the "Transferred To" column uses key "assigned_group"
  const visibleStrCols = isDDInt
    ? STR_COLS
    : STR_COLS.filter((c) => c.key !== "assigned_group");

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" />
      </div>
    );

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <h1 className="text-xl font-medium text-[#1a1a1a]">
            Intelligence Monitoring
          </h1>
          <p className="text-base text-[#9a9a96]">
            Rapid · Other Sources · Closure
          </p>
        </div>

        <Tabs defaultValue="rapid" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="rounded-xl border border-[#EDEDEA] bg-white h-10 p-1">
              <TabsTrigger
                value="rapid"
                className="rounded-lg text-base data-[state=active]:bg-[#EEF2FF] data-[state=active]:text-[#4A5FD4]"
              >
                Rapid
              </TabsTrigger>
              <TabsTrigger
                value="other"
                className="rounded-lg text-base data-[state=active]:bg-[#EEF2FF] data-[state=active]:text-[#4A5FD4]"
              >
                Other Sources
              </TabsTrigger>
              <TabsTrigger
                value="str"
                className="rounded-lg text-base data-[state=active]:bg-[#EEF2FF] data-[state=active]:text-[#4A5FD4]"
              >
                STR
              </TabsTrigger>
            </TabsList>
            <Button
              size="sm"
              variant="outline"
              className={`h-9 rounded-lg border-[#EDEDEA] text-base shadow-none px-4 ${hideClosed ? "bg-[#EEF2FF] text-[#4A5FD4] border-[#4A5FD4]/30" : "text-[#6b6b6b] hover:bg-[#F3F2EF]"}`}
              onClick={() => setHideClosed((v) => !v)}
            >
              {hideClosed ? (
                <EyeOff size={14} className="mr-1.5" />
              ) : (
                <Eye size={14} className="mr-1.5" />
              )}
              {hideClosed ? "Show Closed" : "Hide Closed"}
            </Button>
          </div>

          <TabsContent value="rapid">
            <SubTable
              records={filterSort(
                rapidRecords,
                rapidSearch,
                [
                  "rapid_id",
                  "file_no_ref_id",
                  "received_against_entity",
                  "nature_gist",
                ],
                rapidSortCol,
                rapidSortDir,
              )}
              columns={visibleRapidCols}
              sortCol={rapidSortCol}
              sortDir={rapidSortDir}
              search={rapidSearch}
              searchPlaceholder="Search Rapid ID, entity…"
              onSearch={setRapidSearch}
              onSort={(col) => {
                if (rapidSortCol === col)
                  setRapidSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else {
                  setRapidSortCol(col);
                  setRapidSortDir("asc");
                }
              }}
              onEdit={rapidCrud.onEdit}
              onDelete={rapidCrud.onDelete}
              onAdd={rapidCrud.onAdd}
              emptyMessage="No rapid intelligence records found."
              onExport={handleRapidExport}
              users={workspaceUsers}
              cases={caseOptions}
              customCells={{
                non_ir_no: (r) =>
                  r.non_ir_no ? (
                    <Link
                      href={`/tasks/investigation-cases?caseId=${encodeURIComponent(r.non_ir_no)}`}
                      className="font-medium text-[#4A5FD4] underline underline-offset-2 hover:text-[#3B4EC5]"
                    >
                      {r.non_ir_no}
                    </Link>
                  ) : userRole === "DD_INT" ? (
                    <span className="text-[#9a9a96]">—</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg border-[#EDEDEA] text-[#4A5FD4] hover:bg-[#EEF2FF] text-xs shadow-none px-2"
                      onClick={() =>
                        openNonIrDialog(
                          r,
                          "dggi_intel_rapid_records",
                          setRapidRecords,
                          r.received_against_entity,
                          "",
                          "Int",
                          r.assigned_group,
                        )
                      }
                    >
                      <FilePlus2 size={12} className="mr-1" />
                      Generate NON-IR
                    </Button>
                  ),
              }}
            />
          </TabsContent>

          <TabsContent value="other">
            <SubTable
              records={filterSort(
                otherRecords,
                otherSearch,
                [
                  "source_name",
                  "e_office_ref_no",
                  "entity_name",
                  "gstin",
                  "nature_of_intel",
                ],
                otherSortCol,
                otherSortDir,
              )}
              columns={visibleOtherCols}
              sortCol={otherSortCol}
              sortDir={otherSortDir}
              search={otherSearch}
              searchPlaceholder="Search source, entity, GSTIN…"
              onSearch={setOtherSearch}
              onSort={(col) => {
                if (otherSortCol === col)
                  setOtherSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else {
                  setOtherSortCol(col);
                  setOtherSortDir("asc");
                }
              }}
              onEdit={otherCrud.onEdit}
              onDelete={otherCrud.onDelete}
              onAdd={otherCrud.onAdd}
              emptyMessage="No other source records found."
              onExport={handleOtherExport}
              users={workspaceUsers}
              cases={caseOptions}
              customCells={{
                non_ir_no: (r) =>
                  r.non_ir_no ? (
                    <Link
                      href={`/tasks/investigation-cases?caseId=${encodeURIComponent(r.non_ir_no)}`}
                      className="font-medium text-[#4A5FD4] underline underline-offset-2 hover:text-[#3B4EC5]"
                    >
                      {r.non_ir_no}
                    </Link>
                  ) : userRole === "DD_INT" ? (
                    <span className="text-[#9a9a96]">—</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg border-[#EDEDEA] text-[#4A5FD4] hover:bg-[#EEF2FF] text-xs shadow-none px-2"
                      onClick={() =>
                        openNonIrDialog(
                          r,
                          "dggi_intel_other_source_records",
                          setOtherRecords,
                          r.entity_name,
                          r.gstin,
                          "Group",
                          r.assigned_group,
                        )
                      }
                    >
                      <FilePlus2 size={12} className="mr-1" />
                      Generate NON-IR
                    </Button>
                  ),
              }}
            />
          </TabsContent>

          <TabsContent value="str">
            <SubTable
              records={filterSort(
                strRecords,
                strSearch,
                ["str_reference_no", "entity_name", "gstin", "sio_group"],
                strSortCol,
                strSortDir,
              )}
              columns={visibleStrCols}
              sortCol={strSortCol}
              sortDir={strSortDir}
              search={strSearch}
              searchPlaceholder="Search STR ref, entity, GSTIN…"
              onSearch={setStrSearch}
              onSort={(col) => {
                if (strSortCol === col)
                  setStrSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else {
                  setStrSortCol(col);
                  setStrSortDir("asc");
                }
              }}
              onEdit={strCrud.onEdit}
              onDelete={strCrud.onDelete}
              onAdd={strCrud.onAdd}
              emptyMessage="No STR records found."
              onExport={handleStrExport}
              users={workspaceUsers}
              cases={caseOptions}
              customCells={{
                non_ir_no: (r) =>
                  r.non_ir_no ? (
                    <Link
                      href={`/tasks/investigation-cases?caseId=${encodeURIComponent(r.non_ir_no)}`}
                      className="font-medium text-[#4A5FD4] underline underline-offset-2 hover:text-[#3B4EC5]"
                    >
                      {r.non_ir_no}
                    </Link>
                  ) : userRole === "DD_INT" ? (
                    <span className="text-[#9a9a96]">—</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg border-[#EDEDEA] text-[#4A5FD4] hover:bg-[#EEF2FF] text-xs shadow-none px-2"
                      onClick={() =>
                        openNonIrDialog(
                          r,
                          "dggi_str_records",
                          setStrRecords,
                          r.entity_name,
                          r.gstin,
                          "STR",
                          r.group,
                        )
                      }
                    >
                      <FilePlus2 size={12} className="mr-1" />
                      Generate NON-IR
                    </Button>
                  ),
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Rapid dialog */}
      <RegisterRecordDialog
        open={rapidDialogOpen}
        onOpenChange={setRapidDialogOpen}
        mode={rapidDialogMode}
        columns={RAPID_COLS}
        draft={rapidDialogDraft as Record<string, string>}
        onDraftChange={(k, v) => {
          setRapidDialogDraft((prev) => {
            const next: Partial<RapidRecord> = { ...prev, [k]: v };
            if (k === "action_taken" && v) {
              const today = new Date().toISOString().split("T")[0];
              next.date_of_action_taken = today;
              if (v === "Allocated") next.group_allocation_date = today;
            }
            return next;
          });
        }}
        onSave={
          rapidDialogMode === "add" ? rapidCrud.onSaveNew : rapidCrud.onSave
        }
        saving={rapidSaving}
        users={workspaceUsers}
        caseOptions={caseOptions}
      />

      {/* Other Sources dialog */}
      <RegisterRecordDialog
        open={otherDialogOpen}
        onOpenChange={setOtherDialogOpen}
        mode={otherDialogMode}
        columns={OTHER_COLS}
        draft={otherDialogDraft as Record<string, string>}
        onDraftChange={(k, v) => {
          setOtherDialogDraft((prev) => {
            const next: Partial<OtherSourceRecord> = { ...prev, [k]: v };
            if (k === "action_taken" && v) {
              const today = new Date().toISOString().split("T")[0];
              next.date_of_action_taken = today;
              if (v === "Allocated") next.group_allocation_date = today;
            }
            return next;
          });
        }}
        onSave={
          otherDialogMode === "add" ? otherCrud.onSaveNew : otherCrud.onSave
        }
        saving={otherSaving}
        users={workspaceUsers}
        caseOptions={caseOptions}
      />

      {/* STR dialog */}
      <RegisterRecordDialog
        open={strDialogOpen}
        onOpenChange={setStrDialogOpen}
        mode={strDialogMode}
        columns={STR_COLS}
        draft={strDialogDraft as Record<string, string>}
        onDraftChange={(k, v) => {
          setStrDialogDraft((prev) => {
            const next: Partial<STRRecord> = { ...prev, [k]: v };
            if (k === "action_taken" && v) {
              const today = new Date().toISOString().split("T")[0];
              next.date_of_action_taken = today;
              if (v === "Allocated") next.group_allocation_date = today;
            }
            return next;
          });
        }}
        onSave={strDialogMode === "add" ? strCrud.onSaveNew : strCrud.onSave}
        saving={strSaving}
        users={workspaceUsers}
        caseOptions={caseOptions}
      />

      {/* NON-IR generation dialog */}
      <DGGIRecordDialog
        open={nonIrDialogOpen}
        onOpenChange={(v) => {
          if (!v) setNonIrDialogOpen(false);
        }}
        mode="add"
        draft={nonIrDialogDraft}
        onDraftChange={(k, v) =>
          setNonIrDialogDraft((prev) => {
            const next = { ...prev, [k]: v };
            if (k === "is_ir" && v === false && !prev.date_of_non_ir) {
              next.date_of_non_ir = new Date().toISOString().split("T")[0];
            }
            return next;
          })
        }
        onSave={saveNonIrCase}
        saving={nonIrSaving}
        users={workspaceUsers}
      />
    </div>
  );
};

export default IntelligenceAllocationComponent;
