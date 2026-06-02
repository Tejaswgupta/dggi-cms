import GlobalNav from "@/components/GlobalNav";
import { Suspense, type ReactNode } from "react";
import RecordHighlighter from "@/app/tasks/RecordHighlighter";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full">
      <Suspense>
        <RecordHighlighter />
      </Suspense>
      <GlobalNav />
      <div className="flex-1 min-w-0 overflow-y-auto h-full">{children}</div>
    </div>
  );
}
