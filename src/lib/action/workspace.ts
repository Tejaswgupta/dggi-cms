import checkUserAuthClient from "@/auth/getUserSession";
import clientConnectionWithSupabase from "../supabase/client";

export const getWorkspaceId = async () => {
  const supabase = clientConnectionWithSupabase();

  const { data: session, error }: any = await supabase.auth.getSession();
  let workspaceId = session?.session?.user?.user_metadata?.workspace_id;

  // If workspaceId is not present in user_metadata, fetch it from votum_users. Fallback if something is not working
  if (!workspaceId) {
    const userDataRes = await supabase.auth.getUser();
    if (userDataRes.error) {
      console.log("User not logged in");
    } else if (!userDataRes.data.user) {
      console.log("User data not found");
    } else {
      const workspaceRes = await supabase
        .from("votum_users")
        .select("workspace_id")
        .eq("id", userDataRes.data.user.id)
        .single();
      if (workspaceRes.error) {
        console.log("Workspace error");
      } else {
        workspaceId = workspaceRes.data.workspace_id;
      }
    }
  }

  return workspaceId;
};

export const getWorkspaceName = async () => {
  const supabase = clientConnectionWithSupabase();
  const workspace_id = await getWorkspaceId();
  const { data, error }: any = await supabase
    .from("votum_workspace")
    .select("name")
    .eq("id", workspace_id);

  return data?.length > 0 ? data[0].name : "";
};

export const getUserId = async () => {
  const { data: session }: any = await checkUserAuthClient();

  const user_id = session?.session?.user?.id;

  return user_id;
};

export const getWorkspaceQuota = async () => {
  const supabase = clientConnectionWithSupabase();
  const workspace_id = await getWorkspaceId();

  if (!workspace_id) {
    return { quota: 0 };
  }

  const { data, error } = await supabase
    .from("votum_workspace")
    .select("quota")
    .eq("id", workspace_id)
    .single();

  if (error) {
    console.error("Error fetching workspace quota:", error);
    return { quota: 0 };
  }

  return { quota: data?.quota || 0 };
};

export const updateWorkspaceQuota = async (usedAmount: number) => {
  const supabase = clientConnectionWithSupabase();
  const workspace_id = await getWorkspaceId();

  if (!workspace_id) {
    throw new Error("Workspace not found");
  }

  // Get current quota first
  const { data: currentData } = await supabase
    .from("votum_workspace")
    .select("quota")
    .eq("id", workspace_id)
    .single();

  const currentQuota = currentData?.quota || 0;
  const newQuota = Math.max(0, currentQuota - usedAmount);

  // Update quota
  const { error } = await supabase
    .from("votum_workspace")
    .update({ quota: newQuota })
    .eq("id", workspace_id);

  if (error) {
    console.error("Error updating workspace quota:", error);
    throw error;
  }
};
