import { TimeEntry } from "@/apiReq/newAPIs/time-tracking";
import { clientBackendFetch } from "@/lib/client-backend-fetch";
import AssignCaseInTask from "@/app/tasks/AssignCaseInTask";

import AssignTeamInTask from "@/app/tasks/AssignTeamsInTask";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useTimer } from "@/context/TimerContext";
import useWorkspaceUsers from "@/hooks/useWorkspaceUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import {
  ChevronDown,
  Clock,
  LoaderCircle,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { RiTeamLine } from "react-icons/ri";
import SimplifiedOCRUpload from "../homeComponent/tasks/SimplifiedOCRUpload";
import CCSelection from "./CCSelection";
import TaskFormFields from "./TaskFormFields";

// Import API functions
import { getTaskAutomationStatus } from "@/apiReq/newAPIs/task-automation";
import {
  getWorkspaceTags,
  updateTaskApprover,
  updateTaskAssignee,
  updateTaskCCUsers,
  updateTaskDueDate,
  updateTaskName,
  updateTaskPriority,
  updateTaskStartDate,
  updateTaskStatus,
  updateTaskTags,
} from "@/apiReq/newAPIs/task-new";
import {
  addTimeEntry,
  deleteTimeEntry,
  getTimeEntriesByTask,
  updateTimeEntry,
} from "@/apiReq/newAPIs/time-tracking";
import { getWorkspaceSettings } from "@/apiReq/newAPIs/workspace-settings";
import {
  customizeDateCreated,
  customizeLastUpdated,
} from "@/utils/dateRelated";
import { format, isEqual } from "date-fns";
import { DateTime } from "luxon";

interface TaskFormProps {
  // Mode
  mode: "new" | "edit";

  // Task basic info - for new tasks, this can be minimal
  taskData?: any;
  taskId?: string; // For edit mode, we'll fetch data using this ID

  // Callbacks for parent components
  onTaskUpdate?: (updatedTask: any) => void;
  onTaskNameChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;

  // Override props (optional) - if provided, these will override internal state
  overrides?: {
    taskStatus?: string | number;
    onTaskStatusChange?: (status: string) => void;
    isChangingTaskStatus?: boolean;
    startDate?: Date | null;
    onStartDateChange?: (date: Date) => void;
    dueDate?: Date | null;
    onDueDateChange?: (date: Date) => void;
    priority?: string;
    onPriorityChange?: (priority: string) => void;
    assignee?: { id: string; name: string } | null;
    onAssigneeChange?: (userId: string) => void;
    approver?: { id: string; name: string } | null;
    onApproverChange?: (userId: string) => void;
    client?: { id: string; name: string } | null;
    onClientChange?: (client: any) => void;
    case?: { id: string; trade_name: string } | null;
    onCaseChange?: (case_data: any) => void;
    onStartApprovalWorkflow?: () => void;
    ccUsers?: { id: string; name: string }[];
    onCCUsersChange?: (users: { id: string; name: string }[]) => void;
    documents?: any[];
    onDocumentAdd?: (file: File) => Promise<void>;
    onDocumentRemove?: (document: any) => Promise<void>;
    onDocumentView?: (document: any) => Promise<void>;
    isUploadingDocuments?: boolean;
    hideApproverSection?: boolean;
    hideAssigneeSection?: boolean;
    dueDateDisabled?: boolean;
  };

  // For new task mode
  initialValues?: {
    taskStatus?: string | number;
    startDate?: Date | null;
    dueDate?: Date | null;
    priority?: string;
    assignee?: { id: string; name: string } | null;
    approver?: { id: string; name: string } | null;
    client?: { id: string; name: string } | null;
    case?: { id: string; trade_name: string } | null;
    ccUsers?: { id: string; name: string }[];
    documents?: any[];
  };
}

