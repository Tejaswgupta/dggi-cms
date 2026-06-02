import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  CheckSquare2,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  PenLine,
  Trash2,
  UserRound,
} from "lucide-react";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ColorRing } from "react-loader-spinner";
import { toast } from "react-toastify";

import { deleteTask, makeDuplicate } from "@/apiReq/newAPIs/Task";
import {
  updateTaskAssignee,
  updateTaskDueDate,
  updateTaskPriority,
  updateTaskStatus,
} from "@/apiReq/newAPIs/task-new";
import { AlertDialogContent } from "@/components/customizedShadcn/alert";
import { TASK_PRIORITY_STYLES, TASK_STATUS_OPTIONS, TASK_STATUS_STYLES } from "@/constants/task";
import { Task, TaskRowProps } from "@/types/task";
import { format, isValid } from "date-fns";
import { TaskSideSheet } from "../TaskSideSheet";

const UNASSIGNED_VALUE = "__unassigned__";

const SOURCE_STYLES: Record<
  string,
  { label: string; icon: React.ElementType; pill: string }
> = {
  email:    { label: "Email",     icon: Mail,           pill: "bg-[#EEF2FF] text-[#4A5FD4]" },
  whatsapp: { label: "WhatsApp",  icon: MessageCircle,  pill: "bg-[#EDFAF3] text-[#1D9E75]" },
  manual:   { label: "Manual",    icon: PenLine,        pill: "bg-[#F3F2EF] text-[#6b6b6b]" },
};

const formatDateForInputValue = (dateStr: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
};

