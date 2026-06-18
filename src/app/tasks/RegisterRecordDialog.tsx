"use client";

import { Button } from "@/components/ui/button";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { useState } from "react";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  dggi_role?: string;
}

export interface ScnOption {
  scn_no: string;
  date_of_scn: string;
  noticee_name: string;
}

export interface ArrestOption {
  id: string;
  record_id: string;
  arrested_name: string;
  party_name: string;
  unit_gstin: string;
  arrested_age: string;
  date_of_arrest: string;
  amount_crore: string;
  role_evidence: string;
  sio: string;
  group: string;
}

export interface RegisterColumn {
  key: string;
  label: string;
  dialogLabel?: string;
  type: "text" | "number" | "datepicker" | "select" | "usercombobox" | "caselink" | "scncombobox" | "arrestlink" | "searchcombobox";
  options?: string[];
  allowOther?: boolean;
  readOnly?: boolean;
  width?: string;
  showWhen?: { field: string; values: string[] };
}

export interface ColumnGroup {
  label: string;
  keys: string[];
}

interface RegisterRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "add-person" | "edit";
  title?: string;
  columns: RegisterColumn[];
  columnGroups?: ColumnGroup[];
  draft: Record<string, string>;
  onDraftChange: (key: string, value: string) => void;
  onMultiDraftChange?: (patches: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
  users?: WorkspaceUser[];
  caseOptions?: DGGICaseOption[];
  scnOptions?: ScnOption[];
  arrestOptions?: ArrestOption[];
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
    <Popover open={open} onOpenChange={setOpen} modal={true}>
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
          <CommandList className="max-h-[200px] overflow-y-auto">
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

function ScnCombobox({
  value,
  onChange,
  scnOptions,
}: {
  value: string;
  onChange: (scn: ScnOption | null) => void;
  scnOptions: ScnOption[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = scnOptions.filter(
    (s) =>
      s.scn_no.toLowerCase().includes(query.toLowerCase()) ||
      s.noticee_name?.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = scnOptions.find((s) => s.scn_no === value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] truncate">
          <span className="truncate">
            {selected ? selected.scn_no : <span className="text-[#9a9a96]">Select SCN…</span>}
          </span>
          <ChevronsUpDown size={12} className="text-[#9a9a96] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 border border-[#EDEDEA] shadow-none rounded-xl" align="start">
        <Command>
          <CommandInput
            placeholder="Search SCN…"
            value={query}
            onValueChange={setQuery}
            className="text-base"
          />
          <CommandList className="max-h-[220px] overflow-y-auto">
            <CommandEmpty className="py-3 text-center text-base text-[#9a9a96]">No SCN records found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onChange(null); setOpen(false); setQuery(""); }}
                  className="text-base text-[#9a9a96]"
                >
                  Clear selection
                </CommandItem>
              )}
              {filtered.map((s) => (
                <CommandItem
                  key={s.scn_no}
                  value={s.scn_no}
                  onSelect={() => { onChange(s); setOpen(false); setQuery(""); }}
                  className="text-base"
                >
                  <Check size={13} className={`mr-2 shrink-0 ${value === s.scn_no ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{s.scn_no}</span>
                    {s.noticee_name && <span className="truncate text-[#9a9a96] text-sm">{s.noticee_name}</span>}
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

function ArrestLinkCombobox({
  value,
  onChange,
  arrestOptions,
}: {
  value: string;
  onChange: (arrest: ArrestOption | null) => void;
  arrestOptions: ArrestOption[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = arrestOptions.filter(
    (a) =>
      a.record_id.toLowerCase().includes(query.toLowerCase()) ||
      a.arrested_name?.toLowerCase().includes(query.toLowerCase()) ||
      a.party_name?.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = arrestOptions.find((a) => a.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] truncate">
          <span className="truncate">
            {selected
              ? `${selected.record_id} — ${selected.arrested_name || selected.party_name}`
              : <span className="text-[#9a9a96]">Select arrest case…</span>}
          </span>
          <ChevronsUpDown size={12} className="text-[#9a9a96] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 border border-[#EDEDEA] shadow-none rounded-xl" align="start">
        <Command>
          <CommandInput
            placeholder="Search arrest ID or name…"
            value={query}
            onValueChange={setQuery}
            className="text-base"
          />
          <CommandList className="max-h-[220px] overflow-y-auto">
            <CommandEmpty className="py-3 text-center text-base text-[#9a9a96]">No arrest records found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onChange(null); setOpen(false); setQuery(""); }}
                  className="text-base text-[#9a9a96]"
                >
                  Clear selection
                </CommandItem>
              )}
              {filtered.map((a) => (
                <CommandItem
                  key={a.id}
                  value={a.record_id}
                  onSelect={() => { onChange(a); setOpen(false); setQuery(""); }}
                  className="text-base"
                >
                  <Check size={13} className={`mr-2 shrink-0 ${value === a.id ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{a.record_id}</span>
                    <span className="truncate text-[#9a9a96] text-sm">
                      {a.arrested_name}{a.party_name ? ` · ${a.party_name}` : ""}
                    </span>
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

function SearchCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF]"
        >
          <span className={value ? "text-[#1a1a1a]" : "text-[#9a9a96]"}>
            {value || "Select…"}
          </span>
          <ChevronsUpDown size={14} className="text-[#9a9a96] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 border border-[#EDEDEA] shadow-none rounded-xl" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search commissionerate…"
            value={query}
            onValueChange={setQuery}
            className="text-base"
          />
          <CommandList className="max-h-60">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((o) => (
                <CommandItem
                  key={o}
                  value={o}
                  onSelect={() => { onChange(o); setOpen(false); setQuery(""); }}
                  className="text-base"
                >
                  <Check size={13} className={`mr-2 shrink-0 ${value === o ? "opacity-100" : "opacity-0"}`} />
                  {o}
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
  title,
  columns,
  columnGroups,
  draft,
  onDraftChange,
  onMultiDraftChange,
  onSave,
  saving,
  users = [],
  caseOptions = [],
  scnOptions = [],
  arrestOptions = [],
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

    if (col.type === "scncombobox") {
      return (
        <ScnCombobox
          value={value}
          scnOptions={scnOptions}
          onChange={(scn) => {
            if (scn) {
              if (onMultiDraftChange) {
                onMultiDraftChange({
                  linked_scn_no: scn.scn_no,
                  date_of_scn_issuance: scn.date_of_scn,
                  scn_issued: "Yes",
                });
              } else {
                onChange(scn.scn_no);
              }
            } else {
              if (onMultiDraftChange) {
                onMultiDraftChange({ linked_scn_no: "", date_of_scn_issuance: "", scn_issued: "" });
              } else {
                onChange("");
              }
            }
          }}
        />
      );
    }
    if (col.type === "arrestlink") {
      return (
        <ArrestLinkCombobox
          value={value}
          arrestOptions={arrestOptions}
          onChange={(arrest) => {
            if (arrest) {
              if (onMultiDraftChange) {
                onMultiDraftChange({
                  linked_arrest_id: arrest.id,
                  arrested_person_name: arrest.arrested_name ?? "",
                  age: arrest.arrested_age ?? "",
                  date_of_arrest: arrest.date_of_arrest ?? "",
                  amount_evaded_crore: arrest.amount_crore ?? "",
                  entity_name: arrest.party_name ?? "",
                  gstin: arrest.unit_gstin ?? "",
                  brief_modus_operandi: arrest.role_evidence ?? "",
                  sio: arrest.sio ?? "",
                  group: arrest.group ?? "",
                });
              } else {
                onChange(arrest.record_id);
              }
            } else {
              if (onMultiDraftChange) {
                onMultiDraftChange({ linked_arrest_id: "" });
              } else {
                onChange("");
              }
            }
          }}
        />
      );
    }
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
      return <DateInput value={value} onChange={onChange} />;
    }
    if (col.type === "usercombobox") {
      return (
        <DialogUserCombobox value={value} onChange={onChange} users={users} />
      );
    }
    if (col.type === "searchcombobox") {
      return (
        <SearchCombobox value={value} options={col.options ?? []} onChange={onChange} />
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
    if (col.type === "number") {
      return (
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^-?\d*\.?\d*$/.test(v)) onChange(v);
          }}
          inputMode="decimal"
          className="h-9 border-[#EDEDEA] text-base rounded-lg w-full"
          placeholder="0"
        />
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
            {title ?? (mode === "add" ? "Add Record" : mode === "add-person" ? "Add Person to Batch" : "Edit Record")}
          </DialogTitle>
        </DialogHeader>
        {columnGroups ? (
          <div className="space-y-4 py-2">
            {columnGroups.map((group) => {
              const groupCols = editableColumns.filter((c) => group.keys.includes(c.key));
              if (groupCols.length === 0) return null;
              return (
                <div key={group.label} className="space-y-3">
                  <p className="text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">{group.label}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {groupCols.map((col) => (
                      <div key={col.key} className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#6b6b6b]">
                          {col.dialogLabel ?? col.label}
                        </label>
                        {renderField(col)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
        )}
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
            {saving ? "Saving…" : mode === "add" ? "Add Record" : mode === "add-person" ? "Add Person" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
