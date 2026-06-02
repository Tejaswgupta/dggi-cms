"use client";
import { extractTextFromScannedPdf } from "@/apiReq/extract-text-from-scanned-pdf";
import { clientBackendFetch } from "@/lib/client-backend-fetch";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { addTaskDocuments } from "./task-new";
const supabase = clientConnectionWithSupabase();

interface DocumentData {
  document_data: any;
  url: string;
  name: string;
}

const getUserTasks = async (workspace_id: string, assignedTo: string) => {
  const { data: userTasks, error }: any = await supabase
    .from("votum_tasks")
    .select(
      "* , assigned_to:votum_users!assigned_to(id,name), last_updated_by:votum_users!last_updated_by(id,name), assigned_by:votum_users!assigned_by(id,name)",
    )
    .eq("workspace_id", workspace_id)
    .eq("assigned_to", assignedTo)
    .order("created_at");
  console.log(userTasks);
  if (userTasks !== null) {
    const todayDate = new Date();

    const listTasks = [...userTasks];
    return { success: true, listTasks };
  } else {
    return { success: false, error: error.message };
  }
};

export const newCreateNewTask = async (formData: any, documents: any[]) => {
  try {
    // If formData already contains a valid workspace_id, use that directly
    if (formData && formData.workspace_id) {
      const workspace_id = formData.workspace_id;

      // First get the max id of the task
      const maxSerialRes = await supabase
        .from("votum_tasks")
        .select("serial")
        .eq("workspace_id", workspace_id)
        .order("serial", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxSerialRes?.error) {
        throw new Error(maxSerialRes.error.message);
      }

      // next task id
      const nextSerial = maxSerialRes?.data?.serial + 1 || 1;

      // Get current user for created_by field
      const supabaseClient = clientConnectionWithSupabase();
      const userRes = await supabaseClient.auth.getUser();
      const currentUser = userRes?.data?.user;

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      // Use the existing workspace_id from formData
      const taskData = {
        ...formData,
        serial: nextSerial,
        created_by: currentUser.id,
      };

      console.log("Task data:", taskData);

      // Insert the task
      const resultOftaskCreation: any = await supabase
        .from("votum_tasks")
        .insert([{ ...taskData }])
        .select();

      if (resultOftaskCreation?.error !== null) {
        console.log(resultOftaskCreation.error);
        throw new Error(resultOftaskCreation.error.message);
      }

      // No documents to upload
      if (!documents || documents?.length === 0) {
        return { success: true, resultOftaskCreation };
      }

      // Instead of duplicating upload logic, use the addTaskDocuments function
      const taskObj = resultOftaskCreation.data[0];
      const addDocumentsResult = await addTaskDocuments(taskObj, documents, {
        skipOcr: true,
      });

      if (!addDocumentsResult.success) {
        console.error(
          "Error adding documents to task:",
          addDocumentsResult.error,
        );
        // Even if document upload fails, return success for the task creation
        return { success: true, resultOftaskCreation };
      }

      // Return the updated task with documents
      return {
        success: true,
        resultOftaskCreation: {
          ...resultOftaskCreation,
          data: [addDocumentsResult.data],
        },
      };
    }

    // Otherwise, fallback to getting workspace_id from user session
    const supabaseClient = clientConnectionWithSupabase();

    const userDetailsRes = await supabaseClient.auth.getSession();

    if (userDetailsRes.error) {
      throw new Error("User not found");
    }

    const userDetails = userDetailsRes?.data?.session?.user;

    if (!userDetails) {
      throw new Error("User not found");
    }

    const workspaceIdRes = await supabaseClient
      .from("votum_users")
      .select("workspace_id")
      .eq("id", userDetails.id)
      .maybeSingle();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message || "Workspace not found");
    }

    const workspaceId = workspaceIdRes?.data?.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found for user");
    }

    // First get the max id of the task
    const maxSerialRes = await supabaseClient
      .from("votum_tasks")
      .select("serial")
      .eq("workspace_id", workspaceId)
      .order("serial", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxSerialRes?.error) {
      throw new Error(maxSerialRes.error.message);
    }

    // next task id
    const nextSerial = maxSerialRes?.data?.serial + 1 || 1;

    const taskData = {
      ...formData,
      serial: nextSerial,
      workspace_id: workspaceId,
      created_by: userDetails.id,
      last_updated_by: userDetails.id,
      last_updated_time: new Date().toISOString(),
    };

    console.log("Task data:", taskData);

    // Insert the task
    const resultOftaskCreation: any = await supabase
      .from("votum_tasks")
      .insert([{ ...taskData }])
      .select();

    if (resultOftaskCreation?.error !== null) {
      console.log(resultOftaskCreation.error);
      throw new Error(resultOftaskCreation.error.message);
    }

    // No documents to upload
    if (!documents || documents?.length === 0) {
      return { success: true, resultOftaskCreation };
    }

    // Instead of duplicating upload logic, use the addTaskDocuments function
    const taskObj = resultOftaskCreation.data[0];
    const addDocumentsResult = await addTaskDocuments(taskObj, documents, {
      skipOcr: true,
    });

    if (!addDocumentsResult.success) {
      console.error(
        "Error adding documents to task:",
        addDocumentsResult.error,
      );
      // Even if document upload fails, return success for the task creation
      return { success: true, resultOftaskCreation };
    }

    // Return the updated task with documents
    return {
      success: true,
      resultOftaskCreation: {
        ...resultOftaskCreation,
        data: [addDocumentsResult.data],
      },
    };
  } catch (error) {
    console.log("Error creating new task:", error);
    return { success: false, resultOftaskCreation: { error } };
  }
};

