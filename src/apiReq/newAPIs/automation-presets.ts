import clientConnectionWithSupabase from "@/lib/supabase/client";

type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
};

type PresetUser = {
  id: string;
  deadline_days?: number;
};

type PresetWithUsers = {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  created_at: string;
  last_updated_time: string;
  last_updated_by: string;
  has_deadlines: boolean;
  users: (WorkspaceUser & { deadline_days?: number })[];
};

// Helper function to get user and workspace
const getUserAndWorkspace = async (supabase) => {
  const userDataRes = await supabase.auth.getUser();
  if (userDataRes.error) throw new Error("User not logged in");

  const workspaceRes = await supabase
    .from("votum_users")
    .select("workspace_id")
    .eq("id", userDataRes.data.user.id)
    .single();

  if (workspaceRes.error) throw new Error(workspaceRes.error.message);

  return {
    userId: userDataRes.data.user.id,
    workspaceId: workspaceRes.data.workspace_id
  };
};

export const saveAutomationPreset = async (formData: FormData) => {
  const supabase = clientConnectionWithSupabase();
  
  try {
    const { userId, workspaceId } = await getUserAndWorkspace(supabase);
    const presetName = formData.get("preset_name") as string;
    const presetDescription = formData.get("preset_description") as string;
    const users = JSON.parse(formData.get("users") as string) as PresetUser[];
    const hasDeadlines = formData.get("has_deadlines") === "true";
    
    const { data: existingPreset } = await supabase
      .from("automation_presets")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", presetName)
      .maybeSingle();

    if (existingPreset) {
      throw new Error("A preset with this name already exists");
    }

    // Create preset with transaction
    const { data: preset, error: presetError } = await supabase.from("automation_presets")
      .insert({
        name: presetName,
        description: presetDescription,
        workspace_id: workspaceId,
        has_deadlines: hasDeadlines,
        created_at: new Date().toISOString(),
        last_updated_time: new Date().toISOString(),
        last_updated_by: userId,
      })
      .select()
      .single();

    if (presetError) throw presetError;

    const uniqueUsers = [...new Set(users.map(u => u.id))];
    const hierarchyData = uniqueUsers.map((userId, idx) => ({
      preset_id: preset.id,
      hierarchy_id: preset.id,
      user_id: userId,
      rank: idx + 1,
      deadline_days: users[idx].deadline_days || null,
      created_at: new Date().toISOString(),
      last_updated_time: new Date().toISOString(),
      last_updated_by: userId,
    }));

    const { error: hierarchyError } = await supabase
      .from("automation_presets_hierarchy")
      .insert(hierarchyData);

    if (hierarchyError) {
      await supabase
        .from("automation_presets")
        .delete()
        .eq("id", preset.id);
      throw hierarchyError;
    }

    return { success: true, data: preset };
  } catch (error) {
    console.error("Error saving preset:", error);
    return { success: false, message: error.message };
  }
};

export const getWorkspacePresets = async (): Promise<{ 
  success: boolean; 
  data?: PresetWithUsers[];
  message?: string; 
}> => {
  const supabase = clientConnectionWithSupabase();
  
  try {
    const { workspaceId } = await getUserAndWorkspace(supabase);
    
    const { data: presets, error: presetsError } = await supabase
      .from("automation_presets")
      .select(`
        *,
        automation_presets_hierarchy!inner (
          user_id,
          rank,
          deadline_days,
          votum_users!votum_hierarchy_user_mapping_user_id_fkey (
            id,
            name,
            email,
            avatar_url
          )
        )
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    
    if (presetsError) throw presetsError;

    const formattedPresets: PresetWithUsers[] = presets.map(preset => ({
      ...preset,
      users: preset.automation_presets_hierarchy
        .sort((a, b) => a.rank - b.rank)
        .map(({ votum_users, deadline_days }) => ({
          id: votum_users.id,
          name: votum_users.name,
          email: votum_users.email,
          avatar_url: votum_users.avatar_url,
          deadline_days: deadline_days || undefined
        }))
    }));
    
    return { success: true, data: formattedPresets };
  } catch (error) {
    console.error("Error fetching presets:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};