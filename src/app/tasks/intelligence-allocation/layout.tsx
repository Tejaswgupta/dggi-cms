import createSupabaseServerClient from "@/lib/supabase/server";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

const BLOCKED_ROLES = ["DD_REPORTS"];

export default async function IntelligenceAllocationLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin?redirectTo=/tasks/intelligence-allocation");

  const { data: profile } = await supabase
    .from("votum_users")
    .select("dggi_role")
    .eq("id", user.id)
    .single();

  if (profile && BLOCKED_ROLES.includes(profile.dggi_role)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
