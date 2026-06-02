"use client";

import { getAllCases } from "@/apiReq/newAPIs/cases";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { mergeFirstLetters } from "@/utils/stringOpeartion";
import { format, isValid } from "date-fns";
import {
  CalendarDays,
  Check,
  FileText,
  Link2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { TASK_MODAL_PRIORITIES, TASK_MODAL_STATUSES } from "@/constants/task";

/* ─── Props ──────────────────────────────────────────────────────────── */
interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "new" | "edit";

  taskName: string;
  onTaskNameChange: (name: string) => void;
  taskDescription: string;
  onTaskDescriptionChange: (description: string) => void;

  taskStatus: string | number;
  onTaskStatusChange: (status: string) => void;
  priority: string;
  onPriorityChange: (priority: string) => void;

  startDate: Date | null;
  onStartDateChange: (date: Date) => void;
  dueDate: Date | null;
  onDueDateChange: (date: Date) => void;

  assignee: { id: string; name: string } | null;
  onAssigneeChange: (userId: string) => void;
  workspaceUsers: Array<{ id: string; name: string; email?: string }>;
  selectedAssignees: Array<{ id: string; name: string }>;
  onSelectedAssigneesChange: (
    assignees: Array<{ id: string; name: string }>,
  ) => void;
  onAutomaticAssign?: () => void;
  isSelectingAssignee?: boolean;
  autoAssignEnabled: boolean;
  onAutoAssignChange: (enabled: boolean) => void;

  subtasks: Array<{ id: string; name: string }>;
  availableTasks: Array<{ id: string; name: string }>;
  onAddSubtask: (taskId: string) => Promise<void>;
  onRemoveSubtask: (taskId: string) => Promise<void>;
  onCreateSubtask?: (name: string) => Promise<void>;

  selectedCase: { id: string; trade_name: string } | null;
  onCaseChange: (caseData: { id: string; trade_name: string } | null) => void;

  documents: any[];
  onDocumentAdd?: (file: File) => Promise<void>;
  onDocumentRemove?: (document: any) => Promise<void>;

  ccUsers?: Array<{ id: string; name: string }>;
  onCCUsersChange?: (users: Array<{ id: string; name: string }>) => void;

  teams?: Array<{ id: string; name: string }>;
  selectedTeam?: { id: string; name: string } | null;
  onTeamChange?: (team: { id: string; name: string } | null) => void;

  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;

  isLoading?: boolean;
  isChangingTaskStatus?: boolean;
  hideApproverSection?: boolean;
}

/* ─── Avatar initials ────────────────────────────────────────────────── */
const AVATAR_SHADES = [
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
];
function avatarBg(name: string) {
  return AVATAR_SHADES[name.charCodeAt(0) % AVATAR_SHADES.length];
}

/* ─── Sidebar section label ──────────────────────────────────────────── */
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
      {children}
    </span>
  );
}