// Function to get tasks based on user permissions
export const getTasks = async (
  workspace_id: string,
  team_ids: string[] = [],
  prefetchedUserId?: string,
) => {
  const supabase = clientConnectionWithSupabase();

  let userId = prefetchedUserId;
  if (!userId) {
    const userRes = await supabase.auth.getUser();
    const user = userRes?.data?.user;
    if (!user) {
      console.log("No User");
      return { success: false, error: "User not authenticated", listTasks: [] };
    }
    userId = user.id;
  }

  // Build the OR filter for:
  // 1. Tasks assigned to teams the user is in
  // 2. Tasks assigned to the active user
  // 3. Tasks created by the active user (assigned_by)

  const orConditions = [
    `assigned_to.eq.${userId}`, // Assigned to the user
    `assigned_by.eq.${userId}`, // Assigned by the user
    `created_by.eq.${userId}`, // Created by the user
  ];

  // Add team conditions if user is in any teams
  if (team_ids.length > 0) {
    const teamIdsStr = team_ids.join(",");
    orConditions.push(`assigned_team.in.(${teamIdsStr})`);
  }

  const orFilter = orConditions.join(",");

  const { data: userTasks, error }: any = await supabase
    .from("votum_tasks")
    .select(
      `id, name, taskContent, status, priority, dueDate, moved_to_done_at,
       workspace_id, case_id, created_at, serial, source,
       assigned_to, assigned_by, created_by, last_updated_by,
       assigned_team, client_id, cc_users, custom_fields,
       assigned_by:votum_users!assigned_by(id,name),
       assigned_to:votum_users!assigned_to(id,name),
       last_updated_by:votum_users!last_updated_by(id,name),
       created_by_user:votum_users!created_by(id,name)`,
    )
    .eq("workspace_id", workspace_id)
    .or(orFilter)
    .order("created_at", { ascending: false });

  console.log(`userTasks`, userTasks);
  if (userTasks !== null) {
    const listTasks = [...userTasks];

    return { success: true, listTasks };
  } else {
    return { success: false, error: error.message, listTasks: [] };
  }
};

export const makeDuplicate = async (duplicatetask: any) => {
  const supabase = clientConnectionWithSupabase();
  const userDetails = localStorage.getItem("VotumUserDetails");
  const workspace_id = userDetails
    ? JSON.parse(userDetails).workspace_id
    : null;
  console.log(workspace_id);

  // First get the max id of the task
  const maxSerialRes = await supabase
    .from("votum_tasks")
    .select("serial")
    .eq("workspace_id", workspace_id)
    .order("serial", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxSerialRes?.error) {
    throw new Error(maxSerialRes.error.message);
  }

  // next task id
  const nextSerial = maxSerialRes?.data?.serial + 1 || 1;

  // Get user ID for metadata
  const session = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error }: any = await supabase
    .from("votum_tasks")
    .insert([
      {
        serial: nextSerial,
        name: `[duplicate] ${duplicatetask.name}`,
        priority: duplicatetask.priority,
        startDate: duplicatetask.startDate,
        dueDate: duplicatetask.dueDate,
        status: duplicatetask.status,
        workspace_id: workspace_id,
        created_by: userId,
        last_updated_by: userId,
        sub_tasks: duplicatetask.sub_tasks,
        taskContent: duplicatetask.taskContent,
        documents: duplicatetask.documents,
      },
    ])
    .select();

  if (error === null) {
    return { success: true, data };
  } else {
    return { success: false, error: error.message };
  }
};

