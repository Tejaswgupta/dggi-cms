"use client";

import { signOut } from "@/auth/client";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  Brain,
  ClipboardList,
  FileSearch,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Paperclip,
  Scale,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const USERS_MGMT_ROLES = ["ADG", "DD_INT"];
const NOTIF_ROLES = ["SIO", "DD", "DD_INT", "IO"];
const INTEL_ROLES = ["ADG", "DD_INT", "SIO_INT"];

type SidebarItem = { href: string; label: string; icon: LucideIcon };

const DASHBOARD_ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
];

const REGISTER_ITEMS: SidebarItem[] = [
  {
    href: "/tasks/intelligence-allocation",
    label: "Intelligence Monitoring",
    icon: Brain,
  },
  {
    href: "/tasks/incident-report",
    label: "IR Register",
    icon: AlertTriangle,
  },
  {
    href: "/tasks/non-ir-view",
    label: "NON-IR Register",
    icon: AlertTriangle,
  },
  {
    href: "/tasks/arrest-register",
    label: "Arrest Register",
    icon: ClipboardList,
  },
  {
    href: "/tasks/provisional-attachment",
    label: "Provisional Attachment",
    icon: Paperclip,
  },

  { href: "/tasks/scn-register", label: "SCN Register", icon: FileSearch },
  {
    href: "/tasks/prosecution-register",
    label: "Prosecution Register",
    icon: Scale,
  },
  { href: "/tasks/closure-register", label: "Closure Register", icon: Archive },
  { href: "/tasks/alert-circular", label: "Alert Circular", icon: Bell },
  {
    href: "/tasks/modus-operandi",
    label: "Modus Operandi",
    icon: FlaskConical,
  },
];

const MONITORING_ITEMS: SidebarItem[] = [
  { href: "/tasks/mpr", label: "MPR", icon: BarChart3 },
];

const INVESTIGATION_ITEMS: SidebarItem[] = [
  {
    href: "/tasks/investigation-cases",
    label: "Investigation Cases",
    icon: ShieldAlert,
  },
];

const NAV_SECTIONS = [
  { label: "Dashboard", items: DASHBOARD_ITEMS },
  { label: "Investigation", items: INVESTIGATION_ITEMS },
  { label: "Registers", items: REGISTER_ITEMS },
  { label: "Monitoring & Compliance", items: MONITORING_ITEMS },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [dggiRole, setDggiRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = clientConnectionWithSupabase();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("votum_users")
        .select("dggi_role")
        .eq("id", user.id)
        .single();
      setDggiRole(data?.dggi_role ?? null);

      if (NOTIF_ROLES.includes(data?.dggi_role ?? "")) {
        const wid = await getWorkspaceId();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cutoffStr = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        const { data: groupRows } = await supabase
          .from("dggi_user_group_assignments")
          .select("group_name")
          .eq("user_id", user.id);
        const groups = (groupRows ?? []).map(
          (g: { group_name: string }) => g.group_name,
        );

        const isSIO = (data?.dggi_role ?? "") === "SIO";

        const [{ count: commentCount }, bySio, byGroup] = await Promise.all([
          supabase
            .from("dggi_notifications")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", wid)
            .eq("user_id", user.id)
            .eq("rule_id", "adg_comment")
            .eq("read", false),
          supabase
            .from("dggi_computed_deadlines")
            .select("id")
            .eq("workspace_id", wid)
            .eq("sio_user_id", user.id)
            .eq("skipped", false)
            .lte("deadline_date", cutoffStr),
          !isSIO && groups.length
            ? supabase
                .from("dggi_computed_deadlines")
                .select("id")
                .eq("workspace_id", wid)
                .eq("skipped", false)
                .lte("deadline_date", cutoffStr)
                .in("group_name", groups)
            : Promise.resolve({ data: [] as { id: string }[] | null }),
        ]);

        const deadlineIds = new Set<string>([
          ...((bySio as { data: { id: string }[] | null }).data ?? []).map(
            (r) => r.id,
          ),
          ...((byGroup as { data: { id: string }[] | null }).data ?? []).map(
            (r) => r.id,
          ),
        ]);

        setUnreadCount((commentCount ?? 0) + deadlineIds.size);
      }
    });
  }, []);

  const canManageUsers = USERS_MGMT_ROLES.includes(dggiRole ?? "");
  const showNotifications = NOTIF_ROLES.includes(dggiRole ?? "");
  const canSeeIntel = INTEL_ROLES.includes(dggiRole ?? "");

  const visibleDashboardItems = DASHBOARD_ITEMS.filter(
    (item) => item.href !== "/users" || canManageUsers,
  );

  const visibleInvestigationItems = [
    ...INVESTIGATION_ITEMS,
    ...(showNotifications
      ? [{ href: "/tasks/notifications", label: "Notifications", icon: Bell }]
      : []),
  ];

  const visibleNavSections = NAV_SECTIONS.map((section) => {
    if (section.label === "Dashboard")
      return { ...section, items: visibleDashboardItems };
    if (section.label === "Investigation")
      return { ...section, items: visibleInvestigationItems };
    if (section.label === "Registers")
      return {
        ...section,
        items: section.items.filter(
          (item) =>
            item.href !== "/tasks/intelligence-allocation" || canSeeIntel,
        ),
      };
    return section;
  });

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem("VotumUserDetails");
    router.push("/auth/signin");
  };

  return (
    <aside className="hidden md:flex flex-col w-[200px] shrink-0 border-r border-[#EDEDEA] bg-white h-full pt-5 pb-4 px-2 overflow-y-auto">
      <div className="flex-1">
        {visibleNavSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 pb-2 text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                const isNotif = item.href === "/tasks/notifications";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                      active
                        ? "bg-[#EEF2FF] text-[#4A5FD4] font-medium"
                        : "text-[#6b6b6b] hover:bg-[#F3F2EF] hover:text-[#1a1a1a]"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Icon size={15} />
                      {isNotif && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold leading-none">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="truncate flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#EDEDEA] pt-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#6b6b6b] transition-all hover:bg-[#FEF2F2] hover:text-[#EF4444]"
        >
          <LogOut size={15} className="shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
