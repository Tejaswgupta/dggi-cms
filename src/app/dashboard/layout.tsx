"use client";

import GlobalNav from "@/components/GlobalNav";
import { type ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full">
      <GlobalNav />
      <div className="flex-1 min-w-0 overflow-y-auto h-full">{children}</div>
    </div>
  );
}
