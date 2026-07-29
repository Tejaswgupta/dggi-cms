import createSupabaseServerClient from "@/lib/supabase/server";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

export default async function IntelligenceAllocationLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin?redirectTo=/tasks/intelligence-allocation");

  return <>{children}</>;
}
