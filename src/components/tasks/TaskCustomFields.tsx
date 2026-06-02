"use client";

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, ChevronDown, CalendarIcon, Settings } from "lucide-react";
import { TaskCustomFieldTemplateDialog } from "./TaskCustomFieldTemplateDialog";
import { format, parse, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getTaskCustomFieldTemplates,
  updateTaskCustomFields,
  TaskCustomFieldTemplate,
  TaskCustomField,
} from "@/apiReq/newAPIs/taskCustomFields";

interface TaskCustomFieldsProps {
  taskId: string;
  customFields?: Record<string, string>;
  onCustomFieldsChange?: (fields: Record<string, string>) => void;
}

function debounce<T extends (...args: any[]) => any>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// ── Field row: renders the right input based on field.type ───────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TaskCustomField;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "flex-1 text-sm bg-transparent outline-none text-[#37352f] placeholder:text-[#d0d0cc] focus:bg-white rounded px-1 py-0.5 -mx-1 transition-colors";

  if (field.type === "date") {
    const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
    const selected = parsed && isValid(parsed) ? parsed : undefined;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-[#37352f] hover:bg-white rounded px-1 py-0.5 -mx-1 transition-colors"
          >
            <CalendarIcon size={13} className="text-[#b0b0aa]" />
            {selected ? (
              <span>{format(selected, "dd MMM yyyy")}</span>
            ) : (
              <span className="text-[#d0d0cc]">Pick a date</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => onChange(day ? format(day, "yyyy-MM-dd") : "")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={base}
      />
    );
  }

  if (field.type === "boolean") {
    const checked = value === "true";
    return (
      <button
        type="button"
        onClick={() => onChange(checked ? "false" : "true")}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[#5b89e9]" : "bg-[#EDEDEA]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    );
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} cursor-pointer`}
      >
        <option value="">—</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className={base}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaskCustomFields({
  taskId,
  customFields = {},
  onCustomFieldsChange,
}: TaskCustomFieldsProps) {
  const [templates, setTemplates] = useState<TaskCustomFieldTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>(customFields);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? null;

  useEffect(() => {
    setLocalValues(customFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, JSON.stringify(customFields)]);

  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    const res = await getTaskCustomFieldTemplates();
    if (res.success) {
      setTemplates(res.data);
      setActiveTemplateId((prev) =>
        prev && res.data.find((t) => t.id === prev) ? prev : res.data[0]?.id ?? null,
      );
    }
    setIsLoadingTemplates(false);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, []);

  const debouncedSave = useCallback(
    debounce(async (taskId: string, fields: Record<string, string>) => {
      const res = await updateTaskCustomFields(taskId, fields);
      if (!res.success) console.error("Failed to save custom fields:", res.error);
    }, 800),
    [],
  );

  const handleFieldChange = (label: string, value: string) => {
    const updated = { ...localValues, [label]: value };
    setLocalValues(updated);
    onCustomFieldsChange?.(updated);
    debouncedSave(taskId, updated);
  };

  const filledCount = activeTemplate
    ? activeTemplate.fields.filter((f) => localValues[f.label]?.trim()).length
    : 0;

  return (
    <div className="w-full flex flex-col border border-[#EDEDEA] rounded-xl bg-white overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#6b6b6b]" />
          <span className="text-sm font-medium text-[#1a1a1a]">Custom Fields</span>
          {activeTemplate && (
            <span className="text-xs text-[#b0b0aa] bg-[#F3F2EF] px-1.5 py-0.5 rounded-full">
              {activeTemplate.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeTemplate && filledCount > 0 && (
            <span className="text-xs text-[#6b6b6b]">
              {filledCount}/{activeTemplate.fields.length} filled
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDialogOpen(true);
            }}
            className="p-1 rounded text-[#b0b0aa] hover:text-[#5b89e9] transition-colors"
            title="Manage templates"
          >
            <Settings size={13} />
          </button>
          <ChevronDown
            size={14}
            className={`text-[#b0b0aa] transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="flex flex-col border-t border-[#EDEDEA]">
          {/* Template selector row */}
          {templates.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#EDEDEA] bg-[#FAFAF8]">
              {isLoadingTemplates ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#5b89e9] border-t-transparent" />
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTemplateId(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        activeTemplateId === t.id
                          ? "bg-[#5b89e9] text-white border-[#5b89e9]"
                          : "bg-white text-[#6b6b6b] border-[#EDEDEA] hover:border-[#5b89e9]"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Field value rows */}
          {activeTemplate ? (
            <div className="flex flex-col divide-y divide-[#F3F2EF]">
              {activeTemplate.fields.map((field) => (
                <div key={field.label} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-[38%] flex-shrink-0 flex items-center gap-1.5">
                    <span className="text-[0.84rem] font-[450] text-[#777672]">
                      {field.label}
                    </span>
                    <span className="text-[10px] text-[#c0c0bb] capitalize">{field.type}</span>
                  </div>
                  <FieldInput
                    field={field}
                    value={localValues[field.label] ?? ""}
                    onChange={(v) => handleFieldChange(field.label, v)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6">
              <p className="text-xs text-[#b0b0aa]">No template configured.</p>
            </div>
          )}
        </div>
      )}

      <TaskCustomFieldTemplateDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          loadTemplates();
        }}
      />
    </div>
  );
}
