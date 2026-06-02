import { newCreateNewTask } from "@/apiReq/newAPIs/Task";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_STYLES, TASK_STATUS_OPTIONS, TASK_STATUS_STYLES } from "@/constants/task";
import { Task } from "@/types/task";
import { format, isValid } from "date-fns";
import {
  Calendar as CalendarIcon,
  Check,
  Paperclip,
  Plus,
  UserRound,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type InlineTaskCreatorProps = {
  ListTasks: Task[];
  setListTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  userData?: { id: string; workspace_id: string; name?: string };
  workspaceUsers: { id: string; name: string }[];
  showIndexColumn?: boolean;
};


const cellBaseClass =
  "px-3 py-1.5 align-middle text-sm text-[#1a1a1a] first:pl-4 last:pr-4";

const InlineTaskCreator: React.FC<InlineTaskCreatorProps> = ({
  ListTasks,
  setListTasks,
  userData,
  workspaceUsers,
  showIndexColumn = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [statusValue, setStatusValue] = useState<Task["status"]>(0);
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDateValue, setDueDateValue] = useState("");
  const [priorityValue, setPriorityValue] = useState<Task["priority"]>("Low");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserName = useMemo(() => {
    const user = workspaceUsers.find((item) => item.id === userData?.id);
    return user?.name || "You";
  }, [workspaceUsers, userData?.id]);

  const resetForm = () => {
    setTaskName("");
    setTaskDescription("");
    setStatusValue(0);
    setAssigneeId("");
    setDueDateValue("");
    setPriorityValue("Low");
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(files);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!userData?.workspace_id || !userData.id) {
      toast.error("Workspace or user not ready yet. Please try again.");
      return;
    }

    setIsSaving(true);
    try {
      const taskContent = taskDescription.trim();

      const payload: any = {
        name: taskName.trim() || "Untitled",
        startDate: new Date(),
        dueDate: dueDateValue || null,
        priority: priorityValue,
        status: statusValue,
        taskContent,
        workspace_id: userData.workspace_id,
        last_updated_by: userData.id,
        last_updated_time: new Date().toISOString(),
      };

      if (assigneeId) {
        payload.assigned_to = assigneeId;
      }

      const result: any = await newCreateNewTask(payload, attachments);

      if (!result.success) {
        throw (
          result.resultOftaskCreation?.error ||
          new Error("Failed to create task")
        );
      }

      const rawTask = result.resultOftaskCreation?.data?.[0] || payload;
      const assigneeName =
        workspaceUsers.find((user) => user.id === assigneeId)?.name ||
        (assigneeId ? "Unassigned" : "");

      const hydratedTask: Task = {
        ...rawTask,
        assigned_to: assigneeId
          ? {
              id: assigneeId,
              name: assigneeName,
            }
          : null,
        created_by_user: userData?.id
          ? { id: userData.id, name: currentUserName }
          : null,
      };

      setListTasks([hydratedTask, ...ListTasks]);
      toast.success("Task saved");
      resetForm();
      setIsEditing(false);
    } catch (error: any) {
      console.error("Inline task creation failed:", error);
      toast.error(error?.message || "Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const isComposing = (event.nativeEvent as { isComposing?: boolean })
      .isComposing;
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      isComposing ||
      event.defaultPrevented
    ) {
      return;
    }

    const target = event.target as HTMLElement;
    const isTextInput =
      (target instanceof HTMLInputElement && target.type === "text") ||
      target instanceof HTMLTextAreaElement;

    if (!isTextInput || target.dataset.skipEnterSave === "true") return;

    event.preventDefault();
    handleSave();
  };

  const initialsFromName = (name: string | undefined) => {
    if (!name) return "";
    const [first, second] = name.trim().split(" ");
    const firstInitial = first?.charAt(0) ?? "";
    const secondInitial = second?.charAt(0) ?? "";
    return `${firstInitial}${secondInitial}`.toUpperCase() || firstInitial;
  };

  const isDueDatePassed = (value: string) => {
    if (!value) return false;
    return new Date(value) < new Date();
  };

  const renderPlaceholderRow = () => (
    <TableRow
      className="group h-[46px] cursor-pointer border-b border-[#F3F2EF] bg-white transition-colors hover:bg-[#FAFAF8]"
      onClick={() => setIsEditing(true)}
    >
      <TableCell className={cn(cellBaseClass, "w-[56px] pl-2")}>
        <div className="flex h-full items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-[#4A5FD4] text-[#4A5FD4]">
            <Plus size={16} />
          </div>
        </div>
      </TableCell>
      {showIndexColumn && (
        <TableCell className={cn(cellBaseClass, "w-[52px] text-[#b0b0aa]")}>
          —
        </TableCell>
      )}
      <TableCell colSpan={7} className={cn(cellBaseClass)}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#4A5FD4]">Add task</span>
          <span className="text-sm text-[#b0b0aa]">Click to create a new task</span>
        </div>
      </TableCell>
    </TableRow>
  );

  const renderEditorRow = () => (
    <TableRow
      className="group h-[46px] border-b border-[#F3F2EF] bg-white transition-colors hover:bg-[#FAFAF8]"
      onKeyDown={handleKeyDown}
    >
      <TableCell className={cn(cellBaseClass, "w-[56px] pl-2")}>
        <div className="flex h-full items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-[#DEDBD5] text-[#9a9a96]">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </TableCell>

      {showIndexColumn && (
        <TableCell className={cn(cellBaseClass, "w-[52px] text-slate-400")}>
          —
        </TableCell>
      )}

      <TableCell className={cn(cellBaseClass, "max-w-[260px]")}>
        <Input
          value={taskName}
          onChange={(event) => setTaskName(event.target.value)}
          placeholder="Task name or type / for commands"
          className="h-9 w-full rounded-lg border-[#EDEDEA] bg-white text-sm placeholder:text-[#b0b0aa] focus-visible:ring-0 focus-visible:border-[#4A5FD4]"
          disabled={isSaving}
        />
      </TableCell>

      <TableCell className={cn(cellBaseClass, "max-w-[340px]")}>
        <div className="flex min-w-0 items-center gap-2">
          <AutoResizeTextarea
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            placeholder="Add description"
            className="min-h-9 min-w-[150px] flex-1 resize-none rounded-lg border border-[#EDEDEA] bg-white px-3 py-2 text-sm placeholder:text-[#b0b0aa] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#4A5FD4]"
            disabled={isSaving}
            rows={1}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 items-center gap-1 rounded-md border border-dashed border-[#DEDBD5] px-2 text-xs font-medium text-[#6b6b6b] transition hover:border-[#4A5FD4] hover:text-[#4A5FD4]"
            disabled={isSaving}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>Files</span>
            {attachments.length > 0 && (
              <span className="rounded-full bg-[#eef2ff] px-1.5 text-[#4c5ed9]">
                {attachments.length}
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </TableCell>

      <TableCell
        className={cn(cellBaseClass, "min-w-[160px]")}
        onClick={(e) => e.stopPropagation()}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 w-full cursor-pointer justify-start gap-1 rounded-md px-0 text-left text-xs font-medium shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                !dueDateValue
                  ? "text-muted-foreground"
                  : isDueDatePassed(dueDateValue)
                    ? "text-[#C0432A]"
                    : "text-[#6b6b6b]",
              )}
              disabled={isSaving}
            >
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              {dueDateValue && isValid(new Date(dueDateValue))
                ? format(new Date(dueDateValue), "PP")
                : "Set due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                dueDateValue && isValid(new Date(dueDateValue))
                  ? new Date(dueDateValue)
                  : undefined
              }
              onSelect={(date) =>
                setDueDateValue(date ? format(date, "yyyy-MM-dd") : "")
              }
            />
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell
        className={cn(cellBaseClass, "w-[150px]")}
        onClick={(e) => e.stopPropagation()}
      >
        <Select
          value={String(statusValue)}
          onValueChange={(val) => setStatusValue(Number(val) as Task["status"])}
          disabled={isSaving}
        >
          <SelectTrigger className="h-8 w-full cursor-pointer border-none bg-transparent px-0 shadow-none ring-0 focus:ring-0 focus:ring-offset-0 overflow-hidden [&>svg]:hidden [&>*:last-child:is(svg)]:hidden">
            <div
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-full px-3 text-xs font-medium transition-all",
                TASK_STATUS_STYLES[statusValue].pill,
              )}
            >
              <span className="truncate">
                {TASK_STATUS_STYLES[statusValue].label}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={String(status.value)}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell
        className={cn(cellBaseClass, "w-[120px]")}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex h-8 w-full cursor-pointer items-center justify-center rounded-full px-3 text-xs font-medium transition hover:opacity-80 focus:outline-none",
                TASK_PRIORITY_STYLES[priorityValue].pill,
                isSaving && "opacity-70",
              )}
              title={`Priority: ${priorityValue}`}
              disabled={isSaving}
            >
              <span className="truncate">
                {TASK_PRIORITY_STYLES[priorityValue].label}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[150px]">
            {Object.entries(TASK_PRIORITY_STYLES).map(([key, style]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setPriorityValue(key as Task["priority"])}
                className="flex items-center gap-2 text-sm"
              >
                {style.label}
                {priorityValue === key && (
                  <Check className="ml-auto h-3.5 w-3.5 text-[#4A5FD4]" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      <TableCell
        className={cn(cellBaseClass, "w-[140px]")}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="group/assignee flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-0 text-left text-xs font-medium text-[#1a1a1a] focus:outline-none focus:ring-0"
              title={
                assigneeId
                  ? workspaceUsers.find((user) => user.id === assigneeId)?.name
                  : "Unassigned"
              }
              disabled={isSaving}
            >
              <div className="flex items-center">
                {assigneeId ? (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3F2EF] text-[11px] font-semibold text-[#6b6b6b]"
                    title={
                      workspaceUsers.find((user) => user.id === assigneeId)
                        ?.name
                    }
                  >
                    {initialsFromName(
                      workspaceUsers.find((user) => user.id === assigneeId)
                        ?.name,
                    )}
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[#DEDBD5] text-[11px] font-semibold text-[#9a9a96]">
                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[210px]">
            <DropdownMenuItem
              onClick={() => setAssigneeId("")}
              className="text-sm"
            >
              Unassigned
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {workspaceUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setAssigneeId(user.id)}
                className="flex items-center gap-2 text-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F2EF] text-[11px] font-semibold text-[#6b6b6b]">
                  {initialsFromName(user.name)}
                </span>
                <span className="truncate">{user.name}</span>
                {assigneeId === user.id && (
                  <Check className="ml-auto h-3.5 w-3.5 text-slate-500" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      <TableCell className={cn(cellBaseClass, "w-[160px] pr-3 text-right")}>
        <span className="text-xs font-medium text-slate-500">
          Press Enter to save, Shift+Enter for new line
        </span>
      </TableCell>
    </TableRow>
  );

  return isEditing ? renderEditorRow() : renderPlaceholderRow();
};

export default InlineTaskCreator;
