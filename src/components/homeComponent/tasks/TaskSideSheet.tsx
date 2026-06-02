"use client";

import TaskInfoOptions from "@/app/tasks/[taskId]/task-info-options";
import TaskInfoPage from "@/app/tasks/[taskId]/taskInfoPage";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";

type TaskSideSheetProps = {
  taskId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function TaskSideSheet({ taskId, isOpen, setIsOpen }: TaskSideSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-[96vw] overflow-hidden p-0 sm:max-w-[980px]"
      >
        <div className="flex items-start justify-between border-b px-6 py-4">
          <SheetTitle>Task details</SheetTitle>
          <div className="flex items-center gap-2">
            <TaskInfoOptions taskId={taskId} />
            <SheetClose className="rounded-md p-2 hover:bg-muted">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </div>

        <div className="h-[calc(100vh-64px)]">
          <TaskInfoPage taskId={taskId} variant="sheet" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
