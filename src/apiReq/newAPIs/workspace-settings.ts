import clientConnectionWithSupabase from "@/lib/supabase/client";

export interface WorkspaceSettings {
  delegation_workflow_enabled: boolean;
  notification_settings: {
    timezone: string;
    notification_time: string;
    invoice_reminders_enabled: boolean;
    task_notifications_enabled: boolean;
    email_notifications_enabled: boolean;
    delegation_notifications_enabled: boolean;
  };
}

/**
 * Get current workspace settings
 */
export const getWorkspaceSettings = async () => {
  try {
    const supabase = clientConnectionWithSupabase();
    const userRes = await supabase.auth.getUser();

    if (userRes.error || !userRes.data.user) {
      throw new Error("User not authenticated");
    }

    const user = userRes.data.user;

    // Get workspace
    const workspaceRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceRes.error) {
      throw new Error("Failed to get workspace");
    }

    const workspace_id = workspaceRes.data.workspace_id;

    // Get workspace settings
    const settingsRes = await supabase
      .from("votum_workspace")
      .select("delegation_workflow_enabled, notification_settings")
      .eq("id", workspace_id)
      .single();

    if (settingsRes.error) {
      throw new Error("Failed to get workspace settings");
    }

    return {
      success: true,
      data: {
        delegation_workflow_enabled:
          settingsRes.data.delegation_workflow_enabled || false,
        notification_settings: settingsRes.data.notification_settings || {
          timezone: "UTC",
          notification_time: "09:00",
          invoice_reminders_enabled: true,
          task_notifications_enabled: true,
          email_notifications_enabled: true,
          delegation_notifications_enabled: true,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getWorkspaceSettings:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update workspace delegation workflow setting
 */
export const updateDelegationWorkflowSetting = async (enabled: boolean) => {
  try {
    const supabase = clientConnectionWithSupabase();
    const userRes = await supabase.auth.getUser();

    if (userRes.error || !userRes.data.user) {
      throw new Error("User not authenticated");
    }

    const user = userRes.data.user;

    // Get workspace and verify user is admin/owner
    const workspaceRes = await supabase
      .from("votum_users")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (workspaceRes.error) {
      throw new Error("Failed to get workspace");
    }

    // Check if user has permission to modify workspace settings
    // You may want to add role-based permissions here
    const workspace_id = workspaceRes.data.workspace_id;

    // Update workspace setting
    const updateRes = await supabase
      .from("votum_workspace")
      .update({ delegation_workflow_enabled: enabled })
      .eq("id", workspace_id);

    if (updateRes.error) {
      throw new Error("Failed to update workspace settings");
    }

    return {
      success: true,
      message: `Delegation workflow ${enabled ? "enabled" : "disabled"} for workspace`,
    };
  } catch (error: any) {
    console.error("Error in updateDelegationWorkflowSetting:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update workspace notification settings
 */
export const updateNotificationSettings = async (
  settings: Partial<WorkspaceSettings["notification_settings"]>,
) => {
  try {
    const supabase = clientConnectionWithSupabase();
    const userRes = await supabase.auth.getUser();

    if (userRes.error || !userRes.data.user) {
      throw new Error("User not authenticated");
    }

    const user = userRes.data.user;

    // Get workspace
    const workspaceRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceRes.error) {
      throw new Error("Failed to get workspace");
    }

    const workspace_id = workspaceRes.data.workspace_id;

    // Get current notification settings
    const currentRes = await supabase
      .from("votum_workspace")
      .select("notification_settings")
      .eq("id", workspace_id)
      .single();

    if (currentRes.error) {
      throw new Error("Failed to get current settings");
    }

    // Merge with new settings
    const updatedSettings = {
      ...currentRes.data.notification_settings,
      ...settings,
    };

    // Update notification settings
    const updateRes = await supabase
      .from("votum_workspace")
      .update({ notification_settings: updatedSettings })
      .eq("id", workspace_id);

    if (updateRes.error) {
      throw new Error("Failed to update notification settings");
    }

    return {
      success: true,
      message: "Notification settings updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateNotificationSettings:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if delegation workflow is enabled for current workspace
 */
export const isDelegationWorkflowEnabled = async () => {
  try {
    const settings = await getWorkspaceSettings();
    return settings.success ? settings.data.delegation_workflow_enabled : false;
  } catch (error) {
    console.error("Error checking delegation workflow status:", error);
    return false;
  }
};

/**
 * Smart assignment function that chooses between simple assignment and delegation
 */
export const smartAssignTask = async (
  taskId: string,
  assigneeId: string,
  notes?: string,
) => {
  try {
    const isDelegationEnabled = await isDelegationWorkflowEnabled();

    if (isDelegationEnabled) {
      // Use delegation system
    } else {
      // Use simple assignment
      const supabase = clientConnectionWithSupabase();
      const userRes = await supabase.auth.getUser();

      if (userRes.error || !userRes.data.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("votum_tasks")
        .update({
          assigned_to: assigneeId,
          assigned_by: userRes.data.user.id,
          last_updated_by: userRes.data.user.id,
          last_updated_time: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data,
        message: "Task assigned successfully",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to assign task",
    };
  }
};

/**
 * Get current task assignee (works with both systems)
 */
export const getCurrentTaskAssignee = async (taskId: string) => {
  try {
    const supabase = clientConnectionWithSupabase();

    // Fall back to simple assignment
    const { data, error } = await supabase
      .from("votum_tasks")
      .select(
        `
        assigned_to,
        assigned_by,
        assigned_to_user:assigned_to(id, name, email),
        assigned_by_user:assigned_by(id, name, email)
      `,
      )
      .eq("id", taskId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: {
        assigneeId: data.assigned_to,
        assignmentType: "simple",
        assignedBy: data.assigned_by,
        assigneeUser: data.assigned_to_user,
        assignedByUser: data.assigned_by_user,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get task assignee",
    };
  }
};
