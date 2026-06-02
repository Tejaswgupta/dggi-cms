"use client";

import clientConnectionWithSupabase from "@/lib/supabase/client";

export type FieldType = "text" | "date" | "number" | "select" | "boolean";

export type TaskCustomField = {
  label: string;
  type: FieldType;
  /** Only used when type === "select" */
  options?: string[];
};

export type TaskCustomFieldTemplate = {
  id: string;
  name: string;
  fields: TaskCustomField[];
  workspace_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

const getWorkspaceId = () => {
  const userDetails = localStorage.getItem("VotumUserDetails");
  if (!userDetails) return null;
  try {
    const parsed = JSON.parse(userDetails);
    return parsed?.workspace_id ?? null;
  } catch {
    return null;
  }
};

export const getTaskCustomFieldTemplates = async () => {
  const supabase = clientConnectionWithSupabase();
  const workspaceId = getWorkspaceId();

  if (!workspaceId) {
    return { success: false, error: "Workspace not found" };
  }

  try {
    const { data, error } = await supabase
      .from("votum_task_custom_field_templates")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, data: (data || []) as TaskCustomFieldTemplate[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createTaskCustomFieldTemplate = async (payload: {
  name: string;
  fields: TaskCustomField[];
}) => {
  const supabase = clientConnectionWithSupabase();
  const workspaceId = getWorkspaceId();

  if (!workspaceId) {
    return { success: false, error: "Workspace not found" };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("votum_task_custom_field_templates")
      .insert([
        {
          workspace_id: workspaceId,
          name: payload.name,
          fields: payload.fields,
          created_by: user?.id ?? null,
        },
      ])
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data: data as TaskCustomFieldTemplate };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateTaskCustomFieldTemplate = async (
  templateId: string,
  payload: { name: string; fields: TaskCustomField[] },
) => {
  const supabase = clientConnectionWithSupabase();
  const workspaceId = getWorkspaceId();

  if (!workspaceId) {
    return { success: false, error: "Workspace not found" };
  }

  try {
    const { data, error } = await supabase
      .from("votum_task_custom_field_templates")
      .update({
        name: payload.name,
        fields: payload.fields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data: data as TaskCustomFieldTemplate };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteTaskCustomFieldTemplate = async (templateId: string) => {
  const supabase = clientConnectionWithSupabase();
  const workspaceId = getWorkspaceId();

  if (!workspaceId) {
    return { success: false, error: "Workspace not found" };
  }

  try {
    const { error } = await supabase
      .from("votum_task_custom_field_templates")
      .delete()
      .eq("id", templateId)
      .eq("workspace_id", workspaceId);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/** Save custom field values onto a task (merges into existing custom_fields JSONB) */
export const updateTaskCustomFields = async (
  taskId: string,
  customFields: Record<string, string>,
) => {
  const supabase = clientConnectionWithSupabase();

  try {
    const { data, error } = await supabase
      .from("votum_tasks")
      .update({ custom_fields: customFields })
      .eq("id", taskId)
      .select("custom_fields")
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
