"use server";

import { createClient } from "@supabase/supabase-js";
import createSupabaseServerClient from "@/lib/supabase/server";

const DEFAULT_PASSWORD = "Dggi@1234";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function addUserAction(params: {
  name: string;
  email: string;
  dggi_role: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user: caller },
    } = await serverClient.auth.getUser();
    if (!caller) return { success: false, error: "Unauthorized" };

    const { data: callerProfile } = await serverClient
      .from("votum_users")
      .select("dggi_role")
      .eq("id", caller.id)
      .single();

    if (!["ADG", "DD_INT"].includes(callerProfile?.dggi_role ?? "")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const { data: callerUser } = await serverClient
      .from("votum_users")
      .select("workspace_id")
      .eq("id", caller.id)
      .single();
    const workspace_id = callerUser?.workspace_id ?? caller.user_metadata?.workspace_id;
    if (!workspace_id) return { success: false, error: "No workspace found" };

    const admin = adminClient();

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: params.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name: params.name, workspace_id },
      });

    if (authError) return { success: false, error: authError.message };

    const { data: profileData, error: profileError } = await admin
      .from("votum_users")
      .insert({
        id: authData.user.id,
        name: params.name,
        email: params.email,
        dggi_role: params.dggi_role || null,
        workspace_id,
        role: "member",
      })
      .select()
      .single();

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: profileError.message };
    }

    return { success: true, data: profileData };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add user" };
  }
}
