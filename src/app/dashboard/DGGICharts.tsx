"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Tooltip as RadixTooltip,
  TooltipContent as RadixTooltipContent,
  TooltipProvider as RadixTooltipProvider,
  TooltipTrigger as RadixTooltipTrigger,
} from "@/components/ui/tooltip";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

type Urgency = "expired" | "critical" | "warning" | "safe";

// Minimal structural types — any superset (e.g. DeadlineItem, PendencyRow) is compatible.
interface HeatmapItem {
  deadlineDate: Date;
  urgency: Urgency;
  // Optional display fields for the day-detail dialog
  ruleLabel?: string;
  entityName?: string;
  registerLabel?: string;
  registerHref?: string;
  recordId?: string;
  daysUntil?: number;
}

interface ExposureItem {
  officer: string;
  sioUserId?: string;
  urgency: Urgency;
  sourceTable?: string;
  // Optional display fields for the per-officer breakdown dialog.
  recordId?: string;
  entityName?: string;
  ruleLabel?: string;
  registerLabel?: string;
  registerHref?: string;
  daysUntil?: number;
}

// ─── ComplianceGauge ─────────────────────────────────────────────────────────
// Semicircle meter showing compliance health score.

export function ComplianceGauge({
  expired,
  critical,
  warning,
  safe,
  loading,
}: {
  expired: number;
  critical: number;
  warning: number;
  safe: number;
  loading?: boolean;
}) {
  const total = expired + critical + warning + safe;
  const compliancePct =
    total > 0 ? Math.round(((safe + warning) / total) * 100) : 100;

  const zone =
    compliancePct >= 75
      ? { label: "Safe Zone", cls: "text-emerald-600" }
      : compliancePct >= 50
        ? { label: "Warning Zone", cls: "text-amber-600" }
        : { label: "Critical Zone", cls: "text-red-600" };

  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  const filledArc = (compliancePct / 100) * circumference;

  const needleAngle = -180 + (compliancePct / 100) * 180;
  const needleLength = radius - strokeWidth - 6;
  const needleRad = (needleAngle * Math.PI) / 180;
  const nx = 100 + needleLength * Math.cos(needleRad);
  const ny = 95 + needleLength * Math.sin(needleRad);

  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          Compliance Health Score
        </h3>
        <span
          className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full ${
            compliancePct >= 75
              ? "bg-emerald-50 text-emerald-600"
              : compliancePct >= 50
                ? "bg-amber-50 text-amber-600"
                : "bg-red-50 text-red-600"
          }`}
        >
          {zone.label}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-[120px] w-[200px] bg-[#F3F2EF] rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center mt-2">
            <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
              {/* Background arc */}
              <path
                d="M 20 95 A 80 80 0 0 1 180 95"
                fill="none"
                stroke="#EDEDEA"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient
                  id="gaugeGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="35%" stopColor="#F59E0B" />
                  <stop offset="65%" stopColor="#84CC16" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              {/* Filled arc */}
              <path
                d="M 20 95 A 80 80 0 0 1 180 95"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${filledArc} ${circumference}`}
              />
              {/* Needle */}
              <line
                x1="100"
                y1="95"
                x2={nx}
                y2={ny}
                stroke="#1a1a1a"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="100" cy="95" r="4" fill="#1a1a1a" />
              {/* Center score */}
              <text
                x="100"
                y="85"
                textAnchor="middle"
                className="fill-[#1a1a1a]"
                fontSize="22"
                fontWeight="700"
                fontFamily="DM Sans, sans-serif"
              >
                {compliancePct}%
              </text>
              {/* Min/Max labels */}
              <text
                x="20"
                y="108"
                textAnchor="middle"
                fontSize="8"
                className="fill-[#9a9a96]"
              >
                0
              </text>
              <text
                x="180"
                y="108"
                textAnchor="middle"
                fontSize="8"
                className="fill-[#9a9a96]"
              >
                100
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {[
              {
                label: "Safe",
                value: safe,
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                lbl: "text-emerald-500",
              },
              {
                label: "Warning",
                value: warning,
                bg: "bg-amber-50",
                text: "text-amber-700",
                lbl: "text-amber-500",
              },
              {
                label: "Critical",
                value: critical,
                bg: "bg-orange-50",
                text: "text-orange-700",
                lbl: "text-orange-400",
              },
              {
                label: "Overdue",
                value: expired,
                bg: "bg-red-50",
                text: "text-red-700",
                lbl: "text-red-400",
              },
            ].map(({ label, value, bg, text, lbl }) => (
              <div key={label} className={`${bg} rounded-lg py-2 text-center`}>
                <p
                  className={`text-[9px] font-semibold uppercase tracking-wide ${lbl}`}
                >
                  {label}
                </p>
                <p
                  className={`text-[17px] font-bold tabular-nums leading-none mt-0.5 ${text}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── DeadlineHeatmap ─────────────────────────────────────────────────────────
// Calendar grid for the current month — each day coloured by worst urgency present.
// Clicking a day opens a dialog showing all items due on that day.

const URGENCY_ORDER: Urgency[] = ["expired", "critical", "warning", "safe"];

const URGENCY_PILL: Record<Urgency, string> = {
  expired: "bg-red-100 text-red-700",
  critical: "bg-orange-100 text-orange-700",
  warning: "bg-amber-100 text-amber-700",
  safe: "bg-emerald-100 text-emerald-700",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  expired: "Overdue",
  critical: "Critical",
  warning: "Warning",
  safe: "On Track",
};

export function DeadlineHeatmap({
  items,
  loading,
}: {
  items: HeatmapItem[];
  loading?: boolean;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Mon-start

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Group items by day
  const byDay: Record<
    number,
    { expired: number; critical: number; warning: number; safe: number }
  > = {};
  const itemsByDay: Record<number, HeatmapItem[]> = {};
  for (const item of items) {
    const d = item.deadlineDate;
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDay[day])
        byDay[day] = { expired: 0, critical: 0, warning: 0, safe: 0 };
      byDay[day][item.urgency]++;
      if (!itemsByDay[day]) itemsByDay[day] = [];
      itemsByDay[day].push(item);
    }
  }

  // Sort each day's items by urgency severity
  for (const day of Object.keys(itemsByDay)) {
    itemsByDay[Number(day)].sort(
      (a, b) =>
        URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency),
    );
  }

  const cells: Array<number | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dialogItems = selectedDay ? (itemsByDay[selectedDay] ?? []) : [];

  return (
    <>
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          Deadline Heat Map
        </h3>
        <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-2">
          {format(new Date(year, month), "MMMM yyyy")} · click a day to see
          details
        </p>
        {loading ? (
          <div className="grid grid-cols-7 gap-0.5 max-w-[260px]">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded bg-[#F3F2EF] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-0.5 mb-0.5 max-w-[260px]">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[8px] font-semibold text-[#9a9a96]"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 max-w-[260px]">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const counts = byDay[day];
                const total = counts
                  ? counts.expired +
                    counts.critical +
                    counts.warning +
                    counts.safe
                  : 0;
                const isToday = day === today.getDate();
                const hasItems = total > 0;
                let bg = "bg-[#F3F2EF]";
                let textCls = "text-[#9a9a96]";
                if (counts) {
                  if (counts.expired > 0) {
                    bg = "bg-red-400";
                    textCls = "text-white";
                  } else if (counts.critical > 0) {
                    bg = "bg-orange-300";
                    textCls = "text-white";
                  } else if (counts.warning > 0) {
                    bg = "bg-amber-200";
                    textCls = "text-amber-900";
                  } else if (counts.safe > 0) {
                    bg = "bg-emerald-100";
                    textCls = "text-emerald-800";
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => (hasItems ? setSelectedDay(day) : undefined)}
                    className={`aspect-square rounded flex flex-col items-center justify-center ${bg} ${
                      isToday ? "ring-1 ring-[#4A5FD4] ring-offset-[1px]" : ""
                    } ${hasItems ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"}`}
                    title={
                      hasItems
                        ? `${format(new Date(year, month, day), "d MMM")}: ${total} deadline${total !== 1 ? "s" : ""} — click to view`
                        : format(new Date(year, month, day), "d MMM")
                    }
                  >
                    <span
                      className={`text-[9px] font-medium leading-none ${textCls}`}
                    >
                      {day}
                    </span>
                    {total > 0 && (
                      <span
                        className={`text-[6.5px] leading-none mt-px ${textCls} opacity-90`}
                      >
                        {total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
              {[
                { cls: "bg-red-400", label: "Overdue" },
                { cls: "bg-orange-300", label: "Critical" },
                { cls: "bg-amber-200", label: "Warning" },
                { cls: "bg-emerald-100", label: "On Track" },
                { cls: "bg-[#F3F2EF]", label: "None" },
              ].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-sm ${cls}`} />
                  <span className="text-[9px] text-[#9a9a96]">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Day detail dialog ── */}
      {selectedDay !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-[#EDEDEA] w-full max-w-lg max-h-[80vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F2EF]">
              <div>
                <h2 className="text-[15px] font-semibold text-[#1a1a1a]">
                  {format(
                    new Date(year, month, selectedDay),
                    "EEEE, d MMMM yyyy",
                  )}
                </h2>
                <p className="text-[11px] text-[#9a9a96] mt-0.5">
                  {dialogItems.length} deadline
                  {dialogItems.length !== 1 ? "s" : ""} due
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[#F3F2EF] text-[#6b6b6b] hover:text-[#1a1a1a] transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Items list */}
            <div className="overflow-y-auto flex-1 px-5 py-3 flex flex-col gap-2">
              {dialogItems.length === 0 ? (
                <p className="text-[12px] text-[#9a9a96] text-center py-8">
                  No deadlines on this day
                </p>
              ) : (
                dialogItems.map((item, idx) => {
                  const daysAbs = Math.abs(item.daysUntil ?? 0);
                  const dueLabel =
                    item.urgency === "expired"
                      ? `${daysAbs}d overdue`
                      : (item.daysUntil ?? 0) === 0
                        ? "Due today"
                        : `${item.daysUntil}d left`;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 px-3.5 py-3 rounded-xl bg-[#FAFAF8] border border-[#F0EFE9]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[12px] font-semibold text-[#1a1a1a] leading-snug flex-1">
                          {item.ruleLabel ?? "Deadline"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${URGENCY_PILL[item.urgency]}`}
                        >
                          {dueLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.registerLabel && (
                          <span className="text-[10px] font-semibold text-[#9a9a96] uppercase tracking-wide">
                            {item.registerLabel}
                          </span>
                        )}
                        {item.entityName && item.entityName !== "—" && (
                          <>
                            <span className="text-[#D4D3CE] text-[10px]">
                              ·
                            </span>
                            <span className="text-[11px] text-[#6b6b6b]">
                              {item.entityName}
                            </span>
                          </>
                        )}
                      </div>
                      {item.recordId && item.registerHref && (
                        <Link
                          href={`${item.registerHref}?filter=${encodeURIComponent(item.recordId)}`}
                          className="text-[10.5px] font-mono text-[#4A5FD4] hover:underline w-fit"
                          onClick={() => setSelectedDay(null)}
                        >
                          {item.recordId}
                        </Link>
                      )}
                      <span
                        className={`text-[10px] font-medium mt-0.5 ${URGENCY_PILL[item.urgency]} inline-flex w-fit rounded px-1.5 py-0.5`}
                      >
                        {URGENCY_LABEL[item.urgency]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── ZoneIntelligencePanel ───────────────────────────────────────────────────
// Dark "Zone Intelligence" stats panel with 4 KPI tiles + action type split bar.

interface MoMDeltas {
  provisionalAttachments: number;
  arrests: number;
  investigations: number;
}

interface CurrentMonthCounts {
  provisionalAttachments: number;
  arrests: number;
  investigations: number;
}

export function ZoneIntelligencePanel({
  provisionalAttachments,
  arrests,
  investigations,
  momDeltas,
  currentMonthCounts,
  loading,
}: {
  provisionalAttachments: number;
  arrests: number;
  investigations: number;
  momDeltas?: MoMDeltas;
  currentMonthCounts?: CurrentMonthCounts;
  loading?: boolean;
}) {
  const currentMonthLabel = new Date().toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });

  const tiles = [
    {
      label: "PROVISIONAL ATTACHMENTS",
      value: provisionalAttachments,
      sub: "Current FY",
      delta: momDeltas?.provisionalAttachments,
      currMonth: currentMonthCounts?.provisionalAttachments,
    },
    {
      label: "ARRESTS",
      value: arrests,
      sub: "Current FY",
      delta: momDeltas?.arrests,
      currMonth: currentMonthCounts?.arrests,
    },
    {
      label: "INVESTIGATIONS",
      value: investigations,
      sub: "Current FY",
      delta: momDeltas?.investigations,
      currMonth: currentMonthCounts?.investigations,
    },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col gap-4">
        <p className="text-[10px] font-semibold tracking-widest text-[#9a9a96] uppercase">
          Zone Intelligence
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#F3F2EF] rounded-lg p-3">
              <div className="h-2 bg-[#EDEDEA] rounded animate-pulse w-20 mb-2" />
              <div className="h-7 bg-[#EDEDEA] rounded animate-pulse w-12 mb-1" />
              <div className="h-2 bg-[#EDEDEA] rounded animate-pulse w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col gap-4">
      <p className="text-[10px] font-semibold tracking-widest text-[#9a9a96] uppercase">
        Zone Intelligence
      </p>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const pct =
            tile.value > 0 && tile.currMonth != null
              ? Math.round((tile.currMonth / tile.value) * 100)
              : 0;
          const showBar = tile.currMonth != null && tile.value > 0;
          return (
            <div key={tile.label} className="bg-[#F3F2EF] rounded-lg p-3">
              <p className="text-[9px] font-semibold tracking-widest text-[#9a9a96] uppercase mb-1">
                {tile.label}
              </p>
              <p className="text-[28px] font-bold text-[#1a1a1a] leading-none tabular-nums">
                {tile.value}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[#9a9a96]">{tile.sub}</span>
                {tile.delta != null && tile.delta !== 0 && (
                  <RadixTooltipProvider delayDuration={150}>
                    <RadixTooltip>
                      <RadixTooltipTrigger asChild>
                        <span
                          className={`text-[10px] font-medium tabular-nums cursor-default ${tile.delta > 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {tile.delta > 0 ? "+" : ""}
                          {tile.delta} MoM
                        </span>
                      </RadixTooltipTrigger>
                      <RadixTooltipContent side="top" className="max-w-[200px] text-center leading-snug">
                        {tile.delta > 0
                          ? `${tile.delta} more than last month — activity is increasing`
                          : `${Math.abs(tile.delta)} fewer than last month — activity is declining`}
                      </RadixTooltipContent>
                    </RadixTooltip>
                  </RadixTooltipProvider>
                )}
                {tile.delta != null && tile.delta === 0 && (
                  <RadixTooltipProvider delayDuration={150}>
                    <RadixTooltip>
                      <RadixTooltipTrigger asChild>
                        <span className="text-[10px] text-[#9a9a96] tabular-nums cursor-default">
                          ± 0 MoM
                        </span>
                      </RadixTooltipTrigger>
                      <RadixTooltipContent side="top" className="max-w-[200px] text-center leading-snug">
                        Same count as last month
                      </RadixTooltipContent>
                    </RadixTooltip>
                  </RadixTooltipProvider>
                )}
              </div>
              {showBar && (
                <div className="mt-2.5">
                  <RadixTooltipProvider delayDuration={150}>
                    <RadixTooltip>
                      <RadixTooltipTrigger asChild>
                        <div className="cursor-default">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-[#9a9a96]">
                              {currentMonthLabel}
                            </span>
                            <span className="text-[9px] font-semibold text-[#4A5FD4] tabular-nums">
                              {tile.currMonth} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1 bg-[#DDDDD8] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#4A5FD4] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </RadixTooltipTrigger>
                      <RadixTooltipContent side="bottom" className="max-w-[220px] text-center leading-snug">
                        {tile.currMonth} of {tile.value} cases this FY were added in {currentMonthLabel} — {pct}% of the annual total
                      </RadixTooltipContent>
                    </RadixTooltip>
                  </RadixTooltipProvider>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DetectionRecoveryChart ───────────────────────────────────────────────────

export interface DetectionRecoveryRow {
  group: string;
  detection: number;
  recoveryCash: number;
  recoveryItc: number;
}

export function DetectionRecoveryChart({
  data,
  loading,
}: {
  data: DetectionRecoveryRow[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          Detection vs Recovery (Monthly)
        </h3>
        <div className="h-[200px] bg-[#F3F2EF] rounded-xl animate-pulse mt-4" />
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.group),
    datasets: [
      {
        label: "Detection (₹)",
        data: data.map((d) => d.detection),
        backgroundColor: "#4A5FD4",
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.65,
      },
      {
        label: "Recovery Cash (₹)",
        data: data.map((d) => d.recoveryCash),
        backgroundColor: "#10B981",
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.65,
      },
      {
        label: "Recovery ITC (₹)",
        data: data.map((d) => d.recoveryItc),
        backgroundColor: "#F59E0B",
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.65,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 11, family: "DM Sans" },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: {
            dataset: { label?: string };
            parsed: { y: number };
          }) =>
            `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: "DM Sans" }, color: "#9a9a96" },
      },
      y: {
        grid: { color: "#F3F2EF" },
        ticks: {
          font: { size: 10, family: "DM Sans" },
          color: "#9a9a96",
          callback: (value: number | string) =>
            `₹${Number(value).toLocaleString("en-IN")}`,
        },
      },
    },
  };

  const totalDetection = data.reduce((s, d) => s + d.detection, 0);
  const totalRecoveryCash = data.reduce((s, d) => s + d.recoveryCash, 0);
  const totalRecoveryItc = data.reduce((s, d) => s + d.recoveryItc, 0);

  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        Detection vs Recovery (Monthly)
      </h3>
      <div className="flex items-center gap-3 mt-1 mb-3 flex-wrap">
        <span className="text-[10.5px] text-[#9a9a96]">
          Detection:{" "}
          <span className="font-medium text-[#4A5FD4]">
            ₹{totalDetection.toLocaleString("en-IN")}
          </span>
        </span>
        <span className="text-[10.5px] text-[#9a9a96]">
          Cash:{" "}
          <span className="font-medium text-emerald-600">
            ₹{totalRecoveryCash.toLocaleString("en-IN")}
          </span>
        </span>
        <span className="text-[10.5px] text-[#9a9a96]">
          ITC:{" "}
          <span className="font-medium text-amber-500">
            ₹{totalRecoveryItc.toLocaleString("en-IN")}
          </span>
        </span>
      </div>
      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-[11px] text-[#9a9a96]">
          No incident report data available
        </div>
      ) : (
        <div className="h-[200px]">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}

// ─── IssueInvolvedChart ──────────────────────────────────────────────────────

export interface IssueInvolvedRow {
  issue: string;
  count: number;
}

export interface RegisterActivityDataset {
  table: string;
  label: string;
  shortLabel: string;
  accent: string;
  href: string;
  monthCounts: Record<string, number>; // "YYYY-MM" → count
}

export interface RegisterPendencyCardRow {
  label: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  total: number;
  expired: number;
  critical: number;
  warning: number;
}

const ISSUE_COLORS: Record<string, string> = {
  Fake: "#EF4444",
  Technical: "#F59E0B",
  Clandestine: "#8B5CF6",
  Misclassification: "#06B6D4",
  Others: "#9a9a96",
};

export function IssueInvolvedChart({
  data,
  loading,
}: {
  data: IssueInvolvedRow[];
  loading?: boolean;
}) {
  const KNOWN_ISSUES = ["Fake", "Technical", "Clandestine", "Misclassification"];

  // Bucket any value not in KNOWN_ISSUES into "Others"
  const othersCount = data
    .filter((d) => !KNOWN_ISSUES.includes(d.issue))
    .reduce((s, d) => s + d.count, 0);

  const merged = [
    ...KNOWN_ISSUES.map((issue) => ({
      issue,
      count: data.find((d) => d.issue === issue)?.count ?? 0,
    })),
    ...(othersCount > 0 ? [{ issue: "Others", count: othersCount }] : []),
  ];

  const total = merged.reduce((s, d) => s + d.count, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          Issue Involved
        </h3>
        <div className="h-[200px] bg-[#F3F2EF] rounded-xl animate-pulse mt-4" />
      </div>
    );
  }

  const chartData = {
    labels: merged.map((d) => d.issue),
    datasets: [
      {
        data: merged.map((d) => d.count),
        backgroundColor: merged.map((d) => ISSUE_COLORS[d.issue] ?? "#9a9a96"),
        borderWidth: 0,
        cutout: "60%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; parsed: number }) =>
            `${ctx.label}: ${ctx.parsed} (${total > 0 ? Math.round((ctx.parsed / total) * 100) : 0}%)`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        Issue Involved
      </h3>
      <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-3">
        {total} case{total !== 1 ? "s" : ""} by issue type
      </p>
      <div className="flex flex-col items-center gap-4 flex-1">
        <div className="h-[150px] w-[150px] shrink-0">
          <Doughnut data={chartData} options={options} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
          {merged.map((d) => (
            <div key={d.issue} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{
                  backgroundColor: ISSUE_COLORS[d.issue] ?? "#9a9a96",
                }}
              />
              <span className="text-[11px] text-[#1a1a1a]">{d.issue}</span>
              <span className="text-[11px] text-[#9a9a96] ml-auto tabular-nums font-medium">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── OfficerExposureChart ─────────────────────────────────────────────────────
// Horizontal bar chart: overdue + critical count by assigned officer / unit.
// Accepts the full allItems array and filters internally.

export function OfficerExposureChart({
  items,
  loading,
}: {
  items: ExposureItem[];
  loading?: boolean;
}) {
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);

  // Only IR + NON-IR cases (both live in dggi_records); subsidiary registers
  // (SCN, prosecution, provisional attachment, etc.) are excluded.
  const irItems = items.filter((i) => i.sourceTable === "dggi_records");

  // Named officers show only their action items (overdue/critical exposure).
  // "Unassigned" shows EVERY unassigned case regardless of urgency — an
  // ownerless case is a gap even before its deadline turns urgent. Non-urgent
  // unassigned cases are bucketed as `other` (rendered as a neutral segment).
  const byOfficer: Record<
    string,
    { expired: number; critical: number; other: number; items: ExposureItem[] }
  > = {};
  for (const item of irItems) {
    // Assignment is determined solely by sio_user_id.
    const assigned = !!item.sioUserId?.trim();
    const isAction = item.urgency === "expired" || item.urgency === "critical";
    if (assigned && !isAction) continue;
    const key = assigned ? item.officer?.trim() || "Unknown officer" : "Unassigned";
    if (!byOfficer[key])
      byOfficer[key] = { expired: 0, critical: 0, other: 0, items: [] };
    if (item.urgency === "expired") byOfficer[key].expired++;
    else if (item.urgency === "critical") byOfficer[key].critical++;
    else byOfficer[key].other++;
    byOfficer[key].items.push(item);
  }

  const sorted = Object.entries(byOfficer)
    .map(([officer, counts]) => ({
      officer,
      expired: counts.expired,
      critical: counts.critical,
      other: counts.other,
      total: counts.expired + counts.critical + counts.other,
    }))
    .sort((a, b) => b.total - a.total);

  // Cap at 8 rows, but always keep "Unassigned" visible even if it ranks lower.
  const unassignedRow = sorted.find((r) => r.officer === "Unassigned");
  let topRows = sorted.slice(0, 8);
  if (unassignedRow && !topRows.includes(unassignedRow)) {
    topRows = [...sorted.slice(0, 7), unassignedRow];
  }

  const maxTotal =
    topRows.length > 0 ? Math.max(...topRows.map((r) => r.total)) : 1;

  // Sort the selected officer's items worst-first for the breakdown dialog.
  const URGENCY_ORDER: Record<Urgency, number> = {
    expired: 0,
    critical: 1,
    warning: 2,
    safe: 3,
  };
  const dialogItems = selectedOfficer
    ? [...(byOfficer[selectedOfficer]?.items ?? [])].sort((a, b) => {
        if (URGENCY_ORDER[a.urgency] !== URGENCY_ORDER[b.urgency])
          return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
        return (a.daysUntil ?? 0) - (b.daysUntil ?? 0);
      })
    : [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          Officer Exposure
        </h3>
        <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-4">
          Action items by assigned unit
        </p>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-5 bg-[#F3F2EF] rounded animate-pulse"
              style={{ width: `${75 + i * 5}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        Officer Exposure
      </h3>
      <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-4">
        Action items by officer · all unassigned cases
      </p>
      {topRows.length === 0 ? (
        <div className="py-8 text-center text-[11.5px] text-[#9a9a96]">
          No action items — all clear
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {topRows.map((row) => (
              <button
                key={row.officer}
                type="button"
                onClick={() => setSelectedOfficer(row.officer)}
                className="flex items-center gap-3 w-full text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-[#F3F2EF] transition-colors cursor-pointer"
                title={`View ${row.total} case${row.total !== 1 ? "s" : ""} for ${row.officer}`}
              >
                <span
                  className="text-[11px] font-medium text-[#6b6b6b] shrink-0 w-28 truncate"
                  title={row.officer}
                >
                  {row.officer}
                </span>
                <div className="flex-1 h-5 bg-[#F3F2EF] rounded-full overflow-hidden flex">
                  {row.expired > 0 && (
                    <div
                      style={{ width: `${(row.expired / maxTotal) * 100}%` }}
                      className="bg-red-400 h-full"
                    />
                  )}
                  {row.critical > 0 && (
                    <div
                      style={{ width: `${(row.critical / maxTotal) * 100}%` }}
                      className="bg-orange-400 h-full"
                    />
                  )}
                  {row.other > 0 && (
                    <div
                      style={{ width: `${(row.other / maxTotal) * 100}%` }}
                      className="bg-[#C7C6C0] h-full"
                    />
                  )}
                </div>
                <span className="text-[12px] font-bold text-[#1a1a1a] tabular-nums w-5 text-right shrink-0">
                  {row.total}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[9.5px] text-[#9a9a96]">Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[9.5px] text-[#9a9a96]">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#C7C6C0]" />
              <span className="text-[9.5px] text-[#9a9a96]">Unassigned (other)</span>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Per-officer breakdown dialog */}
    {selectedOfficer !== null && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
        onClick={() => setSelectedOfficer(null)}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl border border-[#EDEDEA] w-full max-w-lg max-h-[80vh] flex flex-col mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F2EF]">
            <div>
              <h2 className="text-[15px] font-semibold text-[#1a1a1a]">
                {selectedOfficer}
              </h2>
              <p className="text-[11px] text-[#9a9a96] mt-0.5">
                {dialogItems.length}{" "}
                {selectedOfficer === "Unassigned" ? "unassigned case" : "action item"}
                {dialogItems.length !== 1 ? "s" : ""}
                {selectedOfficer === "Unassigned" ? "" : " · overdue & critical"}
              </p>
            </div>
            <button
              onClick={() => setSelectedOfficer(null)}
              className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-[#F3F2EF] text-[#6b6b6b] hover:text-[#1a1a1a] transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Items list */}
          <div className="overflow-y-auto flex-1 px-5 py-3 flex flex-col gap-2">
            {dialogItems.length === 0 ? (
              <p className="text-[12px] text-[#9a9a96] text-center py-8">
                No action items
              </p>
            ) : (
              dialogItems.map((item, idx) => {
                const daysAbs = Math.abs(item.daysUntil ?? 0);
                const dueLabel =
                  item.urgency === "expired"
                    ? `${daysAbs}d overdue`
                    : (item.daysUntil ?? 0) === 0
                      ? "Due today"
                      : `${item.daysUntil}d left`;
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 px-3.5 py-3 rounded-xl bg-[#FAFAF8] border border-[#F0EFE9]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12px] font-semibold text-[#1a1a1a] leading-snug flex-1">
                        {item.ruleLabel ?? "Deadline"}
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${URGENCY_PILL[item.urgency]}`}
                      >
                        {dueLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.registerLabel && (
                        <span className="text-[10px] font-semibold text-[#9a9a96] uppercase tracking-wide">
                          {item.registerLabel}
                        </span>
                      )}
                      {item.entityName && item.entityName !== "—" && (
                        <>
                          <span className="text-[#D4D3CE] text-[10px]">·</span>
                          <span className="text-[11px] text-[#6b6b6b]">
                            {item.entityName}
                          </span>
                        </>
                      )}
                    </div>
                    {item.recordId &&
                      item.recordId !== "—" &&
                      item.registerHref && (
                        <Link
                          href={item.registerHref}
                          className="text-[10.5px] font-mono text-[#4A5FD4] hover:underline w-fit"
                          onClick={() => setSelectedOfficer(null)}
                        >
                          {item.recordId}
                        </Link>
                      )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── RegisterPendencyCards ────────────────────────────────────────────────────
// KPI card grid — one card per register showing total/overdue/critical counts.

export function RegisterPendencyCards({
  rows,
  loading,
}: {
  rows: RegisterPendencyCardRow[];
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        Open Items by Register
      </h3>
      <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-4">
        Pending · Overdue · Critical across all registers
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          const safe = Math.max(
            0,
            row.total - row.expired - row.critical - row.warning,
          );
          const hasIssues = row.expired > 0 || row.critical > 0;
          const healthPct =
            row.total > 0
              ? Math.round(((safe + row.warning) / row.total) * 100)
              : 100;

          return (
            <Link
              key={`${row.href}-${row.label}`}
              href={row.href}
              className="flex flex-col gap-2 p-3 rounded-xl border border-[#F0EFE9] bg-[#FAFAF8] hover:bg-white hover:border-[#EDEDEA] hover:shadow-sm transition-all relative overflow-hidden group"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
                style={{ backgroundColor: row.accent }}
              />
              <div className="flex items-start justify-between gap-1 mt-0.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${row.accent}18` }}
                  >
                    <Icon size={10} style={{ color: row.accent }} />
                  </div>
                  <span className="text-[10.5px] font-semibold text-[#1a1a1a] leading-tight truncate group-hover:text-[#4A5FD4] transition-colors">
                    {row.label}
                  </span>
                </div>
                <span
                  className="text-[20px] font-bold tabular-nums leading-none shrink-0"
                  style={{ color: hasIssues ? "#1a1a1a" : "#6b6b6b" }}
                >
                  {loading ? "—" : row.total}
                </span>
              </div>

              {loading ? (
                <div className="h-3 bg-[#F3F2EF] rounded animate-pulse" />
              ) : (
                <>
                  <div className="flex items-center gap-1 flex-wrap">
                    {row.expired > 0 && (
                      <span className="inline-flex items-center text-[9.5px] font-semibold bg-red-50 text-red-600 rounded px-1.5 py-0.5">
                        {row.expired} OD
                      </span>
                    )}
                    {row.critical > 0 && (
                      <span className="inline-flex items-center text-[9.5px] font-semibold bg-orange-50 text-orange-600 rounded px-1.5 py-0.5">
                        {row.critical} Crit
                      </span>
                    )}
                    {row.warning > 0 && (
                      <span className="inline-flex items-center text-[9.5px] font-semibold bg-amber-50 text-amber-600 rounded px-1.5 py-0.5">
                        {row.warning} Warn
                      </span>
                    )}
                    {!hasIssues && row.warning === 0 && row.total > 0 && (
                      <span className="inline-flex items-center text-[9.5px] font-semibold bg-emerald-50 text-emerald-600 rounded px-1.5 py-0.5">
                        All Clear
                      </span>
                    )}
                    {row.total === 0 && (
                      <span className="text-[9.5px] text-[#C4C3BE]">
                        No records
                      </span>
                    )}
                  </div>
                  <div className="h-1 bg-[#EDEDEA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        hasIssues
                          ? "bg-red-400"
                          : row.warning > 0
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                      }`}
                      style={{ width: `${healthPct}%` }}
                    />
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── NonIrConversionChart ─────────────────────────────────────────────────────
// Bar chart showing monthly NON-IR → IR conversion rate (%).

export interface NonIrConversionRow {
  month: string; // display label, e.g. "Jan 26"
  nonIrTotal: number;
  converted: number; // subset of nonIrTotal that became IR cases
}

export function NonIrConversionChart({
  data,
  loading,
}: {
  data: NonIrConversionRow[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          NON-IR → IR Conversion Rate
        </h3>
        <div className="h-[200px] bg-[#F3F2EF] rounded-xl animate-pulse mt-4" />
      </div>
    );
  }

  const rates = data.map((d) =>
    d.nonIrTotal > 0 ? Math.round((d.converted / d.nonIrTotal) * 100) : 0,
  );
  const avgRate =
    data.length > 0 ? Math.round(rates.reduce((s, r) => s + r, 0) / data.length) : 0;

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Conversion Rate (%)",
        data: rates,
        backgroundColor: rates.map((r) =>
          r >= 50 ? "#10B981" : r >= 25 ? "#F59E0B" : "#EF4444",
        ),
        borderRadius: 5,
        barPercentage: 0.65,
        categoryPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { dataIndex: number; parsed: { y: number } }) => {
            const row = data[ctx.dataIndex];
            return [
              `Rate: ${ctx.parsed.y}%`,
              `Converted: ${row.converted} of ${row.nonIrTotal}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: "DM Sans" }, color: "#9a9a96" },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "#F3F2EF" },
        ticks: {
          font: { size: 10, family: "DM Sans" },
          color: "#9a9a96",
          callback: (value: number | string) => `${value}%`,
        },
      },
    },
  };

  const totalConverted = data.reduce((s, d) => s + d.converted, 0);
  const totalNonIr = data.reduce((s, d) => s + d.nonIrTotal, 0);

  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        NON-IR → IR Conversion Rate
      </h3>
      <div className="flex items-center gap-4 mt-1 mb-3 flex-wrap">
        <span className="text-[10.5px] text-[#9a9a96]">
          Total converted:{" "}
          <span className="font-medium text-[#4A5FD4]">
            {totalConverted} / {totalNonIr}
          </span>
        </span>
        <span className="text-[10.5px] text-[#9a9a96]">
          Avg rate:{" "}
          <span
            className={`font-medium ${avgRate >= 50 ? "text-emerald-600" : avgRate >= 25 ? "text-amber-500" : "text-red-500"}`}
          >
            {avgRate}%
          </span>
        </span>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {[
            { cls: "bg-emerald-500", label: "≥50%" },
            { cls: "bg-amber-400", label: "25–49%" },
            { cls: "bg-red-400", label: "<25%" },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${cls}`} />
              <span className="text-[9.5px] text-[#9a9a96]">{label}</span>
            </div>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-[11px] text-[#9a9a96]">
          No conversion data available
        </div>
      ) : (
        <div className="h-[200px]">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}

// ─── OfficerWorkloadChart ─────────────────────────────────────────────────────
// Horizontal stacked bar: all deadline items per officer, stacked by urgency.

export function OfficerWorkloadChart({
  items,
  loading,
}: {
  items: Array<{ officer: string; urgency: Urgency }>;
  loading?: boolean;
}) {
  const byOfficer: Record<
    string,
    { expired: number; critical: number; warning: number; safe: number }
  > = {};
  for (const item of items) {
    const key = item.officer?.trim() || "Unassigned";
    if (!byOfficer[key])
      byOfficer[key] = { expired: 0, critical: 0, warning: 0, safe: 0 };
    byOfficer[key][item.urgency]++;
  }

  const sorted = Object.entries(byOfficer)
    .map(([officer, counts]) => ({
      officer,
      ...counts,
      total: counts.expired + counts.critical + counts.warning + counts.safe,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          Officer Workload
        </h3>
        <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-4">
          All deadline items by assigned officer
        </p>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-5 bg-[#F3F2EF] rounded animate-pulse"
              style={{ width: `${70 + i * 6}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: sorted.map((r) => r.officer),
    datasets: [
      {
        label: "Overdue",
        data: sorted.map((r) => r.expired),
        backgroundColor: "#EF4444",
        barPercentage: 0.75,
        categoryPercentage: 0.75,
      },
      {
        label: "Critical",
        data: sorted.map((r) => r.critical),
        backgroundColor: "#F97316",
        barPercentage: 0.75,
        categoryPercentage: 0.75,
      },
      {
        label: "Warning",
        data: sorted.map((r) => r.warning),
        backgroundColor: "#F59E0B",
        barPercentage: 0.75,
        categoryPercentage: 0.75,
      },
      {
        label: "On Track",
        data: sorted.map((r) => r.safe),
        backgroundColor: "#10B981",
        barPercentage: 0.75,
        categoryPercentage: 0.75,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 10, family: "DM Sans" },
          boxWidth: 10,
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: {
            dataset: { label?: string };
            parsed: { x: number };
          }) => `${ctx.dataset.label}: ${ctx.parsed.x}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: "#F3F2EF" },
        ticks: { font: { size: 10, family: "DM Sans" }, color: "#9a9a96" },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: {
          font: { size: 10, family: "DM Sans" },
          color: "#6b6b6b",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        Officer Workload
      </h3>
      <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-3">
        {items.length} total deadline item{items.length !== 1 ? "s" : ""} by
        assigned officer
      </p>
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-[11.5px] text-[#9a9a96]">
          No deadline items tracked
        </div>
      ) : (
        <div style={{ height: `${Math.max(160, sorted.length * 36 + 40)}px` }}>
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}

