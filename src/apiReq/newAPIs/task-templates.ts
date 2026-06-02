import clientConnectionWithSupabase from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/action/workspace";

export interface TaskTemplate {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  content: string;
  workspace_id: string;
  created_by: string;
}

export async function getTaskTemplatesForWorkspace(): Promise<{
  success: boolean;
  data: TaskTemplate[];
  error?: string;
}> {
  try {
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) return { success: false, data: [], error: "No workspace" };

    const supabase = clientConnectionWithSupabase();
    const { data, error } = await supabase
      .from("task_templates")
      .select("id, created_at, updated_at, name, description, content, workspace_id, created_by")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}
