"use client";

import { getUserDetailById } from "@/apiReq/newAPIs/roadmaps";
import checkUserAuthClient from "@/auth/getUserSession";
import { Combobox } from "@/components/ui/combobox";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSearch,
  FlaskConical,
  HardDrive,
  HelpCircle,
  Paperclip,
  RefreshCw,
  Scale,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type {
  CpgramInformerRow,
  DetectionRecoveryRow,
  IssueInvolvedRow,
  RegisterActivityDataset,
  RegisterPendencyCardRow,
} from "./DGGICharts";
import {
  ComplianceGauge,
  CpgramInformerChart,
  DeadlineHeatmap,
  DetectionRecoveryChart,
  IssueInvolvedChart,
  OfficerExposureChart,
  ZoneIntelligencePanel,
} from "./DGGICharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

// ─── DB deadline row (from dggi_computed_deadlines) ─────────────────────────

interface ComputedDeadlineRow {
  id: string;
  rule_id: string;
  source_table: string;
  record_id: string;
  row_id: string;
  deadline_date: string;
  label: string;
  legal_reference: string | null;
  skipped: boolean;
  sio_user_id: string | null;
  group_name: string | null;
  entity_name: string | null;
  officer_name: string | null;
  critical_days: number | null;
  warning_days: number | null;
  max_reminder_days: number | null;
}

// RBAC: group field and SIO/IO field per table, matching existing register components
const TABLE_RBAC_FIELDS: Record<
  string,
  { groupField: string; sioField: string }
> = {
  dggi_scn_records: { groupField: "group", sioField: "sio" },
  dggi_provisional_attachment_records: { groupField: "group", sioField: "sio" },
  dggi_prosecution_arrest_records: { groupField: "group", sioField: "sio" },
  dggi_prosecution_non_arrest_records: { groupField: "group", sioField: "sio" },
  dggi_intel_rapid_records: {
    groupField: "assigned_group",
    sioField: "sio",
  },
  dggi_str_records: { groupField: "assigned_group", sioField: "sio" },
  dggi_records: { groupField: "group", sioField: "handling_io_sio" },
  dggi_dfl_records: { groupField: "group", sioField: "sio" },
};

// Metric tables that need RBAC filtering (provisional attachments, arrests, investigations)
const METRIC_TABLE_RBAC: Record<
  string,
  { groupField: string; sioField: string }
> = {
  dggi_provisional_attachment_records: { groupField: "group", sioField: "sio" },
  dggi_prosecution_arrest_records: { groupField: "group", sioField: "sio" },
  dggi_records: { groupField: "group", sioField: "handling_io_sio" },
};

interface UserRbac {
  role: string;
  groups: string[];
  uid: string;
}

// Apply RBAC filter to a Supabase query for a given table.
// Uses AnyRecord to avoid the excessively-deep generic instantiation that
// Supabase's chained query builder types produce.
function applyRbacFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  table: string,
  rbac: UserRbac,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const { role, groups, uid } = rbac;
  if (role === "ADG" || role === "DD_INT") return query;
  const fields = TABLE_RBAC_FIELDS[table] ?? METRIC_TABLE_RBAC[table];
  if (!fields) return query;
  if (role === "IO" || role === "SIO") {
    return query.eq(fields.sioField, uid || "__none__");
  }
  // ADC / DD — filter by assigned groups
  if (groups.length > 0) {
    return query.in(fields.groupField, groups);
  }
  return query.eq(fields.groupField, "__none__");
}

// ─── Table → register href (for "open case" links) ──────────────────────────

const TABLE_HREF: Record<string, string> = {
  dggi_records: "/tasks/investigation-cases",
  dggi_scn_records: "/tasks/scn-register",
  dggi_provisional_attachment_records: "/tasks/provisional-attachment",
  dggi_prosecution_arrest_records: "/tasks/prosecution-register",
  dggi_prosecution_non_arrest_records: "/tasks/prosecution-register",
  dggi_intel_rapid_records: "/tasks/intelligence-allocation",
  dggi_str_records: "/tasks/intelligence-allocation",
  dggi_dfl_records: "/tasks/dfl-register",
};

// ─── Register Metadata ───────────────────────────────────────────────────────

interface RegisterMeta {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  table: string;
  accentColor: string;
  category: "register" | "monitoring";
}

const REGISTERS: RegisterMeta[] = [
  {
    href: "/tasks/intelligence-allocation",
    label: "Intelligence Monitoring",
    shortLabel: "Intel Mon.",
    icon: Brain,
    table: "dggi_intel_rapid_records",
    accentColor: "#6D28D9",
    category: "register",
  },
  {
    href: "/tasks/intelligence-allocation",
    label: "Intelligence Monitoring",
    shortLabel: "Intel Mon.",
    icon: Brain,
    table: "dggi_str_records",
    accentColor: "#7C3AED",
    category: "register",
  },
  {
    href: "/tasks",
    label: "IR/NON-IR Cases",
    shortLabel: "Intel Exec.",
    icon: Shield,
    table: "dggi_records",
    accentColor: "#4A5FD4",
    category: "register",
  },
  {
    href: "/tasks/incident-report",
    label: "Incident Report",
    shortLabel: "Incident",
    icon: AlertTriangle,
    table: "dggi_incident_report_records",
    accentColor: "#DC2626",
    category: "register",
  },
  {
    href: "/tasks/provisional-attachment",
    label: "Provisional Attachment",
    shortLabel: "Prov. Attach.",
    icon: Paperclip,
    table: "dggi_provisional_attachment_records",
    accentColor: "#EA580C",
    category: "register",
  },

  {
    href: "/tasks/scn-register",
    label: "SCN Register",
    shortLabel: "SCN",
    icon: FileSearch,
    table: "dggi_scn_records",
    accentColor: "#7C3AED",
    category: "register",
  },
  {
    href: "/tasks/prosecution-register",
    label: "Prosecution Register",
    shortLabel: "Prosecution",
    icon: Scale,
    table: "dggi_prosecution_arrest_records",
    accentColor: "#9F1239",
    category: "register",
  },
  {
    href: "/tasks/prosecution-register",
    label: "Prosecution (Non-Arrest)",
    shortLabel: "Pros. Non-Arrest",
    icon: Scale,
    table: "dggi_prosecution_non_arrest_records",
    accentColor: "#BE123C",
    category: "register",
  },
  {
    href: "/tasks/closure-register",
    label: "Closure Register",
    shortLabel: "Closure",
    icon: Archive,
    table: "dggi_closure_records",
    accentColor: "#374151",
    category: "register",
  },
  {
    href: "/tasks/alert-circular",
    label: "Alert Circular",
    shortLabel: "Alert",
    icon: Bell,
    table: "dggi_alert_circular_records",
    accentColor: "#D97706",
    category: "register",
  },
  {
    href: "/tasks/modus-operandi",
    label: "Modus Operandi",
    shortLabel: "M.O.",
    icon: FlaskConical,
    table: "dggi_modus_operandi_records",
    accentColor: "#0891B2",
    category: "register",
  },

  {
    href: "/tasks/dfl-register",
    label: "DFL Register",
    shortLabel: "DFL",
    icon: HardDrive,
    table: "dggi_dfl_records",
    accentColor: "#1E40AF",
    category: "monitoring",
  },
  // {
  //   href: "/tasks/report-compliance",
  //   label: "Report Compliance",
  //   shortLabel: "Compliance",
  //   icon: ClipboardCheck,
  //   table: "dggi_report_compliance_records",
  //   accentColor: "#047857",
  //   category: "monitoring",
  // },
];

const INVESTIGATIONS_TABLE = "dggi_records";
const REGISTER_BY_TABLE = new Map(REGISTERS.map((r) => [r.table, r]));

function getCurrentFYStart(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}

function getMonthRange(offset: number): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return {
    start: d.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}
