"use client";

import { deleteTask } from "@/apiReq/newAPIs/Task";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  AlertTriangleIcon,
  CalendarIcon,
  EditIcon,
  TagIcon,
  Trash2Icon,
  ViewIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

const TaskViewer = ({ task, setTask }: { task: any; setTask: any }) => {
  const router = useRouter();

  const isOverdue = (date: string): boolean => {
    if (!date) return false;
    const taskDate = new Date(date);
    const currentDate = new Date();
    return taskDate.toLocaleDateString() < currentDate.toLocaleDateString();
  };

  const getDueStatusColor = () => {
    if (task.status === 2 || task.status === 3)
      return "bg-emerald-100 text-emerald-800";
    if (task.dueDate && isOverdue(task.dueDate))
      return "bg-[#FEF0EE] text-[#C0432A]";

    if (!task.dueDate) return "bg-gray-100 text-gray-600";

    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "bg-amber-100 text-amber-800";
    return "bg-indigo-100 text-indigo-800";
  };

  const getPriorityColor = () => {
    const priority = task.priority?.toLowerCase();
    if (priority === "high") return "bg-red-100 text-red-800";
    if (priority === "medium") return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusLabel = () => {
    if (task.status === 2 || task.status === 3) return "Completed";
    if (task.dueDate && isOverdue(task.dueDate)) return "Overdue";

    if (!task.dueDate) return "Upcoming";

    const dueDate = new Date(task.dueDate);
    const today = new Date();

    if (dueDate.toLocaleDateString() === today.toLocaleDateString()) {
      return "Due Today";
    }
    return "Upcoming";
  };

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex gap-3 items-start hover:bg-[#FAFAF8] rounded-[8px] p-3 transition-colors">
        <div
          className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center ${task.status === 2 || task.status === 3 ? "bg-emerald-100" : "bg-white border border-slate-300"}`}
        >
          {(task.status === 2 || task.status === 3) && (
            <CheckIcon className="h-3 w-3 text-emerald-600" />
          )}
        </div>

        <div
          className="flex-1 min-w-0"
          onClick={() => router.push(`/tasks/${task.id}`)}
        >
          <div className="flex flex-col cursor-pointer">
            <div className="flex items-start justify-between">
              <h2
                className={`text-base font-semibold leading-snug ${task.status === 2 || task.status === 3 ? "text-gray-500 line-through" : "text-gray-900"}`}
              >
                {task.name}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <div
                className={`px-2 py-0.5 text-[11px] rounded-full flex items-center ${getDueStatusColor()}`}
              >
                {isOverdue(task.dueDate) && task.status !== 2 && (
                  <AlertTriangleIcon size={12} className="mr-1" />
                )}
                {getStatusLabel()}
              </div>

              {task.priority && (
                <div
                  className={`px-2 py-0.5 text-[11px] rounded-full flex items-center ${getPriorityColor()}`}
                >
                  <TagIcon size={12} className="mr-1" />
                  {task.priority}
                </div>
              )}

              <div className="text-[11px] text-gray-500 flex items-center">
                <CalendarIcon size={12} className="mr-1" />
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : "No due date"}
              </div>
            </div>
          </div>
        </div>

        <Options
          values={[
            {
              name: "View Task",
              icon: <ViewIcon size={15} />,
              onClick: () => {
                router.push(`/tasks/${task.id}`);
              },
            },
            {
              name: "Edit Task",
              icon: <EditIcon size={15} />,
              onClick: () => {
                router.push(`/tasks/${task.id}`);
              },
            },
            {
              name: "Delete Task",
              icon: <Trash2Icon size={15} className="text-red-600" />,
              className: "text-red-600 active:text-red-600 hover:text-red-600",
              onClick: async () => {
                try {
                  const response = await deleteTask(task);
                  if (response) throw new Error(response);
                  setTask((prev: any) =>
                    prev.filter((n: any) => n.id !== task.id)
                  );
                } catch (e) {
                  console.error(e);
                }
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

const Options = ({ values }: { values: any[] }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover p-2 text-popover-foreground shadow-md w-fit",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        )}
      >
        {values.map((value, index) => (
          <button
            key={index}
            onClick={() => value.onClick()}
            className={`flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent gap-2 w-full ${value.className}`}
          >
            {value.icon}
            {value.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default TaskViewer;
