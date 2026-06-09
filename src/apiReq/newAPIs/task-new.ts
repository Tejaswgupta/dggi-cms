import { extractTextFromScannedPdf } from "@/apiReq/extract-text-from-scanned-pdf";
import clientConnectionWithSupabase from "@/lib/supabase/client";

type TaskDocument = {
  name: string;
  url: string | null;
  document_data: string | null;
  uploaded_at: string | null;
};

type TaskCcUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export const getTaskData = async (taskId: string) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const sessionRes = await supabase.auth.getSession();

    if (sessionRes?.error) {
      throw new Error(sessionRes.error.message);
    }

    const session = sessionRes?.data?.session;

    if (!session) {
      throw new Error("User is not authenticated");
    }

    const user = session.user;

    if (!user) {
      throw new Error("User not found");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    // Get the task data
    const taskRes = await supabase
      .from("votum_tasks")
      .select(
        `id, name, taskContent, status, priority, dueDate, startDate,
         workspace_id, case_id, created_at, moved_to_done_at, serial,
         assigned_to, assigned_by, created_by, last_updated_by, approver_id,
         sub_tasks, cc_users, client_id, tags, custom_fields,
         approver_user:approver_id(id,name),
         assigned_to_user:assigned_to(id,name),
         assigned_by_user:assigned_by(id,name),
         last_updated_by_user:last_updated_by(id,name)`
      )
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    if (!taskData) {
      throw new Error("Task data not found");
    }

    const enrichedTaskData: typeof taskData & {
      documents: TaskDocument[];
      cc_users_data: TaskCcUser[];
    } = {
      ...taskData,
      documents: [],
      cc_users_data: [],
    };

    // Fetch CC users and task documents in parallel
    const [ccUsersRes, documentRes] = await Promise.all([
      taskData.cc_users?.length > 0
        ? supabase
            .from("votum_users")
            .select("id, name, email")
            .in("id", taskData.cc_users)
            .eq("workspace_id", workspaceId)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("task_documents")
        .select("filename, pdf_url, extracted_text, created_at")
        .eq("workspace_id", workspaceId)
        .contains("tags", ["task", taskId]),
    ]);

    if (ccUsersRes.error) {
      console.error("Error fetching CC users:", ccUsersRes.error);
    } else {
      enrichedTaskData.cc_users_data = (ccUsersRes.data ?? []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }));
    }

    if (documentRes.error) {
      throw new Error(documentRes.error.message);
    }

    enrichedTaskData.documents = documentRes.data.map((doc) => ({
      name: doc.filename,
      url: doc.pdf_url,
      document_data: doc.extracted_text,
      uploaded_at: doc.created_at,
    }));

    return { success: true, data: enrichedTaskData };
  } catch (error) {
    console.log("GET_TASK_DATA_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const getOtherTasks = async (taskId: string) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const sessionRes = await supabase.auth.getSession();

    if (sessionRes?.error) {
      throw new Error(sessionRes.error.message);
    }

    const session = sessionRes?.data?.session;

    if (!session) {
      throw new Error("User is not authenticated");
    }

    const user = session.user;

    if (!user) {
      throw new Error("User not found");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .select("id, name, status")
      .eq("workspace_id", workspaceId)
      .neq("id", taskId);

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    if (!taskData) {
      throw new Error("Other tasks not found");
    }

    return { success: true, data: taskData };
  } catch (error) {
    console.log("GET_OTHER_TASKS_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const deleteTaskData = async (taskId: string) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    // Check if the user is the creator of the task
    const taskCheckRes = await supabase
      .from("votum_tasks")
      .select("created_by")
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .single();

    if (taskCheckRes.error) {
      throw new Error(taskCheckRes.error.message);
    }

    // Only allow deletion if the user is the creator of the task
    if (taskCheckRes.data.created_by !== user.id) {
      throw new Error("Only the creator of the task can delete it");
    }

    // Delete the task data
    const taskRes = await supabase
      .from("votum_tasks")
      .delete()
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .single();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    // Remove documents associated with this task from task_documents
    const { error: deleteError } = await supabase
      .from("task_documents")
      .delete()
      .contains("tags", ["task", taskId])
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      console.error("Error deleting task documents:", deleteError);
    }

    return { success: true };
  } catch (error) {
    console.log("DELETE_TASK_DATA_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskName = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    // Update the task data
    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskStatus = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;
    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    updateObj.assigned_by = user.id;

    // Conditionally update moved_to_done_at
    if (updateObj.status === 3) {
      updateObj.moved_to_done_at = new Date().toISOString();
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskStartDate = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskDueDate = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskPriority = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskAssignee = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    // Notify the newly assigned user (skip if unassigning or self-assigning)
    const newAssigneeId = updateObj.assigned_to;
    if (newAssigneeId && newAssigneeId !== user.id) {
      const redirectUri = `${window.location.origin}/tasks/${taskId}`;
      await supabase.from("votum_notifications").insert([
        {
          id: crypto.randomUUID(),
          type: "assignment",
          subtype: "task_assigned",
          module: "task",
          redirect_uri: redirectUri,
          message: "You have been assigned a task",
          title: "Task Assigned",
          workspace_id: workspaceId,
          target_user_id: newAssigneeId,
          created_by_id: user.id,
          is_obsolete: false,
          is_active: true,
          created_at: new Date().toISOString(),
          related_entity_id: taskId,
          related_entity_type: "task",
        },
      ]);
    }

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskApprover = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        assigned_by: user.id,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskCCUsers = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_CC_USERS_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Result is not an ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export const addTaskDocuments = async (
  task: any,
  files: File[] | any[],
  options?: { skipOcr?: boolean }
) => {
  try {
    if (!task || !files || files.length === 0) {
      throw new Error("Task and files are required");
    }

    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    // Process each file or document
    for (const fileOrDoc of files) {
      // Check if the item is already a processed document object with a URL
      if (
        typeof fileOrDoc === "object" &&
        "url" in fileOrDoc &&
        typeof fileOrDoc.url === "string"
      ) {
        // This is a pre-processed document, add it directly to the table
        const { error: insertError } = await supabase
          .from("task_documents")
          .insert({
            user_id: user.id,
            pdf_url: fileOrDoc.url,
            filename: fileOrDoc.name,
            tags: ["task", task.id],
            document_type: "task_processed",
            language: "en",
            client_id: task.client_id,
            workspace_id: workspaceId,
            extracted_text: fileOrDoc.document_data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (insertError) {
             console.error("Error inserting pre-processed document:", insertError);
             // Continue to next file
        }

      } else if (fileOrDoc instanceof File) {
        // This is a File object, process it
        // 1. Upload file to Supabase storage
        const fileName = `tasks/${task.id}/${Date.now()}_${fileOrDoc.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("votum_ocr_users_pdfs")
          .upload(fileName, fileOrDoc);

        if (uploadError) {
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }

        // 2. Get the public URL of the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from("votum_ocr_users_pdfs")
          .getPublicUrl(fileName);

        const fileUrl = publicUrlData.publicUrl;

        // 3. Insert document record immediately so task creation can return fast
        const { data: insertedDoc, error: insertError } = await supabase
          .from("task_documents")
          .insert({
            user_id: user.id,
            pdf_url: fileUrl,
            filename: fileOrDoc.name,
            tags: ["task", task.id],
            document_type: "task_processed",
            language: "en",
            client_id: task.client_id,
            workspace_id: workspaceId,
            extracted_text: null,
            metaData: {
              ocr_status: options?.skipOcr ? "pending" : "processing",
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(`Error inserting document: ${insertError.message}`);
        }

        // 4. Process the document using OCR and update the inserted record
        if (options?.skipOcr) {
          continue;
        }

        const existingDocumentId =
          insertedDoc?.id !== undefined && insertedDoc?.id !== null
            ? String(insertedDoc.id)
            : undefined;

        const ocrPromise = extractTextFromScannedPdf(
          fileOrDoc,
          "en",
          true, // Store in task_documents
          {
            userId: user.id,
            filename: fileOrDoc.name,
            documentType: "task_processed",
            clientId: task.client_id,
            tags: ["task", task.id],
            pdfUrl: fileUrl,
            existingDocumentId,
          }
        );

        const extractResult = await ocrPromise;
        if (!extractResult.success) {
          throw new Error(extractResult.error);
        }

      } else {
        throw new Error("Invalid file or document object");
      }
    }

    // Update task's last updated info
    const updateRes = await supabase
      .from("votum_tasks")
      .update({
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      );

    if (updateRes.error) {
      throw new Error(updateRes.error.message);
    }

    // Fetch fresh task data including new documents
    return await getTaskData(task.id);

  } catch (error) {
    console.log("ADD_TASK_DOCUMENTS_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const removeTaskDocument = async (task, document) => {
  try {
    if (!task || !document) {
      throw new Error("Task and document are required");
    }

    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    // Remove document from storage if URL exists
    if (document.url) {
      try {
        // Extract the path from the URL (remove the storage URL prefix)
        const storage_url = supabase.storage
          .from("votum_ocr_users_pdfs")
          .getPublicUrl("").data.publicUrl;
        const filePath = document.url.replace(storage_url, "");

        // Delete the file from storage
        const { error: storageError } = await supabase.storage
          .from("votum_ocr_users_pdfs")
          .remove([filePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          throw new Error(`Storage deletion failed: ${storageError.message}`);
        }

        // Delete from task_documents table
        const { error: dbError } = await supabase
            .from("task_documents")
            .delete()
            .eq("pdf_url", document.url)
            .eq("workspace_id", workspaceId);

        if (dbError) {
            console.error("Error deleting document from database:", dbError);
            throw new Error(`Database deletion failed: ${dbError.message}`);
        }

      } catch (storageError) {
        console.error("Error processing deletion:", storageError);
      }
    }

    // Update task's last updated info
    await supabase
      .from("votum_tasks")
      .update({
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("workspace_id", workspaceId);

    // Fetch fresh task data
    return await getTaskData(task.id);

  } catch (error) {
    console.log("REMOVE_TASK_DOCUMENT_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskDocumentData = async (task, updateObj) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    // Check if the update includes documents
    if (updateObj.documents) {
      for (const docUpdate of updateObj.documents) {
        if (docUpdate.url) {
           const payload: any = {};
           if (docUpdate.document_data) payload.extracted_text = docUpdate.document_data;
           // Handle both casing conventions if unsure, but schema says "metaData"
           if (docUpdate.metadata || docUpdate.metaData) {
               payload.metaData = docUpdate.metadata || docUpdate.metaData;
           }
           
           if (Object.keys(payload).length > 0) {
               const { error: updateError } = await supabase
                 .from("task_documents")
                 .update(payload)
                 .eq("pdf_url", docUpdate.url)
                 .eq("workspace_id", workspaceId);
               
               if (updateError) {
                   console.error("Error updating document:", updateError);
               }
           }
        }
      }
    }

    // Update the task's last_updated information
    const { error: taskError } = await supabase
        .from("votum_tasks")
        .update({
          last_updated_by: user.id,
          last_updated_time: new Date().toISOString(),
        })
        .eq("id", taskId)
        .eq("workspace_id", workspaceId);

    if (taskError) {
        throw new Error(taskError.message);
    }

    // Return fresh data
    return await getTaskData(taskId);

  } catch (error) {
    console.log("UPDATE_TASK_DOCUMENT_DATA_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTaskCaseId = async (task: any, caseId: string) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        case_id: caseId || null,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_CASE_ID_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const getWorkspaceTags = async (workspaceId: string): Promise<string[]> => {
  try {
    const supabase = clientConnectionWithSupabase();
    const { data, error } = await supabase
      .from("votum_tasks")
      .select("tags")
      .eq("workspace_id", workspaceId)
      .not("tags", "is", null);

    if (error || !data) return [];

    const unique = [...new Set(data.flatMap((row) => row.tags ?? []))].sort();
    return unique;
  } catch {
    return [];
  }
};

export const updateTaskTags = async (task: any, tags: string[]) => {
  try {
    const taskId = task?.id;
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    const supabase = clientConnectionWithSupabase();
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) throw new Error(userRes.error.message);
    const user = userRes?.data?.user;
    if (!user) throw new Error("User is not authenticated");

    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) throw new Error(workspaceIdRes.error.message);
    const workspaceId = workspaceIdRes.data.workspace_id;
    if (!workspaceId) throw new Error("Workspace ID not found");

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        tags,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) throw new Error(taskRes.error.message);

    return { success: true, data: taskRes.data };
  } catch (error) {
    console.log("UPDATE_TASK_TAGS_ERROR: ", error);
    return { success: false, error: error.message };
  }
};

export const updateTasksSubtasks = async (task: any, updateObj: any) => {
  try {
    const taskId = task?.id;

    if (!taskId) {
      throw new Error("Task ID is required");
    }
    // Create a supabase client connection
    const supabase = clientConnectionWithSupabase();

    // Check if user is authenticated
    const userRes = await supabase.auth.getUser();

    if (userRes?.error) {
      throw new Error(userRes.error.message);
    }

    const user = userRes?.data?.user;

    if (!user) {
      throw new Error("User is not authenticated");
    }

    // Get the workspace ID
    const workspaceIdRes = await supabase
      .from("votum_users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (workspaceIdRes.error) {
      throw new Error(workspaceIdRes.error.message);
    }

    const workspaceId = workspaceIdRes.data.workspace_id;

    if (!workspaceId) {
      throw new Error("Workspace ID not found");
    }

    const taskRes = await supabase
      .from("votum_tasks")
      .update({
        ...updateObj,
        last_updated_by: user.id,
        last_updated_time: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select(
        "*, approver_user:approver_id(id,name), assigned_to_user:assigned_to(id,name), assigned_by_user:assigned_by(id,name), last_updated_by_user:last_updated_by(id,name)"
      )
      .maybeSingle();

    if (taskRes.error) {
      throw new Error(taskRes.error.message);
    }

    const taskData = taskRes.data;

    return { success: true, data: taskData };
  } catch (error) {
    console.log("UPDATE_TASK_NAME_ERROR: ", error);
    return { success: false, error: error.message };
  }
};