const markASComplete = async (TaskObj: any) => {
  const supabase = clientConnectionWithSupabase();
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails !== null) {
    const result = await supabase
      .from("votum_tasks")
      .update({ status: true })
      .eq("id", TaskObj.id)
      .select();
    console.log(result);
    return result;
  } else {
    return "User Data not found , please login again";
  }
};

export const deleteTask = async (TaskObj: any) => {
  try {
    // Get user details
    const userDetails: any = localStorage.getItem("VotumUserDetails");
    const parsedUserDetails = JSON.parse(userDetails);

    if (parsedUserDetails === null)
      throw new Error("User Data not found , please login again");

    // Check if the user is the creator of the task
    if (TaskObj.created_by !== parsedUserDetails.id) {
      throw new Error("Only the creator of the task can delete it");
    }

    // Get list of files
    const { data: list, error: ListofFilesError } = await supabase.storage
      .from("votum_ocr_users_pdfs")
      .list(`${parsedUserDetails.workspace_id}/${TaskObj.id}`);

    if (ListofFilesError) throw new Error(ListofFilesError.message);

    const filesToRemove = list.map(
      (file) => `${parsedUserDetails.workspace_id}/${TaskObj.id}/${file.name}`,
    );

    // Remove files
    if (filesToRemove.length > 0) {
      const { data, error: removedFilesError } = await supabase.storage
        .from("votum_ocr_users_pdfs")
        .remove(filesToRemove);
      if (removedFilesError) throw new Error(removedFilesError.message);
    }

    // Remove task
    const { error } = await supabase
      .from("votum_tasks")
      .delete()
      .eq("id", TaskObj.id);

    return error;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const markAsPendingAPI = async (TaskObj: any) => {
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails !== null) {
    const result = await supabase
      .from("votum_tasks")
      .update({ status: false })
      .eq("id", TaskObj.id)
      .select();
    console.log(result);
    return result;
  } else {
    return "User Data not found , please login again";
  }
};

const markAsPendingBulk = async (selectedList: any) => {
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails !== null) {
    for (let i = 0; i < selectedList.length; i++) {
      const result = await supabase
        .from("votum_tasks")
        .update({ status: false })
        .eq("id", selectedList[i].id)
        .select();
    }
  } else {
    return "User Data not found , please login again";
  }
};

const markAsCompletedBulk = async (
  selectedList: any,
  completedTask: any,
  pendingTask: any,
) => {
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails !== null) {
    for (let i = 0; i < selectedList.length; i++) {
      const result = await supabase
        .from("votum_tasks")
        .update({ status: true })
        .eq("id", selectedList[i].id)
        .select();
      console.log(result);
    }
  } else {
    return {
      success: false,
      message: "User Data not found , please login again",
    };
  }
};

const deleteBulk = async (selectedList: any) => {
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails !== null) {
    for (var i = 0; i < selectedList.length; i++) {
      // Check if the user is the creator of the task
      if (selectedList[i].created_by !== parsedUserDetails.id) {
        console.log("Skipping task deletion - user is not the creator");
        continue;
      }

      const { data: list, error: ListofFilesError } = await supabase.storage
        .from("votum_ocr_users_pdfs")
        .list(`${parsedUserDetails.workspace_id}/${selectedList[i].id}/`);

      if (list) {
        const filesToRemove = list.map(
          (file) =>
            `${parsedUserDetails.workspace_id}/${selectedList[i].id}/${file.name}`,
        );
        const { data, error: removedFilesError } = await supabase.storage
          .from("votum_ocr_users_pdfs")
          .remove(filesToRemove);
      }

      const { error } = await supabase
        .from("votum_tasks")
        .delete()
        .eq("id", selectedList[i].id);
    }
  } else {
    return "User Data not found , please login again";
  }
};

export const getAllTask = async (workspace_id: string) => {
  if (!workspace_id) return { success: false, error: "Invalid workspace_id" };
  const { data: userTask, error }: any = await supabase
    .from("votum_tasks")
    .select()
    .eq("workspace_id", workspace_id);

  console.log(userTask);
  if (error === null) {
    const { data: users, error }: any = await supabase
      .from("votum_users")
      .select("id , name, skills")
      .eq("workspace_id", workspace_id);

    return { success: true, userTask, users };
  } else {
    return { success: false, message: "Internal Server Error" };
  }
};

