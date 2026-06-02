"use client";
import { newCreateNewTask } from "@/apiReq/newAPIs/Task";
import TaskModal from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/button";
import useWorkspaceUsers from "@/hooks/useWorkspaceUsers";
import { cn } from "@/lib/utils";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NewTaskFromDocument from "./new-task-from-document";

const NewTask: React.FC<any> = (props) => {
  const {
    setListTasks,
    ListTasks,
    bigAPIrequest,
    userData,
    suggestedTaskDetails,
    refreshTasks,
    containerClassName,
    newButtonClassName,
    newButtonLabel = "New Task",
    fromDocumentButtonClassName,
    fromDocumentButtonVariant = "outline",
    isOpen = false,
    initialCaseId,
  } = props;

  const workspaceUsers = useWorkspaceUsers();

  const [newTaskCreateBox, setNewTaskCreateBox] = useState<boolean>(isOpen);
  const [taskSaveLoader, setTaskSaveLoader] = useState<boolean>(false);

  const [taskName, setTaskName] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [emailMessageId, setEmailMessageId] = useState<string>("");

  const buildDefaultDates = () => {
    const start = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 14);
    return { start, due };
  };

  const [taskStatus, setTaskStatus] = useState<string>("0");
  const [priority, setPriority] = useState<string>("Low");
  const [startDate, setStartDate] = useState<Date | null>(buildDefaultDates().start);
  const [dueDate, setDueDate] = useState<Date | null>(buildDefaultDates().due);

  const [selectedAssignees, setSelectedAssignees] = useState<Array<{ id: string; name: string }>>([]);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState<boolean>(false);

  const [selectedCase, setSelectedCase] = useState<{ id: string; trade_name: string }>({
    id: initialCaseId || "",
    trade_name: "",
  });

  const [documentList, setDocumentList] = useState<File[]>([]);
  const [ccUsers, setCcUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Single assignee compat for API (first selected)
  const assignee = selectedAssignees[0] ?? null;

  const base64ToBlob = async (
    downloadLink: string,
    mimeType: string,
    fileName: string,
  ): Promise<File> => {
    const response = await fetch(downloadLink);
    const blob = await response.blob();
    return new File([blob], fileName, { type: mimeType });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (localStorage.getItem("mailTask")) {
        const { task, attachments }: any = JSON.parse(localStorage.getItem("mailTask")!);
        setTaskName(task.task_title);
        setEmailMessageId(task.email_message_id);
        setTaskDescription(task.task_content || "");

        try {
          if (attachments?.length > 0) {
            const uniqueFilenames = new Set<string>();
            const blobs = await Promise.all(
              attachments.map(async (element: any) => {
                const file = await base64ToBlob(element.downloadLink, element.mimeType, element.filename);
                if (!uniqueFilenames.has(file.name)) {
                  uniqueFilenames.add(file.name);
                  return file;
                }
                return null;
              }),
            );
            const uniqueBlobs = blobs.filter((b): b is File => b !== null);
            setDocumentList((prev) => [...prev, ...uniqueBlobs]);
          }
          setNewTaskCreateBox(true);
          localStorage.removeItem("mailTask");
        } catch (error) {
          console.error("Error processing attachments:", error);
        }
      }
    };
    fetchData();
  }, [userData]);

  useEffect(() => {
    if (isOpen) setNewTaskCreateBox(true);
  }, [isOpen]);

  useEffect(() => {
    setSelectedCase({ id: initialCaseId || "", trade_name: "" });
  }, [initialCaseId]);

  useEffect(() => {
    if (suggestedTaskDetails) {
      setTaskName(suggestedTaskDetails.title);
      setTaskDescription(suggestedTaskDetails.description || "");
      setNewTaskCreateBox(true);
    }
  }, [suggestedTaskDetails]);

  const resetForm = () => {
    setTaskName("");
    setTaskDescription("");
    setEmailMessageId("");
    setTaskStatus("0");
    setPriority("Low");
    const { start, due } = buildDefaultDates();
    setStartDate(start);
    setDueDate(due);
    setSelectedAssignees([]);
    setAutoAssignEnabled(false);
    setSelectedCase({ id: "", trade_name: "" });
    setDocumentList([]);
    setCcUsers([]);
  };

  const saveTask = async () => {
    setTaskSaveLoader(true);

    if (!userData?.workspace_id) {
      toast.error("User data is missing. Please log in again.", {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
      setTaskSaveLoader(false);
      return;
    }

    const obj: any = {
      name: taskName.length !== 0 ? taskName : "Untitled",
      status: taskStatus,
      startDate,
      dueDate,
      priority,
      taskContent: taskDescription,
      sub_tasks: [],
      workspace_id: userData.workspace_id,
      last_updated_by: userData.id,
      last_updated_time: new Date(),
      email_message_id: emailMessageId,
    };

    if (assignee?.id) obj.assigned_to = assignee.id;
    if (selectedCase.id) obj.case_id = selectedCase.id;

    const result = await newCreateNewTask(obj, documentList);

    if (!result.success) {
      toast.error(result.resultOftaskCreation.error.message, {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
      setTaskSaveLoader(false);
      return;
    }

    if (props.suggestedTaskId) {
      const supabase = clientConnectionWithSupabase();
      await supabase.from("votum_suggested_tasks").delete().eq("id", props.suggestedTaskId);
    }

    setListTasks([result.resultOftaskCreation.data[0], ...ListTasks]);
    setTaskSaveLoader(false);

    setTimeout(() => {
      resetForm();
      setNewTaskCreateBox(false);
      if (props.onTaskCreated) props.onTaskCreated();
    }, 50);

    toast.success("Task created successfully", {
      position: "top-right",
      autoClose: 5000,
      theme: "colored",
    });
  };

  return (
    <div className={cn("flex items-center gap-2", containerClassName)}>
      {taskSaveLoader && (
        <div className="fixed inset-0 bg-black/10 z-[1000000000] flex justify-center items-center">
          <ClipLoader color={"#6680ff"} loading={true} size={70} aria-label="Loading Spinner" />
        </div>
      )}

      <Button
        className={cn(
          "h-10 rounded-full bg-[#4f46e5] px-4 text-sm font-semibold text-white shadow-[0_12px_32px_-16px_rgba(79,70,229,0.9)] transition hover:-translate-y-[1px] hover:bg-[#4338ca] focus-visible:ring-2 focus-visible:ring-offset-0 createNewTaskButtonTaskSection",
          newButtonClassName,
        )}
        onClick={() => {
          if (bigAPIrequest === false) setNewTaskCreateBox(true);
        }}
      >
        <Plus size={18} />
        <h2 className="tracking-wide text-sm font-semibold">{newButtonLabel}</h2>
      </Button>

      <TaskModal
        open={newTaskCreateBox}
        onOpenChange={(open) => setNewTaskCreateBox(open)}
        mode="new"
        taskName={taskName}
        onTaskNameChange={setTaskName}
        taskDescription={taskDescription}
        onTaskDescriptionChange={setTaskDescription}
        taskStatus={taskStatus}
        onTaskStatusChange={setTaskStatus}
        priority={priority}
        onPriorityChange={setPriority}
        startDate={startDate}
        onStartDateChange={setStartDate}
        dueDate={dueDate}
        onDueDateChange={setDueDate}
        assignee={assignee}
        onAssigneeChange={(userId) => {
          const user = (workspaceUsers as any[]).find((u) => u.id === userId);
          if (user) setSelectedAssignees([{ id: user.id, name: user.name }]);
        }}
        workspaceUsers={workspaceUsers as any[]}
        selectedAssignees={selectedAssignees}
        onSelectedAssigneesChange={setSelectedAssignees}
        autoAssignEnabled={autoAssignEnabled}
        onAutoAssignChange={setAutoAssignEnabled}
        subtasks={[]}
        availableTasks={[]}
        onAddSubtask={async () => {}}
        onRemoveSubtask={async () => {}}
        selectedCase={selectedCase.id ? selectedCase : null}
        onCaseChange={(c) => setSelectedCase(c ?? { id: "", trade_name: "" })}
        documents={documentList.map((f) => ({ name: f.name, size: f.size, type: f.type }))}
        onDocumentAdd={async (file) => {
          const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            toast.error(`Unsupported file type: ${file.name}`, { position: "top-right", autoClose: 5000, theme: "colored" });
            return Promise.reject();
          }
          setDocumentList((prev) => [...prev, file]);
        }}
        onDocumentRemove={async (doc) => {
          setDocumentList((prev) => prev.filter((f) => f.name !== doc.name));
        }}
        ccUsers={ccUsers}
        onCCUsersChange={setCcUsers}
        onSave={saveTask}
        onCancel={() => {
          resetForm();
          setNewTaskCreateBox(false);
        }}
        isLoading={taskSaveLoader}
      />

      <NewTaskFromDocument
        refreshTasks={refreshTasks}
        buttonClassName={cn(
          "h-10 rounded-full border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_6px_20px_-12px_rgba(15,23,42,0.4)] transition hover:-translate-y-[1px] hover:bg-slate-50",
          fromDocumentButtonClassName,
        )}
        buttonVariant={fromDocumentButtonVariant}
      />
    </div>
  );
};

export default NewTask;
