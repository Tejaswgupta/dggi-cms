"use client";
import { autoAssignTasks, getTasks } from "@/apiReq/newAPIs/Task";
import { TASK_STATUS_LABELS } from "@/constants/task";
import { deleteTaskData } from "@/apiReq/newAPIs/task-new";
import { useTasksStore } from "@/stores/tasks-store";

import NewTask from "@/components/homeComponent/tasks/newTask";
import SkeletonComponentForTaskView from "@/components/homeComponent/tasks/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import {
  Columns3,
  Download,
  ListTodo,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SyncLoader } from "react-spinners";

import NewListViewComponent from "@/components/homeComponent/tasks/newlistview/component";

import clientConnectionWithSupabase from "@/lib/supabase/client";
import { FaQuestionCircle } from "react-icons/fa";

import SuggestedTasksView from "@/components/homeComponent/tasks/suggested/SuggestedTasksView";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getWorkspaceId } from "@/lib/action/workspace";
import { Info, Lightbulb } from "lucide-react";

import { toast } from "react-toastify";

const Component = () => {
  const tasksCache = useTasksStore();
  const [activeTab, setActiveTab] = useState<string>("list");
  const [skeletonShow, setSkeletonShow] = useState<boolean>(true);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const searchParams = useSearchParams();
  const openTaskSheetFromQuery = searchParams.get("newTask") === "true";
  const initialCaseId = searchParams.get("caseId") || "";

  const [userData, setUserData] = useState<{
    id: string;
    workspace_id: string;
  }>();

  const [listViewSelected, setListViewSelected] = useState<any>([]);

  const [bigAPIrequest, setBigAPIrequest] = useState(false);

  const [listTasks, setListTasks] = useState<any>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [isDeletingMultipleTasks, setIsDeletingMultipleTasks] = useState(false);
  const [selectionResetKey, setSelectionResetKey] = useState(0);

  const [skeletonLoaderForTable, setSkeletonLoaderForTable] =
    useState<boolean>(false);

  const tasksFetched = useRef(false); // Ref to prevent duplicate fetching/creation

  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const [suggestedTaskDetails, setSuggestedTaskDetails] = useState<{
    title: string;
    description: string;
    taskId: string;
  } | null>(null);

  const [lastEmailSyncTimestamp, setLastEmailSyncTimestamp] =
    useState<Date | null>(null);
  const [syncingSuggestedTasks, setSyncingSuggestedTasks] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const supabase = clientConnectionWithSupabase();

  useEffect(() => {
    let isMounted = true;

    // Show cached data immediately if available
    if (tasksCache.tasks.length > 0) {
      setListTasks(tasksCache.tasks);
      setSkeletonShow(false);
      setIsLoading(false);
    }

    // Skip fetch if cache is fresh
    if (!tasksCache.isStale()) return;

    const fetchTasks = async () => {
      if (isMounted && !tasksFetched.current) {
        tasksFetched.current = true;
        await getTaskFromSupabase();
      }
    };

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedTaskIds(new Set());
    setSelectionResetKey((prev) => prev + 1);
  }, [listTasks]);

  useEffect(() => {
    const fetchSuggestedTasks = async () => {
      if (userData?.id) {
        const result = await getSuggestedTasks(userData.id);
        if (result.success) {
          setSuggestedTasks(result.data);
        }
        setLoadingSuggestions(false);
      }
    };

    if (userData?.id) {
      fetchSuggestedTasks();
    }
  }, [userData]);

  useEffect(() => {
    const fetchLastSync = async () => {
      if (!userData?.id) return;
      const { data, error } = await supabase
        .from("votum_user_tokens")
        .select("last_email_sync_timestamp")
        .eq("user_id", userData.id)
        .maybeSingle();
      if (data && data.last_email_sync_timestamp) {
        setLastEmailSyncTimestamp(new Date(data.last_email_sync_timestamp));
      }
    };
    fetchLastSync();
  }, [userData]);

  useEffect(() => {
    if (openTaskSheetFromQuery) {
      setIsTaskSheetOpen(true);
    }
  }, [openTaskSheetFromQuery]);

  const getSuggestedTasks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("votum_suggested_tasks")
        .select("id, task_details")
        .eq("user_id", userId);

      console.log(`suggested tasks:`, data, userId);

      if (error) {
        console.log("error", error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("Error fetching suggested tasks:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const getTaskFromSupabase = async () => {
    // Fetch workspace and current user in parallel — they don't depend on each other
    const [workspaceId, { data: { user } }] = await Promise.all([
      getWorkspaceId(),
      supabase.auth.getUser(),
    ]);
    const userID = user?.id;

    // Team membership depends on userID, fetch it next
    const { data: teamData } = await supabase
      .from("votum_team_members")
      .select("team_id")
      .eq("user_id", userID);

    const teamIds = (teamData ?? []).map((team: any) => team.team_id);

    // Pass userID so getTasks skips its own auth.getUser() call
    const result: any = await getTasks(workspaceId, teamIds, userID);
    setListTasks(result.listTasks);
    tasksCache.setTasks(result.listTasks);

    setUserData({ id: userID, workspace_id: workspaceId });
    setSkeletonShow(false);
    setIsLoading(false);
  };

  const handleSyncSuggestedTasks = async () => {
    // if (!userData?.id) return;
    // setSyncingSuggestedTasks(true);
    // try {
    //   const formData = new FormData();
    //   formData.append("user_id", userData.id);
    //   // Call external API to trigger sync
    //   const response = await fetch("https://api.thevotum.com/sync_emails/", {
    //     method: "POST",
    //     body: formData,
    //   });
    //   if (!response.ok) {
    //     throw new Error("Failed to sync emails");
    //   }
    //   // Optionally, you can check response.json() for more info
    //   // After successful sync, update timestamp in votum_user_tokens
    //   const now = new Date();
    //   await supabase
    //     .from("votum_user_tokens")
    //     .update({ last_email_sync_timestamp: now.toISOString() })
    //     .eq("user_id", userData.id);
    //   setLastEmailSyncTimestamp(now);
    //   // Optionally, refetch suggested tasks
    //   if (userData?.id) {
    //     const result = await getSuggestedTasks(userData.id);
    //     if (result.success) {
    //       setSuggestedTasks(result.data);
    //     }
    //   }
    // } catch (error) {
    //   // Optionally, show error to user
    //   console.error("Sync error:", error);
    // }
    // setSyncingSuggestedTasks(false);
  };

  const handleAutoAssignTasks = async () => {
    if (!userData?.workspace_id) {
      toast.error("Workspace ID not found");
      return;
    }

    setAutoAssigning(true);
    try {
      const result = await autoAssignTasks(userData.workspace_id);

      if (result.success) {
        toast.success(result.message);
        // Refresh the task list to show the newly assigned tasks
        await getTaskFromSupabase();
      } else {
        toast.error(result.error || "Failed to auto-assign tasks");
      }
    } catch (error: any) {
      console.error("Auto-assign error:", error);
      toast.error(error.message || "Failed to auto-assign tasks");
    }
    setAutoAssigning(false);
  };

  const handleSelectionChange = useCallback(
    (selected: Set<string>) => {
      setSelectedTaskIds(new Set(selected));
    },
    [setSelectedTaskIds],
  );

  const handleDeleteSelectedTasks = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;
    if (!userData?.id) {
      toast.error("User data not found");
      return;
    }

    setIsDeleteAlertOpen(true);
  }, [selectedTaskIds, userData]);

  const confirmDeleteSelectedTasks = useCallback(async () => {
    setIsDeletingMultipleTasks(true);
    try {
      const tasksToDelete = listTasks.filter(
        (task) =>
          selectedTaskIds.has(task.id) &&
          task.created_by_user?.id === userData.id,
      );

      if (tasksToDelete.length === 0) {
        toast.error("You can only delete tasks that you created.");
        setIsDeleteAlertOpen(false);
        return;
      }

      const skipped = selectedTaskIds.size - tasksToDelete.length;
      if (skipped > 0) {
        toast.warn(
          `You can only delete tasks that you created. Skipping ${skipped} task(s).`,
        );
      }

      const deleteIds = new Set(tasksToDelete.map((task) => task.id));

      await Promise.all(tasksToDelete.map((task) => deleteTaskData(task.id)));

      setListTasks((prev) => prev.filter((task) => !deleteIds.has(task.id)));

      setSelectedTaskIds(new Set());
      setIsDeleteAlertOpen(false);
      toast.success("Tasks deleted successfully");
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast.error(error?.message || "Failed to delete selected tasks");
    } finally {
      setIsDeletingMultipleTasks(false);
    }
  }, [listTasks, selectedTaskIds, setListTasks, setSelectedTaskIds, userData]);

  const exportToExcel = () => {
    const headers = [
      "Title",
      "Status",
      "Priority",
      "Due Date",
      "Assignee",
      "Created By",
      "CC Users",
      "Description",
      "Case ID",
    ];

    const csvContent = [
      headers.join(","),
      ...listTasks.map((task) => {
        const title = task.name || "";
        const status = TASK_STATUS_LABELS[task.status] || "Unknown";
        const priority = task.priority || "";
        const dueDate = task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : "";
        const assignee = task.assigned_to?.name || "Unassigned";
        const createdBy = task.created_by_user?.name || "";
        const ccUsers = task.cc_users?.map((u) => u.name).join("; ") || "";

        // Parse taskContent if it exists
        let description = "";
        if (task.taskContent) {
          try {
            const content = JSON.parse(task.taskContent);
            description = content
              .map((block: any) => {
                if (block.type === "paragraph" && block.content) {
                  return block.content
                    .map((text: any) => text.text || "")
                    .join("");
                }
                return "";
              })
              .join("\n")
              .replace(/"/g, '""')
              .substring(0, 500); // Limit description length
          } catch {
            description = (task.taskContent || "")
              .replace(/"/g, '""')
              .substring(0, 500);
          }
        }

        const caseId = task.case_id || "";

        return [
          `"${title.replace(/"/g, '""')}"`,
          `"${status}"`,
          `"${priority}"`,
          `"${dueDate}"`,
          `"${assignee.replace(/"/g, '""')}"`,
          `"${createdBy.replace(/"/g, '""')}"`,
          `"${ccUsers.replace(/"/g, '""')}"`,
          `"${description}"`,
          `"${caseId}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tasks_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Tasks exported successfully");
  };

  const focusSearchControls = () => {
    if (typeof window === "undefined") return;

    const searchContainer = document.getElementById("tasks-search-header");
    if (searchContainer) {
      searchContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      const searchInput = searchContainer.querySelector("input");
      if (searchInput instanceof HTMLInputElement) {
        searchInput.focus();
      }
    }
  };

  const taskCount = listTasks?.length ?? 0;

  return (
    <>
      {bigAPIrequest === true && (
        <div className="absolute z-[100000] w-[100vw] h-[100vh] bg-[rgba(0,0,0,0.4)] flex justify-center items-center">
          <SyncLoader
            color={"#f7f8fc"}
            loading={true}
            size={13}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}

      {/* Add Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000001]">
          <div className="bg-white border border-[#EDEDEA] rounded-2xl shadow-none p-4 max-w-4xl w-full mx-4 relative font-['DM_Sans']">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 rounded-lg border border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"
              onClick={() => setShowTutorial(false)}
            >
              ✕
            </Button>
            <h2 className="text-xl font-semibold mb-4 text-[#1a1a1a]">How to use Tasks</h2>
            <video
              controls
              className="w-full rounded-lg"
              src="/tutorial/Tasks.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      <div className="w-full h-full pt-4 bg-white font-['DM_Sans']">
        <Tabs defaultValue="list" className="flex h-full w-full flex-col">
          <div className="px-3 sm:px-6">
            <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none">
              <div className="space-y-3 px-3 sm:px-5 pb-3 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-medium text-[#1a1a1a]">
                      Tasks
                    </h1>
                    {/* <span className="text-sm text-slate-500">
                      • {taskCount} {taskCount === 1 ? "item" : "items"}
                    </span> */}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg border border-[#EDEDEA] bg-white text-[#6b6b6b] hover:bg-[#F3F2EF] shadow-none"
                      onClick={() => setShowTutorial(true)}
                    >
                      <FaQuestionCircle className="h-4 w-4" />
                    </Button>
                    <NewTask
                      userData={userData}
                      bigAPIrequest={bigAPIrequest}
                      setBigAPIrequest={setBigAPIrequest}
                      listViewSelected={listViewSelected}
                      setListViewSelected={setListViewSelected}
                      setListTasks={setListTasks}
                      ListTasks={listTasks}
                      suggestedTaskDetails={suggestedTaskDetails}
                      suggestedTaskId={suggestedTaskDetails?.taskId}
                      isOpen={isTaskSheetOpen}
                      initialCaseId={initialCaseId || undefined}
                      onTaskCreated={() => {
                        setSuggestedTaskDetails(null);
                        if (suggestedTaskDetails?.taskId) {
                          setSuggestedTasks(
                            suggestedTasks.filter(
                              (task) => task.id !== suggestedTaskDetails.taskId,
                            ),
                          );
                        }
                      }}
                      containerClassName="flex items-center gap-2"
                      newButtonLabel="New Task"
                      newButtonClassName="h-10 px-4"
                      fromDocumentButtonVariant="ghost"
                      fromDocumentButtonClassName="h-10 px-4 border border-[#EDEDEA] bg-white text-sm text-[#6b6b6b] rounded-lg hover:bg-[#F3F2EF] shadow-none"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-lg border border-[#EDEDEA] bg-white text-[#6b6b6b] hover:bg-[#F3F2EF] shadow-none"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl border border-[#EDEDEA] bg-white shadow-none p-1">
                        <DropdownMenuItem
                          onClick={handleAutoAssignTasks}
                          disabled={autoAssigning}
                          className="flex items-center gap-2 text-sm"
                        >
                          {autoAssigning ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                          <span>
                            {autoAssigning ? "Assigning..." : "Auto Assign"}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsDeleteAlertOpen(true)}
                          disabled={
                            selectedTaskIds.size === 0 ||
                            isDeletingMultipleTasks
                          }
                          className="flex items-center gap-2 text-sm"
                        >
                          {isDeletingMultipleTasks ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              <span>
                                Delete selected ({selectedTaskIds.size})
                              </span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={exportToExcel}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export to Excel</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled
                          className="flex items-center gap-2 text-sm text-[#b0b0aa]"
                        >
                          <Columns3 className="h-4 w-4" />
                          <span>Manage columns</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDEDEA] pt-3">
                  <TabsList className="bg-transparent p-0">
                    <TabsTrigger
                      className="rounded-none border-b-2 border-transparent px-3 pb-2 text-sm text-[#9a9a96] transition-colors hover:text-[#6b6b6b] data-[state=active]:border-[#4A5FD4] data-[state=active]:text-[#1a1a1a] data-[state=active]:font-medium"
                      value="list"
                      onClick={(e) => setActiveTab("list")}
                    >
                      <ListTodo
                        style={
                          activeTab === "list"
                            ? { color: "#4A5FD4" }
                            : { color: "#9a9a96" }
                        }
                        size={15}
                      />
                      List
                    </TabsTrigger>

                    <TabsTrigger
                      className="rounded-none border-b-2 border-transparent px-3 pb-2 text-sm text-[#9a9a96] transition-colors hover:text-[#6b6b6b] data-[state=active]:border-[#4A5FD4] data-[state=active]:text-[#1a1a1a] data-[state=active]:font-medium"
                      value="suggested"
                      onClick={(e) => setActiveTab("suggested")}
                      disabled={isLoading}
                    >
                      <Lightbulb
                        style={
                          activeTab === "suggested"
                            ? { color: "#4A5FD4" }
                            : { color: "#9a9a96" }
                        }
                        size={15}
                      />
                      Suggested
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="list" className="flex-1 bg-white">
            {skeletonShow === true ? (
              <SkeletonComponentForTaskView />
            ) : listTasks?.length == 0 ? (
              <div className="flex max-h-[500px] w-full flex-col items-center justify-center gap-3 py-16 sm:py-[100px] bg-white">
                <h1 className="text-center text-2xl font-[600] text-[#6b6b6b]">
                  No tasks found
                </h1>
                <h2 className="w-[330px] text-center text-[0.87rem] text-[#b0b0aa]">
                  Track tasks to better manage your firm&apos;s productivity.
                </h2>
                <Button
                  className="flex items-center justify-center gap-1 bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-sm font-medium rounded-lg px-4 py-2 shadow-none"
                  onClick={(e) => {
                    e.preventDefault();
                    const createNewtaskAlert: any = document.querySelector(
                      ".createNewTaskButtonTaskSection",
                    );
                    if (createNewtaskAlert) {
                      createNewtaskAlert.click();
                    }
                  }}
                >
                  Create New task
                </Button>
              </div>
            ) : (
              <div className="px-3 sm:px-6 pb-6 pt-4 bg-white">
                <NewListViewComponent
                  ListTasks={listTasks}
                  setListTasks={setListTasks}
                  skeletonLoaderForTable={skeletonLoaderForTable}
                  setSkeletonLoaderForTable={setSkeletonLoaderForTable}
                  userData={userData}
                  onSelectionChange={handleSelectionChange}
                  selectionResetKey={selectionResetKey}
                  showIndexColumn
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggested" className="flex-1 bg-white">
            <div className="px-3 sm:px-6 pb-6 pt-4 bg-white">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="flex items-center gap-1 text-lg font-semibold text-[#1a1a1a]">
                  Suggested Tasks
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="ml-1 cursor-pointer outline-none"
                      >
                        <Info
                          size={16}
                          className="text-[#b0b0aa] hover:text-[#9a9a96]"
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      These are tasks that AI suggests by reading your email.
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 flex h-8 items-center gap-1 px-3 text-xs bg-white border border-[#EDEDEA] text-[#6b6b6b] rounded-lg hover:bg-[#F3F2EF] shadow-none"
                  onClick={handleSyncSuggestedTasks}
                  disabled={syncingSuggestedTasks}
                >
                  <RefreshCw
                    className={syncingSuggestedTasks ? "animate-spin" : ""}
                    size={12}
                  />
                  {syncingSuggestedTasks ? "Syncing..." : "Sync"}
                </Button>
              </div>
              {lastEmailSyncTimestamp && (
                <div className="text-xs text-[#9a9a96]">
                  Last sync:{" "}
                  {formatDistanceToNow(lastEmailSyncTimestamp, {
                    addSuffix: true,
                  })}
                </div>
              )}
              <SuggestedTasksView
                suggestedTasks={suggestedTasks}
                isLoading={loadingSuggestions}
                setSuggestedTasks={setSuggestedTasks}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none font-['DM_Sans']">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1a1a1a] font-semibold">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6b6b6b] text-sm">
              Are you sure you want to delete {selectedTaskIds.size} selected
              task(s)?
              {(() => {
                const tasksToDelete = listTasks.filter(
                  (task) =>
                    selectedTaskIds.has(task.id) &&
                    task.created_by_user?.id === userData?.id,
                );
                const skipped = selectedTaskIds.size - tasksToDelete.length;
                return skipped > 0
                  ? ` Note: ${skipped} task(s) will be skipped as you can only delete tasks you created.`
                  : "";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMultipleTasks} className="rounded-lg border border-[#EDEDEA] bg-white text-[#6b6b6b] text-sm hover:bg-[#F3F2EF] shadow-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSelectedTasks}
              disabled={isDeletingMultipleTasks}
              className="bg-[#C0432A] hover:bg-[#A83924] text-white text-sm font-medium rounded-lg px-4 py-2 shadow-none"
            >
              {isDeletingMultipleTasks ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Component;
