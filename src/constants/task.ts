import type { Task } from "@/types/task";

// ── Status options for dropdowns ──────────────────────────────────────────
export const TASK_STATUS_OPTIONS = [
  { value: 0, label: "Todo" },
  { value: 1, label: "In Progress" },
  { value: 2, label: "In Verify" },
  { value: 3, label: "Done" },
] as const;

// ── Status pill styles (list/row view) ────────────────────────────────────
export const TASK_STATUS_STYLES: Record<
  Task["status"],
  { label: string; pill: string }
> = {
  0: { label: "Todo", pill: "bg-[#F3F2EF] text-[#6b6b6b]" },
  1: { label: "In Progress", pill: "bg-[#EEF2FF] text-[#4A5FD4]" },
  2: { label: "In Verify", pill: "bg-[#F5F3FF] text-[#6d28d9]" },
  3: { label: "Done", pill: "bg-[#EDFAF3] text-[#1D9E75]" },
};

// ── Status labels for group headings / export ─────────────────────────────
export const TASK_STATUS_LABELS: Record<number, string> = {
  0: "Todo",
  1: "In Progress",
  2: "In Verify",
  3: "Done",
};

// ── Status config for TaskModal badge (bg / color / border / dot) ─────────
export const TASK_MODAL_STATUSES = [
  {
    label: "Todo",
    value: "0",
    bg: "#eff6ff",
    color: "#1d4ed8",
    border: "#bfdbfe",
    dot: "#3b82f6",
  },
  {
    label: "In progress",
    value: "1",
    bg: "#fef3c7",
    color: "#b45309",
    border: "#fde68a",
    dot: "#f59e0b",
  },
  {
    label: "In verify",
    value: "2",
    bg: "#f5f3ff",
    color: "#6d28d9",
    border: "#ddd6fe",
    dot: "#8b5cf6",
  },
  {
    label: "Done",
    value: "3",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#bbf7d0",
    dot: "#22c55e",
  },
];

// ── Priority pill styles (list/row view) ──────────────────────────────────
export const TASK_PRIORITY_STYLES: Record<
  Task["priority"],
  { label: string; pill: string }
> = {
  Low: { label: "Low", pill: "bg-[#EDFAF3] text-[#1D9E75]" },
  Medium: { label: "Medium", pill: "bg-[#FFFAEB] text-[#B45309]" },
  High: { label: "High", pill: "bg-[#FEF0EE] text-[#C0432A]" },
};

// ── Priority config for TaskModal buttons ─────────────────────────────────
export const TASK_MODAL_PRIORITIES = [
  {
    label: "Low",
    value: "Low",
    activeBg: "#dcfce7",
    activeColor: "#15803d",
    activeBorder: "#86efac",
    inactiveColor: "#a3a3a3",
    inactiveBorder: "#e5e5e5",
  },
  {
    label: "Med",
    value: "Medium",
    activeBg: "#fef3c7",
    activeColor: "#b45309",
    activeBorder: "#fde68a",
    inactiveColor: "#a3a3a3",
    inactiveBorder: "#e5e5e5",
  },
  {
    label: "High",
    value: "High",
    activeBg: "#fee2e2",
    activeColor: "#b91c1c",
    activeBorder: "#fca5a5",
    inactiveColor: "#a3a3a3",
    inactiveBorder: "#e5e5e5",
  },
];
