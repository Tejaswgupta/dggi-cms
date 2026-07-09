import GlobalNav from "@/components/GlobalNav";
import createSupabaseServerClient from "@/lib/supabase/server";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

const ALLOWED_ROLES = ["ADG", "DD_INT"];

export default async function UsersLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin?redirectTo=/users");

  const { data: profile } = await supabase
    .from("votum_users")
    .select("dggi_role")
    .eq("id", user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.dggi_role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-full w-full">
      <GlobalNav />
      <div className="flex-1 min-w-0 overflow-y-auto h-full">{children}</div>
    </div>
  );
}