const TODAY_STR = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Urgency = "expired" | "critical" | "warning" | "safe";

interface DeadlineItem {
  ruleId: string;
  ruleLabel: string;
  legalRef: string;
  registerLabel: string;
  registerHref: string;
  sourceTable: string;
  recordId: string;
  // db row id — used for out-of-monitoring updates
  rowId: string;
  entityName: string;
  officer: string;
  group: string;
  deadlineDate: Date;
  daysUntil: number;
  urgency: Urgency;
  criticalDays: number;
  warningDays: number;
}

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_CFG: Record<
  Urgency,
  {
    label: string;
    sub: string;
    numCls: string;
    labelCls: string;
    subCls: string;
    pillCls: string;
    borderCls: string;
    ringCls: string;
  }
> = {
  expired: {
    label: "Overdue",
    sub: "Past deadline",
    numCls: "text-red-600",
    labelCls: "text-red-700",
    subCls: "text-red-400",
    pillCls: "bg-red-100 text-red-700",
    borderCls: "border-l-red-500",
    ringCls: "ring-2 ring-red-300",
  },
  critical: {
    label: "Critical",
    sub: "Due within critical window",
    numCls: "text-orange-600",
    labelCls: "text-orange-700",
    subCls: "text-orange-400",
    pillCls: "bg-orange-100 text-orange-700",
    borderCls: "border-l-orange-400",
    ringCls: "ring-2 ring-orange-300",
  },
  warning: {
    label: "Warning",
    sub: "Due within warning window",
    numCls: "text-amber-600",
    labelCls: "text-amber-700",
    subCls: "text-amber-400",
    pillCls: "bg-amber-100 text-amber-700",
    borderCls: "border-l-amber-400",
    ringCls: "ring-2 ring-amber-300",
  },
  safe: {
    label: "On Track",
    sub: "No immediate risk",
    numCls: "text-emerald-600",
    labelCls: "text-emerald-700",
    subCls: "text-emerald-400",
    pillCls: "bg-emerald-100 text-emerald-700",
    borderCls: "border-l-emerald-400",
    ringCls: "ring-2 ring-emerald-300",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Maps a dggi_computed_deadlines row to the DeadlineItem shape the UI uses.
// days_until is recomputed live so the display is never stale.
function dbRowToDeadlineItem(row: ComputedDeadlineRow, usersMap: Map<string, string>): DeadlineItem | null {
  const deadlineDate = parseISO(row.deadline_date);
  if (!isValid(deadlineDate)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = differenceInCalendarDays(deadlineDate, today);
  const criticalDays = row.critical_days ?? 7;
  const warningDays = row.warning_days ?? 30;
  const urgency: Urgency =
    daysUntil < 0
      ? "expired"
      : daysUntil <= criticalDays
        ? "critical"
        : daysUntil <= warningDays
          ? "warning"
          : "safe";

  const reg = REGISTER_BY_TABLE.get(row.source_table);
  return {
    ruleId: row.rule_id,
    ruleLabel: row.label,
    legalRef: row.legal_reference ?? "",
    registerLabel: reg?.label ?? row.source_table,
    registerHref: TABLE_HREF[row.source_table] ?? "/tasks",
    sourceTable: row.source_table,
    recordId: row.record_id || "—",
    rowId: row.row_id,
    entityName: row.entity_name ?? "—",
    officer: (row.sio_user_id ? usersMap.get(row.sio_user_id) : null) ?? row.officer_name ?? "",
    group: row.group_name ?? "",
    deadlineDate,
    daysUntil,
    urgency,
    criticalDays,
    warningDays,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UrgencyPill({
  urgency,
  daysUntil,
}: {
  urgency: Urgency;
  daysUntil: number;
}) {
  const label =
    urgency === "expired"
      ? `${Math.abs(daysUntil)}d overdue`
      : daysUntil === 0
        ? "Due today"
        : `${daysUntil}d left`;
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${URGENCY_CFG[urgency].pillCls} whitespace-nowrap`}
    >
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] px-4 py-4 flex flex-col gap-2 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#9a9a96] uppercase tracking-[0.1em] leading-none">
          {label}
        </span>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon size={12} style={{ color: accent }} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-[#F3F2EF] rounded animate-pulse" />
      ) : (
        <span className="text-[26px] font-bold text-[#1a1a1a] leading-none tabular-nums">
          {value}
        </span>
      )}
      {sub && !loading && (
        <span className="text-[10px] text-[#9a9a96] leading-none">{sub}</span>
      )}
    </div>
  );
}

// Compact tab button used for both main tabs and subtabs
function TabBtn({
  active,
  onClick,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  if (size === "sm") {
    return (
      <button
        onClick={onClick}
        className={`relative flex items-center gap-1.5 pb-2 px-1 mr-4 text-[11.5px] font-medium transition-colors ${
          active ? "text-[#1a1a1a]" : "text-[#9a9a96] hover:text-[#6b6b6b]"
        }`}
      >
        {children}
        {active && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A5FD4] rounded-full" />
        )}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 pb-2.5 px-1 mr-5 text-[12.5px] font-semibold transition-colors ${
        active ? "text-[#1a1a1a]" : "text-[#9a9a96] hover:text-[#6b6b6b]"
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A5FD4] rounded-full" />
      )}
    </button>
  );
}

function CountBadge({
  n,
  color,
}: {
  n: number;
  color: "red" | "orange" | "amber" | "emerald" | "neutral";
}) {
  const cls =
    color === "red"
      ? "bg-red-500 text-white"
      : color === "orange"
        ? "bg-orange-100 text-orange-700"
        : color === "amber"
          ? "bg-amber-100 text-amber-700"
          : color === "emerald"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-[#EDEDEA] text-[#6b6b6b]";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[16px] h-4 rounded-full px-1 text-[9px] font-bold ${cls}`}
    >
      {n}
    </span>
  );
}

// ─── Deadline Table ───────────────────────────────────────────────────────────

const TH_CLS =
  "text-left px-4 py-2.5 text-[10px] font-bold text-[#9a9a96] uppercase tracking-[0.08em] whitespace-nowrap border-b border-[#EDEDEA] bg-white";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function DeadlineTable({
  items,
  loading,
  isAdg = false,
  onOutOfMonitoring,
  emptyIcon: EmptyIcon = CheckCircle2,
  emptyTitle = "No items in this category",
  emptyBody = "All clear here",
}: {
  items: DeadlineItem[];
  loading: boolean;
  isAdg?: boolean;
  onOutOfMonitoring?: (item: DeadlineItem) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    item: DeadlineItem;
  } | null>(null);

  // Reset to page 1 whenever the item list changes
  const itemsKey = items.length + (items[0]?.ruleId ?? "");
  useEffect(() => {
    setPage(1);
  }, [itemsKey]);

  // Close context menu on click-away or keyboard
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [ctxMenu]);

  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-white rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <EmptyIcon size={26} className="text-[#C4C3BE] mb-2.5" />
        <p className="text-[13px] font-medium text-[#1a1a1a]">{emptyTitle}</p>
        <p className="text-[11.5px] text-[#9a9a96] mt-0.5">{emptyBody}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / pageSize);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return (
    <div className="relative">
      {/* Context menu */}
      {ctxMenu && isAdg && (
        <div
          className="fixed z-50 bg-white border border-[#EDEDEA] rounded-xl shadow-xl py-1.5 min-w-[200px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9a9a96] uppercase tracking-wider border-b border-[#F3F2EF] mb-1">
            {ctxMenu.item.entityName}
          </div>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#C0432A] hover:bg-red-50 transition-colors"
            onClick={() => {
              onOutOfMonitoring?.(ctxMenu.item);
              setCtxMenu(null);
            }}
          >
            <X size={12} />
            Move Out of Monitoring
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className={TH_CLS}>Register</th>
              <th className={TH_CLS}>Record ID</th>
              <th className={TH_CLS}>Entity</th>
              <th className={TH_CLS}>Deadline</th>
              <th className={TH_CLS}>Due Date</th>
              <th className={TH_CLS}>Status</th>
              <th className={TH_CLS}>Officer</th>
              <th className={TH_CLS}>Group</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, i) => (
              <tr
                key={`${item.ruleId}-${item.recordId}-${start + i}`}
                className={`border-b border-[#F3F2EF] last:border-0 hover:bg-white transition-colors border-l-[3px] ${URGENCY_CFG[item.urgency].borderCls} ${isAdg ? "cursor-context-menu" : ""}`}
                onContextMenu={
                  isAdg
                    ? (e) => {
                        e.preventDefault();
                        setCtxMenu({ x: e.clientX, y: e.clientY, item });
                      }
                    : undefined
                }
              >
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="text-[10.5px] font-semibold text-[#6b6b6b] uppercase tracking-wide">
                    {item.registerLabel}
                  </span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Link
                    href={`${item.registerHref}?highlight=${encodeURIComponent(item.recordId)}`}
                    className="font-mono text-[11px] text-[#4A5FD4] hover:underline"
                  >
                    {item.recordId}
                  </Link>
                </td>
                <td className="px-4 py-2.5 max-w-[150px]">
                  <span className="block truncate font-medium text-[#1a1a1a]">
                    {item.entityName}
                  </span>
                </td>
                <td className="px-4 py-2.5 max-w-[220px]">
                  <div className="truncate font-medium text-[#1a1a1a]">
                    {item.ruleLabel}
                  </div>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-[11.5px] text-[#6b6b6b]">
                  {format(item.deadlineDate, "dd MMM yyyy")}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <UrgencyPill
                    urgency={item.urgency}
                    daysUntil={item.daysUntil}
                  />
                </td>
                <td className="px-4 py-2.5 max-w-[130px]">
                  {item.officer ? (
                    <span className="inline-flex items-center text-[10px] text-[#4A5FD4] font-medium bg-indigo-50 rounded px-1.5 py-0.5 truncate max-w-full">
                      {item.officer}
                    </span>
                  ) : (
                    <span className="text-[#C4C3BE]">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 max-w-[130px]">
                  {item.group ? (
                    <span className="inline-flex items-center text-[10px] text-[#6b6b6b] font-medium bg-[#F3F2EF] rounded px-1.5 py-0.5 truncate max-w-full">
                      {item.group}
                    </span>
                  ) : (
                    <span className="text-[#C4C3BE]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#F3F2EF]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9a9a96]">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as PageSize);
                setPage(1);
              }}
              className="text-[11px] text-[#1a1a1a] bg-[#F3F2EF] border-0 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#4A5FD4]"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#9a9a96]">
            <span className="mr-2 tabular-nums">
              {start + 1}–{Math.min(start + pageSize, items.length)} of{" "}
              {items.length}
            </span>
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F2EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[#6b6b6b]"
              title="First page"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F2EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[#6b6b6b]"
              title="Previous page"
            >
              ‹
            </button>
            <span className="px-2 tabular-nums text-[#1a1a1a] font-medium">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F2EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[#6b6b6b]"
              title="Next page"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F2EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[#6b6b6b]"
              title="Last page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pendency Table ───────────────────────────────────────────────────────────

interface PendencyRow {
  label: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  total: number;
  expired: number;
  critical: number;
  warning: number;
}

function PendencyTableRow({
  row,
  loading,
}: {
  row: PendencyRow;
  loading: boolean;
}) {
  const Icon = row.icon;
  const hasCritical = row.expired > 0 || row.critical > 0;
  const healthPct =
    row.total > 0
      ? Math.round(((row.total - row.expired - row.critical) / row.total) * 100)
      : 100;

  return (
    <Link
      href={row.href}
      className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors border-b border-[#F3F2EF] last:border-0 group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${row.accent}18` }}
        >
          <Icon size={10} style={{ color: row.accent }} />
        </div>
        <span className="text-[12px] font-medium text-[#1a1a1a] truncate group-hover:text-[#4A5FD4] transition-colors">
          {row.label}
        </span>
      </div>
      {loading ? (
        <>
          <div className="h-3 w-5 bg-[#F3F2EF] rounded animate-pulse" />
          <div className="h-3 w-5 bg-[#F3F2EF] rounded animate-pulse" />
          <div className="h-3 w-5 bg-[#F3F2EF] rounded animate-pulse" />
          <div className="h-3 w-14 bg-[#F3F2EF] rounded animate-pulse" />
        </>
      ) : (
        <>
          <span className="text-[12px] font-semibold text-[#1a1a1a] tabular-nums text-right w-6">
            {row.total}
          </span>
          <span
            className={`text-[11.5px] font-semibold tabular-nums text-right w-6 ${row.expired > 0 ? "text-red-500" : "text-[#C4C3BE]"}`}
          >
            {row.expired}
          </span>
          <span
            className={`text-[11.5px] font-semibold tabular-nums text-right w-6 ${row.critical > 0 ? "text-orange-400" : "text-[#C4C3BE]"}`}
          >
            {row.critical}
          </span>
          <div className="flex items-center w-14">
            <div className="flex-1 h-1 bg-[#EDEDEA] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${hasCritical ? "bg-red-400" : "bg-emerald-400"}`}
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>
        </>
      )}
    </Link>
  );
}

// ─── Graph View ──────────────────────────────────────────────────────────────

function GraphView({
  expiredItems,
  criticalItems,
  warningItems,
  safeItems,
  allItems,
  allItemsRaw,
  detectionRecoveryData,
  issueInvolvedData,
  activityDatasets,
  registerRows,
  cpgramInformerData,
  loading,
}: {
  expiredItems: DeadlineItem[];
  criticalItems: DeadlineItem[];
  warningItems: DeadlineItem[];
  safeItems: DeadlineItem[];
  allItems: DeadlineItem[];
  allItemsRaw: DeadlineItem[];
  detectionRecoveryData: DetectionRecoveryRow[];
  issueInvolvedData: IssueInvolvedRow[];
  activityDatasets: RegisterActivityDataset[];
  registerRows: RegisterPendencyCardRow[];
  cpgramInformerData: CpgramInformerRow[];
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* ─── Cross-Register Overview ─── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#F3F2EF]" />
        {/* <span className="text-[10px] font-semibold text-[#9a9a96] uppercase tracking-[0.15em] shrink-0">
          Cross-Register Overview
        </span> */}
        <div className="h-px flex-1 bg-[#F3F2EF]" />
      </div>

      {/* Open Items by Register — KPI cards */}
      {/* <RegisterPendencyCards rows={registerRows} loading={loading} /> */}

      {/* ─── Intelligence & Compliance ─── */}
      <div className="flex items-center gap-3 mt-1">
        <div className="h-px flex-1 bg-[#F3F2EF]" />
        <span className="text-[10px] font-semibold text-[#9a9a96] uppercase tracking-[0.15em] shrink-0">
          Intelligence &amp; Compliance
        </span>
        <div className="h-px flex-1 bg-[#F3F2EF]" />
      </div>

      {/* Detection/Recovery · Issue Involved · Officer Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DetectionRecoveryChart
          data={detectionRecoveryData}
          loading={loading}
        />
        <IssueInvolvedChart data={issueInvolvedData} loading={loading} />
        <OfficerExposureChart items={allItemsRaw} loading={loading} />
      </div>

      {/* Deadline heatmap + CPGRAM/Informer */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <DeadlineHeatmap items={allItems} loading={loading} />
        </div>
        <div className="lg:col-span-3">
          <CpgramInformerChart data={cpgramInformerData} loading={loading} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DGGIDashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [isAdg, setIsAdg] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userRbac, setUserRbac] = useState<UserRbac>({
    role: "",
    groups: [],
    uid: "",
  });
  const [registerCounts, setRegisterCounts] = useState<Record<string, number>>(
    {},
  );
  const [computedDeadlineRows, setComputedDeadlineRows] = useState<
    ComputedDeadlineRow[]
  >([]);
  const [investigationCount, setInvestigationCount] = useState(0);
  const [fyProvisionalAttachments, setFyProvisionalAttachments] = useState(0);
  const [fyArrests, setFyArrests] = useState(0);
  const [fyInvestigations, setFyInvestigations] = useState(0);
  const [prevMonthCounts, setPrevMonthCounts] = useState({
    provisionalAttachments: 0,
    arrests: 0,
    investigations: 0,
  });
  const [currMonthCounts, setCurrMonthCounts] = useState({
    provisionalAttachments: 0,
    arrests: 0,
    investigations: 0,
  });
  const [detectionRecoveryData, setDetectionRecoveryData] = useState<
    DetectionRecoveryRow[]
  >([]);
  const [issueInvolvedData, setIssueInvolvedData] = useState<
    IssueInvolvedRow[]
  >([]);
  const [activityDatasets, setActivityDatasets] = useState<
    RegisterActivityDataset[]
  >([]);
  const [cpgramInformerData, setCpgramInformerData] = useState<
    CpgramInformerRow[]
  >([]);

  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());

  // Deadline Tracker state
  const [regFilter, setRegFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<Urgency | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [unreadCommentCount, setUnreadCommentCount] = useState(0);
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);

  const getGreeting = useCallback((): string => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const authRes = (await checkUserAuthClient()) as AnyRecord;
      if (authRes?.data?.session == null) {
        setLoading(false);
        return;
      }
      const session = authRes.data.session;
      const userId = session.user.id as string;

      const [dbUser, wid] = await Promise.all([
        getUserDetailById(userId) as Promise<AnyRecord | null>,
        getWorkspaceId() as Promise<string | null>,
      ]);

      if (dbUser?.name) setUserName(dbUser.name as string);
      else if ((session.user.user_metadata as AnyRecord)?.name)
        setUserName((session.user.user_metadata as AnyRecord).name as string);

      if (!wid) {
        setLoading(false);
        return;
      }

      const supabase = clientConnectionWithSupabase();

      // ── Fetch RBAC role + group assignments + all users ──────────────────────
      const [{ data: userRow }, { data: groupRows }, { data: allUsers }] = await Promise.all([
        supabase
          .from("votum_users")
          .select("dggi_role")
          .eq("id", userId)
          .single(),
        supabase
          .from("dggi_user_group_assignments")
          .select("group_name")
          .eq("user_id", userId),
        supabase
          .from("votum_users")
          .select("id,name")
          .eq("workspace_id", wid),
      ]);
      const map = new Map<string, string>();
      for (const u of allUsers ?? []) if (u.id && u.name) map.set(u.id, u.name);
      setUsersMap(map);
      const dggiRole = (userRow?.dggi_role as string | undefined) ?? "";
      const assignedGroups = (
        (groupRows ?? []) as { group_name: string }[]
      ).map((g) => g.group_name);
      const rbac: UserRbac = {
        role: dggiRole,
        groups: assignedGroups,
        uid: userId,
      };
      setUserRbac(rbac);

      // ADG role check — also covers dggi_role field
      if (dggiRole === "ADG") {
        setIsAdg(true);
      }

      // Fetch unread comment notifications for banner
      const NOTIF_ROLES = ["SIO", "DD", "DD_INT", "IO"];
      if (NOTIF_ROLES.includes(dggiRole)) {
        const { count: unread } = await supabase
          .from("dggi_notifications")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wid)
          .eq("user_id", userId)
          .eq("rule_id", "adg_comment")
          .eq("read", false);
        setUnreadCommentCount(unread ?? 0);
      }

      const countOnlyTables = REGISTERS.map((r) => r.table);

      const fyStart = getCurrentFYStart();
      const currMonth = getMonthRange(0);
      const prevMonth = getMonthRange(-1);

      const [
        deadlineRes,
        countResults,
        invRes,
        fyProvRes,
        fyArrRes,
        fyInvRes,
        irRecordsRes,
        caseRecordsRes,
        cmProvRes,
        cmArrRes,
        cmInvRes,
        pmProvRes,
        pmArrRes,
        pmInvRes,
      ] = await Promise.all([
        // Single query replaces 9 source-table fetches — DB already computed & stored everything
        (async () => {
          const PAGE = 1000;
          const all: ComputedDeadlineRow[] = [];
          let from = 0;
          while (true) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let q: any = supabase
              .from("dggi_computed_deadlines")
              .select(
                "id,rule_id,source_table,record_id,row_id,deadline_date,label,legal_reference,skipped,sio_user_id,group_name,entity_name,officer_name,critical_days,warning_days,max_reminder_days",
              )
              .eq("workspace_id", wid)
              .eq("skipped", false)
              .range(from, from + PAGE - 1);
            if (rbac.role !== "ADG" && rbac.role !== "DD_INT") {
              if (rbac.role === "IO" || rbac.role === "SIO") {
                q = q.eq("sio_user_id", rbac.uid);
              } else if (rbac.groups.length > 0) {
                q = q.in("group_name", rbac.groups);
              } else {
                q = q.eq("group_name", "__none__");
              }
            }
            const { data } = await q;
            if (!data || data.length === 0) break;
            all.push(...data);
            if (data.length < PAGE) break;
            from += PAGE;
          }
          return { data: all };
        })(),
        Promise.all(
          countOnlyTables.map((table) =>
            applyRbacFilter(
              supabase
                .from(table)
                .select("*", { count: "exact", head: true })
                .eq("workspace_id", wid),
              table,
              rbac,
            ).then((r: { count: number | null }) => ({
              table,
              count: r.count ?? 0,
            })),
          ),
        ),
        applyRbacFilter(
          supabase
            .from(INVESTIGATIONS_TABLE)
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid),
          INVESTIGATIONS_TABLE,
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_provisional_attachment_records")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", fyStart),
          "dggi_provisional_attachment_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_prosecution_arrest_records")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", fyStart),
          "dggi_prosecution_arrest_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from(INVESTIGATIONS_TABLE)
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", fyStart),
          INVESTIGATIONS_TABLE,
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_incident_report_records")
            .select(
              "incident_date, detection_amount, recovery_itc, recovery_cash",
            )
            .eq("workspace_id", wid),
          "dggi_incident_report_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_records")
            .select("issue_involved")
            .eq("workspace_id", wid)
            .not("issue_involved", "is", null)
            .neq("issue_involved", ""),
          "dggi_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_provisional_attachment_records")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", currMonth.start)
            .lt("created_at", currMonth.end),
          "dggi_provisional_attachment_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_prosecution_arrest_records")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", currMonth.start)
            .lt("created_at", currMonth.end),
          "dggi_prosecution_arrest_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from(INVESTIGATIONS_TABLE)
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", currMonth.start)
            .lt("created_at", currMonth.end),
          INVESTIGATIONS_TABLE,
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_provisional_attachment_records")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", prevMonth.start)
            .lt("created_at", prevMonth.end),
          "dggi_provisional_attachment_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from("dggi_prosecution_arrest_records")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", prevMonth.start)
            .lt("created_at", prevMonth.end),
          "dggi_prosecution_arrest_records",
          rbac,
        ),
        applyRbacFilter(
          supabase
            .from(INVESTIGATIONS_TABLE)
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .gte("created_at", prevMonth.start)
            .lt("created_at", prevMonth.end),
          INVESTIGATIONS_TABLE,
          rbac,
        ),
      ]);

      setComputedDeadlineRows(
        (deadlineRes.data ?? []) as ComputedDeadlineRow[],
      );

      const countsMap: Record<string, number> = {};
      for (const { table, count } of countResults) countsMap[table] = count;
      setRegisterCounts(countsMap);
      setInvestigationCount(invRes.count ?? 0);
      setFyProvisionalAttachments(fyProvRes.count ?? 0);
      setFyArrests(fyArrRes.count ?? 0);
      setFyInvestigations(fyInvRes.count ?? 0);
      setCurrMonthCounts({
        provisionalAttachments: cmProvRes.count ?? 0,
        arrests: cmArrRes.count ?? 0,
        investigations: cmInvRes.count ?? 0,
      });
      setPrevMonthCounts({
        provisionalAttachments: pmProvRes.count ?? 0,
        arrests: pmArrRes.count ?? 0,
        investigations: pmInvRes.count ?? 0,
      });

      // Detection vs Recovery by group
      const irRows = (irRecordsRes.data ?? []) as AnyRecord[];
      const monthMap = new Map<
        string,
        { detection: number; recoveryCash: number; recoveryItc: number }
      >();
      for (const row of irRows) {
        if (!row.incident_date) continue;
        const d = new Date(row.incident_date as string);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthMap.get(key) ?? {
          detection: 0,
          recoveryCash: 0,
          recoveryItc: 0,
        };
        existing.detection += Number(row.detection_amount) || 0;
        existing.recoveryCash += Number(row.recovery_cash) || 0;
        existing.recoveryItc += Number(row.recovery_itc) || 0;
        monthMap.set(key, existing);
      }
      setDetectionRecoveryData(
        Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, vals]) => ({
            group: new Date(key + "-01").toLocaleDateString("en-IN", {
              month: "short",
              year: "2-digit",
            }),
            ...vals,
          })),
      );

      // Issue involved distribution
      const caseRows = (caseRecordsRes.data ?? []) as AnyRecord[];
      const issueMap = new Map<string, number>();
      for (const row of caseRows) {
        const issue = row.issue_involved as string;
        issueMap.set(issue, (issueMap.get(issue) ?? 0) + 1);
      }
      setIssueInvolvedData(
        Array.from(issueMap.entries())
          .sort(([, a], [, b]) => b - a)
          .map(([issue, count]) => ({ issue, count })),
      );

      // Activity batch: monthly new-record counts per register for current FY
      const activityBatch = await Promise.all(
        REGISTERS.map((reg) =>
          applyRbacFilter(
            supabase
              .from(reg.table)
              .select("created_at")
              .eq("workspace_id", wid)
              .gte("created_at", fyStart),
            reg.table,
            rbac,
          ).then((r) => ({
            reg,
            dates: (r.data ?? [])
              .map((row) => (row as AnyRecord).created_at as string)
              .filter(Boolean),
          })),
        ),
      );

      const builtDatasets: RegisterActivityDataset[] = activityBatch
        .map(({ reg, dates }) => {
          const monthCounts: Record<string, number> = {};
          for (const dateStr of dates) {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) continue;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthCounts[key] = (monthCounts[key] ?? 0) + 1;
          }
          return {
            table: reg.table,
            label: reg.label,
            shortLabel: reg.shortLabel,
            accent: reg.accentColor,
            href: reg.href,
            monthCounts,
          };
        })
        .filter((d) => Object.values(d.monthCounts).some((c) => c > 0));

      setActivityDatasets(builtDatasets);

      // Fetch CPGRAM + Informer Reward monthly counts
      const [cpgramRes, informerRes] = await Promise.all([
        supabase
          .from("dggi_cpgram_records")
          .select("date_of_receipt")
          .eq("workspace_id", wid),
        supabase
          .from("dggi_informer_reward_records")
          .select("date_of_information")
          .eq("workspace_id", wid),
      ]);

      const cpgramMonthMap = new Map<string, number>();
      for (const row of (cpgramRes.data ?? []) as AnyRecord[]) {
        const dateStr = row.date_of_receipt as string | undefined;
        if (!dateStr) continue;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        cpgramMonthMap.set(key, (cpgramMonthMap.get(key) ?? 0) + 1);
      }

      const informerMonthMap = new Map<string, number>();
      for (const row of (informerRes.data ?? []) as AnyRecord[]) {
        const dateStr = row.date_of_information as string | undefined;
        if (!dateStr) continue;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        informerMonthMap.set(key, (informerMonthMap.get(key) ?? 0) + 1);
      }

      const allCpgramInformerMonths = Array.from(
        new Set([...cpgramMonthMap.keys(), ...informerMonthMap.keys()]),
      ).sort();

      setCpgramInformerData(
        allCpgramInformerMonths.map((key) => ({
          month: new Date(key + "-01").toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          }),
          cpgram: cpgramMonthMap.get(key) ?? 0,
          informer: informerMonthMap.get(key) ?? 0,
        })),
      );
    } catch (e) {
      console.error("DGGIDashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Deadline computation ──────────────────────────────────────────────────

  // Map DB rows → DeadlineItem[]. Days are recomputed live so display is never stale.
  const allDeadlineItemsRaw = useMemo(() => {
    const items: DeadlineItem[] = [];
    for (const row of computedDeadlineRows) {
      const item = dbRowToDeadlineItem(row, usersMap);
      if (item) items.push(item);
    }
    return items;
  }, [computedDeadlineRows, usersMap]);

  // Step 2: derive available groups from raw items (sorted alphabetically)
  const availableGroups = useMemo(
    () =>
      [
        ...new Set(allDeadlineItemsRaw.map((i) => i.group).filter(Boolean)),
      ].sort(),
    [allDeadlineItemsRaw],
  );

  // Step 3: apply group filter then categorize
  const {
    expiredItems,
    criticalItems,
    warningItems,
    safeItems,
    pendencyBreakdown,
  } = useMemo(() => {
    const filtered =
      groupFilter === "all"
        ? allDeadlineItemsRaw
        : allDeadlineItemsRaw.filter((i) => i.group === groupFilter);

    const sorted = [...filtered].sort((a, b) => a.daysUntil - b.daysUntil);

    const expired: DeadlineItem[] = [];
    const critical: DeadlineItem[] = [];
    const warning: DeadlineItem[] = [];
    const safe: DeadlineItem[] = [];
    // For pendency counts, track each record's worst urgency per source table.
    // Keying by sourceTable (not registerHref) prevents two registers that share
    // the same href (e.g. Prosecution / Pros. Non-Arrest) from merging counts.
    // Using `sourceTable|recordId` ensures multi-rule records are counted once.
    const URGENCY_RANK: Record<Urgency, number> = {
      expired: 0,
      critical: 1,
      warning: 2,
      safe: 3,
    };
    const worstUrgency = new Map<string, Urgency>(); // key = sourceTable|recordId

    for (const d of sorted) {
      switch (d.urgency) {
        case "expired":
          expired.push(d);
          break;
        case "critical":
          critical.push(d);
          break;
        case "warning":
          warning.push(d);
          break;
        default:
          safe.push(d);
      }
      const key = `${d.sourceTable}|${d.recordId}`;
      const prev = worstUrgency.get(key);
      if (!prev || URGENCY_RANK[d.urgency] < URGENCY_RANK[prev]) {
        worstUrgency.set(key, d.urgency);
      }
    }

    const breakdown: Record<
      string,
      { expired: number; critical: number; warning: number }
    > = {};
    for (const [key, urgency] of worstUrgency) {
      if (urgency === "safe") continue;
      const table = key.split("|")[0];
      if (!breakdown[table])
        breakdown[table] = { expired: 0, critical: 0, warning: 0 };
      breakdown[table][urgency]++;
    }

    return {
      expiredItems: expired,
      criticalItems: critical,
      warningItems: warning,
      safeItems: safe,
      pendencyBreakdown: breakdown,
    };
  }, [allDeadlineItemsRaw, groupFilter]);

  const actionItems = useMemo(
    () => [...expiredItems, ...criticalItems],
    [expiredItems, criticalItems],
  );

  // Group-filtered items (for heatmap, split bar, health tiles, tables)
  const allItems = useMemo(
    () => [...expiredItems, ...criticalItems, ...warningItems, ...safeItems],
    [expiredItems, criticalItems, warningItems, safeItems],
  );

  const totalCritical = actionItems.length;

  const pendencyRows = useMemo((): PendencyRow[] => {
    // All registers in REGISTERS can now show pendency (data comes from dggi_computed_deadlines)
    const merged = new Map<string, PendencyRow>();
    for (const reg of REGISTERS) {
      const b = pendencyBreakdown[reg.table] ?? {
        expired: 0,
        critical: 0,
        warning: 0,
      };
      const count = registerCounts[reg.table] ?? 0;
      const existing = merged.get(reg.href);
      if (existing) {
        existing.total += count;
        existing.expired += b.expired;
        existing.critical += b.critical;
        existing.warning += b.warning;
      } else {
        merged.set(reg.href, {
          label: reg.shortLabel,
          href: reg.href,
          icon: reg.icon,
          accent: reg.accentColor,
          total: count,
          expired: b.expired,
          critical: b.critical,
          warning: b.warning,
        });
      }
    }
    return Array.from(merged.values());
  }, [pendencyBreakdown, registerCounts]);

  // All registers (including count-only) for the cross-register pendency cards
  const allRegisterRows = useMemo((): RegisterPendencyCardRow[] => {
    const merged = new Map<string, RegisterPendencyCardRow>();
    for (const reg of REGISTERS) {
      const b = pendencyBreakdown[reg.table] ?? {
        expired: 0,
        critical: 0,
        warning: 0,
      };
      const count = registerCounts[reg.table] ?? 0;
      const existing = merged.get(reg.href);
      if (existing) {
        existing.total += count;
        existing.expired += b.expired;
        existing.critical += b.critical;
        existing.warning += b.warning;
      } else {
        merged.set(reg.href, {
          label: reg.label,
          href: reg.href,
          icon: reg.icon,
          accent: reg.accentColor,
          total: count,
          expired: b.expired,
          critical: b.critical,
          warning: b.warning,
        });
      }
    }
    return Array.from(merged.values());
  }, [pendencyBreakdown, registerCounts]);

  // All items sorted by urgency (expired → critical → warning → safe)
  const baseItems = useMemo(() => {
    if (healthFilter) {
      switch (healthFilter) {
        case "expired":
          return expiredItems;
        case "critical":
          return criticalItems;
        case "warning":
          return warningItems;
        case "safe":
          return safeItems;
      }
    }
    return [...expiredItems, ...criticalItems, ...warningItems, ...safeItems];
  }, [healthFilter, expiredItems, criticalItems, warningItems, safeItems]);

  // Unique registers present in baseItems, in display order
  const registerSubTabs = useMemo(() => {
    const seen = new Map<
      string,
      { label: string; href: string; count: number }
    >();
    for (const item of baseItems) {
      if (!seen.has(item.registerHref)) {
        seen.set(item.registerHref, {
          label: item.registerLabel,
          href: item.registerHref,
          count: 0,
        });
      }
      seen.get(item.registerHref)!.count++;
    }
    return Array.from(seen.values()).sort((a, b) => {
      if (a.href === "/tasks/dfl-register") return 1;
      if (b.href === "/tasks/dfl-register") return -1;
      return 0;
    });
  }, [baseItems]);

  const visibleItems = useMemo(() => {
    if (regFilter === "all") return baseItems;
    return baseItems.filter((i) => i.registerHref === regFilter);
  }, [baseItems, regFilter]);

  function handleHealthTileClick(urgency: Urgency) {
    if (healthFilter === urgency) {
      setHealthFilter(null);
      setRegFilter("all");
      return;
    }
    setHealthFilter(urgency);
    setRegFilter("all");
  }

  const supabase = clientConnectionWithSupabase();

  async function handleSyncDeadlines() {
    setSyncing(true);
    try {
      const res = await fetch("/api/dggi/deadline-alerts", {
        method: "POST",
        headers: { "x-internal-cron": "1" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? res.statusText);
      const totalUpserted = Object.values(
        json.summary as Record<string, { upserted: number }>,
      ).reduce((s, v) => s + v.upserted, 0);
      toast.success(`Deadlines synced — ${totalUpserted} rows updated`);
      // Reload deadline rows without full page refresh
      fetchAll();
    } catch (e: unknown) {
      toast.error(
        "Sync failed: " + (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleOutOfMonitoring(item: DeadlineItem) {
    if (!item.rowId) return;
    const { error } = await supabase
      .from(item.sourceTable)
      .update({ out_of_monitoring: true })
      .eq("id", item.rowId);
    if (error) {
      toast.error("Failed to move out of monitoring: " + error.message);
      return;
    }
    // Remove from local deadline rows immediately so the table updates without refetch.
    // The cron will also mark the row skipped=true on its next run.
    setComputedDeadlineRows((prev) =>
      prev.filter((r) => r.row_id !== item.rowId),
    );
    toast.success(`${item.entityName} moved out of monitoring`);
  }

  // KPI stats
  const totalRecordsAcrossRegisters =
    Object.values(registerCounts).reduce((s, c) => s + c, 0) +
    investigationCount;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="w-full h-full overflow-y-auto bg-white relative">
      {/* ── Watermark ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/dggi-logo.png"
          alt=""
          className="w-[480px] max-w-[60vw] opacity-[0.04] select-none"
          draggable={false}
        />
      </div>
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#EDEDEA] px-6 pt-5 pb-4">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[22px] font-semibold text-[#1a1a1a] leading-tight">
                {getGreeting()},{" "}
                <span className="text-[#4A5FD4]">
                  {loading ? "…" : userName || "ADG"}
                </span>
              </h1>
              <p className="text-[11.5px] text-[#9a9a96] mt-0.5">{TODAY_STR}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Group selector */}
              <div className="flex items-center gap-1.5">
                <Combobox
                  items={[
                    { value: "all", label: "All Groups" },
                    ...availableGroups.map((g) => ({ value: g, label: g })),
                  ]}
                  value={groupFilter}
                  onChange={(val) => {
                    setGroupFilter(val);
                    setHealthFilter(null);
                    setRegFilter("all");
                  }}
                  placeholder="All Groups"
                  disabled={loading}
                  className={`h-8 text-[12px] w-[160px] ${
                    groupFilter !== "all"
                      ? "bg-indigo-50 border-[#4A5FD4] text-[#4A5FD4]"
                      : ""
                  }`}
                />
                {groupFilter !== "all" && (
                  <button
                    onClick={() => setGroupFilter("all")}
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 hover:bg-indigo-200 text-[#4A5FD4] transition-colors"
                    title="Clear group filter"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              {/* Sync deadlines (ADG / DD_INT only) */}
              {isAdg && (
                <button
                  onClick={handleSyncDeadlines}
                  disabled={syncing}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#F3F2EF] hover:bg-[#EDEDEA] text-[#6b6b6b] hover:text-[#1a1a1a] transition-all text-[11.5px] font-medium disabled:opacity-60"
                  title="Re-compute deadlines from source records"
                >
                  <RefreshCw
                    size={13}
                    className={syncing ? "animate-spin" : ""}
                  />
                  {syncing ? "Syncing…" : "Sync Deadlines"}
                </button>
              )}
              {/* Deadline rules help */}
              <button
                onClick={() => setShowRulesDialog(true)}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F3F2EF] hover:bg-[#EDEDEA] text-[#6b6b6b] hover:text-[#1a1a1a] transition-all"
                title="Deadline rules"
              >
                <HelpCircle size={14} />
              </button>
              {/* View mode toggle */}
              <div className="flex items-center bg-[#F3F2EF] rounded-lg p-0.5 text-[11.5px] font-medium">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    viewMode === "table"
                      ? "bg-white text-[#1a1a1a] shadow-sm"
                      : "text-[#6b6b6b] hover:text-[#1a1a1a]"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    viewMode === "graph"
                      ? "bg-white text-[#1a1a1a] shadow-sm"
                      : "text-[#6b6b6b] hover:text-[#1a1a1a]"
                  }`}
                >
                  Graph
                </button>
              </div>
              {/* <Link
                href="/tasks"
                className="flex items-center gap-1.5 bg-white hover:bg-[#F3F2EF] border border-[#EDEDEA] rounded-lg px-3 py-1.5 text-[11.5px] text-[#6b6b6b] hover:text-[#1a1a1a] transition-all"
              >
                <Eye size={11} />
                <span>All Registers</span>
                <ChevronRight size={10} />
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* ── Notification banner ── */}
      {unreadCommentCount > 0 && !notifBannerDismissed && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4A5FD4] text-[10px] font-bold text-white shrink-0">
                {unreadCommentCount > 9 ? "9+" : unreadCommentCount}
              </span>
              <span className="text-[12.5px] text-[#4A5FD4] font-medium">
                {unreadCommentCount === 1
                  ? "You have 1 unread ADG comment"
                  : `You have ${unreadCommentCount} unread ADG comments`}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/tasks/notifications"
                className="flex items-center gap-1 text-[12px] font-semibold text-[#4A5FD4] hover:underline"
              >
                <Bell size={12} />
                View notifications
              </Link>
              <button
                onClick={() => setNotifBannerDismissed(true)}
                className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-indigo-200 text-[#4A5FD4] transition-colors"
                title="Dismiss"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6 py-5 flex flex-col gap-4">
        {/* ── KPI Strip ── */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <StatCard
            label="Total Records"
            value={totalRecordsAcrossRegisters}
            icon={BarChart3}
            accent="#4A5FD4"
            loading={loading}
            sub="across all registers"
          />
          <StatCard
            label="Investigations"
            value={investigationCount}
            icon={Folder}
            accent="#4A5FD4"
            loading={loading}
          />
          <StatCard
            label="SCN Records"
            value={scnCount}
            icon={FileSearch}
            accent="#7C3AED"
            loading={loading}
          />
          <StatCard
            label="Prov. Attach."
            value={provCount}
            icon={Paperclip}
            accent="#EA580C"
            loading={loading}
          />
          <StatCard
            label="Arrests"
            value={arrestCount}
            icon={ClipboardList}
            accent="#DC2626"
            loading={loading}
          />
          <StatCard
            label="STR Filings"
            value={strCount}
            icon={FileWarning}
            accent="#0F766E"
            loading={loading}
          />
          <StatCard
            label="CPGRAM"
            value={cpgramCount}
            icon={MessageSquare}
            accent="#16A34A"
            loading={loading}
          />
          <StatCard
            label="Evidence Room"
            value={evidenceCount}
            icon={Package}
            accent="#92400E"
            loading={loading}
          />
        </div> */}

        {/* ── Zone Deadline Health ── */}
        <div className="bg-white rounded-xl border border-[#EDEDEA] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#F3F2EF]">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-[#4A5FD4]" />
              <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
                Zone Deadline Health
              </h3>
              {healthFilter && (
                <span className="ml-1 text-[11px] text-[#9a9a96]">
                  · click to change filter, click again to clear
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#9a9a96]">
              {expiredItems.length +
                criticalItems.length +
                warningItems.length +
                safeItems.length}{" "}
              total deadline triggers tracked
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#F3F2EF]">
            {(
              [
                { urgency: "expired" as Urgency, count: expiredItems.length },
                { urgency: "critical" as Urgency, count: criticalItems.length },
                { urgency: "warning" as Urgency, count: warningItems.length },
                { urgency: "safe" as Urgency, count: safeItems.length },
              ] as const
            ).map(({ urgency, count }) => {
              const cfg = URGENCY_CFG[urgency];
              const isActive = healthFilter === urgency;
              const isDimmed = healthFilter !== null && !isActive;
              return (
                <button
                  key={urgency}
                  onClick={() => handleHealthTileClick(urgency)}
                  className={`px-5 py-4 text-left transition-all cursor-pointer group
                    ${isActive ? "bg-[#F3F2EF] " + cfg.ringCls : "hover:bg-[#FAFAF9]"}
                    ${isDimmed ? "opacity-50" : ""}
                  `}
                >
                  <p
                    className={`text-[28px] font-bold leading-none tabular-nums ${cfg.numCls}`}
                  >
                    {loading ? "—" : count}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div>
                      <p
                        className={`text-[11.5px] font-semibold ${cfg.labelCls}`}
                      >
                        {cfg.label}
                      </p>
                      <p className={`text-[10.5px] mt-0.5 ${cfg.subCls}`}>
                        {cfg.sub}
                      </p>
                    </div>
                    {isActive ? (
                      <span
                        className={`text-[10px] font-semibold ${cfg.labelCls} opacity-70`}
                      >
                        Viewing ↓
                      </span>
                    ) : (
                      <ChevronRight
                        size={12}
                        className={`${cfg.subCls} opacity-0 group-hover:opacity-100 transition-opacity`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Grid (conditional on view mode) ── */}
        {viewMode === "graph" ? (
          <GraphView
            expiredItems={expiredItems}
            criticalItems={criticalItems}
            warningItems={warningItems}
            safeItems={safeItems}
            allItems={allItems}
            allItemsRaw={allDeadlineItemsRaw}
            detectionRecoveryData={detectionRecoveryData}
            issueInvolvedData={issueInvolvedData}
            activityDatasets={activityDatasets}
            registerRows={allRegisterRows}
            cpgramInformerData={cpgramInformerData}
            loading={loading}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* ── Insight row: zone intelligence + compliance gauge ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <ZoneIntelligencePanel
                  provisionalAttachments={fyProvisionalAttachments}
                  arrests={fyArrests}
                  investigations={fyInvestigations}
                  momDeltas={{
                    provisionalAttachments:
                      currMonthCounts.provisionalAttachments -
                      prevMonthCounts.provisionalAttachments,
                    arrests: currMonthCounts.arrests - prevMonthCounts.arrests,
                    investigations:
                      currMonthCounts.investigations -
                      prevMonthCounts.investigations,
                  }}
                  loading={loading}
                />
              </div>
              <div className="lg:col-span-2">
                <ComplianceGauge
                  expired={expiredItems.length}
                  critical={criticalItems.length}
                  warning={warningItems.length}
                  safe={safeItems.length}
                  loading={loading}
                />
              </div>
            </div>
            {/* Deadline Tracker */}
            <div className="bg-white rounded-xl border border-[#EDEDEA] flex flex-col overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <CalendarClock size={14} className="text-[#4A5FD4]" />
                  <h2 className="text-[14px] font-semibold text-[#1a1a1a]">
                    Deadline Tracker
                  </h2>
                  {healthFilter && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded px-2 py-0.5 ml-1 ${URGENCY_CFG[healthFilter].pillCls}`}
                    >
                      {URGENCY_CFG[healthFilter].label}
                      <span className="text-[10px]">
                        ({visibleItems.length})
                      </span>
                    </span>
                  )}
                </div>
                {healthFilter && (
                  <button
                    onClick={() => setHealthFilter(null)}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#6b6b6b] hover:text-[#1a1a1a] bg-[#F3F2EF] hover:bg-[#EDEDEA] rounded-md px-2 py-1 transition-colors"
                  >
                    <X size={10} />
                    <span>Clear filter</span>
                  </button>
                )}
              </div>

              {/* Register subtabs */}
              <div className="flex items-center gap-0 px-5 pt-3 pb-0 border-b border-[#F3F2EF] overflow-x-auto">
                {registerSubTabs.length > 0 && (
                  <>
                    <TabBtn
                      size="sm"
                      active={regFilter === "all"}
                      onClick={() => setRegFilter("all")}
                    >
                      All
                      <CountBadge n={baseItems.length} color="neutral" />
                    </TabBtn>
                    {registerSubTabs.map((reg) => (
                      <TabBtn
                        key={reg.href}
                        size="sm"
                        active={regFilter === reg.href}
                        onClick={() => setRegFilter(reg.href)}
                      >
                        {reg.label}
                        <CountBadge n={reg.count} color="neutral" />
                      </TabBtn>
                    ))}
                  </>
                )}
              </div>

              {/* Table */}
              <DeadlineTable
                items={visibleItems}
                loading={loading}
                isAdg={isAdg}
                onOutOfMonitoring={handleOutOfMonitoring}
                emptyIcon={healthFilter ? Clock : CheckCircle2}
                emptyTitle={
                  healthFilter
                    ? `No ${URGENCY_CFG[healthFilter].label.toLowerCase()} items`
                    : regFilter !== "all"
                      ? "No items for this register"
                      : "All deadlines on track"
                }
                emptyBody="Nothing within the reminder window"
              />
            </div>

            {/* Pendency Table */}
            <div className="bg-white rounded-xl border border-[#EDEDEA]">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#F3F2EF]">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-[#4A5FD4]" />
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a]">
                    Register Pendency
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-[#9a9a96] uppercase tracking-wide pr-1">
                  <span className="w-6 text-right">Total</span>
                  <span className="w-6 text-right text-red-400">OD</span>
                  <span className="w-6 text-right text-orange-400">Crit</span>
                  <span className="w-14 text-right">Health</span>
                </div>
              </div>
              <div>
                {pendencyRows.map((row) => (
                  <PendencyTableRow
                    key={row.href}
                    row={row}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Deadline Rules Dialog ── */}
      {showRulesDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          onClick={() => setShowRulesDialog(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-[#EDEDEA] w-full max-w-2xl max-h-[80vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F2EF]">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 rounded-lg">
                  <HelpCircle size={16} className="text-[#4A5FD4]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1a1a1a]">
                    Deadline Rules
                  </h2>
                  <p className="text-[11px] text-[#9a9a96]">
                    Statutory and procedural deadlines tracked on this dashboard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesDialog(false)}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[#F3F2EF] text-[#6b6b6b] hover:text-[#1a1a1a] transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* ── Flowchart overview ── */}
            <div className="px-6 pt-4 pb-0 border-b border-[#F3F2EF]">
              <p className="text-[10px] font-bold text-[#9a9a96] uppercase tracking-[0.12em] mb-4">
                Intelligence Allocation Flow
              </p>
              <div className="flex items-end pb-5 overflow-x-auto gap-0">
                {/* Origin */}
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[9px] text-[#9a9a96] mb-2">&nbsp;</span>
                  <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-[11px] font-semibold text-[#6D28D9] whitespace-nowrap">
                    Int. Allocation
                  </div>
                </div>
                {[
                  {
                    duration: "within 30 days",
                    node: "Put up to Pr. ADG Sir",
                    box: "bg-amber-50 border-amber-300 text-amber-700",
                  },
                  {
                    duration: "within 10 days",
                    node: "Initiation of Action",
                    box: "bg-orange-50 border-orange-300 text-orange-700",
                  },
                  {
                    duration: "within 1 month",
                    node: "IR to be issued",
                    box: "bg-red-50 border-red-300 text-red-700",
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-end shrink-0">
                    {/* Connector */}
                    <div className="flex flex-col items-center shrink-0 w-24">
                      <span className="text-[9px] text-[#9a9a96] whitespace-nowrap mb-2">
                        {step.duration}
                      </span>
                      <div className="flex items-center w-full">
                        <div className="flex-1 h-px bg-[#D4D3CE]" />
                        <ChevronRight
                          size={10}
                          className="text-[#C4C3BE] -ml-1 shrink-0"
                        />
                      </div>
                    </div>
                    {/* Node */}
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[9px] text-transparent mb-2">
                        &nbsp;
                      </span>
                      <span
                        className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap ${step.box}`}
                      >
                        {step.node}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules list — numbered detail */}
            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
              {[
                {
                  num: 1,
                  label: "Intelligence Allocation — Put-up to ADG",
                  accent: "#6D28D9",
                  ref: "from date of group allocation",
                  milestones: ["16 days", "23 days", "30 days"],
                },
                {
                  num: "1b",
                  label: "Intelligence Allocation — Execution / Initiation",
                  accent: "#6D28D9",
                  ref: "from date of group allocation",
                  milestones: ["5 days", "8 days", "10 days"],
                },
                {
                  num: 2,
                  label: "Provisional Attachment",
                  accent: "#EA580C",
                  ref: "from date of attachment (SCN to be issued)",
                  milestones: ["7 months", "8 months", "9 months"],
                },
                {
                  num: 3,
                  label: "Prosecution — No Bail",
                  accent: "#9F1239",
                  ref: "from date of arrest",
                  milestones: ["40 days", "50 days", "60 days"],
                },
                {
                  num: 4,
                  label: "Prosecution — Bail Granted",
                  accent: "#BE123C",
                  ref: "from date of arrest",
                  milestones: ["4 months", "5 months", "6 months"],
                },
                // {
                //   num: 5,
                //   label: "Seizure Register",
                //   accent: "#7F1D1D",
                //   ref: "from date of seizure",
                //   milestones: ["4 months", "5 months", "6 months"],
                // },
                {
                  num: 6,
                  label:
                    "NON-IR — Initiation Fields (Intel Approved / Action / Mode)",
                  accent: "#4A5FD4",
                  ref: "from date of record creation",
                  milestones: ["5 days", "8 days", "10 days"],
                },
                {
                  num: "6b",
                  label: "Intel Approved Date → Intelligence Action Date",
                  accent: "#4A5FD4",
                  ref: "from Intel Approved Date",
                  milestones: ["5 days", "8 days", "10 days"],
                },
                {
                  num: "6c",
                  label: "NON-IR — Close / Create / Transfer",
                  accent: "#4A5FD4",
                  ref: "from date of action",
                  milestones: ["14 days", "23 days", "30 days"],
                },
                {
                  num: 7,
                  label: "SCN Register",
                  accent: "#7C3AED",
                  ref: "from date of IR",
                  milestones: ["7 months", "8 months", "9 months"],
                },
                {
                  num: 8,
                  label: "DFL Register",
                  accent: "#1E40AF",
                  ref: "from date of request",
                  milestones: ["40 days", "50 days", "60 days"],
                },
              ].map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-3 py-2.5 px-3 rounded-lg bg-[#FAFAF8] border border-[#F0EFE9]"
                >
                  <span className="w-5 h-5 rounded-full bg-white border border-[#EDEDEA] flex items-center justify-center text-[10px] font-bold text-[#6b6b6b] shrink-0 mt-0.5">
                    {item.num}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.accent }}
                      />
                      <span className="text-[12.5px] font-semibold text-[#1a1a1a]">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-[#9a9a96] italic">
                        {item.ref}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap pl-4">
                      {item.milestones.map((m, i) => {
                        const pillCls =
                          [
                            "text-amber-700 bg-amber-50 border border-amber-200",
                            "text-orange-700 bg-orange-50 border border-orange-200",
                            "text-red-700 bg-red-50 border border-red-200",
                          ][i] ??
                          "text-red-700 bg-red-50 border border-red-200";
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1"
                          >
                            {i > 0 && (
                              <ChevronRight
                                size={9}
                                className="text-[#C4C3BE]"
                              />
                            )}
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${pillCls}`}
                            >
                              {m}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
