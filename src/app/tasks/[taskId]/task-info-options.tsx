"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { LayoutTemplate, MoreHorizontal, Trash2 } from "lucide-react";
import TaskTemplateSelector from "@/components/tasks/TaskTemplateSelector";
import { useState } from "react";
import { deleteTaskData } from "@/apiReq/newAPIs/task-new";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface TaskInfoOptionsProps {
  taskId: string;
  onApplyTemplate?: (content: string) => void;
}

function TaskInfoOptions({ taskId, onApplyTemplate }: TaskInfoOptionsProps) {
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    try {
      await deleteTaskData(taskId);
      router.push("/tasks");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete task", variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none focus:border-none active:border-none border-none">
          <MoreHorizontal className="cursor-pointer text-[#9a9a96] hover:text-[#1a1a1a] transition-colors" size={22} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {onApplyTemplate && (
            <>
              <DropdownMenuItem
                className="flex gap-2"
                onClick={() => setTemplateSelectorOpen(true)}
              >
                <LayoutTemplate size={16} className="opacity-60" />
                <span>Use Template</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem className="flex gap-2" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 size={16} className="opacity-[0.6]" color="#FC979F" />
            <h2 className="text-[#FC979F]">Delete</h2>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#FC979F] hover:bg-[#e8848c] text-white"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {onApplyTemplate && (
        <TaskTemplateSelector
          open={templateSelectorOpen}
          onOpenChange={setTemplateSelectorOpen}
          onApply={onApplyTemplate}
        />
      )}
    </>
  );
}

export default TaskInfoOptions;
