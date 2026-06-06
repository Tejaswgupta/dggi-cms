"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value: string; // ISO yyyy-MM-dd
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  triggerClassName?: string;
}

/**
 * Date picker that also accepts keyboard input in dd/MM/yyyy format.
 * The text field accepts manual typing; the calendar icon opens a picker.
 */
export function DateInput({
  value,
  onChange,
  className,
  placeholder = "dd/mm/yyyy",
  triggerClassName,
}: DateInputProps) {
  const parsed = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  const [open, setOpen] = React.useState(false);
  // Local text state — formatted as dd/MM/yyyy for display
  const [text, setText] = React.useState(parsed ? format(parsed, "dd/MM/yyyy") : "");

  // Sync text when external value changes
  React.useEffect(() => {
    const d = value && isValid(parseISO(value)) ? parseISO(value) : null;
    setText(d ? format(d, "dd/MM/yyyy") : "");
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    // Auto-insert slashes
    const digits = raw.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8);
    if (formatted !== raw) setText(formatted);

    // Try parsing
    const attempts = [
      () => parse(formatted, "dd/MM/yyyy", new Date()),
      () => parse(raw, "dd/MM/yyyy", new Date()),
      () => parse(raw, "yyyy-MM-dd", new Date()),
    ];
    for (const attempt of attempts) {
      try {
        const d = attempt();
        if (isValid(d) && d.getFullYear() >= 1900) {
          onChange(format(d, "yyyy-MM-dd"));
          return;
        }
      } catch {}
    }
    if (raw === "") onChange("");
  };

  const handleBlur = () => {
    // Re-format on blur if we have a valid ISO value
    if (value && isValid(parseISO(value))) {
      setText(format(parseISO(value), "dd/MM/yyyy"));
    } else if (!text) {
      onChange("");
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={10}
        className={cn("h-9 border-[#EDEDEA] text-base rounded-lg flex-1", triggerClassName)}
      />
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#EDEDEA] bg-white hover:bg-[#F3F2EF] transition-colors"
          >
            <CalendarIcon size={14} className="text-[#9a9a96]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border border-[#EDEDEA] shadow-none rounded-xl"
          align="start"
        >
          <Calendar
            mode="single"
            selected={parsed}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
