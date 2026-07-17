"use client";

import { Button } from "@/components/ui/button";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { differenceInCalendarDays, format, formatDistanceToNow, parseISO } from "date-fns";
import { Bell, CalendarClock, Check, CheckCheck, ExternalLink, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Urgency = "expired" | "critical" | "warning";

interface CommentNotif {
  kind: "adg_comment";
  id: string;
  record_id: string;
  label: string;
  legal_reference: string | null;
  created_at: string;
  read: boolean;
  source_table: string;
}

interface AllocationNotif {
  kind: "allocation";
  id: string;
  record_id: string;
  label: string;
  legal_reference: string | null;
  created_at: string;
  read: boolean;
  source_table: string;
}

interface DeadlineNotif {
  kind: "deadline";
  id: string;
  record_id: string;
  label: string;
  legal_reference: string | null;
  deadline_date: string;
  source_table: string;
}

type Notif = CommentNotif | DeadlineNotif | AllocationNotif;

type TabFilter = "all" | "unread" | "adg_comment" | "deadline" | "allocation";

const TAB_OPTIONS: { value: TabFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "adg_comment", label: "ADG Comments" },
  { value: "deadline", label: "Deadlines" },
  { value: "allocation", label: "Allocations" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TABLE_HREF: Record<string, string> = {
  dggi_records: "/tasks/investigation-cases",
  dggi_scn_records: "/tasks/scn-register",
  dggi_provisional_attachment_records: "/tasks/provisional-attachment",
  dggi_prosecution_arrest_records: "/tasks/prosecution-register",
  dggi_prosecution_non_arrest_records: "/tasks/prosecution-register",
  dggi_seizure_records: "/tasks/seizure-register",
  dggi_intel_rapid_records: "/tasks/intelligence-allocation",
  dggi_intel_other_source_records: "/tasks/intelligence-allocation",
  dggi_str_records: "/tasks/intelligence-allocation",
  dggi_dfl_records: "/tasks/dfl-register",
};

function notifHref(n: Notif): string {
  const base = TABLE_HREF[n.source_table] ?? "/tasks/investigation-cases";
  if (n.source_table === "dggi_records")
    return `${base}?caseId=${encodeURIComponent(n.record_id)}`;
  return `${base}?highlight=${encodeURIComponent(n.record_id)}`;
}

function liveDaysUntil(deadline_date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(parseISO(deadline_date), today);
}

function urgencyOf(days: number): Urgency {
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  return "warning";
}

const URGENCY_PILL: Record<Urgency, string> = {
  expired: "bg-red-100 text-red-700",
  critical: "bg-orange-100 text-orange-700",
  warning: "bg-amber-100 text-amber-700",
};

// ─── Row components ────────────────────────────────────────────────────────────

function DeadlineTag({ deadline_date }: { deadline_date: string }) {
  const days = liveDaysUntil(deadline_date);
  const urgency = urgencyOf(days);
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCY_PILL[urgency]}`}>
      {label}
    </span>
  );
}

function NotificationRow({
  n,
  onMarkRead,
}: {
  n: Notif;
  onMarkRead: (id: string) => void;
}) {
  const isComment = n.kind === "adg_comment";
  const isAllocation = n.kind === "allocation";
  const isUnread = n.kind === "deadline" ? false : !(n as CommentNotif | AllocationNotif).read;
  const href = notifHref(n);

  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 transition-all ${
        isUnread ? "bg-[#FAFBFF]" : "bg-white hover:bg-[#FAFAF9]"
      }`}
    >
      <div className="mt-2.5 shrink-0">
        <span className={`block h-2 w-2 rounded-full ${isUnread ? "bg-[#4A5FD4]" : "bg-transparent"}`} />
      </div>

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isComment ? "bg-[#EEF2FF]" : isAllocation ? "bg-[#F0FDF4]" : "bg-[#FFF7ED]"
        }`}
      >
        {isComment ? (
          <MessageSquare size={16} className="text-[#4A5FD4]" />
        ) : isAllocation ? (
          <Share2 size={16} className="text-[#16A34A]" />
        ) : (
          <CalendarClock size={16} className="text-[#D97706]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-base leading-snug ${isUnread ? "text-[#1a1a1a] font-medium" : "text-[#3a3a3a]"}`}>
          {n.label}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {n.record_id && (
            <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-medium text-[#4A5FD4]">
              {n.record_id}
            </span>
          )}
          {n.kind === "deadline" && (
            <DeadlineTag deadline_date={(n as DeadlineNotif).deadline_date} />
          )}
          <span
            className="text-xs text-[#9a9a96]"
            title={
              n.kind === "deadline"
                ? format(parseISO((n as DeadlineNotif).deadline_date), "dd MMM yyyy")
                : format(parseISO((n as CommentNotif | AllocationNotif).created_at), "dd MMM yyyy, HH:mm")
            }
          >
            {n.kind === "deadline"
              ? `Due ${format(parseISO((n as DeadlineNotif).deadline_date), "dd MMM yyyy")}`
              : formatDistanceToNow(parseISO((n as CommentNotif | AllocationNotif).created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 mt-1">
        <Link
          href={href}
          onClick={() => (isComment || isAllocation) && isUnread && onMarkRead(n.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9a9a96] hover:bg-[#EEF2FF] hover:text-[#4A5FD4] transition-all"
          title="Open"
        >
          <ExternalLink size={13} />
        </Link>
        {(isComment || isAllocation) && isUnread && (
          <button
            onClick={() => onMarkRead(n.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9a9a96] hover:bg-[#EEF2FF] hover:text-[#4A5FD4] transition-all"
            title="Mark as read"
          >
            <Check size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NotificationsComponent() {
  const supabase = clientConnectionWithSupabase();
  const [comments, setComments] = useState<CommentNotif[]>([]);
  const [allocations, setAllocations] = useState<AllocationNotif[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id ?? "";

      // Fetch user's role and group memberships
      const [{ data: profileRow }, { data: groupRows }] = await Promise.all([
        supabase.from("votum_users").select("dggi_role").eq("id", uid).single(),
        supabase.from("dggi_user_group_assignments").select("group_name").eq("user_id", uid),
      ]);
      const role = (profileRow as { dggi_role: string } | null)?.dggi_role ?? "";
      const groups = (groupRows ?? []).map((g: { group_name: string }) => g.group_name);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDaysAhead = 60; // only surface deadlines within 60 days or already overdue
      const cutoffDate = new Date(today);
      cutoffDate.setDate(cutoffDate.getDate() + maxDaysAhead);

      // ADG comment notifications — per-user rows in dggi_notifications
      const commentQuery = supabase
        .from("dggi_notifications")
        .select("id,record_id,label,legal_reference,created_at,read,source_table")
        .eq("workspace_id", wid)
        .eq("user_id", uid)
        .eq("rule_id", "adg_comment")
        .order("created_at", { ascending: false })
        .limit(200);

      const allocationQuery = supabase
        .from("dggi_notifications")
        .select("id,record_id,label,legal_reference,created_at,read,source_table")
        .eq("workspace_id", wid)
        .eq("user_id", uid)
        .eq("rule_id", "allocation")
        .order("created_at", { ascending: false })
        .limit(200);

      // Deadline rows from dggi_computed_deadlines — single shared table, filter by recipient.
      // SIOs only see their own cases (sio_user_id). Other roles also see group-level deadlines.
      const cutoffStr = cutoffDate.toISOString().slice(0, 10);
      const isSIO = role === "SIO";

      const [commentRes, allocationRes, bySioRes, byGroupRes] = await Promise.all([
        commentQuery,
        allocationQuery,
        supabase
          .from("dggi_computed_deadlines")
          .select("id,record_id,label,legal_reference,deadline_date,source_table")
          .eq("workspace_id", wid)
          .eq("skipped", false)
          .lte("deadline_date", cutoffStr)
          .eq("sio_user_id", uid),
        !isSIO && groups.length
          ? supabase
              .from("dggi_computed_deadlines")
              .select("id,record_id,label,legal_reference,deadline_date,source_table")
              .eq("workspace_id", wid)
              .eq("skipped", false)
              .lte("deadline_date", cutoffStr)
              .in("group_name", groups)
          : Promise.resolve({ data: [] as Record<string, string>[] | null }),
      ]);

      type NotifRow = { id: string; record_id: string; label: string; legal_reference: string | null; created_at: string; read: boolean; source_table: string };
      setComments(
        ((commentRes.data ?? []) as NotifRow[]).map((r) => ({ kind: "adg_comment" as const, ...r })),
      );
      setAllocations(
        ((allocationRes.data ?? []) as NotifRow[]).map((r) => ({ kind: "allocation" as const, ...r })),
      );

      // Merge SIO + group deadline rows, dedup by id
      const seen = new Set<string>();
      const merged: DeadlineNotif[] = [];
      for (const row of [...(bySioRes.data ?? []), ...((byGroupRes as { data: unknown[] | null }).data ?? [])]) {
        const r = row as { id: string; record_id: string; label: string; legal_reference: string | null; deadline_date: string; source_table: string };
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        merged.push({ kind: "deadline", id: r.id, record_id: r.record_id, label: r.label, legal_reference: r.legal_reference, deadline_date: r.deadline_date, source_table: r.source_table });
      }
      // Sort: expired → critical → warning, then by deadline_date asc
      merged.sort((a, b) => {
        const da = liveDaysUntil(a.deadline_date), db = liveDaysUntil(b.deadline_date);
        const ua = urgencyOf(da), ub = urgencyOf(db);
        const rank = { expired: 0, critical: 1, warning: 2 };
        if (rank[ua] !== rank[ub]) return rank[ua] - rank[ub];
        return da - db;
      });
      setDeadlines(merged);
      setLoading(false);
    };
    init();
  }, []);

  const markRead = async (id: string) => {
    setComments((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setAllocations((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("dggi_notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    const unreadIds = [
      ...comments.filter((n) => !n.read).map((n) => n.id),
      ...allocations.filter((n) => !n.read).map((n) => n.id),
    ];
    if (!unreadIds.length) return;
    setMarkingAll(true);
    setComments((prev) => prev.map((n) => ({ ...n, read: true })));
    setAllocations((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("dggi_notifications").update({ read: true }).in("id", unreadIds);
    setMarkingAll(false);
  };

  const unreadComments = comments.filter((n) => !n.read).length;
  const unreadAllocations = allocations.filter((n) => !n.read).length;
  const unreadDeadlines = deadlines.length;
  const unreadTotal = unreadComments + unreadAllocations;

  const tabCounts: Record<TabFilter, number> = {
    all: unreadTotal + unreadDeadlines,
    unread: unreadTotal,
    adg_comment: unreadComments,
    deadline: unreadDeadlines,
    allocation: unreadAllocations,
  };

  const allNotifs: Notif[] = [
    ...comments,
    ...allocations,
    ...deadlines,
  ].sort((a, b) => {
    const getTs = (n: Notif) =>
      n.kind === "deadline" ? n.deadline_date : n.created_at;
    return getTs(b).localeCompare(getTs(a));
  });

  const filtered = allNotifs.filter((n) => {
    if (tab === "unread") return n.kind !== "deadline" && !(n as CommentNotif | AllocationNotif).read;
    if (tab === "adg_comment") return n.kind === "adg_comment";
    if (tab === "deadline") return n.kind === "deadline";
    if (tab === "allocation") return n.kind === "allocation";
    return true;
  });

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
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a] flex items-center gap-2">
                <Bell size={18} className="text-[#4A5FD4]" />
                Notifications
              </h1>
              <p className="text-base text-[#9a9a96] mt-0.5">
                {(unreadTotal + unreadDeadlines) > 0 ? `${unreadTotal + unreadDeadlines} requiring attention` : "All caught up"}
              </p>
            </div>
            {(unreadComments > 0 || unreadAllocations > 0) && (
              <Button
                size="sm"
                variant="outline"
                disabled={markingAll}
                onClick={markAllRead}
                className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4"
              >
                <CheckCheck size={14} className="mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-[#EDEDEA]">
          {TAB_OPTIONS.map((t) => {
            const count = tabCounts[t.value];
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-base border-b-2 transition-all -mb-px ${
                  tab === t.value
                    ? "border-[#4A5FD4] text-[#4A5FD4] font-medium"
                    : "border-transparent text-[#6b6b6b] hover:text-[#1a1a1a]"
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#4A5FD4] px-1.5 text-xs text-white font-medium">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden divide-y divide-[#EDEDEA]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F2EF]">
                <Bell size={20} className="text-[#9a9a96]" />
              </div>
              <p className="text-base text-[#9a9a96]">No notifications here</p>
            </div>
          ) : (
            filtered.map((n) => <NotificationRow key={n.id} n={n} onMarkRead={markRead} />)
          )}
        </div>
      </div>
    </div>
  );
}
