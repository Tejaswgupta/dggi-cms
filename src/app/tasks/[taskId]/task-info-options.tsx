"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModalStore } from "@/providers/modal-store-provider";
import { ModalType } from "@/stores/modal-store";
import { LayoutTemplate, MoreHorizontal, Trash2 } from "lucide-react";
import TaskTemplateSelector from "@/components/tasks/TaskTemplateSelector";
import { useState } from "react";

interface TaskInfoOptionsProps {
  taskId: string;
  onApplyTemplate?: (content: string) => void;
}

function TaskInfoOptions({ taskId, onApplyTemplate }: TaskInfoOptionsProps) {
  const { onOpen } = useModalStore((s) => s);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  const handleTrashClick = () => {
    onOpen(ModalType.CONFIRM_DELETE_TASK, { taskId: taskId });
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
          <DropdownMenuItem className="flex gap-2" onClick={handleTrashClick}>
            <Trash2 size={16} className="opacity-[0.6]" color="#FC979F" />
            <h2 className="text-[#FC979F]">Delete</h2>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