const TaskForm: React.FC<TaskFormProps> = ({
  mode,
  taskData: propTaskData,
  taskId,
  onTaskUpdate,
  onTaskNameChange,
  overrides = {},
  initialValues = {},
}) => {
  const { toast } = useToast();
  const timer = useTimer();
  const workspaceUsersList = useWorkspaceUsers() || [];

  // Internal state
  const [internalTaskData, setInternalTaskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSelectingAssignee, setIsSelectingAssignee] = useState(false);
  const [isChangingTaskStatus, setIsChangingTaskStatus] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null);
  const [areOptionalFieldsOpen, setAreOptionalFieldsOpen] = useState(false);
  const [isDelegationWorkflowEnabled, setIsDelegationWorkflowEnabled] =
    useState(false);

  // Time tracking state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);
  const [isSavingTimeEntry, setIsSavingTimeEntry] = useState(false);
  const [newTimeDescription, setNewTimeDescription] = useState("");

  // Tags
  const [tagInput, setTagInput] = useState("");
  const [workspaceTags, setWorkspaceTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Workspace data
  const [workspaceId, setWorkspaceId] = useState<string>("");

  const workspaceUsers = [
    {
      name: "Unassigned",
      id: "",
      email: "",
    },
    ...workspaceUsersList,
  ];

  // Get the effective task data (either from props or internal state)
  const taskData = propTaskData || internalTaskData;
  console.log(`prop`, propTaskData, internalTaskData);

  // Initialize workspace ID and pre-fetch workspace tags for suggestions
  useEffect(() => {
    const initWorkspace = async () => {
      const id = await getWorkspaceId();
      setWorkspaceId(id);
      if (id) {
        const tags = await getWorkspaceTags(id);
        setWorkspaceTags(tags);
      }
    };
    initWorkspace();
  }, []);

  useEffect(() => {
    const loadWorkspaceSettings = async () => {
      try {
        const result = await getWorkspaceSettings();
        if (result.success) {
          setIsDelegationWorkflowEnabled(
            result.data.delegation_workflow_enabled || false
          );
        }
      } catch (error) {
        console.error("Error loading workspace settings:", error);
      }
    };

    loadWorkspaceSettings();
  }, []);

  // Fetch task data for edit mode - simplified dependencies
  useEffect(() => {
    if (mode === "edit" && taskId && !propTaskData) {
      fetchTaskData();
    } else if (mode === "new" && workspaceId) {
      // Initialize with default values for new task
      const currentDate = new Date();
      const dueDate = new Date(currentDate);
      dueDate.setDate(dueDate.getDate() + 14);

      setInternalTaskData({
        name: "",
        status: initialValues.taskStatus || "0",
        startDate: initialValues.startDate || currentDate,
        dueDate: initialValues.dueDate || dueDate,
        priority: initialValues.priority || "Low",
        assigned_to: initialValues.assignee?.id || "",
        assigned_to_user: initialValues.assignee || null,
        approver_id: initialValues.approver?.id || "",
        approver_user: initialValues.approver || null,
        client_id: initialValues.client?.id || "",
        case_id: initialValues.case?.id || "",
        cc_users: initialValues.ccUsers?.map((user) => user.id) || [],
        cc_users_data: initialValues.ccUsers || [],
        documents: initialValues.documents || [],
        workspace_id: workspaceId,
        created_at: new Date().toISOString(),
      });
      setIsLoading(false);
    }
  }, [mode, taskId, propTaskData, workspaceId]);

  // Fetch time entries for edit mode
  useEffect(() => {
    if (mode === "edit" && taskId) {
      fetchTimeEntries();
      loadTaskAutomationStatus();
    }
  }, [mode, taskId]);

  const fetchTaskData = async () => {
    try {
      setIsLoading(true);
      const { getTaskData } = await import("@/apiReq/newAPIs/task-new");
      const result = await getTaskData(taskId!);

      if (result.error) {
        throw new Error(result.error);
      }

      setInternalTaskData(result.data);
    } catch (error) {
      console.error("Error fetching task data:", error);
      toast({
        title: "Error fetching task data",
        description: error.message || "Failed to load task data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      setIsLoadingTimeEntries(true);
      const result = await getTimeEntriesByTask(taskId!);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch time entries");
      }

      setTimeEntries(result.data || []);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      toast({
        title: "Error fetching time entries",
        description: error.message || "Failed to load time entries",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTimeEntries(false);
    }
  };

  const loadTaskAutomationStatus = async () => {
    try {
      const { success, data } = await getTaskAutomationStatus(taskId!);
      if (success && data && data.length > 0) {
        const activeWorkflows = data.filter(
          (w) => w.status === "pending" || w.status === "in_progress"
        );
        if (activeWorkflows.length > 0) {
          setActiveWorkflow(activeWorkflows[0]);
        }
      }
    } catch (error) {
      console.error("Error loading task automation status:", error);
    }
  };

  // Debounced update function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedUpdateTaskName = useCallback(
    debounce(async (taskData: any, updateObj: any) => {
      if (mode === "edit") {
        await updateTaskName(taskData, updateObj);
      }
    }, 1000),
    [mode]
  );

  // Internal handlers
  const handleTaskNameChange = (e: any) => {
    const newName = e.target.value;
    setInternalTaskData({ ...taskData, name: newName });

    if (onTaskNameChange) {
      onTaskNameChange(e);
    }

    if (mode === "edit") {
      const updateObj = { name: newName };
      debouncedUpdateTaskName(taskData, updateObj);
    }

    if (onTaskUpdate) {
      onTaskUpdate({ ...taskData, name: newName });
    }
  };

  const handleStatusChange = async (newValue: string) => {
    if (overrides.onTaskStatusChange) {
      overrides.onTaskStatusChange(newValue);
      return;
    }

    const newStatus = Number(newValue);
    if (taskData.status === newStatus) return;

    setIsChangingTaskStatus(true);

    try {
      if (mode === "edit") {
        const updateObj: { status: number } = { status: newStatus };
        const result = await updateTaskStatus(taskData, updateObj);

        if (result.error) {
          throw new Error(result.error);
        }

        const updatedTaskData = { ...taskData, ...result.data };
        setInternalTaskData(updatedTaskData);

        if (onTaskUpdate) {
          onTaskUpdate(updatedTaskData);
        }
      } else {
        // New task mode
        const updatedTaskData = { ...taskData, status: newStatus };
        setInternalTaskData(updatedTaskData);

        if (onTaskUpdate) {
          onTaskUpdate(updatedTaskData);
        }
      }
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
    if (overrides.onStartDateChange) {
      overrides.onStartDateChange(date);
      return;
    }

    const prevDate = taskData.startDate;
    const newDate = date ? format(date, "yyyy-MM-dd") : null;

    try {
      if (!newDate) return;
      if (isEqual(prevDate, newDate)) return;

      const updatedTaskData = { ...taskData, startDate: newDate };
      setInternalTaskData(updatedTaskData);

      if (mode === "edit") {
        const updateObj = { startDate: newDate };
        const result = await updateTaskStartDate(taskData, updateObj);

        if (result.error) {
          throw new Error(result.error);
        }

        setInternalTaskData({ ...result.data });
      }

      if (onTaskUpdate) {
        onTaskUpdate(updatedTaskData);
      }
    } catch (error) {
      console.error("Error updating task start date", error);
      toast({
        title: "Error updating task start date",
        description: error.message || "Failed to update task start date",
        variant: "destructive",
      });

      setInternalTaskData({ ...taskData, startDate: prevDate });
    }
  };

  const handleDueDateChange = async (date: Date) => {
    if (overrides.onDueDateChange) {
      overrides.onDueDateChange(date);
      return;
    }

    const prevDate = taskData.dueDate;
    const newDate = date ? format(date, "yyyy-MM-dd") : null;

    try {
      if (!newDate) return;

      const start = new Date(taskData.startDate);
      const due = new Date(newDate);

      if (taskData.startDate && due < start) {
        toast({
          title: "Invalid Due Date",
          description: "Due date cannot be earlier than start date.",
          variant: "destructive",
        });
        return;
      }

      if (isEqual(prevDate, newDate)) return;

      const updatedTaskData = { ...taskData, dueDate: newDate };
      setInternalTaskData(updatedTaskData);

      if (mode === "edit") {
        const updateObj = { dueDate: newDate };
        const result = await updateTaskDueDate(taskData, updateObj);

        if (result.error) {
          throw new Error(result.error);
        }

        setInternalTaskData({ ...result.data });
      }

      if (onTaskUpdate) {
        onTaskUpdate(updatedTaskData);
      }
    } catch (error) {
      console.error("Error updating task due date", error);
      toast({
        title: "Error updating task due date",
        description: error.message || "Failed to update task due date",
        variant: "destructive",
      });

      setInternalTaskData({ ...taskData, dueDate: prevDate });
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (overrides.onPriorityChange) {
      overrides.onPriorityChange(newPriority);
      return;
    }

    const prevPriority = taskData.priority;

    try {
      const updatedTaskData = { ...taskData, priority: newPriority };
      setInternalTaskData(updatedTaskData);

      if (mode === "edit") {
        const updateObj = { priority: newPriority };
        const result = await updateTaskPriority(taskData, updateObj);

        if (result.error) {
          throw new Error(result.error || "Failed to update task priority");
        }

        setInternalTaskData({ ...result.data });
      }

      if (onTaskUpdate) {
        onTaskUpdate(updatedTaskData);
      }
    } catch (error) {
      console.error("Error updating task priority", error);
      toast({
        title: "Error updating task priority",
        description: error.message || "Failed to update task priority",
        variant: "destructive",
      });

      setInternalTaskData({ ...taskData, priority: prevPriority });
    }
  };

  const handleAssigneeChange = async (newValue: string) => {
    if (overrides.onAssigneeChange) {
      overrides.onAssigneeChange(newValue);
      return;
    }

    const prevAssignee = taskData.assigned_to;
    const newAssignee = newValue === "" ? null : newValue;

    try {
      if (newAssignee === prevAssignee) return;

      const assigneeUser = workspaceUsersList.find(
        (user) => user.id === newAssignee
      );
      const updatedTaskData = {
        ...taskData,
        assigned_to: newAssignee,
        assigned_to_user: assigneeUser || null,
      };
      setInternalTaskData(updatedTaskData);

      if (mode === "edit") {
        const updateObj = { assigned_to: newAssignee || null };
        const result = await updateTaskAssignee(taskData, updateObj);

        if (result.error) {
          throw new Error(result.error || "Failed to update task assignee");
        }

        setInternalTaskData({ ...result.data });
      }

      if (onTaskUpdate) {
        onTaskUpdate(updatedTaskData);
      }
    } catch (error) {
      console.error("Error updating task assignee", error);
      toast({
        title: "Error updating task assignee",
        description: error.message || "Failed to update task assignee",
        variant: "destructive",
      });

      setInternalTaskData({ ...taskData, assigned_to: prevAssignee });
    }
  };

  const handleApproverChange = async (newValue: string) => {
    if (overrides.onApproverChange) {
      overrides.onApproverChange(newValue);
      return;
    }

    const prevApprover = taskData.approver_id;
    const newApprover = newValue === "" ? null : newValue;

    try {
      if (newApprover === prevApprover) return;

      const approverUser = workspaceUsersList.find(
        (user) => user.id === newApprover
      );
      const updatedTaskData = {
        ...taskData,
        approver_id: newApprover,
        approver_user: approverUser || null,
      };
      setInternalTaskData(updatedTaskData);

      if (mode === "edit") {
        const updateObj = { approver_id: newApprover || null };
        const result = await updateTaskApprover(taskData, updateObj);

        if (result.error) {
          throw new Error(result.error || "Failed to update task approver");
        }

        setInternalTaskData({ ...result.data });
      }

      if (onTaskUpdate) {
        onTaskUpdate(updatedTaskData);
      }
    } catch (error) {
      console.error("Error updating task approver", error);
      toast({
        title: "Error updating task approver",
        description: error.message || "Failed to update task approver",
        variant: "destructive",
      });

      setInternalTaskData({ ...taskData, approver_id: prevApprover });
    }
  };

  const handleCCUsersChange = async (
    newCCUsers: { id: string; name: string }[]
  ) => {
    if (overrides.onCCUsersChange) {
      overrides.onCCUsersChange(newCCUsers);
      return;
    }

    const prevCCUsers = taskData.cc_users_data || [];
    const ccUserIds = newCCUsers.map((user) => user.id);

    try {
      const updatedTaskData = {
        ...taskData,
        cc_users: ccUserIds,
        cc_users_data: newCCUsers,
      };
      setInternalTaskData(updatedTaskData);

      if (mode === "edit") {
        const updateObj = { cc_users: ccUserIds };
        const result = await updateTaskCCUsers(taskData, updateObj);

        if (result.error) {
          throw new Error(result.error || "Failed to update task CC users");
        }

        setInternalTaskData({
          ...result.data,
          cc_users_data: newCCUsers,
        });
      }

      if (onTaskUpdate) {
        onTaskUpdate(updatedTaskData);
      }
    } catch (error) {
      console.error("Error updating task CC users", error);
      toast({
        title: "Error updating CC users",
        description: error.message || "Failed to update CC users",
        variant: "destructive",
      });

      setInternalTaskData({
        ...taskData,
        cc_users_data: prevCCUsers,
        cc_users: prevCCUsers.map((user) => user.id),
      });
    }
  };

  const handleTagsChange = async (newTags: string[]) => {
    const prevTags = taskData.tags || [];

    try {
      const updatedTaskData = { ...taskData, tags: newTags };
      setInternalTaskData(updatedTaskData);

      if (mode === "edit") {
        const result = await updateTaskTags(taskData, newTags);
        if (result.error) throw new Error(result.error);
        setInternalTaskData({ ...result.data });
      }

      if (onTaskUpdate) onTaskUpdate(updatedTaskData);
    } catch (error) {
      console.error("Error updating task tags", error);
      toast({
        title: "Error updating tags",
        description: error.message || "Failed to update tags",
        variant: "destructive",
      });
      setInternalTaskData({ ...taskData, tags: prevTags });
    }
  };

  const commitTagInput = () => {
    const trimmed = tagInput.trim().replace(/,+$/, "");
    if (!trimmed) return;
    const currentTags: string[] = taskData.tags || [];
    if (!currentTags.includes(trimmed)) {
      handleTagsChange([...currentTags, trimmed]);
      // Surface new tag as a suggestion for the rest of the session
      if (!workspaceTags.includes(trimmed)) {
        setWorkspaceTags((prev) => [...prev, trimmed].sort());
      }
    }
    setTagInput("");
  };

  // Transform workspaceUser into team_members format for automatic assignment
  const transformTeamMembers = (users: typeof workspaceUsersList) => {
    return users.map((user) => ({
      user_id: user.id,
      skills: user.skills ? user.skills.join(", ") : "",
    }));
  };

  const handleAutomaticAssignee = async () => {
    setIsSelectingAssignee(true);

    try {
      if (!workspaceUsersList || workspaceUsersList.length === 0) {
        throw new Error("No team members available");
      }

      const transformedMembers = transformTeamMembers(workspaceUsersList);

      const body = {
        task_description: taskData.name + " " + (taskData.taskContent || ""),
        team_members: transformedMembers,
      };

      const response = await clientBackendFetch("https://api.thevotum.com/assign_task/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const assignedUser = await response.text();

      if (!assignedUser) {
        throw new Error("No user ID returned from API");
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

      const foundUser = workspaceUsersList.find(
        (user) => user.id === cleanedUserId
      );

      if (!foundUser) {
        throw new Error("Could not find matching user for the assigned ID");
      }

      await handleAssigneeChange(foundUser.id);

      toast({
        title: "Assignee selected successfully!",
        description: `${foundUser.name} has been assigned the task!`,
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

  // Time tracking handlers
  const addTimeEntryManually = async () => {
    const hoursInput = document.getElementById(
      "manual-hours"
    ) as HTMLInputElement;
    const minutesInput = document.getElementById(
      "manual-minutes"
    ) as HTMLInputElement;
    const descriptionInput = document.getElementById(
      "manual-description"
    ) as HTMLInputElement;

    const hours = hoursInput ? parseInt(hoursInput.value || "0") : 0;
    const minutes = minutesInput ? parseInt(minutesInput.value || "0") : 0;
    const description = descriptionInput
      ? descriptionInput.value || "Work on task"
      : "Work on task";

    if (hours === 0 && minutes === 0) return;

    setIsSavingTimeEntry(true);

    try {
      const timeEntryData = {
        task_id: taskId!,
        user_id: taskData?.assigned_to,
        description,
        duration: hours * 3600 + minutes * 60,
        date: new Date().toISOString().split("T")[0],
        client_id: taskData?.client_id || null,
        workspace_id: taskData?.workspace_id,
      };

      const result = await addTimeEntry(timeEntryData);

      if (!result.success) {
        throw new Error(result.error || "Failed to add time entry");
      }

      setTimeEntries([result.data, ...timeEntries]);

      // Reset form
      if (hoursInput) hoursInput.value = "";
      if (minutesInput) minutesInput.value = "";
      if (descriptionInput) descriptionInput.value = "";

      toast({
        title: "Time entry added",
        description: "Your time has been recorded successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding time entry:", error);
      toast({
        title: "Error adding time entry",
        description: error.message || "Failed to add time entry",
        variant: "destructive",
      });
    } finally {
      setIsSavingTimeEntry(false);
    }
  };

  const handleUpdateTimeEntry = async (
    id: string,
    field: string,
    value: any
  ) => {
    try {
      const updatedEntries = timeEntries.map((entry) => {
        if (entry.id === id) {
          return { ...entry, [field]: value };
        }
        return entry;
      });

      setTimeEntries(updatedEntries);

      const updateResult = await updateTimeEntry(id, { [field]: value });

      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to update time entry");
      }
    } catch (error) {
      console.error("Error updating time entry:", error);
      toast({
        title: "Error updating time entry",
        description: error.message || "Failed to update time entry",
        variant: "destructive",
      });

      fetchTimeEntries();
    }
  };

  const handleDeleteTimeEntry = async (id: string) => {
    try {
      const updatedEntries = timeEntries.filter((entry) => entry.id !== id);
      setTimeEntries(updatedEntries);

      const deleteResult = await deleteTimeEntry(id);

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || "Failed to delete time entry");
      }

      toast({
        title: "Time entry deleted",
        description: "The time entry has been removed",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast({
        title: "Error deleting time entry",
        description: error.message || "Failed to delete time entry",
        variant: "destructive",
      });

      fetchTimeEntries();
    }
  };

  // Format seconds to hh:mm:ss for timer display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      remainingSeconds.toString().padStart(2, "0"),
    ].join(":");
  };

  // Convert dates for display
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <LoaderCircle className="animate-spin" size={32} />
      </div>
    );
  }

  // Don't render if no task data
  if (!taskData) {
    return null;
  }

  console.log(
    "Rendering TaskForm with taskData:",
    overrides.documents,
    taskData.documents || []
  );

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Main task form fields (status, dates, priority, assignee) */}
      <TaskFormFields
        mode={mode}
        taskStatus={overrides.taskStatus ?? taskData.status}
        onTaskStatusChange={overrides.onTaskStatusChange ?? handleStatusChange}
        isChangingTaskStatus={
          overrides.isChangingTaskStatus ?? isChangingTaskStatus
        }
        startDate={overrides.startDate ?? convertedStartDate}
        onStartDateChange={overrides.onStartDateChange ?? handleStartDateChange}
        dueDate={overrides.dueDate ?? convertedDueDate}
        onDueDateChange={overrides.onDueDateChange ?? handleDueDateChange}
        priority={overrides.priority ?? taskData.priority}
        onPriorityChange={overrides.onPriorityChange ?? handlePriorityChange}
        assignee={
          overrides.assignee ??
          (taskData?.assigned_to_user
            ? {
                id: taskData.assigned_to,
                name: taskData.assigned_to_user.name,
              }
            : { id: "", name: "unassigned" })
        }
        onAssigneeChange={overrides.onAssigneeChange ?? handleAssigneeChange}
        workspaceUsers={workspaceUsers}
        onAutomaticAssign={handleAutomaticAssignee}
        isSelectingAssignee={isSelectingAssignee}
        hideAssigneeSection={
          overrides.hideAssigneeSection ?? isDelegationWorkflowEnabled
        }
        dueDateDisabled={overrides.dueDateDisabled ?? false}
        createdAt={
          mode === "edit"
            ? customizeDateCreated(taskData.created_at)
            : undefined
        }
      />

      {/* Documents */}
      <div className="w-full flex flex-col gap-2">
        <div className="w-full h-min-[40px] flex gap-3">
          <div className="base:w-[35%] tv:w-[28%] h-[40px] rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#777672"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M7 2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2m-2 0h-6m6 0v2m-6-2v2m0 0H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"></path>
            </svg>
            <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
              Documents
            </p>
          </div>
          <div className="base:w-[65%] tv:w-[72%] h-full flex rounded-[5px] text-[#37352f] gap-1 items-center justify-start flex-wrap">
            <SimplifiedOCRUpload
              documents={overrides.documents ?? (taskData.documents || [])}
              onDocumentAdd={
                overrides.onDocumentAdd ??
                (async (file) => {
                  // Handle document upload for both new and edit tasks
                  if (mode === "new") {
                    const updatedDocuments = [
                      ...(taskData.documents || []),
                      {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      },
                    ];
                    const updatedTaskData = {
                      ...taskData,
                      documents: updatedDocuments,
                    };
                    setInternalTaskData(updatedTaskData);
                    if (onTaskUpdate) {
                      onTaskUpdate(updatedTaskData);
                    }
                  } else if (mode === "edit") {
                    // For edit mode, optimistically update the UI first
                    const optimisticDocument = {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      uploaded_at: new Date().toISOString(),
                    };
                    const updatedDocuments = [
                      ...(taskData.documents || []),
                      optimisticDocument,
                    ];
                    const updatedTaskData = {
                      ...taskData,
                      documents: updatedDocuments,
                    };
                    setInternalTaskData(updatedTaskData);
                    if (onTaskUpdate) {
                      onTaskUpdate(updatedTaskData);
                    }

                    try {
                      // Then perform the actual upload
                      setIsUploadingDocuments(true);
                      const { addTaskDocuments } = await import(
                        "@/apiReq/newAPIs/task-new"
                      );
                      const result = await addTaskDocuments(taskData, [file]);

                      if (result.success) {
                        // Update with the actual server response
                        setInternalTaskData(result.data);
                        if (onTaskUpdate) {
                          onTaskUpdate(result.data);
                        }
                      } else {
                        // Revert optimistic update on error
                        setInternalTaskData(taskData);
                        if (onTaskUpdate) {
                          onTaskUpdate(taskData);
                        }
                        throw new Error(result.error);
                      }
                    } catch (error) {
                      console.error("Error uploading document:", error);
                      toast({
                        title: "Error uploading document",
                        description:
                          error.message || "Failed to upload document",
                        variant: "destructive",
                      });
                    } finally {
                      setIsUploadingDocuments(false);
                    }
                  }
                })
              }
              onDocumentRemove={
                overrides.onDocumentRemove ??
                (async (document) => {
                  // Handle document removal for both new and edit tasks
                  if (mode === "new") {
                    const updatedDocuments = (taskData.documents || []).filter(
                      (doc: any) => doc.name !== document.name
                    );
                    const updatedTaskData = {
                      ...taskData,
                      documents: updatedDocuments,
                    };
                    setInternalTaskData(updatedTaskData);
                    if (onTaskUpdate) {
                      onTaskUpdate(updatedTaskData);
                    }
                  } else if (mode === "edit") {
                    // For edit mode, optimistically update the UI first
                    const updatedDocuments = (taskData.documents || []).filter(
                      (doc: any) => doc.name !== document.name
                    );
                    const updatedTaskData = {
                      ...taskData,
                      documents: updatedDocuments,
                    };
                    setInternalTaskData(updatedTaskData);
                    if (onTaskUpdate) {
                      onTaskUpdate(updatedTaskData);
                    }

                    try {
                      // Then perform the actual removal
                      const { removeTaskDocument } = await import(
                        "@/apiReq/newAPIs/task-new"
                      );
                      const result = await removeTaskDocument(
                        taskData,
                        document
                      );

                      if (result.success) {
                        // Update with the actual server response
                        setInternalTaskData(result.data);
                        if (onTaskUpdate) {
                          onTaskUpdate(result?.data);
                        }
                      } else {
                        // Revert optimistic update on error
                        setInternalTaskData(taskData);
                        if (onTaskUpdate) {
                          onTaskUpdate(taskData);
                        }
                        throw new Error(result.error);
                      }
                    } catch (error) {
                      console.error("Error removing document:", error);
                      toast({
                        title: "Error removing document",
                        description:
                          error.message || "Failed to remove document",
                        variant: "destructive",
                      });
                    }
                  }
                })
              }
              onDocumentView={overrides.onDocumentView}
              isUploading={
                overrides.isUploadingDocuments ?? isUploadingDocuments
              }
            />
          </div>
        </div>
      </div>

      <Collapsible
        open={areOptionalFieldsOpen}
        onOpenChange={setAreOptionalFieldsOpen}
        className="w-full"
      >
        <div className="w-full h-[40px] flex gap-3">
          <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
            <Clock size={15} />
            <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
              Optional fields
            </p>
          </div>

          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="base:w-[65%] tv:w-[72%] border-none outline-none shadow-none justify-between"
            >
              <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                {areOptionalFieldsOpen ? "Hide" : "Show"}
              </p>
              <ChevronDown
                className={[
                  "ml-8 h-3 w-3 shrink-0 opacity-50 transition-transform",
                  areOptionalFieldsOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="w-full flex flex-col gap-2 pt-1">
          {/* CC Users */}
          <div className="w-full h-min-[40px] flex gap-3">
            <div className="base:w-[35%] tv:w-[28%] h-[40px] rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
              <FaRegUser size={15} />
              <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
                CC
              </p>
            </div>
            <div className="base:w-[65%] tv:w-[72%] flex items-center">
              <CCSelection
                ccUsers={overrides.ccUsers ?? (taskData.cc_users_data || [])}
                onCCUsersChange={
                  overrides.onCCUsersChange ?? handleCCUsersChange
                }
                workspaceUsers={workspaceUsers}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="w-full min-h-[40px] flex gap-3 items-start">
            <div className="base:w-[35%] tv:w-[28%] h-[40px] rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#777672" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
                Tags
              </p>
            </div>
            <div className="base:w-[65%] tv:w-[72%] flex flex-wrap items-center gap-1 min-h-[40px] py-1 pl-[7px] relative">
              {(taskData.tags || []).map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#edeef3] text-[#364258]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      handleTagsChange(
                        (taskData.tags || []).filter((t: string) => t !== tag)
                      )
                    }
                    className="ml-0.5 text-[#777672] hover:text-red-500 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commitTagInput();
                    setShowTagSuggestions(false);
                  } else if (e.key === "Escape") {
                    setShowTagSuggestions(false);
                  } else if (
                    e.key === "Backspace" &&
                    tagInput === "" &&
                    (taskData.tags || []).length > 0
                  ) {
                    const tags: string[] = taskData.tags || [];
                    handleTagsChange(tags.slice(0, -1));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    commitTagInput();
                    setShowTagSuggestions(false);
                  }, 150);
                }}
                placeholder={(taskData.tags || []).length === 0 ? "Add tag…" : ""}
                className="flex-1 min-w-[80px] text-[0.84rem] bg-transparent outline-none text-[#37352f] placeholder:text-[#b0b0aa]"
              />
              {showTagSuggestions && (() => {
                const currentTags: string[] = taskData.tags || [];
                const filtered = workspaceTags.filter(
                  (t) =>
                    !currentTags.includes(t) &&
                    t.toLowerCase().startsWith(tagInput.toLowerCase())
                );
                return filtered.length > 0 ? (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#EDEDEA] rounded-lg shadow-md py-1 min-w-[160px] max-h-[180px] overflow-y-auto">
                    {filtered.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleTagsChange([...currentTags, suggestion]);
                          setTagInput("");
                          setShowTagSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-[#364258] hover:bg-[#F3F2EF] transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Last Updated - only shown in edit mode */}
          {mode === "edit" &&
            taskData?.last_updated_by_user &&
            taskData?.last_updated_time && (
              <div className="w-full h-[40px] flex gap-3">
                <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
                  <Clock size={15} />
                  <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
                    Last updated
                  </p>
                </div>
                <div className="base:w-[65%] tv:w-[72%] h-full flex rounded-[5px] text-[#37352f]">
                  <div className="w-full rounded-[5px] hover:bg-[#efefef] base:text-[0.84rem] ttl:text-[0.91rem] h-full flex items-center pl-[7px]">
                    <p>
                      By {taskData.last_updated_by_user.name} at{" "}
                      {customizeLastUpdated(taskData.last_updated_time)}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Approver */}
          {!overrides.hideApproverSection && (
            <div className="w-full h-[40px] flex gap-3">
              <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
                <FaRegUser size={15} />
                <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
                  Approver
                </p>
              </div>

              {mode === "edit" && activeWorkflow ? (
                <div className="base:w-[65%] tv:w-[72%] flex items-center">
                  <div className="bg-[#edeef3] px-3 py-1 rounded-md text-[#364258] mr-2">
                    Approval Workflow Active
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/tasks/${taskId}/automation-status`)
                    }
                  >
                    View Details
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="base:w-[65%] tv:w-[72%] border-none outline-none shadow-none justify-between"
                  onClick={() => {
                    // Handle start approval workflow
                    if (overrides.onStartApprovalWorkflow) {
                      overrides.onStartApprovalWorkflow();
                    } else if (mode === "edit") {
                      // Navigate to automation dialog or trigger workflow
                      console.log("Start approval workflow for task:", taskId);
                    }
                  }}
                >
                  <div className="flex ml-[-8px] items-center gap-3">
                    <div className="bg-[#edeef3] rounded-full flex justify-center items-center w-[26px] h-[26px]">
                      <FaRegUser size={15} color="#c0c7d1" />
                    </div>
                    <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                      Start Approval Workflow
                    </p>
                  </div>
                  <span className="ml-8 h-3 w-3 shrink-0 opacity-50">›</span>
                </Button>
              )}
            </div>
          )}

          {/* Linked Case */}
          <div className="w-full h-[40px] flex gap-3">
            <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
              <FaRegUser size={15} />
              <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
                Linked Case
              </p>
            </div>

            <div className="base:w-[65%] tv:w-[72%] h-full">
              {mode === "edit" ? (
                <AssignCaseInTask
                  taskInfo={taskData}
                  setTaskInfo={(case_data) => {
                    if (overrides.onCaseChange) {
                      overrides.onCaseChange(case_data);
                    } else {
                      const updatedTaskData = {
                        ...taskData,
                        case_id: case_data?.id || "",
                      };
                      setInternalTaskData(updatedTaskData);
                      if (onTaskUpdate) {
                        onTaskUpdate(updatedTaskData);
                      }
                    }
                  }}
                />
              ) : (
                <AssignCaseInTask
                  taskInfo={{
                    case_id: overrides.case?.id || taskData.case_id || "",
                  }}
                  isNewTask={true}
                  setLinkedCase={(case_data) => {
                    if (overrides.onCaseChange) {
                      overrides.onCaseChange(case_data);
                    } else {
                      const updatedTaskData = {
                        ...taskData,
                        case_id: case_data?.id || "",
                      };
                      setInternalTaskData(updatedTaskData);
                      if (onTaskUpdate) {
                        onTaskUpdate(updatedTaskData);
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Team */}
          <div className="w-full h-[40px] flex gap-3">
            <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
              <RiTeamLine size={15} />
              <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
                Team
              </p>
            </div>
            <div className="base:w-[65%] tv:w-[72%] h-full flex items-center">
              <AssignTeamInTask
                workspace_id={workspaceId || taskData.workspace_id || ""}
                taskId={taskId || ""}
              />
            </div>
          </div>

          {/* Time Tracking - only in edit mode */}
          {mode === "edit" && (
            <>
              <div className="w-full h-[40px] flex gap-3 items-center">
                <div className="base:w-[35%] tv:w-[28%] h-full rounded-[5px] hover:bg-[#efefef] pl-[7px] flex items-center px-[3px] gap-2 font-light text-[#777672]">
                  <Clock size={15} />
                  <p className="capitalize base:text-[0.84rem] bbl:text-[0.88rem] ttl:text-[0.92rem] font-[450]">
                    Time Tracking
                  </p>
                </div>
                <div className="base:w-[65%] tv:w-[72%] flex gap-2">
                  {timer.isTimerRunning && timer.currentTaskId === taskId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 border-red-600"
                      onClick={async () => {
                        const result = await timer.stopTimer();
                        if (result.success) {
                          toast({
                            title: "Time entry saved",
                            description:
                              "Your time has been recorded successfully",
                            variant: "success",
                          });
                          await fetchTimeEntries();
                        } else {
                          toast({
                            title: "Error saving time entry",
                            description:
                              result.error || "Failed to save time entry",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={isSavingTimeEntry}
                    >
                      {isSavingTimeEntry ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : (
                        <StopCircle size={16} />
                      )}
                      <span>
                        Stop (
                        {timer.timerElapsed
                          ? formatTime(timer.timerElapsed)
                          : "00:00:00"}
                        )
                      </span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-green-600 border-green-600"
                      onClick={() =>
                        timer.startTimer(
                          taskId!,
                          newTimeDescription || "Work on task"
                        )
                      }
                      disabled={
                        isSavingTimeEntry ||
                        (timer.isTimerRunning && timer.currentTaskId !== taskId)
                      }
                    >
                      <PlayCircle size={16} />
                      <span>Start Timer</span>
                    </Button>
                  )}
                  {timer.isTimerRunning && timer.currentTaskId === taskId ? (
                    <Input
                      placeholder="What are you working on?"
                      className="w-40 h-8 text-sm"
                      value={timer.timerDescription || ""}
                      onChange={(e) => timer.updateDescription(e.target.value)}
                    />
                  ) : (
                    <Input
                      placeholder="What are you working on?"
                      className="w-40 h-8 text-sm"
                      value={newTimeDescription}
                      onChange={(e) => setNewTimeDescription(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Time tracking details accordion */}
              <div className="w-full flex gap-3 items-center mt-2">
                <div className="base:w-[35%] tv:w-[28%]"></div>
                <div className="base:w-[65%] tv:w-[72%]">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="time-tracking-details">
                      <AccordionTrigger className="py-2 text-sm">
                        Time Tracking Details
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex items-center gap-2 pt-2 mb-4">
                          <Input
                            id="manual-hours"
                            type="number"
                            min="0"
                            className="w-16 h-8 text-sm"
                            placeholder="HH"
                          />
                          <span>:</span>
                          <Input
                            id="manual-minutes"
                            type="number"
                            min="0"
                            max="59"
                            className="w-16 h-8 text-sm"
                            placeholder="MM"
                          />
                          <Input
                            id="manual-description"
                            className="w-40 h-8 text-sm"
                            placeholder="Description"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addTimeEntryManually}
                            disabled={isSavingTimeEntry}
                          >
                            {isSavingTimeEntry ? (
                              <LoaderCircle
                                className="animate-spin mr-2"
                                size={16}
                              />
                            ) : null}
                            Add Time
                          </Button>
                        </div>

                        {/* Time entries table */}
                        {isLoadingTimeEntries ? (
                          <div className="flex justify-center py-4">
                            <LoaderCircle className="animate-spin" />
                          </div>
                        ) : timeEntries.length > 0 ? (
                          <Table className="border">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[150px]">
                                  Date
                                </TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[100px]">
                                  Duration
                                </TableHead>
                                <TableHead className="w-[100px]">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {timeEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell>
                                    {entry.date
                                      ? new Date(entry.date)
                                          .toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                          })
                                          .replace(/\//g, "-")
                                      : ""}
                                  </TableCell>
                                  <TableCell>{entry.description}</TableCell>
                                  <TableCell>
                                    {formatTime(entry.duration)}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        handleUpdateTimeEntry(
                                          entry.id!,
                                          "description",
                                          entry.description
                                        )
                                      }
                                    >
                                      ✏️
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-600"
                                      onClick={() =>
                                        handleDeleteTimeEntry(entry.id!)
                                      }
                                    >
                                      🗑️
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell
                                  colSpan={2}
                                  className="text-right font-medium"
                                >
                                  Total:
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatTime(
                                    timeEntries.reduce(
                                      (total, entry) => total + entry.duration,
                                      0
                                    )
                                  )}
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No time entries yet
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default TaskForm;
