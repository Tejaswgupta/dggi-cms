import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import createSupabaseServerClient from "@/lib/supabase/server";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  // Verify the caller is ADG
  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await userClient
    .from("votum_users")
    .select("dggi_role, workspace_id")
    .eq("id", user.id)
    .single();

  if (profile?.dggi_role !== "ADG") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = adminClient();

  // Fetch votum_users for this workspace
  const { data: workspaceUsers, error: usersErr } = await admin
    .from("votum_users")
    .select("id, name, email, dggi_role, designation")
    .eq("workspace_id", profile.workspace_id)
    .order("name");

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  // Fetch auth.users for last_sign_in_at
  const userIds = (workspaceUsers ?? []).map((u) => u.id);
  const { data: authUsersPage, error: authErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  const authMap = new Map<string, string | null>();
  for (const au of authUsersPage.users) {
    authMap.set(au.id, au.last_sign_in_at ?? null);
  }

  const result = (workspaceUsers ?? [])
    .filter((u) => userIds.includes(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      dggi_role: u.dggi_role,
      designation: u.designation,
      last_sign_in_at: authMap.get(u.id) ?? null,
    }));

  return NextResponse.json({ users: result });
}