/* ─── Component ──────────────────────────────────────────────────────── */
const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onOpenChange,
  mode,
  taskName,
  onTaskNameChange,
  taskDescription,
  onTaskDescriptionChange,
  taskStatus,
  onTaskStatusChange,
  priority,
  onPriorityChange,
  startDate,
  onStartDateChange,
  dueDate,
  onDueDateChange,
  assignee,
  onAssigneeChange,
  workspaceUsers,
  selectedAssignees,
  onSelectedAssigneesChange,
  onAutomaticAssign,
  isSelectingAssignee,
  autoAssignEnabled,
  onAutoAssignChange,
  subtasks,
  availableTasks,
  onAddSubtask,
  onRemoveSubtask,
  onCreateSubtask,
  selectedCase,
  onCaseChange,
  documents,
  onDocumentAdd,
  onDocumentRemove,
  ccUsers = [],
  onCCUsersChange,
  teams = [],
  selectedTeam = null,
  onTeamChange,
  onSave,
  onCancel,
  onDelete,
  isLoading = false,
  isChangingTaskStatus = false,
  hideApproverSection = false,
}) => {
  /* Status cycling */
  const [statusIndex, setStatusIndex] = useState(0);
  useEffect(() => {
    const i = TASK_MODAL_STATUSES.findIndex(
      (s) => s.value === String(taskStatus),
    );
    if (i !== -1) setStatusIndex(i);
  }, [taskStatus]);

  const cycleStatus = () => {
    const next = (statusIndex + 1) % TASK_MODAL_STATUSES.length;
    setStatusIndex(next);
    onTaskStatusChange(TASK_MODAL_STATUSES[next].value);
  };
  const statusCfg = TASK_MODAL_STATUSES[statusIndex];

  /* Case search */
  const [caseQuery, setCaseQuery] = useState("");
  const [caseOpen, setCaseOpen] = useState(false);
  const [allCases, setAllCases] = useState<
    Array<{ id: number; display: string }>
  >([]);
  const caseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!caseOpen || allCases.length > 0) return;
    getAllCases().then((res) => {
      if (res.success && res.data) {
        setAllCases(
          res.data.map((c: any) => ({
            id: c.id,
            display:
              c.manual_name || c.registration_no || `Case ${c.id}`,
          })),
        );
      }
    });
  }, [caseOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (caseRef.current && !caseRef.current.contains(e.target as Node))
        setCaseOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCases = allCases.filter(
    (c) =>
      caseQuery === "" ||
      c.display.toLowerCase().includes(caseQuery.toLowerCase()),
  );

  /* Assignee dropdown */
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        assigneeRef.current &&
        !assigneeRef.current.contains(e.target as Node)
      )
        setAssigneeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredUsers = workspaceUsers
    .filter((u) => u.id !== "")
    .filter(
      (u) =>
        assigneeQuery === "" ||
        u.name.toLowerCase().includes(assigneeQuery.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(assigneeQuery.toLowerCase()),
    );

  const toggleAssignee = (u: { id: string; name: string }) => {
    if (selectedAssignees.find((a) => a.id === u.id)) {
      onSelectedAssigneesChange(selectedAssignees.filter((a) => a.id !== u.id));
    } else {
      onSelectedAssigneesChange([
        ...selectedAssignees,
        { id: u.id, name: u.name },
      ]);
    }
  };

  /* CC dropdown */
  const [ccQuery, setCcQuery] = useState("");
  const [ccOpen, setCcOpen] = useState(false);
  const ccRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ccRef.current && !ccRef.current.contains(e.target as Node))
        setCcOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCCUsers = workspaceUsers
    .filter((u) => u.id !== "")
    .filter(
      (u) =>
        ccQuery === "" ||
        u.name.toLowerCase().includes(ccQuery.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(ccQuery.toLowerCase()),
    );

  const toggleCC = (u: { id: string; name: string }) => {
    if (!onCCUsersChange) return;
    if (ccUsers.find((a) => a.id === u.id)) {
      onCCUsersChange(ccUsers.filter((a) => a.id !== u.id));
    } else {
      onCCUsersChange([...ccUsers, { id: u.id, name: u.name }]);
    }
  };

  /* Team dropdown */
  const [teamQuery, setTeamQuery] = useState("");
  const [teamOpen, setTeamOpen] = useState(false);
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (teamRef.current && !teamRef.current.contains(e.target as Node))
        setTeamOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredTeams = teams.filter(
    (t) =>
      teamQuery === "" ||
      t.name.toLowerCase().includes(teamQuery.toLowerCase()),
  );

  /* Subtask input */
  const [subtaskText, setSubtaskText] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSubtaskInput) subtaskInputRef.current?.focus();
  }, [showSubtaskInput]);

  const commitSubtask = async () => {
    const trimmed = subtaskText.trim();
    if (trimmed && onCreateSubtask) {
      await onCreateSubtask(trimmed);
      setSubtaskText("");
    } else if (!trimmed) {
      setShowSubtaskInput(false);
    }
  };

  /* File upload */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onDocumentAdd) await onDocumentAdd(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onDocumentAdd) await onDocumentAdd(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-[900px] p-0 gap-0 overflow-hidden [&>button.absolute]:hidden"
        style={{
          height: "90vh",
          maxHeight: "90dvh",
          borderRadius: "14px",
          border: "1px solid #e5e5e5",
          boxShadow:
            "0 24px 64px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
          background: "transparent",
        }}
      >
        <div
          className="flex flex-col md:flex-row h-full overflow-hidden"
          style={{ borderRadius: "14px" }}
        >
          {/* ── Left: Main content panel ── */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-white">
            {/* Title */}
            <div className="flex-shrink-0 px-4 sm:px-7 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-neutral-100">
              <input
                type="text"
                value={taskName}
                onChange={(e) => onTaskNameChange(e.target.value)}
                placeholder="Untitled task…"
                className="w-full bg-transparent outline-none text-neutral-900 placeholder:text-neutral-300 placeholder:font-light"
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  letterSpacing: "-0.3px",
                }}
              />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-7 py-4 sm:py-5 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Description
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => onTaskDescriptionChange(e.target.value)}
                  placeholder="Add context — matter background, what needs to be done, references…"
                  rows={4}
                  className="w-full px-4 py-3 text-sm rounded-xl resize-none outline-none transition-all duration-150 placeholder:font-light placeholder:text-neutral-300 text-neutral-700 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:ring-2 focus:ring-black/5"
                  style={{ lineHeight: "1.65" }}
                />
              </div>

              <div className="col-span-2 md:col-span-1 h-px bg-neutral-100" />

              {/* Assign to */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Assign to
                </label>

                {/* Auto-assign toggle */}
                <button
                  type="button"
                  onClick={() => {
                    onAutoAssignChange(!autoAssignEnabled);
                    if (!autoAssignEnabled && onAutomaticAssign)
                      onAutomaticAssign();
                  }}
                  className="flex items-center gap-2.5 text-xs transition-colors"
                  style={{ color: autoAssignEnabled ? "#171717" : "#737373" }}
                >
                  <div
                    className="relative flex-shrink-0 rounded-full transition-all duration-200"
                    style={{
                      width: "32px",
                      height: "18px",
                      background: autoAssignEnabled ? "#171717" : "#e5e5e5",
                    }}
                  >
                    <div
                      className="absolute top-[2px] rounded-full bg-white shadow-sm transition-all duration-200"
                      style={{
                        width: "14px",
                        height: "14px",
                        left: autoAssignEnabled ? "16px" : "2px",
                      }}
                    />
                  </div>
                  <span className="font-medium">
                    Auto-assign based on workload
                  </span>
                </button>

                {/* Assignee chips */}
                {selectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedAssignees.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white"
                          style={{ background: avatarBg(a.name) }}
                        >
                          {mergeFirstLetters(a.name)}
                        </span>
                        {a.name.split(" ")[0]}
                        <button
                          type="button"
                          onClick={() =>
                            onSelectedAssigneesChange(
                              selectedAssignees.filter((x) => x.id !== a.id),
                            )
                          }
                          className="ml-0.5 opacity-40 hover:opacity-80 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Assignee dropdown */}
                <div className="relative" ref={assigneeRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setAssigneeOpen((v) => !v);
                      setAssigneeQuery("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all text-neutral-600 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300"
                  >
                    <Plus size={12} />
                    Add Assignee
                  </button>

                  {assigneeOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 z-50 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xl">
                      <div className="p-2 border-b border-neutral-100">
                        <input
                          autoFocus
                          type="text"
                          value={assigneeQuery}
                          onChange={(e) => setAssigneeQuery(e.target.value)}
                          placeholder="Search members…"
                          className="w-full px-3 py-1.5 text-xs rounded-lg outline-none text-neutral-700 bg-neutral-50 border border-neutral-200 focus:border-neutral-400"
                        />
                      </div>
                      <ul className="max-h-44 overflow-y-auto py-1">
                        {filteredUsers.length === 0 && (
                          <li className="px-3 py-2 text-xs text-neutral-400">
                            No members found
                          </li>
                        )}
                        {filteredUsers.map((u) => {
                          const isSelected = !!selectedAssignees.find(
                            (a) => a.id === u.id,
                          );
                          return (
                            <li key={u.id}>
                              <button
                                type="button"
                                onClick={() => toggleAssignee(u)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors",
                                  isSelected
                                    ? "bg-neutral-100 text-neutral-900"
                                    : "hover:bg-neutral-50 text-neutral-600",
                                )}
                              >
                                <span
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white"
                                  style={{ background: avatarBg(u.name) }}
                                >
                                  {mergeFirstLetters(u.name)}
                                </span>
                                <span className="flex-1 truncate font-medium">
                                  {u.name}
                                </span>
                                {isSelected && (
                                  <Check
                                    size={12}
                                    className="text-neutral-700"
                                  />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* CC */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  CC
                </label>

                {ccUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ccUsers.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200"
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white"
                          style={{ background: avatarBg(a.name) }}
                        >
                          {mergeFirstLetters(a.name)}
                        </span>
                        {a.name.split(" ")[0]}
                        <button
                          type="button"
                          onClick={() =>
                            onCCUsersChange?.(
                              ccUsers.filter((x) => x.id !== a.id),
                            )
                          }
                          className="ml-0.5 opacity-40 hover:opacity-80 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative" ref={ccRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setCcOpen((v) => !v);
                      setCcQuery("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all text-neutral-600 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300"
                  >
                    <Plus size={12} />
                    Add CC
                  </button>

                  {ccOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 z-50 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xl">
                      <div className="p-2 border-b border-neutral-100">
                        <input
                          autoFocus
                          type="text"
                          value={ccQuery}
                          onChange={(e) => setCcQuery(e.target.value)}
                          placeholder="Search members…"
                          className="w-full px-3 py-1.5 text-xs rounded-lg outline-none text-neutral-700 bg-neutral-50 border border-neutral-200 focus:border-neutral-400"
                        />
                      </div>
                      <ul className="max-h-44 overflow-y-auto py-1">
                        {filteredCCUsers.length === 0 && (
                          <li className="px-3 py-2 text-xs text-neutral-400">
                            No members found
                          </li>
                        )}
                        {filteredCCUsers.map((u) => {
                          const isSelected = !!ccUsers.find(
                            (a) => a.id === u.id,
                          );
                          return (
                            <li key={u.id}>
                              <button
                                type="button"
                                onClick={() => toggleCC(u)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors",
                                  isSelected
                                    ? "bg-neutral-100 text-neutral-900"
                                    : "hover:bg-neutral-50 text-neutral-600",
                                )}
                              >
                                <span
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white"
                                  style={{ background: avatarBg(u.name) }}
                                >
                                  {mergeFirstLetters(u.name)}
                                </span>
                                <span className="flex-1 truncate font-medium">
                                  {u.name}
                                </span>
                                {isSelected && (
                                  <Check
                                    size={12}
                                    className="text-neutral-700"
                                  />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Team */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Team
                </label>

                {selectedTeam && (
                  <span className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 text-white border border-neutral-800">
                    {selectedTeam.name}
                    <button
                      type="button"
                      onClick={() => onTeamChange?.(null)}
                      className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}

                <div className="relative" ref={teamRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setTeamOpen((v) => !v);
                      setTeamQuery("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all text-neutral-600 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300"
                  >
                    <Plus size={12} />
                    {selectedTeam ? "Change Team" : "Select Team"}
                  </button>

                  {teamOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 z-50 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xl">
                      <div className="p-2 border-b border-neutral-100">
                        <input
                          autoFocus
                          type="text"
                          value={teamQuery}
                          onChange={(e) => setTeamQuery(e.target.value)}
                          placeholder="Search teams…"
                          className="w-full px-3 py-1.5 text-xs rounded-lg outline-none text-neutral-700 bg-neutral-50 border border-neutral-200 focus:border-neutral-400"
                        />
                      </div>
                      <ul className="max-h-44 overflow-y-auto py-1">
                        {filteredTeams.length === 0 && (
                          <li className="px-3 py-2 text-xs text-neutral-400">
                            No teams found
                          </li>
                        )}
                        {filteredTeams.map((t) => (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => {
                                onTeamChange?.(t);
                                setTeamOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors font-medium",
                                selectedTeam?.id === t.id
                                  ? "bg-neutral-100 text-neutral-900"
                                  : "hover:bg-neutral-50 text-neutral-600",
                              )}
                            >
                              <span className="flex-1 truncate">{t.name}</span>
                              {selectedTeam?.id === t.id && (
                                <Check size={12} className="text-neutral-700" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 h-px bg-neutral-100" />

              {/* Sub-tasks */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Sub-tasks
                </label>

                {subtasks.length > 0 && (
                  <ul className="space-y-1.5">
                    {subtasks.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium bg-neutral-50 border border-neutral-200 text-neutral-600"
                      >
                        <div className="w-4 h-4 rounded flex-shrink-0 border-[1.5px] border-neutral-300" />
                        <span className="flex-1">{s.name}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveSubtask(s.id)}
                          className="opacity-30 hover:opacity-70 transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {showSubtaskInput ? (
                  <input
                    ref={subtaskInputRef}
                    type="text"
                    value={subtaskText}
                    onChange={(e) => setSubtaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitSubtask();
                      }
                      if (e.key === "Escape") {
                        setShowSubtaskInput(false);
                        setSubtaskText("");
                      }
                    }}
                    onBlur={() => {
                      if (!subtaskText.trim()) setShowSubtaskInput(false);
                    }}
                    placeholder="Type sub-task and press Enter…"
                    className="w-full px-3 py-2 text-xs rounded-lg outline-none text-neutral-700 border border-neutral-900 bg-white ring-2 ring-black/5 placeholder:text-neutral-300"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubtaskInput(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    <Plus size={13} />
                    Add sub-task
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 sm:px-7 py-3 sm:py-4 flex items-center justify-end gap-2 sm:gap-2.5 border-t border-neutral-100 bg-white">
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="mr-auto text-xs font-semibold px-3 py-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isLoading}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-neutral-900 hover:bg-black transition-all disabled:opacity-50 hover:-translate-y-px"
                style={{ boxShadow: "0 4px 14px -4px rgba(0,0,0,0.35)" }}
              >
                {isLoading ? "Saving…" : "Save task"}
              </button>
            </div>
          </div>

          {/* ── Right: Properties sidebar ── */}
          <div className="w-full md:w-[230px] flex-shrink-0 flex flex-col min-h-0 overflow-hidden bg-white border-t md:border-t-0 md:border-l border-neutral-200">
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-4 sm:pt-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-neutral-100">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                Properties
              </span>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
              >
                <X size={13} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-5">
                {/* Status */}
                <div className="space-y-2">
                  <SideLabel>Status</SideLabel>
                  <button
                    type="button"
                    onClick={cycleStatus}
                    disabled={isChangingTaskStatus}
                    className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                    style={{
                      background: statusCfg.bg,
                      color: statusCfg.color,
                      border: `1px solid ${statusCfg.border}`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: statusCfg.dot }}
                    />
                    {statusCfg.label}
                  </button>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <SideLabel>Priority</SideLabel>
                  <div className="flex gap-1.5">
                    {TASK_MODAL_PRIORITIES.map((p) => {
                      const isActive =
                        priority.toLowerCase() === p.value.toLowerCase();
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => onPriorityChange(p.value)}
                          className="text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all"
                          style={{
                            background: isActive ? p.activeBg : "transparent",
                            color: isActive ? p.activeColor : p.inactiveColor,
                            border: `1px solid ${isActive ? p.activeBorder : p.inactiveBorder}`,
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 h-px bg-neutral-100" />

                {/* Start date */}
                <div className="space-y-2">
                  <SideLabel>Start date</SideLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all bg-neutral-50 border border-neutral-200 hover:border-neutral-400"
                        style={{
                          color:
                            startDate && isValid(startDate)
                              ? "#262626"
                              : "#a3a3a3",
                        }}
                      >
                        <CalendarDays
                          size={12}
                          className="text-neutral-400 flex-shrink-0"
                        />
                        {startDate && isValid(startDate)
                          ? format(startDate, "dd MMM yyyy")
                          : "Pick a date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate ?? undefined}
                        onSelect={(d) => {
                          if (d) onStartDateChange(d);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due date */}
                <div className="space-y-2">
                  <SideLabel>Due date</SideLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all bg-neutral-50 border border-neutral-200 hover:border-neutral-400"
                        style={{
                          color:
                            dueDate && isValid(dueDate) ? "#262626" : "#a3a3a3",
                        }}
                      >
                        <CalendarDays
                          size={12}
                          className="text-neutral-400 flex-shrink-0"
                        />
                        {dueDate && isValid(dueDate)
                          ? format(dueDate, "dd MMM yyyy")
                          : "Pick a date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate ?? undefined}
                        onSelect={(d) => {
                          if (d) onDueDateChange(d);
                        }}
                        disabled={(d) =>
                          startDate && isValid(startDate)
                            ? d < startDate
                            : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {startDate &&
                    dueDate &&
                    isValid(startDate) &&
                    isValid(dueDate) &&
                    dueDate < startDate && (
                      <p className="text-[10px] text-neutral-400">
                        Due date is before start date.
                      </p>
                    )}
                </div>

                <div className="col-span-2 md:col-span-1 h-px bg-neutral-100" />

                {/* Linked case */}
                <div
                  className="col-span-2 md:col-span-1 space-y-2"
                  ref={caseRef}
                >
                  <SideLabel>Linked case</SideLabel>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setCaseOpen((v) => !v);
                        setCaseQuery("");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-all bg-neutral-50 border border-neutral-200 hover:border-neutral-400"
                    >
                      <Link2
                        size={12}
                        className="text-neutral-400 flex-shrink-0"
                      />
                      <span
                        className="flex-1 truncate font-medium"
                        style={{
                          color: selectedCase?.trade_name
                            ? "#262626"
                            : "#a3a3a3",
                        }}
                      >
                        {selectedCase?.trade_name || "Search or link…"}
                      </span>
                      {selectedCase?.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCaseChange(null);
                          }}
                          className="opacity-40 hover:opacity-80 transition-opacity text-neutral-500"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </button>

                    {caseOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-full z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                        <div className="p-2 border-b border-neutral-100">
                          <input
                            autoFocus
                            type="text"
                            value={caseQuery}
                            onChange={(e) => setCaseQuery(e.target.value)}
                            placeholder="Search cases…"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-none text-neutral-700 bg-neutral-50 border border-neutral-200 focus:border-neutral-400 placeholder:text-neutral-300"
                          />
                        </div>
                        <ul className="max-h-44 overflow-y-auto py-1">
                          {filteredCases.length === 0 && (
                            <li className="px-3 py-2 text-xs text-neutral-400">
                              No cases found
                            </li>
                          )}
                          {filteredCases.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  onCaseChange({
                                    id: String(c.id),
                                    trade_name: c.display,
                                  });
                                  setCaseOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors font-medium",
                                  selectedCase?.id === String(c.id)
                                    ? "bg-neutral-100 text-neutral-900"
                                    : "hover:bg-neutral-50 text-neutral-600",
                                )}
                              >
                                <span className="flex-1 truncate">
                                  {c.display}
                                </span>
                                {selectedCase?.id === String(c.id) && (
                                  <Check
                                    size={11}
                                    className="text-neutral-700"
                                  />
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 h-px bg-neutral-100" />

                {/* Documents */}
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <SideLabel>Documents</SideLabel>

                  {documents.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {documents.map((doc, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200"
                        >
                          <FileText
                            size={11}
                            className="text-neutral-400 flex-shrink-0"
                          />
                          <span className="flex-1 truncate">{doc.name}</span>
                          {onDocumentRemove && (
                            <button
                              type="button"
                              onClick={() => onDocumentRemove(doc)}
                              className="opacity-40 hover:opacity-80 transition-opacity"
                            >
                              <X size={9} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) =>
                      e.key === "Enter" && fileInputRef.current?.click()
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl w-full cursor-pointer transition-all select-none"
                    style={{
                      border: `2px dashed ${isDraggingOver ? "#6366f1" : "#d4d4d4"}`,
                      background: isDraggingOver ? "#eef2ff" : "#fafafa",
                      color: isDraggingOver ? "#4f46e5" : "#a3a3a3",
                    }}
                  >
                    <Upload
                      size={16}
                      style={{ color: isDraggingOver ? "#4f46e5" : "#d4d4d4" }}
                    />
                    <span className="text-[11px] font-semibold">
                      {isDraggingOver ? "Drop to upload" : "Drop file here"}
                    </span>
                    <span
                      className="text-[10px] font-normal"
                      style={{ color: "#c4c4c4" }}
                    >
                      or{" "}
                      <span
                        style={{
                          color: isDraggingOver ? "#4f46e5" : "#737373",
                        }}
                        className="underline underline-offset-2"
                      >
                        click to browse
                      </span>
                    </span>
                    <span className="text-[9px]" style={{ color: "#d4d4d4" }}>
                      PDF, PNG, JPG, GIF, WEBP
                    </span>
                  </div>

                  {documents.length > 0 && (
                    <p className="text-[10px] text-neutral-400">
                      {documents.length} file{documents.length !== 1 ? "s" : ""}{" "}
                      attached
                    </p>
                  )}
                </div>
              </div>
              {/* end grid */}
            </div>
            {/* end scroll container */}
          </div>
          {/* end sidebar */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
