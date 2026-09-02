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
    .select("id, name, email, dggi_role, designation, last_activity_at")
    .eq("workspace_id", profile.workspace_id)
    .order("name");

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  const result = (workspaceUsers ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    dggi_role: u.dggi_role,
    designation: u.designation,
    last_activity_at: u.last_activity_at,
  }));

  return NextResponse.json({ users: result });
}

export async function POST() {
  const userClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await adminClient()
    .from("votum_users")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