// Function to auto-assign tasks that don't have an active assignee
export const autoAssignTasks = async (workspace_id: string) => {
  try {
    const supabase = clientConnectionWithSupabase();

    // Get current user
    const userRes = await supabase.auth.getUser();
    const currentUser = userRes?.data?.user;

    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Get all users in the workspace with their skills
    const { data: users, error: usersError } = await supabase
      .from("votum_users")
      .select("id, name, skills")
      .eq("workspace_id", workspace_id);

    if (usersError) {
      throw new Error(usersError.message);
    }

    if (!users || users.length === 0) {
      throw new Error("No users found in workspace");
    }

    // Transform users into the format expected by the API
    const teamMembers = users.map((user) => ({
      user_id: user.id,
      skills: user.skills ? user.skills.join(", ") : "",
    }));

    // Get unassigned tasks (where assigned_to is null)
    const { data: unassignedTasks, error: tasksError } = await supabase
      .from("votum_tasks")
      .select("id, name, taskContent")
      .eq("workspace_id", workspace_id)
      .is("assigned_to", null);

    if (tasksError) {
      throw new Error(tasksError.message);
    }

    if (!unassignedTasks || unassignedTasks.length === 0) {
      return {
        success: true,
        message: "No unassigned tasks found",
        assignedCount: 0,
      };
    }

    let assignedCount = 0;

    // Process each unassigned task
    for (const task of unassignedTasks) {
      try {
        const body = {
          task_description: task.name + " " + (task.taskContent || ""),
          team_members: teamMembers,
        };

        const response = await clientBackendFetch(
          "https://api.thevotum.com/assign_task/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          },
        );

        if (!response.ok) {
          console.error(
            `Failed to assign task ${task.id}:`,
            await response.text(),
          );
          continue;
        }

        const assignedUser = await response.text();

        if (!assignedUser) {
          console.error(`No user ID returned from API for task ${task.id}`);
          continue;
        }

        let cleanedUserId = assignedUser;
        try {
          const parsed = JSON.parse(assignedUser);
          if (parsed && typeof parsed === "object" && parsed.user_id) {
            cleanedUserId = parsed.user_id;
          }
        } catch (e) {
          // Not JSON, keep as is (string)
        }

        // Update the task with the assigned user
        const { error: updateError } = await supabase
          .from("votum_tasks")
          .update({
            assigned_to: cleanedUserId,
            assigned_by: currentUser.id,
            last_updated_by: currentUser.id,
            last_updated_time: new Date().toISOString(),
          })
          .eq("id", task.id);

        if (updateError) {
          console.error(
            `Failed to update task ${task.id}:`,
            updateError.message,
          );
          continue;
        }

        assignedCount++;
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        continue;
      }
    }

    return {
      success: true,
      message: `Successfully assigned ${assignedCount} out of ${unassignedTasks.length} tasks`,
      assignedCount,
      totalCount: unassignedTasks.length,
    };
  } catch (error: any) {
    console.error("Error in autoAssignTasks:", error);
    return { success: false, error: error.message };
  }
};