const TaskRow: React.FC<TaskRowProps> = React.memo(
  ({
    ListTasks,
    setListTasks,
    task,
    index,
    showIndexColumn = true,
    setCheckList,
    checkList,
    userData,
    workspaceUsers,
  }) => {
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
    const [statusValue, setStatusValue] = useState<number>(task.status);
    const [priorityValue, setPriorityValue] = useState(task.priority);
    const [dueDateValue, setDueDateValue] = useState(
      task.dueDate ? formatDateForInputValue(task.dueDate) : ""
    );
    const [inlineSaving, setInlineSaving] = useState({
      status: false,
      priority: false,
      assignee: false,
      dueDate: false,
    });

    const router = useRouter();

    useEffect(() => {
      setStatusValue(task.status);
      setPriorityValue(task.priority);
      setDueDateValue(
        task.dueDate ? formatDateForInputValue(task.dueDate) : ""
      );
    }, [task]);

    const isDueDatePassed = useCallback((dueDate: string | null): boolean => {
      if (!dueDate) return false;
      return new Date(dueDate) < new Date();
    }, []);

    const handleError = useCallback((error: any) => {
      toast.error(error.message || "An error occurred", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }, []);

    const deriveAssignee = useCallback(
      (assigneeId: string | null, data?: any) => {
        if (!assigneeId) return null;
        if (data?.assigned_to_user) {
          const user = data.assigned_to_user;
          return {
            id: user.id,
            name: user.name || user.email || "Assignee",
          };
        }
        const user = workspaceUsers.find((member) => member.id === assigneeId);
        return user
          ? { id: user.id, name: user.name }
          : { id: assigneeId, name: "Assignee" };
      },
      [workspaceUsers]
    );

    const mergeIntoList = useCallback(
      (changes: Partial<Task>) => {
        setListTasks((prev) =>
          prev.map((item) =>
            item.id === task.id ? { ...item, ...changes } : item
          )
        );
      },
      [setListTasks, task.id]
    );

    const handleDelete = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);

        try {
          await deleteTask(task as any);
          setListTasks(ListTasks.filter((item) => item.id !== task.id));
        } catch (error) {
          handleError(error);
        } finally {
          setIsDeleting(false);
          setIsDeleteAlertOpen(false);
        }
      },
      [task, ListTasks, setListTasks, handleError]
    );

    const handleStatusChange = useCallback(
      async (value: number) => {
        setStatusValue(value);
        setInlineSaving((prev) => ({ ...prev, status: true }));
        const result = await updateTaskStatus(task as any, { status: value });
        if (!result.success) {
          toast.error(result.error || "Failed to update status");
          setStatusValue(task.status);
        } else {
          const updatedStatus = result.data?.status ?? value;
          mergeIntoList({ status: updatedStatus });
        }
        setInlineSaving((prev) => ({ ...prev, status: false }));
      },
      [mergeIntoList, task, toast]
    );

    const handlePriorityChange = useCallback(
      async (value: Task["priority"]) => {
        setPriorityValue(value);
        setInlineSaving((prev) => ({ ...prev, priority: true }));
        const result = await updateTaskPriority(task as any, {
          priority: value,
        });
        if (!result.success) {
          toast.error(result.error || "Failed to update priority");
          setPriorityValue(task.priority);
        } else {
          const updatedPriority = result.data?.priority ?? value;
          mergeIntoList({ priority: updatedPriority });
        }
        setInlineSaving((prev) => ({ ...prev, priority: false }));
      },
      [mergeIntoList, task, toast]
    );

    const handleAssigneeChange = useCallback(
      async (assigneeId: string) => {
        const normalizedAssigneeId =
          assigneeId === UNASSIGNED_VALUE ? "" : assigneeId;
        setInlineSaving((prev) => ({ ...prev, assignee: true }));
        const result = await updateTaskAssignee(task as any, {
          assigned_to: normalizedAssigneeId || null,
        });
        if (!result.success) {
          toast.error(result.error || "Failed to update assignee");
        } else {
          const assignee = deriveAssignee(normalizedAssigneeId, result.data);
          mergeIntoList({ assigned_to: assignee });
        }
        setInlineSaving((prev) => ({ ...prev, assignee: false }));
      },
      [deriveAssignee, mergeIntoList, task, toast]
    );

    const handleDueDateChange = useCallback(
      async (value: Date | null) => {
        const formatted = value ? format(value, "yyyy-MM-dd") : "";
        setDueDateValue(formatted);
        setInlineSaving((prev) => ({ ...prev, dueDate: true }));
        const result = await updateTaskDueDate(task as any, {
          dueDate: formatted || null,
        });
        if (!result.success) {
          toast.error(result.error || "Failed to update due date");
          setDueDateValue(
            task.dueDate ? formatDateForInputValue(task.dueDate) : ""
          );
        } else {
          const updatedDueDate = result.data?.dueDate ?? formatted ?? null;
          mergeIntoList({ dueDate: updatedDueDate });
        }
        setInlineSaving((prev) => ({ ...prev, dueDate: false }));
      },
      [mergeIntoList, task, toast]
    );

    const handleDuplicate = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          const result = await makeDuplicate(task as any);
          if (result.data?.[0]) {
            const newTask = result.data[0] as Task;
            setListTasks([...ListTasks, newTask]);
          } else {
            handleError(result.error || "Failed to duplicate task");
          }
        } catch (error) {
          handleError(error);
        }
      },
      [task, ListTasks, setListTasks, handleError]
    );

    const handleCheckboxClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        setCheckList(
          checkList.map((checked, i) => (i === index ? !checked : checked))
        );
      },
      [checkList, index, setCheckList]
    );

    const parsedTaskContent = useMemo(() => {
      if (!task.taskContent) return "";

      if (
        typeof task.taskContent === "string" &&
        !task.taskContent.startsWith("[") &&
        !task.taskContent.startsWith("{")
      ) {
        return task.taskContent.trim();
      }

      try {
        const parsedContent = JSON.parse(task.taskContent);

        // Ensure it's an array
        if (!Array.isArray(parsedContent)) {
          return "";
        }

        return parsedContent
          .map((block) => {
            // Extract text from the content array in each block
            if (block && block.content && Array.isArray(block.content)) {
              return block.content
                .map((item) => {
                  // Handle different types of content items
                  if (item && typeof item === "object") {
                    if (item.type === "text" && item.text) {
                      return item.text;
                    } else if (item.text) {
                      return item.text;
                    }
                  } else if (typeof item === "string") {
                    return item;
                  }
                  return "";
                })
                .join("");
            }
            return "";
          })
          .filter((text) => text && text.trim()) // Filter out empty strings
          .join(" ") // Join with space instead of newline for better display
          .trim(); // Remove any leading/trailing whitespace
      } catch (e) {
        console.error("Error parsing task content:", e);
        console.error("Task content:", task.taskContent);
        return (
          task.taskContent?.replace(/[{}[\]"]/g, "").substring(0, 100) || ""
        );
      }
    }, [task.taskContent]);

    const initialsFromName = useCallback((name: string | undefined | null) => {
      if (!name) return "";
      const [first, second] = name.trim().split(" ");
      const firstInitial = first?.charAt(0) ?? "";
      const secondInitial = second?.charAt(0) ?? "";
      return `${firstInitial}${secondInitial}`.toUpperCase() || firstInitial;
    }, []);

    const assigneeList = useMemo(
      () => (task.assigned_to ? [task.assigned_to] : []),
      [task.assigned_to]
    );

    const cellBaseClass =
      "px-3 py-1.5 align-middle text-sm text-[#1a1a1a] first:pl-4 last:pr-4";

    return (
      <>
        <TableRow
          key={task.id}
          className={cn(
            "group h-[46px] cursor-pointer border-b border-[#F3F2EF] transition-colors hover:bg-[#FAFAF8]",
            checkList[index] ? "bg-[#EEF2FF]" : "bg-white"
          )}
          onClick={() => {
            router.push(`/home/tasks/${task.id}`);
            // setIsSideSheetOpen(true);
          }}
        >
          <AlertDialog
            open={isDeleteAlertOpen}
            onOpenChange={setIsDeleteAlertOpen}
          >
            <AlertDialogContent className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none font-['DM_Sans']">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#1a1a1a] font-semibold">Confirm deletion</AlertDialogTitle>
                <AlertDialogDescription className="text-[#6b6b6b] text-sm">
                  Are you sure you want to delete this task?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row justify-end gap-2">
                <button
                  className="rounded-lg border border-[#EDEDEA] bg-white text-sm text-[#6b6b6b] hover:bg-[#F3F2EF] px-4 py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteAlertOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-1 bg-[#C0432A] hover:bg-[#A83924] text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-60"
                  onClick={handleDelete}
                >
                  <ColorRing
                    visible={isDeleting}
                    height="20"
                    width="20"
                    ariaLabel="color-ring-loading"
                    wrapperStyle={{}}
                    wrapperClass="color-ring-wrapper"
                    colors={["#fff", "#fff", "#fff", "#fff", "#fff"]}
                  />
                  Delete
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <TableCell className={cn(cellBaseClass, "w-[56px] pl-2")}>
            <div
              className={cn(
                "flex h-full items-center justify-center rounded-md transition-opacity duration-150",
                checkList[index]
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              )}
              onClick={handleCheckboxClick}
            >
              <Checkbox
                checked={checkList[index]}
                onCheckedChange={(checked) => {
                  setCheckList(
                    checkList.map((c, i) =>
                      i === index ? checked === true : c
                    )
                  );
                }}
                disabled={isDeleting}
                className="border-[#DEDBD5] data-[state=checked]:bg-[#4A5FD4] data-[state=checked]:border-[#4A5FD4]"
              />
            </div>
          </TableCell>

          {showIndexColumn && (
            <TableCell
              className={cn(
                cellBaseClass,
                "w-[52px] text-xs text-[#9a9a96] tabular-nums"
              )}
            >
              {index + 1}
            </TableCell>
          )}

          <TableCell className={cn(cellBaseClass, "max-w-[260px]")}>
            <div className="flex min-w-0 flex-col gap-0.5" title={task.name}>
              <div className="truncate text-[15px] font-semibold text-[#1a1a1a]">
                {task.name}
              </div>
              {task.source && SOURCE_STYLES[task.source] && (() => {
                const s = SOURCE_STYLES[task.source!];
                const Icon = s.icon;
                return (
                  <span className={cn("inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", s.pill)}>
                    <Icon size={9} />
                    {s.label}
                  </span>
                );
              })()}
            </div>
          </TableCell>
          <TableCell className={cn(cellBaseClass, "max-w-[340px]")}>
            <div
              className="truncate text-xs text-[#9a9a96]"
              title={parsedTaskContent}
            >
              {parsedTaskContent || "—"}
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
                      : "text-[#6b6b6b]"
                  )}
                  disabled={inlineSaving.dueDate || isDeleting}
                >
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
                  onSelect={(date) => handleDueDateChange(date ?? null)}
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
              onValueChange={(val) => handleStatusChange(Number(val))}
              disabled={inlineSaving.status || isDeleting}
            >
              <SelectTrigger className="h-8 w-full cursor-pointer border-none bg-transparent px-0 shadow-none ring-0 focus:ring-0 focus:ring-offset-0 overflow-hidden [&>svg]:hidden [&>*:last-child:is(svg)]:hidden">
                <div
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-full px-3 text-xs font-medium transition-all",
                    TASK_STATUS_STYLES[statusValue].pill,
                    inlineSaving.status && "opacity-70"
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
                    inlineSaving.priority && "opacity-70"
                  )}
                  title={`Priority: ${priorityValue}`}
                  disabled={inlineSaving.priority || isDeleting}
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
                    onClick={() =>
                      handlePriorityChange(key as Task["priority"])
                    }
                    className="flex items-center gap-2 text-sm"
                  >
                    {style.label}
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
                  className="group/assignee flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-0 text-left text-xs font-medium text-slate-800 focus:outline-none focus:ring-0"
                  title={
                    assigneeList.length > 0
                      ? assigneeList.map((a) => a.name).join(", ")
                      : "Unassigned"
                  }
                  disabled={inlineSaving.assignee || isDeleting}
                >
                  <div className="flex items-center">
                    {assigneeList.length > 0 ? (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3F2EF] text-[11px] font-semibold text-[#6b6b6b]"
                        title={assigneeList[0].name}
                      >
                        {initialsFromName(assigneeList[0].name)}
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
                  onClick={() => handleAssigneeChange(UNASSIGNED_VALUE)}
                  className="text-sm"
                >
                  Unassigned
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {workspaceUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => handleAssigneeChange(user.id)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F2EF] text-[11px] font-semibold text-[#6b6b6b]">
                      {initialsFromName(user.name)}
                    </span>
                    <span className="truncate">{user.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>

          <TableCell className={cn(cellBaseClass, "w-[60px] pr-3")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9a9a96] transition hover:bg-[#F3F2EF]">
                  <MoreHorizontal size={16} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px] rounded-xl border border-[#EDEDEA] bg-white shadow-none p-1">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push(`/home/tasks/${task.id}`)}
                    className="flex items-center gap-3 text-sm text-[#1a1a1a] py-2 px-3 rounded-lg"
                  >
                    <ExternalLink size={16} className="text-[#6b6b6b]" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-3 text-sm text-[#1a1a1a] py-2 px-3 rounded-lg"
                    onClick={handleCheckboxClick}
                  >
                    <CheckSquare2 size={16} className="text-[#6b6b6b]" />
                    Select
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    className="flex items-center gap-3 text-sm text-[#1a1a1a] py-2 px-3 rounded-lg"
                  >
                    <Copy size={16} className="text-[#6b6b6b]" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => router.push(`/home/tasks/${task.id}`)}
                    className="flex items-center gap-3 text-sm text-[#1a1a1a] py-2 px-3 rounded-lg"
                  >
                    <Pencil size={16} className="text-[#6b6b6b]" />
                    Edit
                  </DropdownMenuItem>
                  {task.created_by_user?.id === userData?.id && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleteAlertOpen(true);
                      }}
                      className="flex items-center gap-3 text-sm text-[#C0432A] py-2 px-3 rounded-lg"
                    >
                      <Trash2 size={16} className="text-[#C0432A]" />
                      Move to trash
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>

        <TaskSideSheet
          taskId={task.id}
          isOpen={isSideSheetOpen}
          setIsOpen={setIsSideSheetOpen}
        />
      </>
    );
  }
);

export default TaskRow;
