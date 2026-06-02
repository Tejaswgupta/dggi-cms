"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  getTaskCustomFieldTemplates,
  createTaskCustomFieldTemplate,
  updateTaskCustomFieldTemplate,
  deleteTaskCustomFieldTemplate,
  TaskCustomFieldTemplate,
  TaskCustomField,
  FieldType,
} from "@/apiReq/newAPIs/taskCustomFields";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "boolean", label: "Boolean" },
];

function FieldBuilderRow({
  field,
  onChange,
  onDelete,
}: {
  field: TaskCustomField;
  onChange: (updated: TaskCustomField) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-white border border-[#EDEDEA]">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Field label"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="flex-1 text-sm bg-white border border-[#EDEDEA] rounded-lg px-3 py-1.5 outline-none focus:border-[#5b89e9] text-[#1a1a1a] placeholder:text-[#b0b0aa]"
        />
        <select
          value={field.type}
          onChange={(e) =>
            onChange({
              ...field,
              type: e.target.value as FieldType,
              options:
                e.target.value === "select"
                  ? (field.options ?? [""])
                  : undefined,
            })
          }
          className="text-xs bg-white border border-[#EDEDEA] rounded-lg px-2 py-1.5 outline-none focus:border-[#5b89e9] text-[#6b6b6b] cursor-pointer"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="text-[#b0b0aa] hover:text-red-500 transition-colors p-1 flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {field.type === "select" && (
        <div className="flex flex-col gap-1 pl-2">
          {(field.options ?? []).map((opt, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={opt}
                placeholder={`Option ${idx + 1}`}
                onChange={(e) => {
                  const opts = [...(field.options ?? [])];
                  opts[idx] = e.target.value;
                  onChange({ ...field, options: opts });
                }}
                className="flex-1 text-xs bg-white border border-[#EDEDEA] rounded px-2 py-1 outline-none focus:border-[#5b89e9] text-[#1a1a1a] placeholder:text-[#b0b0aa]"
              />
              <button
                onClick={() => {
                  const opts = (field.options ?? []).filter(
                    (_, i) => i !== idx,
                  );
                  onChange({ ...field, options: opts });
                }}
                className="text-[#b0b0aa] hover:text-red-500 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({ ...field, options: [...(field.options ?? []), ""] })
            }
            className="flex items-center gap-1 text-xs text-[#5b89e9] hover:underline w-fit"
          >
            <Plus size={11} />
            Add option
          </button>
        </div>
      )}
    </div>
  );
}

type View = "list" | "form";

export function TaskCustomFieldTemplateDialog({ isOpen, onClose }: Props) {
  const { toast } = useToast();

  const [templates, setTemplates] = useState<TaskCustomFieldTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // form state
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [fields, setFields] = useState<TaskCustomField[]>([
    { label: "", type: "text" },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      const res = await getTaskCustomFieldTemplates();
      if (res.success) setTemplates(res.data);
      setIsLoading(false);
    };
    load();
    setView("list");
  }, [isOpen]);

  const openNew = () => {
    setEditingId(null);
    setTemplateName("");
    setFields([{ label: "", type: "text" }]);
    setView("form");
  };

  const openEdit = (t: TaskCustomFieldTemplate) => {
    setEditingId(t.id);
    setTemplateName(t.name);
    setFields(t.fields.map((f) => ({ ...f })));
    setView("form");
  };

  const handleSave = async () => {
    const validFields = fields.filter((f) => f.label.trim() !== "");
    if (!templateName.trim()) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }
    if (validFields.length === 0) {
      toast({ title: "Add at least one field", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = { name: templateName.trim(), fields: validFields };
      let updated: TaskCustomFieldTemplate[];

      if (editingId) {
        const res = await updateTaskCustomFieldTemplate(editingId, payload);
        if (!res.success) throw new Error(res.error);
        updated = templates.map((t) => (t.id === editingId ? res.data : t));
      } else {
        const res = await createTaskCustomFieldTemplate(payload);
        if (!res.success) throw new Error(res.error);
        updated = [res.data, ...templates];
      }

      setTemplates(updated);
      toast({ title: "Template saved", variant: "success" });
      setView("list");
    } catch (error: any) {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    const res = await deleteTaskCustomFieldTemplate(templateId);
    if (!res.success) {
      toast({
        title: "Error deleting template",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    const updated = templates.filter((t) => t.id !== templateId);
    setTemplates(updated);
    toast({ title: "Template deleted", variant: "success" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white border-[#EDEDEA]">
        <DialogHeader>
          <DialogTitle className="text-[#1a1a1a] text-base font-semibold">
            {view === "list"
              ? "Custom Field Templates"
              : editingId
              ? "Edit Template"
              : "New Template"}
          </DialogTitle>
        </DialogHeader>

        {/* List view */}
        {view === "list" && (
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5b89e9] border-t-transparent" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-[#b0b0aa] text-center py-6">
                No templates yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2.5 bg-white border border-[#EDEDEA] rounded-lg"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        {t.name}
                      </span>
                      <span className="text-xs text-[#b0b0aa]">
                        {t.fields.length} field{t.fields.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded text-[#b0b0aa] hover:text-[#5b89e9] hover:bg-[#F3F2EF] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded text-[#b0b0aa] hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={openNew}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-[#EDEDEA] text-sm text-[#5b89e9] hover:bg-white transition-colors"
            >
              <Plus size={14} />
              New template
            </button>
          </div>
        )}

        {/* Form view */}
        {view === "form" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#1a1a1a] w-fit transition-colors"
            >
              <ArrowLeft size={12} />
              Back to templates
            </button>

            <input
              type="text"
              placeholder="Template name (e.g. GST Intelligence)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-sm bg-white border border-[#EDEDEA] rounded-lg px-3 py-2 outline-none focus:border-[#5b89e9] text-[#1a1a1a] placeholder:text-[#b0b0aa]"
            />

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-0.5">
              {fields.map((field, idx) => (
                <FieldBuilderRow
                  key={idx}
                  field={field}
                  onChange={(updated) => {
                    const copy = [...fields];
                    copy[idx] = updated;
                    setFields(copy);
                  }}
                  onDelete={() =>
                    setFields((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
              ))}
            </div>

            <button
              onClick={() =>
                setFields((prev) => [...prev, { label: "", type: "text" }])
              }
              className="flex items-center gap-1 text-xs text-[#5b89e9] hover:underline w-fit"
            >
              <Plus size={12} />
              Add field
            </button>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#5b89e9] text-white hover:bg-[#4a78d8] disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving…" : "Save template"}
              </button>
              <button
                onClick={() => setView("list")}
                className="px-4 py-1.5 rounded-lg text-sm text-[#6b6b6b] hover:bg-[#EDEDEA] transition-colors"
              >
                Cancel
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    handleDelete(editingId);
                    setView("list");
                  }}
                  className="ml-auto px-4 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete template
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
