import clientConnectionWithSupabase from "@/lib/supabase/client";

/**
 * Starts task approval automation workflow using a preset
 */
export const startTaskAutomation = async (formData: FormData) => {
  try {
    const supabase = clientConnectionWithSupabase();
    const task_id = formData.get("task_id") as string;
    const users = JSON.parse(formData.get("users") as string);
    const useDeadlines = formData.get("use_deadlines") === "true";

    if (!task_id) {
      throw new Error("Task id not found");
    }

    if (!users || !users.length) {
      throw new Error("No approvers specified");
    }

    const userDataRes = await supabase.auth.getUser();
    if (userDataRes.error) {
      throw new Error("User not logged in");
    }

    const user = userDataRes.data.user;
    if (!user) {
      throw new Error("User data not found");
    }

    const workspaceRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceRes.error) {
      throw new Error(workspaceRes.error.message);
    }

    const workspace_id = workspaceRes.data.workspace_id;
    if (!workspace_id) {
      throw new Error("Workspace id not found");
    }

    // Check if the user has access to the task
    const taskRes = await supabase
      .from("votum_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("workspace_id", workspace_id)
      .single();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const task = taskRes.data;
    if (!task) {
      throw new Error("Task not found");
    }

    // Calculate deadlines based on workflow start
    const calculateDeadlines = (users: any[], startDate: Date) => {
      let currentDate = new Date(startDate);
      return users.map((user) => {
        const deadline = new Date(currentDate);
        deadline.setDate(deadline.getDate() + (user.deadline_days || 7));
        currentDate = new Date(deadline);
        return deadline.toISOString();
      });
    };

    // Create workflow with start date
    const workflowStartDate = new Date();
    const deadlineDates = calculateDeadlines(users, workflowStartDate);

    // Create approval workflow with current task state
    const createWorkflowRes = await supabase
      .from("votum_approval_workflows")
      .insert([
        {
          created_by: user.id,
          type: "task",
          task_id: task.id,
          status: "pending",
          created_at: workflowStartDate.toISOString(),
          last_updated_by: user.id,
          workspace_id: workspace_id,
          start_date: workflowStartDate.toISOString(),
          use_deadlines: useDeadlines,
          version_number: await getNextVersionNumber(supabase, task.id),
        },
      ])
      .select("*")
      .maybeSingle();

    if (createWorkflowRes.error) {
      throw new Error(
        "Error creating approval workflow: " + createWorkflowRes.error.message
      );
    }

    const workflow = createWorkflowRes.data;

    // Create workflow progress entries with deadlines
    const workflowProgressUsers = users.map((user: any, idx: number) => {
      const baseEntry = {
        workflow_id: workflow.id,
        signer_id: user.id,
        signer_email: user?.email || "",
        signer_name: user?.name || user?.email || "Anonymous",
        rank: idx + 1,
        signer_status: idx === 0 ? "pending" : "not-assigned",
        last_updated_by: user.id,
      };

      if (useDeadlines) {
        return {
          ...baseEntry,
          deadline_days: user.deadline_days || 7,
          deadline_date: deadlineDates[idx],
        };
      }

      return baseEntry;
    });

    const createWorkflowProgressRes = await supabase
      .from("votum_approval_workflow_steps")
      .insert(workflowProgressUsers)
      .select("*");

    if (createWorkflowProgressRes.error) {
      await supabase
        .from("votum_approval_workflows")
        .delete()
        .eq("id", workflow.id);
      throw new Error(
        "Error creating workflow steps: " +
          createWorkflowProgressRes.error.message
      );
    }

    // Get the assigned users emails for the first step
    const firstStepUser = users.find((u) => u.rank === 1) || users[0];
    if (firstStepUser && firstStepUser.email) {
      // Send notification to first approver
      // This would be added in a production environment
    }

    return {
      success: true,
      message: "Automation started successfully",
      data: workflow,
    };
  } catch (error) {
    console.error("Error in startTaskAutomation:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Gets the next version number for a task's automation
 */
async function getNextVersionNumber(supabase, taskId) {
  const { data, error } = await supabase
    .from("votum_approval_workflows")
    .select("version_number")
    .eq("task_id", taskId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error getting next version number:", error);
    return 1;
  }

  if (data && data.length > 0 && data[0].version_number) {
    return data[0].version_number + 1;
  }

  return 1;
}

/**
 * Gets current automation status for a task
 */
export const getTaskAutomationStatus = async (taskId: string) => {
  try {
    const supabase = clientConnectionWithSupabase();

    const { data, error } = await supabase
      .from("votum_approval_workflows")
      .select(
        `
        id,
        created_at,
        status,
        task_id,
        version_number,
        created_by(name, email),
        steps:votum_approval_workflow_steps(
          id,
          signer_id,
          signer_name,
          signer_email,
          signer_status,
          rank,
          deadline_date,
          signed_on
        )
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        "Error fetching task automation status: " + error.message
      );
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getTaskAutomationStatus:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Approves a task in the workflow
 */
export const approveTaskInWorkflow = async (
  taskId: string,
  workflowId: string
) => {
  try {
    const supabase = clientConnectionWithSupabase();
    const userDataRes = await supabase.auth.getUser();

    if (!userDataRes.data.user) {
      throw new Error("User not found");
    }
    const user = userDataRes.data.user;

    // Get the user's workflow step
    const workflowStepRes = await supabase
      .from("votum_approval_workflow_steps")
      .select(
        `
        *,
        workflow:workflow_id(id, task_id, status)
      `
      )
      .eq("workflow_id", workflowId)
      .eq("signer_id", user.id)
      .eq("signer_status", "pending")
      .single();

    if (workflowStepRes.error) {
      throw new Error("No pending approval found for this workflow");
    }

    const step = workflowStepRes.data;

    // Update current signer's status
    const updateStepRes = await supabase
      .from("votum_approval_workflow_steps")
      .update({
        signer_status: "approved",
        signed_on: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated_by: user.id,
      })
      .eq("id", step.id)
      .select()
      .single();

    if (updateStepRes.error) {
      throw new Error("Failed to update approval status");
    }

    // Update next signer's status if any
    const nextSignerRes = await supabase
      .from("votum_approval_workflow_steps")
      .update({
        signer_status: "pending",
        updated_at: new Date().toISOString(),
        last_updated_by: user.id,
      })
      .eq("workflow_id", workflowId)
      .eq("rank", step.rank + 1)
      .eq("signer_status", "not-assigned");

    // Check if all steps are now approved
    const allStepsRes = await supabase
      .from("votum_approval_workflow_steps")
      .select("signer_status")
      .eq("workflow_id", workflowId);

    if (allStepsRes.error) {
      throw new Error("Failed to check workflow completion status");
    }

    const allApproved = allStepsRes.data.every(
      (s) => s.signer_status === "approved"
    );

    if (allApproved) {
      // Update workflow status to completed
      await supabase
        .from("votum_approval_workflows")
        .update({ status: "completed" })
        .eq("id", workflowId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in approveTaskInWorkflow:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancels a task automation workflow
 */
export const cancelTaskAutomation = async (workflowId: string) => {
  try {
    const supabase = clientConnectionWithSupabase();
    const userDataRes = await supabase.auth.getUser();

    if (!userDataRes.data.user) {
      throw new Error("User not found");
    }

    // Update workflow status
    const updateRes = await supabase
      .from("votum_approval_workflows")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
        last_updated_by: userDataRes.data.user.id,
      })
      .eq("id", workflowId)
      .select()
      .single();

    if (updateRes.error) {
      throw new Error(
        "Failed to cancel automation: " + updateRes.error.message
      );
    }

    return { success: true, data: updateRes.data };
  } catch (error) {
    console.error("Error in cancelTaskAutomation:", error);
    return { success: false, error: error.message };
  }
};
