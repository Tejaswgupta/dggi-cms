"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  Bell,
  Brain,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  FlaskConical,
  Gift,
  HardDrive,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Paperclip,
  Scale,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/auth/client";

type SidebarItem = { href: string; label: string; icon: LucideIcon };

const DASHBOARD_ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const REGISTER_ITEMS: SidebarItem[] = [
  { href: "/tasks/intelligence-allocation", label: "Intelligence Monitoring", icon: Brain },
  { href: "/tasks/incident-report", label: "Incident Report", icon: AlertTriangle },
  { href: "/tasks/arrest-register", label: "Arrest Register", icon: ClipboardList },
  { href: "/tasks/provisional-attachment", label: "Provisional Attachment", icon: Paperclip },
  { href: "/tasks/alert-circular", label: "Alert Circular", icon: Bell },
  { href: "/tasks/scn-register", label: "SCN Register", icon: FileSearch },
  { href: "/tasks/prosecution-register", label: "Prosecution Register", icon: Scale },
  { href: "/tasks/closure-register", label: "Closure Register", icon: Archive },
  { href: "/tasks/modus-operandi", label: "Modus Operandi", icon: FlaskConical },
];

const MONITORING_ITEMS: SidebarItem[] = [
  { href: "/tasks/cpgram", label: "CPGRAM", icon: MessageSquare },
  { href: "/tasks/informer-reward", label: "Informer Reward", icon: Gift },
  { href: "/tasks/dfl-register", label: "DFL", icon: HardDrive },
  { href: "/tasks/report-compliance", label: "Report Compliance", icon: ClipboardCheck },
  { href: "/tasks/evidence-room", label: "Evidence Room", icon: Package },
];

const INVESTIGATION_ITEMS: SidebarItem[] = [
  { href: "/tasks/investigation-cases", label: "Investigation Cases", icon: ShieldAlert },
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

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem("VotumUserDetails");
    router.push("/auth/signin");
  };

  return (
    <aside className="hidden md:flex flex-col w-[200px] shrink-0 border-r border-[#EDEDEA] bg-white h-full pt-5 pb-4 px-2 overflow-y-auto">
      <div className="flex-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 pb-2 text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
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
                    <Icon size={15} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
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