const addTaskReview = async (formData: any) => {
  try {
    const supabase = clientConnectionWithSupabase();

    const addTaskReviewRes = await supabase
      .from("votum_task_reviews")
      .insert([
        {
          task_id: formData.task_id,
          assigned_by_id: formData.assigned_by_id,
          assigned_to_id: formData.assigned_to_id,
        },
      ])
      .select();

    if (addTaskReviewRes.error) {
      console.log(addTaskReviewRes.error.message);
      throw new Error(addTaskReviewRes.error.message);
    }

    return { success: true, data: addTaskReviewRes.data[0] };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

const deleteTaskReview = async (formData: any) => {
  try {
    const supabase = clientConnectionWithSupabase();

    const currentTaskReview = await supabase
      .from("votum_task_reviews")
      .select()
      .eq("task_id", formData.task_id)
      .maybeSingle();

    if (!currentTaskReview) {
      console.log("No task review found for this task");
      return { success: true, data: null };
    }

    const deleteTaskReviewRes = await supabase
      .from("votum_task_reviews")
      .delete()
      .match({ task_id: formData.task_id });

    if (deleteTaskReviewRes.error) {
      console.log(deleteTaskReviewRes.error.message);
      throw new Error(deleteTaskReviewRes.error.message);
    }

    return { success: true, data: null };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

const updateTaskReview = async (formData: any) => {
  try {
    const supabase = clientConnectionWithSupabase();

    const taskReviewFormData = {
      task_id: formData.task_id,
      assigned_by_id: formData.assigned_by,
      assigned_to_id: formData.approver_id,
    };

    const currentTaskReview = await supabase
      .from("votum_task_reviews")
      .select()
      .eq("task_id", formData.task_id)
      .maybeSingle();

    if (!currentTaskReview) {
      const addTaskReviewRes = await addTaskReview(formData);

      if (!addTaskReviewRes.success) {
        throw new Error(addTaskReviewRes.error);
      }

      return { success: true, data: addTaskReviewRes.data };
    } else {
      const updateTaskReviewRes = await supabase
        .from("votum_task_reviews")
        .update({
          ...formData,
        })
        .eq("task_id", formData.task_id)
        .select();

      if (updateTaskReviewRes.error) {
        console.log(updateTaskReviewRes.error.message);
        throw new Error(updateTaskReviewRes.error.message);
      }

      return { success: true, data: updateTaskReviewRes.data[0] };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

// creating a new function for updating task status. Will run only if task status is updated.
const updateTaskStatus = async (formData: any) => {
  try {
    const supabase = clientConnectionWithSupabase();

    const updateObject = {
      status: formData.newStatus,
    };

    // Update the task
    const taskUpdationRes: any = await supabase
      .from("votum_tasks")
      .update({ ...updateObject })
      .eq("id", formData.taskId)
      .select(
        "*, assigned_to:votum_users!assigned_to(id,name,email), approver:votum_users!approver_id(id,name,email), last_updated_by:votum_users!last_updated_by(id,name)",
      );

    // If something failed, throw an error
    if (taskUpdationRes.error) {
      console.log(taskUpdationRes.error);
      throw new Error(taskUpdationRes.error.message);
    }

    // Check if task status has been updated to in verify
    if (formData.newStatus == 2 && formData?.approver_id) {
      // Add new entry to votum_task_reviews table
      const taskReviewFormData = {
        task_id: formData.taskId,
        assigned_by_id: formData.assigned_by,
        assigned_to_id: formData.approver_id,
      };

      const addToTaskReviewRes = await addTaskReview(taskReviewFormData);

      if (!addToTaskReviewRes.success) {
        throw new Error(addToTaskReviewRes.error);
      }
    } else {
      // If task status is not in verify, remove the entry from votum_task_reviews table
      const deleteTaskReviewRes = await deleteTaskReview({
        task_id: formData.taskId,
      });

      if (!deleteTaskReviewRes.success) {
        throw new Error(deleteTaskReviewRes.error);
      }
    }

    return { success: true, data: taskUpdationRes.data[0] };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};
export const updateTask = async (task: any, id: string) => {
  const supabase = clientConnectionWithSupabase();

  const { data, error }: any = await supabase
    .from("votum_tasks")
    .update({ ...task })
    .eq("id", id)
    .select(
      "*, assigned_to:votum_users!assigned_to(id,name,email), approver:votum_users!approver_id(id,name,email), last_updated_by:votum_users!last_updated_by(id,name)",
    );
  // console.log(data[0])
  if (error === null) {
    return { success: true, data: data[0] };
  } else {
    return { success: false, error: error.message };
  }
};

////// Status

export const markAsTodo = async (TaskID: string) => {
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails === null) {
    return {
      success: false,
      error: "user data not available please try login again",
    };
  } else {
    const { data, error } = await supabase
      .from("votum_tasks")
      .update({ status: 0 })
      .eq("id", TaskID)
      .select();
    console.log(error);
    if (error === null) {
      return { success: true };
    } else {
      return { success: false, error: error.message };
    }
  }
};

export const markAsOnprogress = async (TaskID: string) => {
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails === null) {
    return {
      success: false,
      error: "user data not available please try login again",
    };
  } else {
    const { data, error } = await supabase
      .from("votum_tasks")
      .update({ status: 1 })
      .eq("id", TaskID)
      .select();
    if (error === null) {
      return { success: true };
    } else {
      return { success: false, error: error.message };
    }
  }
};

export const markAsDone = async (TaskID: string) => {
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (parsedUserDetails === null) {
    return {
      success: false,
      error: "user data not available please try login again",
    };
  } else {
    const { data, error } = await supabase
      .from("votum_tasks")
      .update({ status: 2 })
      .eq("id", TaskID)
      .select();
    if (error === null) {
      return { success: true };
    } else {
      return { success: false, error: error.message };
    }
  }
};

const addDocumentToTask = async (
  document: any,
  task_id: string,
  workspace_id: string,
) => {
  // Get user ID for metadata
  const session = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  // Use extractPdfFromScanned instead of uploading to votum_ocr_users_pdfs
  const extractResult = await extractTextFromScannedPdf(document, "en", true, {
    userId: userId,
    filename: document.name,
    documentType: "task_processed",
    clientId: null, // Will need to be updated if client ID is available
    tags: ["task", task_id],
    pdfUrl: "", // This will be filled in by the extractPdfFromScanned function
  });

  if (extractResult.success) {
    // Update task with document info
    const taskInfoRes = await supabase
      .from("votum_tasks")
      .select()
      .eq("id", task_id)
      .maybeSingle();

    if (taskInfoRes.error) {
      return { success: false, error: taskInfoRes.error.message };
    }

    const taskInfo = taskInfoRes.data;
    const documents = taskInfo.documents || [];

    documents.push({
      document_data: extractResult.extractedText,
      url: extractResult.ocrData?.pdf_url || "",
      name: document.name,
    });

    // Update the task with the new document
    const updateRes = await supabase
      .from("votum_tasks")
      .update({ documents })
      .eq("id", task_id);

    if (updateRes.error) {
      return { success: false, error: updateRes.error.message };
    }

    return { success: true, data: { ...taskInfo, documents } };
  } else {
    return { success: false, error: extractResult.error };
  }
};

const getTaskDocuments = async (task_id: string, workspace_id: string) => {
  // Query votum_tasks documents column
  const { data, error } = await supabase
    .from("votum_tasks")
    .select("documents")
    .eq("id", task_id)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  const documents = data?.documents || [];

  // Transform the data to match the expected format
  const formattedData = documents.map((doc) => ({
    name: doc.name,
    size: 0,
    created_at: doc.uploaded_at || new Date().toISOString(),
  }));
  return { success: true, data: formattedData };
};

const getFileFromStorage = async (workspace_id: string, task_id: string) => {
  // Query votum_tasks documents column
  const { data, error } = await supabase
    .from("votum_tasks")
    .select("documents")
    .eq("id", task_id)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  const documents = data?.documents || [];

  // Transform the data to match the expected format
  const formattedData = documents.map((doc) => ({
    name: doc.name,
    size: 0,
    created_at: doc.uploaded_at || new Date().toISOString(),
  }));
  return { success: true, data: formattedData };
};

const deleteFileFromStorage = async (
  workspace_id: string,
  task_id: string,
  fileName: string,
) => {
  // Update task documents list
  const taskRes = await supabase
    .from("votum_tasks")
    .select("documents")
    .eq("id", task_id)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (taskRes.error || !taskRes.data) {
    return {
      success: false,
      error: taskRes.error?.message || "Task not found",
    };
  }

  // Remove document from task's documents array
  const documents = taskRes.data.documents || [];
  const updatedDocuments = documents.filter((doc) => doc.name !== fileName);

  // Update task with new documents array
  const updateRes = await supabase
    .from("votum_tasks")
    .update({ documents: updatedDocuments })
    .eq("id", task_id)
    .eq("workspace_id", workspace_id);

  if (updateRes.error) {
    return { success: false, error: updateRes.error.message };
  }

  return { success: true };
};

const verifyDocumentOcr = async (workspace_id: string, tasks_id: string) => {
  // Get user ID for metadata
  const session = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  // Get task info to check if there are existing documents
  const taskInfoRes = await supabase
    .from("votum_tasks")
    .select("documents")
    .eq("id", tasks_id)
    .maybeSingle();

  if (taskInfoRes.error) {
    return { success: false, error: taskInfoRes.error.message };
  }

  const taskInfo = taskInfoRes.data;
  const existingDocs = taskInfo?.documents || [];

  // Process each document if needed
  // Since we're using extractPdfFromScanned, we may not need this function anymore
  // But keeping the function to update task documents if needed

  return { success: true };
};

// get taskks for a specific client for client profile
const getClientTasks = async (workspace_id: string, clientId: string) => {
  const { data: clientTasks, error }: any = await supabase
    .from("votum_tasks")
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("client_id", clientId);

  console.log("clientTasks", clientTasks);
  if (error === null && clientTasks) {
    return { success: true, clientTasks: clientTasks[0] };
  } else {
    return { success: false, error: error };
  }
};
