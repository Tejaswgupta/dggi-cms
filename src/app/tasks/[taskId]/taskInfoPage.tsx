"use client";

import { useTimer } from "@/context/TimerContext";
import { format, isEqual } from "date-fns";
import { DateTime } from "luxon";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { extractTextFromScannedPdf } from "@/apiReq/extract-text-from-scanned-pdf";
import TaskCustomFields from "@/components/tasks/TaskCustomFields";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { clientBackendFetch } from "@/lib/client-backend-fetch";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import MetadataSheet from "./metadata-sheet";
import TaskInfoOptions from "./task-info-options";

import {
  addTaskDocuments,
  getOtherTasks,
  getTaskData,
  removeTaskDocument,
  updateTaskApprover,
  updateTaskAssignee,
  updateTaskDocumentData,
  updateTaskDueDate,
  updateTaskName,
  updateTasksSubtasks,
  updateTaskStartDate,
  updateTaskStatus,
} from "@/apiReq/newAPIs/task-new";
import { cn } from "@/lib/utils";

import useWorkspaceUsers from "@/hooks/useWorkspaceUsers";

import { newCreateNewTask } from "@/apiReq/newAPIs/Task";
import { getTaskAutomationStatus } from "@/apiReq/newAPIs/task-automation";

const Editor = dynamic(() => import("./Editor"), { ssr: false });
const TaskForm = dynamic(() => import("@/components/tasks/TaskForm"), {
  ssr: false,
});
const SubtaskManager = dynamic(
  () => import("@/components/tasks/SubtaskManager"),
  {
    ssr: false,
  },
);

const TaskAutomationDialog = dynamic(
  () =>
    import("@/components/task-automation/task-automation-dialog").then(
      (mod) => ({
        default: mod.TaskAutomationDialog,
      }),
    ),
  { ssr: false },
);

interface TaskInfoPageProps {
  taskId: string;
  variant?: "page" | "sheet";
}

const sanitizeStorageFileName = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;
  const baseName = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = hasExtension ? fileName.slice(lastDotIndex + 1) : "";

  const safeBaseName =
    baseName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "") || "file";

  const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return safeExtension ? `${safeBaseName}.${safeExtension}` : safeBaseName;
};

