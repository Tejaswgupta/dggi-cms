"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
}

export interface RegisterColumn {
  key: string;
  label: string;
  dialogLabel?: string;
  type: "text" | "datepicker" | "select" | "usercombobox" | "caselink";
  options?: string[];
  allowOther?: boolean;
  readOnly?: boolean;
  width?: string;
  showWhen?: { field: string; values: string[] };
}

interface RegisterRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  columns: RegisterColumn[];
  draft: Record<string, string>;
  onDraftChange: (key: string, value: string) => void;
  onSave: () => void;
  saving: boolean;
  users?: WorkspaceUser[];
  caseOptions?: DGGICaseOption[];
}

function DialogDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <button className="flex h-9 w-full items-center gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF]">
          <CalendarIcon size={13} className="text-[#9a9a96] shrink-0" />
          {parsed ? (
            format(parsed, "dd/MM/yyyy")
          ) : (
            <span className="text-[#9a9a96]">Pick date</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-[#EDEDEA] shadow-none rounded-xl"
        align="start"
      >
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function DialogUserCombobox({
  value,
  onChange,
  users,
}: {
  value: string;
  onChange: (v: string) => void;
  users: WorkspaceUser[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] truncate">
          <span className="truncate">
            {users.find((u) => u.id === value)?.name || (
              <span className="text-[#9a9a96]">Select user…</span>
            )}
          </span>
          <ChevronsUpDown size={12} className="text-[#9a9a96] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-0 border border-[#EDEDEA] shadow-none rounded-xl"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search user…"
            value={query}
            onValueChange={setQuery}
            className="text-base"
          />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-base text-[#9a9a96]">
              No users found.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.name}
                  onSelect={() => {
                    onChange(u.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="text-base"
                >
                  <Check
                    size={13}
                    className={`mr-2 shrink-0 ${value === u.id ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{u.name}</span>
                    <span className="truncate text-[#9a9a96] text-sm">{u.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function RegisterRecordDialog({
  open,
  onOpenChange,
  mode,
  columns,
  draft,
  onDraftChange,
  onSave,
  saving,
  users = [],
  caseOptions = [],
}: RegisterRecordDialogProps) {
  const editableColumns = columns.filter((col) => {
    if (col.readOnly) return false;
    if (col.showWhen) {
      const fieldVal = draft[col.showWhen.field] ?? "";
      return col.showWhen.values.includes(fieldVal);
    }
    return true;
  });

  const renderField = (col: RegisterColumn) => {
    const value = draft[col.key] ?? "";
    const onChange = (v: string) => onDraftChange(col.key, v);

    if (col.type === "caselink") {
      return (
        <CaseIdCombobox
          value={value}
          onChange={onChange}
          cases={caseOptions}
          editing={true}
        />
      );
    }
    if (col.type === "datepicker") {
      return <DialogDatePicker value={value} onChange={onChange} />;
    }
    if (col.type === "usercombobox") {
      return (
        <DialogUserCombobox value={value} onChange={onChange} users={users} />
      );
    }
    if (col.type === "select") {
      const isOtherMode = col.allowOther && value && !col.options?.includes(value) && value !== "__other__";
      const selectValue = isOtherMode ? "__other__" : value;
      return (
        <div className="flex flex-col gap-1.5">
          <Select value={selectValue} onValueChange={(v) => { if (v === "__other__") onChange(""); else onChange(v); }}>
            <SelectTrigger className="h-9 border-[#EDEDEA] text-base rounded-lg w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {col.options?.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
              {col.allowOther && <SelectItem value="__other__">Others</SelectItem>}
            </SelectContent>
          </Select>
          {(selectValue === "__other__" || isOtherMode) && (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Specify source…"
              className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
            />
          )}
        </div>
      );
    }
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#EDEDEA] shadow-none font-['DM_Sans']">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-[#1a1a1a]">
            {mode === "add" ? "Add Record" : "Edit Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-2">
          {editableColumns.map((col) => (
            <div key={col.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#6b6b6b]">
                {col.dialogLabel ?? col.label}
              </label>
              {renderField(col)}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            className="rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white shadow-none"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : mode === "add" ? "Add Record" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
