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
  MessageSquare,
  Package,
  Paperclip,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import RecordHighlighter from "./RecordHighlighter";

const REGISTER_ITEMS = [
  {
    href: "/home/tasks/intelligence-allocation",
    label: "Intelligence Monitoring",
    icon: Brain,
  },
  // {
  //   href: "/home/tasks/non-ir-register",
  //   label: "NON-IR Cases",
  //   icon: BookOpen,
  // },
  {
    href: "/home/tasks/incident-report",
    label: "Incident Report",
    icon: AlertTriangle,
  },
  {
    href: "/home/tasks/arrest-register",
    label: "Arrest Register",
    icon: ClipboardList,
  },
  {
    href: "/home/tasks/provisional-attachment",
    label: "Provisional Attachment",
    icon: Paperclip,
  },
  { href: "/home/tasks/alert-circular", label: "Alert Circular", icon: Bell },
  { href: "/home/tasks/scn-register", label: "SCN Register", icon: FileSearch },
  {
    href: "/home/tasks/prosecution-register",
    label: "Prosecution Register",
    icon: Scale,
  },
  {
    href: "/home/tasks/closure-register",
    label: "Closure Register",
    icon: Archive,
  },
  // { href: "/home/tasks/str-register", label: "STR", icon: FileWarning },
  {
    href: "/home/tasks/modus-operandi",
    label: "Modus Operandi",
    icon: FlaskConical,
  },
  // {
  //   href: "/home/tasks/seizure-register",
  //   label: "Seizure Register",
  //   icon: Lock,
  // },
];

const MONITORING_ITEMS = [
  { href: "/home/tasks/cpgram", label: "CPGRAM", icon: MessageSquare },
  { href: "/home/tasks/informer-reward", label: "Informer Reward", icon: Gift },
  { href: "/home/tasks/dfl-register", label: "DFL", icon: HardDrive },
  {
    href: "/home/tasks/report-compliance",
    label: "Report Compliance",
    icon: ClipboardCheck,
  },
  { href: "/home/tasks/evidence-room", label: "Evidence Room", icon: Package },
];

type SidebarItem = { href: string; label: string; icon: LucideIcon };

function SecondaryNav({
  items,
  label,
}: {
  items: SidebarItem[];
  label: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-[200px] shrink-0 border-r border-[#EDEDEA] bg-white h-full pt-5 pb-4 px-2 gap-0.5 overflow-y-auto">
      <p className="px-3 pb-2 text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">
        {label}
      </p>
      {items.map((item) => {
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
    </aside>
  );
}

export default function TasksLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isRegister = REGISTER_ITEMS.some((item) =>
    pathname.startsWith(item.href),
  );
  const isMonitoring = MONITORING_ITEMS.some((item) =>
    pathname.startsWith(item.href),
  );

  if (isRegister || isMonitoring) {
    return (
      <div className="flex h-full w-full">
        <Suspense>
          <RecordHighlighter />
        </Suspense>
        <SecondaryNav
          items={isRegister ? REGISTER_ITEMS : MONITORING_ITEMS}
          label={isRegister ? "Registers" : "Monitoring & Compliance"}
        />
        <div className="flex-1 min-w-0 overflow-y-auto h-full">{children}</div>
      </div>
    );
  }

  return (
    <>
      <Suspense>
        <RecordHighlighter />
      </Suspense>
      {children}
    </>
  );
}
