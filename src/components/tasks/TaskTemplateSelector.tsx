"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTaskTemplatesForWorkspace, TaskTemplate } from "@/apiReq/newAPIs/task-templates";
import { useEffect, useState } from "react";

interface TaskTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (content: string) => void;
}

export default function TaskTemplateSelector({
  open,
  onOpenChange,
  onApply,
}: TaskTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<TaskTemplate | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setIsLoading(true);
    getTaskTemplatesForWorkspace().then((res) => {
      if (res.success) setTemplates(res.data);
      setIsLoading(false);
    });
  }, [open]);

  const handleApply = () => {
    if (!selected) return;
    onApply(selected.content);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#5b89e9] border-t-transparent" />
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-[#b0b0aa] text-center py-8">
            No templates available. Ask your admin to create some.
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto py-1">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selected?.id === t.id
                    ? "border-[#5b89e9] bg-[#EEF2FF]"
                    : "border-[#EDEDEA] bg-white hover:bg-white"
                }`}
              >
                <div className="font-medium text-sm text-[#1a1a1a]">{t.name}</div>
                {t.description && (
                  <div className="text-xs text-[#6b6b6b] mt-0.5">{t.description}</div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded-lg border border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!selected}
            className="px-4 py-2 text-sm rounded-lg bg-[#5b89e9] text-white hover:bg-[#4a78d8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply Template
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
