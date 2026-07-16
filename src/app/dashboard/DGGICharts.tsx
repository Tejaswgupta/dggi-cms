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
interface DistributionRow {
  label: string;
  accent: string;
  total: number;
  expired: number;
  critical: number;
  warning: number;
}

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
  urgency: Urgency;
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
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          Deadline Heat Map
        </h3>
        <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-3">
          {format(new Date(year, month), "MMMM yyyy")} · click a day to see
          details
        </p>
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-md bg-[#F3F2EF] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[9px] font-semibold text-[#9a9a96]"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
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
                    className={`aspect-square rounded-md flex flex-col items-center justify-center ${bg} ${
                      isToday ? "ring-2 ring-[#4A5FD4] ring-offset-1" : ""
                    } ${hasItems ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"}`}
                    title={
                      hasItems
                        ? `${format(new Date(year, month, day), "d MMM")}: ${total} deadline${total !== 1 ? "s" : ""} — click to view`
                        : format(new Date(year, month, day), "d MMM")
                    }
                  >
                    <span
                      className={`text-[10px] font-medium leading-none ${textCls}`}
                    >
                      {day}
                    </span>
                    {total > 0 && (
                      <span
                        className={`text-[7.5px] leading-none mt-px ${textCls} opacity-90`}
                      >
                        {total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {[
                { cls: "bg-red-400", label: "Overdue" },
                { cls: "bg-orange-300", label: "Critical" },
                { cls: "bg-amber-200", label: "Warning" },
                { cls: "bg-emerald-100", label: "On Track" },
                { cls: "bg-[#F3F2EF]", label: "None" },
              ].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                  <span className="text-[9.5px] text-[#9a9a96]">{label}</span>
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
                          href={`${item.registerHref}?highlight=${encodeURIComponent(item.recordId)}`}
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

export function ZoneIntelligencePanel({
  provisionalAttachments,
  arrests,
  investigations,
  momDeltas,
  loading,
}: {
  provisionalAttachments: number;
  arrests: number;
  investigations: number;
  momDeltas?: MoMDeltas;
  loading?: boolean;
}) {
  const tiles = [
    {
      label: "PROVISIONAL ATTACHMENTS",
      value: provisionalAttachments,
      sub: "Current FY",
      delta: momDeltas?.provisionalAttachments,
    },
    {
      label: "ARRESTS",
      value: arrests,
      sub: "Current FY",
      delta: momDeltas?.arrests,
    },
    {
      label: "INVESTIGATIONS",
      value: investigations,
      sub: "Current FY",
      delta: momDeltas?.investigations,
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
        {tiles.map((tile) => (
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
                <span
                  className={`text-[10px] font-medium tabular-nums ${tile.delta > 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {tile.delta > 0 ? "+" : ""}
                  {tile.delta} MoM
                </span>
              )}
              {tile.delta != null && tile.delta === 0 && (
                <span className="text-[10px] text-[#9a9a96] tabular-nums">
                  ± 0 MoM
                </span>
              )}
            </div>
          </div>
        ))}
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
  const actionItems = items.filter(
    (i) => i.urgency === "expired" || i.urgency === "critical",
  );

  const byOfficer: Record<string, { expired: number; critical: number }> = {};
  for (const item of actionItems) {
    const key = item.officer?.trim() || "Unassigned";
    if (!byOfficer[key]) byOfficer[key] = { expired: 0, critical: 0 };
    byOfficer[key][item.urgency === "expired" ? "expired" : "critical"]++;
  }

  const sorted = Object.entries(byOfficer)
    .map(([officer, counts]) => ({
      officer,
      ...counts,
      total: counts.expired + counts.critical,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const maxTotal =
    sorted.length > 0 ? Math.max(...sorted.map((r) => r.total)) : 1;

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
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        Officer Exposure
      </h3>
      <p className="text-[10.5px] text-[#9a9a96] mt-0.5 mb-4">
        {actionItems.length} action item{actionItems.length !== 1 ? "s" : ""} by
        assigned unit
      </p>
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-[11.5px] text-[#9a9a96]">
          No action items — all clear
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {sorted.map((row) => (
              <div key={row.officer} className="flex items-center gap-3">
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
                </div>
                <span className="text-[12px] font-bold text-[#1a1a1a] tabular-nums w-5 text-right shrink-0">
                  {row.total}
                </span>
              </div>
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
          </div>
        </>
      )}
    </div>
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

// ─── CpgramInformerChart ──────────────────────────────────────────────────────
// Grouped bar chart: monthly CPGRAM + Informer Reward counts by date of receipt.

export interface CpgramInformerRow {
  month: string;
  cpgram: number;
  informer: number;
}

export function CpgramInformerChart({
  data,
  loading,
}: {
  data: CpgramInformerRow[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#EDEDEA] p-5">
        <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
          CPGRAM &amp; Informer Reward (Monthly)
        </h3>
        <div className="h-[200px] bg-[#F3F2EF] rounded-xl animate-pulse mt-4" />
      </div>
    );
  }

  const totalCpgram = data.reduce((s, d) => s + d.cpgram, 0);
  const totalInformer = data.reduce((s, d) => s + d.informer, 0);

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "CPGRAM",
        data: data.map((d) => d.cpgram),
        backgroundColor: "#6D28D9",
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.65,
      },
      {
        label: "Informer Reward",
        data: data.map((d) => d.informer),
        backgroundColor: "#0891B2",
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
          }) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
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
          stepSize: 1,
          callback: (v: number | string) => (Number(v) % 1 === 0 ? v : ""),
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-[#EDEDEA] p-5 flex flex-col">
      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
        CPGRAM &amp; Informer Reward (Monthly)
      </h3>
      <div className="flex items-center gap-4 mt-1 mb-3 flex-wrap">
        <span className="text-[10.5px] text-[#9a9a96]">
          CPGRAM:{" "}
          <span className="font-medium text-[#6D28D9]">{totalCpgram}</span>
        </span>
        <span className="text-[10.5px] text-[#9a9a96]">
          Informer Reward:{" "}
          <span className="font-medium text-[#0891B2]">{totalInformer}</span>
        </span>
      </div>
      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-[11px] text-[#9a9a96]">
          No CPGRAM or Informer Reward data available
        </div>
      ) : (
        <div className="h-[200px]">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}