/// Task Details Page
function TaskInfoPage({ taskId, variant = "page" }: TaskInfoPageProps) {
  const router = useRouter();

  const { toast } = useToast();

  // Extract the timer context at the top level
  const timer = useTimer();

  // State to store the task data
  const [taskData, setTaskData] = useState<any>(null);
  const [isSelectingAssignee, setIsSelectingAssignee] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // state to see if the task data is being fetched
  const [isFetchingTaskData, setIsFetchingTaskData] = useState(true);

  // State to see if task status is changing
  const [isChangingTaskStatus, setIsChangingTaskStatus] = useState(false);

  // State to see if document is being uploaded
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  // State to store other tasks
  const [otherTasks, setOtherTasks] = useState([]);
  const [fetchingOtherTasks, setFetchingOtherTasks] = useState(false);

  const selectedTasks = otherTasks?.filter((task) => {
    if (!taskData?.sub_tasks || taskData?.sub_tasks.length === 0) {
      return false;
    }
    return !!taskData?.sub_tasks?.find((subTask) => subTask === task.id);
  });

  const remainingTasks = otherTasks?.filter((task) => {
    if (!taskData?.sub_tasks || taskData?.sub_tasks.length === 0) {
      return true;
    }
    return !taskData?.sub_tasks?.find((subTask) => subTask === task.id);
  });

  // State to manage loading document
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // State to manage the selected document for metadata
  const [selectedMetaDocument, setSelectedMetaDocument] = useState(null);

  // State to manage fetching metadata
  const [isFetchingMetaData, setIsFetchingMetaData] = useState(false);

  const [newSubtask, setNewSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);

  // First, add a state variable for tracking the assignee popover state
  // Add this near the other state declarations at the top
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);

  // File input ref
  const fileInputRef = useRef(null);

  // Getting workspace users
  const workspaceUsersList = useWorkspaceUsers() || [];

  const workspaceUsers = [
    {
      name: "Unassigned",
      id: "",
      email: "",
    },
    ...workspaceUsersList,
  ];

  const constructDocumentUrl = (workspaceId, taskId, fileName) => {
    // If fileName already contains a URL, return it
    if (fileName && fileName.startsWith("http")) {
      return fileName;
    }

    const baseUrl =
      "https://zrkvvedwycdcjjheewef.supabase.co/storage/v1/object/public/votum_ocr_users_pdfs";
    // Use encodeURIComponent for proper encoding of URL components
    const encodedFileName = encodeURIComponent(fileName);
    return `${baseUrl}/${workspaceId}/${taskId}/${encodedFileName}`;
  };

  const convertedStartDate =
    taskData?.startDate &&
    DateTime.fromISO(`${taskData.startDate}T00:00:00`, {
      zone: "local",
    }).toJSDate();

  const convertedDueDate =
    taskData?.dueDate &&
    DateTime.fromISO(`${taskData?.dueDate}T00:00:00`, {
      zone: "local",
    }).toJSDate();

  const handleBack = () => {
    if (variant === "sheet") {
      router.back();
      return;
    }
    router.back();
    router.refresh();
  };

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedUpdateTaskName = useCallback(
    debounce(async (taskId, updateObj) => {
      await updateTaskName(taskId, updateObj);
    }, 1000),
    [],
  );

  // Memoize the onTaskUpdate callback to prevent re-renders
  const handleTaskUpdate = useCallback(
    (updatedTask) => {
      setTaskData(updatedTask);
    },
    [setTaskData],
  );

  // Memoize the handleTaskNameChange to prevent re-renders
  const memoizedHandleTaskNameChange = useCallback(
    (e: any) => {
      setTaskData({ ...taskData, name: e.target.value });

      const updateObj = {
        name: e.target.value,
      };

      // Update the task name
      debouncedUpdateTaskName(taskData, updateObj);
    },
    [taskData, debouncedUpdateTaskName],
  );

  const handleValueChange = async (newValue: string | number | null) => {
    if (!newValue || isNaN(Number(newValue))) return;

    const newStatus = Number(newValue);
    if (taskData.status === newStatus) return;

    setIsChangingTaskStatus(true);

    try {
      const updateObj: { status: number } = { status: newStatus };
      const updateTaskStatusRes = await updateTaskStatus(taskData, updateObj);

      if (updateTaskStatusRes.error) {
        throw new Error(updateTaskStatusRes.error);
      }

      const updatedTaskData = updateTaskStatusRes.data;
      setTaskData({ ...taskData, ...updatedTaskData });
    } catch (error) {
      console.error("Error updating task status", error);
      toast({
        title: "Error updating task status",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsChangingTaskStatus(false);
    }
  };

  const handleStartDateChange = async (date: Date) => {
    const prevDate = taskData.startDate;
    const newDate = date ? format(date, "yyyy-MM-dd") : null;

    try {
      if (!newDate) {
        return;
      }
      if (isEqual(prevDate, newDate)) {
        return;
      }
      //   Optimistically update the task data
      setTaskData({ ...taskData, startDate: newDate });

      const updateObj = {
        startDate: newDate,
      };

      // Update the task start date
      const updateTaskStartDateRes = await updateTaskStartDate(
        taskData,
        updateObj,
      );

      if (updateTaskStartDateRes.error) {
        throw new Error(updateTaskStartDateRes.error);
      }

      const updatedTaskData = updateTaskStartDateRes.data;

      // Update the task data
      setTaskData({ ...updatedTaskData });
    } catch (error) {
      console.log("Error updating task start date", error);
      toast({
        title: "Error updating task start date",
        description: error.message || "Failed to update task start date",
        variant: "destructive",
      });

      //   Reset the task data
      setTaskData({ ...taskData, startDate: prevDate });
    }
  };

  const handleDueDateChange = async (date: Date) => {
    const prevDate = taskData.dueDate;
    const newDate = date ? format(date, "yyyy-MM-dd") : null;

    try {
      if (!newDate) return;

      // Convert both dates to Date objects for comparison
      const start = new Date(taskData.startDate);
      const due = new Date(newDate);

      // ❗ Check: Due date cannot be before start date
      if (taskData.startDate && due < start) {
        toast({
          title: "Invalid Due Date",
          description: "Due date cannot be earlier than start date.",
          variant: "destructive",
        });
        return;
      }

      if (isEqual(prevDate, newDate)) return;

      // Optimistically update the task data
      setTaskData({ ...taskData, dueDate: newDate });

      const updateObj = { dueDate: newDate };

      const updateTaskStartDateRes = await updateTaskDueDate(
        taskData,
        updateObj,
      );

      if (updateTaskStartDateRes.error) {
        throw new Error(updateTaskStartDateRes.error);
      }

      const updatedTaskData = updateTaskStartDateRes.data;

      setTaskData({ ...updatedTaskData });
    } catch (error) {
      console.log("Error updating task due date", error);
      toast({
        title: "Error updating task due date",
        description: error.message || "Failed to update task due date",
        variant: "destructive",
      });

      // Reset the due date
      setTaskData({ ...taskData, dueDate: prevDate });
    }
  };

  const handleAssigneeChange = async (newValue) => {
    // send push notification to the assignee this newValue
    // newValue -> user_id
    const prevAssignee = taskData.assigned_to;
    const newAssignee = newValue === "" ? null : newValue;
    try {
      // If the new assignee is same as the old assignee
      if (newAssignee === prevAssignee) {
        return;
      }

      // Update the assignee
      const updateObj = {
        assigned_to: newAssignee || null,
      };

      // Optimistically update the task data
      setTaskData({ ...taskData, assigned_to: newAssignee });

      const updateTaskAssigneeRes = await updateTaskAssignee(
        taskData,
        updateObj,
      );

      if (updateTaskAssigneeRes.error) {
        throw new Error(
          updateTaskAssigneeRes.error || "Failed to update task assignee",
        );
      }

      const updatedTaskData = updateTaskAssigneeRes.data;

      setTaskData({ ...updatedTaskData });
    } catch (error) {
      console.log("Error updating task assignee", error);
      toast({
        title: "Error updating task assignee",
        description: error.message || "Failed to update task assignee",
        variant: "destructive",
      });

      setTaskData({ ...taskData, assigned_to: prevAssignee });
    }
  };
  // Function to transform workspaceUser into team_members format
  const transformTeamMembers = (users: typeof workspaceUsersList) => {
    return users.map((user) => ({
      user_id: user.id,
      skills: user.skills ? user.skills.join(", ") : "",
    }));
  };
  // Automatic assignee
  const handleAutomaticAssignee = async () => {
    setIsSelectingAssignee(true);

    try {
      console.log("Starting automatic assignment process");

      if (!workspaceUsersList || workspaceUsersList.length === 0) {
        throw new Error("No team members available");
      }

      const transformedMembers = transformTeamMembers(workspaceUsersList);
      console.log("Team members transformed:", transformedMembers);

      const body = {
        task_description: taskData.name + " " + (taskData.taskContent || ""),
        team_members: transformedMembers,
      };

      console.log("Request body:", body);

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

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const assignedUser = await response.text();

      if (!assignedUser) {
        throw new Error("No user ID returned from API");
      }

      let cleanedUserId = assignedUser;
      // Try to parse as JSON if it looks like an object
      try {
        const parsed = JSON.parse(assignedUser);
        if (parsed && typeof parsed === "object" && parsed.user_id) {
          cleanedUserId = parsed.user_id;
        }
      } catch (e) {
        // Not JSON, keep as is (string)
      }

      let selectedUserName;
      let foundUser = false;

      workspaceUsersList.forEach((user) => {
        console.log("User ID:", user.id, "Assigned User ID:", cleanedUserId);
        if (user.id === cleanedUserId) {
          console.log("Found matching user:", user.name);
          handleAssigneeChange(user.id);
          selectedUserName = user.name;
          foundUser = true;
        }
      });

      if (!foundUser) {
        console.error(
          "User ID not found in workspace users list:",
          cleanedUserId,
        );
        console.log(
          "Available users:",
          workspaceUsersList.map((u) => u.id),
        );
        throw new Error("Could not find matching user for the assigned ID");
      }

      // Close the popover after successful assignment
      setAssigneePopoverOpen(false);

      toast({
        title: "Assignee selected successfully!",
        description: `${selectedUserName} has been assigned the task!`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error assigning task automatically:", error);
      toast({
        title: "Error selecting assignee",
        description:
          error.message ||
          "Could not automatically assign the task. Please try again or assign manually.",
        variant: "destructive",
      });
    } finally {
      setIsSelectingAssignee(false);
    }
  };

  const handleApproverChange = async (newValue) => {
    const prevApprover = taskData.approver_id;
    const newApprover = newValue === "" ? null : newValue;
    try {
      // If the new assignee is same as the old assignee
      if (newApprover === prevApprover) {
        return;
      }

      // Update the assignee
      const updateObj = {
        approver_id: newApprover || null,
      };

      // Optimistically update the task data
      setTaskData({ ...taskData, approver_id: newApprover });

      const updateTaskApproverRes = await updateTaskApprover(
        taskData,
        updateObj,
      );

      if (updateTaskApproverRes.error) {
        throw new Error(
          updateTaskApproverRes.error || "Failed to update task approver",
        );
      }

      const updatedTaskData = updateTaskApproverRes.data;

      setTaskData({ ...updatedTaskData });
    } catch (error) {
      console.log("Error updating task approver", error);
      toast({
        title: "Error updating task approver",
        description: error.message || "Failed to update task approver",
        variant: "destructive",
      });

      setTaskData({ ...taskData, approver_id: prevApprover });
    }
  };

  const handleAddDocument = useCallback(
    async (file: File) => {
      // Your existing logic to add a document to the task
      await handleAddDocuments([file]);
    },
    [taskData],
  );

  const handleAddDocuments = useCallback(
    async (files: File[]) => {
      try {
        setIsUploadingDocuments(true);
        if (!files || files.length === 0) {
          toast({
            title: "No files selected",
            description: "Please select at least one file to upload.",
            variant: "destructive",
          });
          return;
        }
        // Validate file types (allow pdf, images, docx, xlsx)
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/gif",
          "image/webp",
        ];
        const allowedExtensions = [".pdf", ".docx", ".xlsx"];
        const invalidFiles = files.filter((file) => {
          const fileType = (file.type || "").toLowerCase();
          const fileName = (file.name || "").toLowerCase();
          const hasAllowedMimeType = allowedTypes.includes(fileType);
          const hasAllowedExtension = allowedExtensions.some((ext) =>
            fileName.endsWith(ext),
          );

          return !hasAllowedMimeType && !hasAllowedExtension;
        });
        if (invalidFiles.length > 0) {
          toast({
            title: "Unsupported file type",
            description: `The following files are not supported: ${invalidFiles
              .map((f) => f.name)
              .join(", ")}`,
            variant: "destructive",
          });
          return;
        }

        // Initialize Supabase client
        const supabase = clientConnectionWithSupabase();

        // Get user session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const processedFiles = [];

        for (const file of files) {
          // Create unique filename to avoid collisions
          let newFileName = file.name;
          let fileIndex = 1;
          const currentDocuments = taskData.documents || [];
          currentDocuments.forEach((doc) => {
            if (doc.name === newFileName) {
              newFileName = `(${fileIndex})-${file.name}`;
              fileIndex += 1;
            }
          });

          const newFile = new File([file], newFileName, {
            type: file.type,
            lastModified: file.lastModified,
          });

          // Keep storage keys ASCII-safe to avoid InvalidKey errors
          const safeStorageFileName = sanitizeStorageFileName(newFileName);
          const finalFilename = `${Date.now()}_${safeStorageFileName}`;
          const filePath = `${taskData.workspace_id}/${taskData.id}/${finalFilename}`;

          // Upload to Supabase storage
          const { data: fileData, error: fileError } = await supabase.storage
            .from("votum_ocr_users_pdfs")
            .upload(filePath, newFile, { upsert: true });

          if (fileError) {
            toast({
              title: "Upload failed",
              description:
                fileError.message || "Failed to upload file to storage",
              variant: "destructive",
            });
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("votum_ocr_users_pdfs")
            .getPublicUrl(filePath);

          const documentUrl = urlData?.publicUrl;
          if (!documentUrl) {
            throw new Error("Failed to get public URL for uploaded file");
          }

          // Extract text using OCR if it's an image or PDF
          let documentData = null;
          if (file.type.includes("pdf") || file.type.includes("image")) {
            try {
              // Call OCR extraction with metadata
              const result = await extractTextFromScannedPdf(
                newFile,
                "en",
                true,
                {
                  userId,
                  pdfUrl: documentUrl,
                  filename: finalFilename,
                  documentType: "task_document",
                },
              );

              if (result.success && result.extractedText) {
                documentData = result.extractedText;
              }
            } catch (ocrError) {
              console.error("OCR processing failed:", ocrError);
              toast({
                title: "OCR failed",
                description: `Could not extract text from ${newFileName}. You can still view the document, but search/metadata may be limited.`,
                variant: "destructive",
              });
              // Continue with the upload even if OCR fails
            }
          }

          // Prepare document object
          // Add document with processed data
          processedFiles.push({
            name: newFileName,
            url: documentUrl,
            document_data: documentData,
            type: file.type,
            size: file.size,
            uploaded_at: new Date().toISOString(),
          });
        }

        // Use the existing API to add documents to task
        const addFilesRes = await addTaskDocuments(taskData, processedFiles);

        if (!addFilesRes.success || addFilesRes.error) {
          let errorMsg = addFilesRes.error || "Failed to add documents.";
          if (typeof errorMsg === "object" && errorMsg.message)
            errorMsg = errorMsg.message;
          if (errorMsg && errorMsg.toLowerCase().includes("failed to fetch")) {
            errorMsg =
              "Could not connect to the server. Please check your internet connection or try again later.";
          }
          toast({
            title: "Error adding documents",
            description: errorMsg,
            variant: "destructive",
          });
          return;
        }

        const updatedTaskData = addFilesRes.data;
        setTaskData({ ...updatedTaskData });
      } catch (error) {
        let errorMsg = error?.message || "Failed to add documents.";
        if (errorMsg && errorMsg.toLowerCase().includes("failed to fetch")) {
          errorMsg =
            "Could not connect to the server. Please check your internet connection or try again later.";
        }
        console.log("Error adding documents", error);
        toast({
          title: "Error adding documents",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setIsUploadingDocuments(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [taskData],
  );

  const handleRemoveDocument = useCallback(
    async (document) => {
      try {
        if (!document) {
          return;
        }

        const currentDocuments = taskData.documents || [];

        const newDocuments = currentDocuments.filter(
          (doc) => doc.name !== document.name,
        );

        // Optimistically update the task data
        setTaskData({ ...taskData, documents: newDocuments });

        const updateObj = {
          documents: newDocuments,
        };

        const updateTaskDocumentsRes = await removeTaskDocument(
          taskData,
          document,
        );

        if (updateTaskDocumentsRes.error) {
          throw new Error(
            updateTaskDocumentsRes.error || "Failed to remove document",
          );
        }

        const updatedTaskData = updateTaskDocumentsRes.data;

        setTaskData({ ...updatedTaskData });
      } catch (error) {
        console.error("Error removing document:", error);
        toast({
          title: "Error removing document",
          description: error.message || "Failed to remove document",
          variant: "destructive",
        });

        // Revert optimistic update
        // We need to fetch the fresh data to be sure, but referencing taskData in catch
        // might refer to the state at the time of function creation, which is fine here
        // since we want to revert to *that* state.
        setTaskData({ ...taskData });
      }
    },
    [taskData],
  );

  const handleDownloadDocument = useCallback(
    async (document) => {
      try {
        setIsLoadingDocument(true);

        if (!document) return;

        const urlToFetch = document?.url?.includes("https")
          ? document.url
          : constructDocumentUrl(taskData.workspace_id, taskId, document.name);
        console.log("URL to fetch document from:", urlToFetch);

        const res = await fetch(urlToFetch);

        if (!res.ok) {
          throw new Error(`Failed to download document: ${res.statusText}`);
        }

        const blob = await res.blob();
        // Create a download link
        const downloadUrl = URL.createObjectURL(blob);

        // If the document is a PDF, open it in a new tab
        if (
          document.type === "application/pdf" ||
          document.name?.toLowerCase().endsWith(".pdf")
        ) {
          window.open(downloadUrl, "_blank");
          return;
        }

        const link = window.document.createElement("a");
        link.href = downloadUrl;
        link.download = document.name || "document";
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Error downloading document", error);
        toast({
          title: "Error downloading document",
          description: error.message || "Failed to download document",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDocument(false);
      }
    },
    [taskData, taskId],
  );

  const handleAddSubtask = async (subTaskId) => {
    const prevSubTasks = taskData.sub_tasks || [];
    const newSubTasks = [...prevSubTasks, subTaskId];

    try {
      if (!subTaskId) {
        return;
      }

      const isSubTaskAlreadyAdded = prevSubTasks.find(
        (subtasks) => subtasks === subTaskId,
      );

      if (isSubTaskAlreadyAdded) {
        return;
      }

      // Optimistically update the task data
      setTaskData({ ...taskData, sub_tasks: newSubTasks });

      const updateObj = {
        sub_tasks: newSubTasks,
      };

      const updateTaskSubTasksRes = await updateTasksSubtasks(
        taskData,
        updateObj,
      );

      if (updateTaskSubTasksRes.error) {
        throw new Error(updateTaskSubTasksRes.error || "Failed to add subtask");
      }

      const updatedTaskData = updateTaskSubTasksRes.data;

      setTaskData({ ...updatedTaskData });
    } catch (error) {
      console.log("Error adding subtask", error);
      toast({
        title: "Error adding subtask",
        description: error.message || "Failed to add subtask",
        variant: "destructive",
      });

      setTaskData({ ...taskData, sub_tasks: prevSubTasks });
    }
  };

  const handleRemoveSubtask = async (subTaskId) => {
    const prevSubTasks = taskData.sub_tasks || [];

    if (!prevSubTasks || prevSubTasks.length === 0) {
      return;
    }

    const newSubTasks = prevSubTasks.filter((subTask) => subTask !== subTaskId);
    try {
      if (!subTaskId) {
        return;
      }

      // Optimistically update the task data
      setTaskData({ ...taskData, sub_tasks: newSubTasks });

      const updateObj = {
        sub_tasks: newSubTasks,
      };

      const updateTaskSubTasksRes = await updateTasksSubtasks(
        taskData,
        updateObj,
      );

      if (updateTaskSubTasksRes.error) {
        throw new Error(updateTaskSubTasksRes.error || "Failed to add subtask");
      }

      const updatedTaskData = updateTaskSubTasksRes.data;

      setTaskData({ ...updatedTaskData });
    } catch (error) {
      console.log("Error adding subtask", error);
      toast({
        title: "Error adding subtask",
        description: error.message || "Failed to add subtask",
        variant: "destructive",
      });

      setTaskData({ ...taskData, sub_tasks: prevSubTasks });
    }
  };

  const handleTaskContentChange = async (e: any) => {
    setTaskData({ ...taskData, taskContent: e });

    const updateObj = {
      taskContent: e,
    };

    // Update the task name
    debouncedUpdateTaskName(taskData, updateObj);
  };

  const handleGenerateMetaData = async () => {
    try {
      setIsFetchingMetaData(true);
      if (!taskData.documents || taskData.documents.length === 0) {
        throw new Error("No documents to generate metadata");
      }
      if (!selectedMetaDocument) {
        throw new Error("No document selected");
      }
      const selectedDocumentDetails = taskData.documents.find(
        (document) => document.name === selectedMetaDocument,
      );
      if (!selectedDocumentDetails) {
        throw new Error("Document not found");
      }

      // Check if you have the document_data
      if (!selectedDocumentDetails.document_data) {
        // Try to get text from the document
        const documentUrl = selectedDocumentDetails?.url;
        if (!documentUrl) {
          throw new Error("Document url not found");
        }
        const ocrRes = await fetch(
          `https://api.thevotum.com/extract?url=${documentUrl}`,
          {
            method: "POST",
          },
        );
        if (!ocrRes.ok) {
          throw new Error("Failed to extract text from document");
        }
        const ocrData = await ocrRes.json();
        const ocrText = ocrData.text;
        if (!ocrText) {
          throw new Error("No text extracted from document");
        }
        selectedDocumentDetails.document_data = ocrText;

        // Update document data in task_documents
        const updateObj = {
          documents: [
            {
              ...selectedDocumentDetails,
              document_data: ocrText,
            },
          ],
        };

        const updateDocumentDataRes = await updateTaskDocumentData(
          taskData,
          updateObj,
        );

        if (updateDocumentDataRes.error) {
          throw new Error(updateDocumentDataRes.error);
        }

        const updatedTaskData = updateDocumentDataRes.data;
        // Update the task data
        setTaskData({ ...updatedTaskData });
      }

      // Generate metadata
      const metaDataRes = await fetch(
        "https://api.thevotum.com/extract_order_metadata/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: selectedDocumentDetails.document_data,
          }),
        },
      );

      if (!metaDataRes.ok) {
        throw new Error("Failed to generate metadata");
      }

      const metaData = await metaDataRes.json();

      // Update metadata in task_documents
      const updateObj = {
        documents: [
          {
            ...selectedDocumentDetails,
            metaData,
          },
        ],
      };

      const updateDocumentDataRes = await updateTaskDocumentData(
        taskData,
        updateObj,
      );

      if (updateDocumentDataRes.error) {
        throw new Error(updateDocumentDataRes.error);
      }

      const updatedTaskData = updateDocumentDataRes.data;
      // Update the task data
      setTaskData({ ...updatedTaskData });
    } catch (error) {
      console.log("Error generating metadata", error);
      toast({
        title: "Error generating metadata",
        description: error.message || "Failed to generate metadata",
        variant: "destructive",
      });
      // Reset the task data
      setTaskData({ ...taskData });
    } finally {
      setIsFetchingMetaData(false);
    }
  };

  const createSubtask = async () => {
    try {
      // Add null check for taskData and workspace_id
      if (!taskData || !taskData.workspace_id) {
        throw new Error("Task workspace information is missing");
      }

      const obj: any = {
        name: newSubtaskName.length !== 0 ? newSubtaskName : "Untitled",
        workspace_id: taskData.workspace_id,
      };
      const result = await newCreateNewTask(obj, []);
      const newSubtaskResult = result.resultOftaskCreation.data[0];
      setOtherTasks([...otherTasks, newSubtaskResult]);
      await handleAddSubtask(newSubtaskResult.id);
      setNewSubtask(false);
    } catch (error) {
      toast({
        title: "Subtask not created",
        description: error.message || "Failed to create the sub-task",
        variant: "destructive",
      });
      console.log("Error creating subtask: ", error.message);
    }
  };

  // Single effect fires all independent fetches in parallel when taskId is available
  useEffect(() => {
    if (!taskId) return;

    // Task detail (critical path — shown first)
    const fetchTaskData = async () => {
      setIsFetchingTaskData(true);
      try {
        const result = await getTaskData(taskId);
        if (result.error) throw new Error(result.error);
        setTaskData(result.data);
      } catch (error: any) {
        console.error("Error fetching task data:", error);
        toast({
          title: "Error fetching task data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsFetchingTaskData(false);
      }
    };

    // Current user ID
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await clientConnectionWithSupabase().auth.getUser();
        if (user) setCurrentUserId(user.id);
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };

    // Other tasks for subtask selector
    const fetchOtherTasksData = async () => {
      setFetchingOtherTasks(true);
      try {
        const res = await getOtherTasks(taskId);
        if (res.error) throw new Error(res.error.message);
        setOtherTasks(res.data);
      } catch (error: any) {
        console.log("Error fetching other tasks", error);
      } finally {
        setFetchingOtherTasks(false);
      }
    };

    // All independent — fire together
    Promise.all([
      fetchTaskData(),
      fetchCurrentUser(),
      fetchOtherTasksData(),
      loadTaskAutomationStatus(),
      loadWorkspaceSettings(),
    ]);
  }, [taskId]);

  const [editorKey, setEditorKey] = useState(0);

  const handleApplyTemplate = (content: string) => {
    setTaskData((prev: any) => ({ ...prev, taskContent: content }));
    setEditorKey((k) => k + 1);
    // Persist the new content
    debouncedUpdateTaskName(taskData, { taskContent: content });
  };

  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [isDelegationWorkflowEnabled, setIsDelegationWorkflowEnabled] =
    useState<boolean>(false);

  const loadWorkspaceSettings = async () => {
    try {
      const { getWorkspaceSettings } =
        await import("@/apiReq/newAPIs/workspace-settings");
      const result = await getWorkspaceSettings();
      if (result.success) {
        setIsDelegationWorkflowEnabled(
          result.data.delegation_workflow_enabled || false,
        );
      }
    } catch (error) {
      console.error("Error loading workspace settings:", error);
    }
  };

  const loadTaskAutomationStatus = async () => {
    try {
      setIsLoadingWorkflow(true);
      const { success, data } = await getTaskAutomationStatus(taskId);
      if (success && data && data.length > 0) {
        // Find the most recent active workflow
        const activeWorkflows = data.filter(
          (w) => w.status === "pending" || w.status === "in_progress",
        );

        if (activeWorkflows.length > 0) {
          setActiveWorkflow(activeWorkflows[0]);
        }
      }
    } catch (error) {
      console.error("Error loading task automation status:", error);
    } finally {
      setIsLoadingWorkflow(false);
    }
  };

  // Memoize the overrides object to prevent infinite re-renders
  const taskFormOverrides = useMemo(
    () => ({
      onStartApprovalWorkflow: () => setShowAutomationDialog(true),
      onDocumentAdd: handleAddDocument,
      onDocumentRemove: handleRemoveDocument,
      onDocumentView: handleDownloadDocument,
      isUploadingDocuments: isUploadingDocuments,
      hideApproverSection: isDelegationWorkflowEnabled,
      hideAssigneeSection: isDelegationWorkflowEnabled,
      dueDateDisabled:
        !!currentUserId &&
        !!taskData?.created_by &&
        currentUserId !== taskData.created_by,
    }),
    [
      setShowAutomationDialog,
      handleAddDocument,
      handleRemoveDocument,
      handleDownloadDocument,
      isUploadingDocuments,
      isDelegationWorkflowEnabled,
      currentUserId,
      taskData?.created_by,
    ],
  );

  if (!taskData && !isFetchingTaskData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-10">
        <div className="text-lg font-semibold text-red-600 mb-2">
          Task data not found
        </div>
        <div className="text-gray-500">
          Unable to load the task. Please try refreshing the page or contact
          support if the problem persists.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full flex flex-col bg-white",
        variant === "sheet" ? "h-full" : "h-[calc(100vh_-_4rem)] bl:h-screen",
      )}
    >
      <ScrollArea className="w-full h-full">
        <div className="w-full h-full flex flex-col items-center gap-6">
          {/* Heading + Back Button + Options Button (Delete) */}
          {variant === "page" ? (
            <div className="w-full flex items-center justify-between px-4 sm:px-[25px] py-4 sm:py-[20px]">
              <div
                className="flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] cursor-pointer transition-colors"
                onClick={handleBack}
              >
                <ArrowLeft size={16} />
                <span className="select-none">Task list</span>
              </div>
              <div className="flex justify-center items-center">
                <TaskInfoOptions
                  taskId={taskId}
                  onApplyTemplate={handleApplyTemplate}
                />
              </div>
            </div>
          ) : null}

          {/* Task Body */}
          <div className="w-full h-full flex flex-col px-4 sm:px-8 md:px-[40px] pb-[100px] items-center">
            {/* Top section max width */}
            <div
              className={cn(
                "w-full h-full flex flex-col gap-3",
                variant === "sheet"
                  ? "max-w-[860px]"
                  : "w-full md:max-w-[45vw]",
              )}
            >
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                {/* Title of task */}
                <TextareaAutosize
                  placeholder="Untitled"
                  value={taskData?.name}
                  onChange={memoizedHandleTaskNameChange}
                  className="w-full !resize-none overflow-hidden text-2xl bg-transparent font-normal break-words outline-none text-[#1a1a1a] placeholder:text-[#b0b0aa] font-['DM_Serif_Display']"
                />
                {/* Metadata button */}
                <div className="w-full sm:w-fit flex items-center gap-2 flex-shrink-0">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleAddDocuments(Array.from(e.target.files));
                      }
                    }}
                    style={{ display: "none" }}
                    accept=".pdf,.docx,.xlsx,image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingDocuments}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-[#EDEDEA] text-[#6b6b6b] text-sm rounded-lg hover:bg-[#F3F2EF] transition-colors disabled:opacity-50"
                  >
                    {isUploadingDocuments ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5b89e9] border-t-transparent" />
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">Upload Document</span>
                  </button>
                  <MetadataSheet
                    selectedMetaDocument={selectedMetaDocument}
                    setSelectedMetaDocument={setSelectedMetaDocument}
                    handleGenerateMetaData={handleGenerateMetaData}
                    isFetchingMetaData={isFetchingMetaData}
                    disabled={isFetchingMetaData}
                    taskData={taskData}
                  />
                </div>
              </div>

              <TaskForm
                mode="edit"
                taskId={taskId}
                taskData={taskData}
                onTaskUpdate={handleTaskUpdate}
                onTaskNameChange={memoizedHandleTaskNameChange}
                overrides={taskFormOverrides}
              />

              {/* Custom Fields */}
              <TaskCustomFields
                taskId={taskId}
                customFields={taskData?.custom_fields ?? {}}
                onCustomFieldsChange={(fields) =>
                  setTaskData((prev: any) => ({
                    ...prev,
                    custom_fields: fields,
                  }))
                }
              />

              {/* Sub-tasks */}
              <SubtaskManager
                mode="edit"
                availableTasks={otherTasks}
                selectedSubtaskIds={taskData?.sub_tasks || []}
                parentTaskId={taskId}
                onAddSubtask={handleAddSubtask}
                onRemoveSubtask={handleRemoveSubtask}
                onCreateSubtask={async (name) => {
                  try {
                    // Add null check for taskData and workspace_id
                    if (!taskData || !taskData.workspace_id) {
                      throw new Error("Task workspace information is missing");
                    }

                    const obj: any = {
                      name: name.length !== 0 ? name : "Untitled",
                      workspace_id: taskData.workspace_id,
                    };
                    const result = await newCreateNewTask(obj, []);
                    const newSubtaskResult =
                      result.resultOftaskCreation.data[0];
                    setOtherTasks([...otherTasks, newSubtaskResult]);
                    await handleAddSubtask(newSubtaskResult.id);
                    return Promise.resolve();
                  } catch (error) {
                    toast({
                      title: "Subtask not created",
                      description:
                        error.message || "Failed to create the sub-task",
                      variant: "destructive",
                    });
                    console.log("Error creating subtask: ", error.message);
                    return Promise.reject(error);
                  }
                }}
                isLoading={fetchingOtherTasks}
              />
            </div>

            {/* Editor + Comments */}
            <Editor
              key={editorKey}
              editable={true}
              onChange={handleTaskContentChange}
              initialContent={taskData?.taskContent}
              taskId={taskId}
              taskName={taskData?.name}
            />
          </div>
        </div>
      </ScrollArea>
      <TaskAutomationDialog
        isOpen={showAutomationDialog}
        onClose={() => setShowAutomationDialog(false)}
        taskId={taskId}
        onSuccess={loadTaskAutomationStatus}
      />
    </div>
  );
}

export default TaskInfoPage;
