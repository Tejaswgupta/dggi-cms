"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Link2 } from "lucide-react";
import { useState } from "react";

export interface DGGICaseOption {
  record_id: string;
  taxpayer_name: string;
  file_no: string;
  is_ir: boolean;
  financial_year?: string;
  handling_io_sio?: string;
  group?: string;
  detection_amount?: string;
  date_of_initiation?: string;
  date_of_receipt?: string;
  gstins?: string;
}

export function CaseIdCombobox({
  value,
  onChange,
  cases,
  editing,
}: {
  value: string;
  onChange: (v: string) => void;
  cases: DGGICaseOption[];
  editing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = cases.find((c) => c.record_id === value);

  if (!editing) {
    if (!value) return <span className="text-[#9a9a96]">—</span>;
    return (
      <div className="flex items-center gap-1">
        <Link2 size={11} className="text-[#4A5FD4] shrink-0" />
        <a
          href={`/tasks/investigation-cases?caseId=${encodeURIComponent(value)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base text-[#4A5FD4] font-medium hover:underline hover:text-[#3B4EC5] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
        {selected && (
          <span className="text-[10px] text-[#9a9a96] bg-[#F3F2EF] rounded px-1 truncate max-w-[100px]">
            {selected.taxpayer_name}
          </span>
        )}
      </div>
    );
  }

  const filtered = cases.filter(
    (c) =>
      c.record_id?.toLowerCase().includes(query.toLowerCase()) ||
      c.taxpayer_name?.toLowerCase().includes(query.toLowerCase()) ||
      c.file_no?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
      modal={true}
    >
      <PopoverTrigger asChild>
        <button className="flex h-8 w-[180px] items-center justify-between gap-2 rounded-lg border border-[#EDEDEA] bg-white px-3 text-base text-[#1a1a1a] hover:bg-[#F3F2EF] truncate">
          <span className="truncate">
            {value ? (
              <span className="flex items-center gap-1">
                <Link2 size={11} className="text-[#4A5FD4] shrink-0" />
                <span className="text-[#4A5FD4] font-medium">{value}</span>
              </span>
            ) : (
              <span className="text-[#9a9a96]">Link case…</span>
            )}
          </span>
          <ChevronsUpDown size={12} className="text-[#9a9a96] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 border border-[#EDEDEA] shadow-none rounded-xl"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search case ID, name, file no…"
            value={query}
            onValueChange={setQuery}
            className="text-base"
          />
          <CommandList>
            {filtered.length === 0 && (
              <p className="py-3 text-center text-base text-[#9a9a96]">
                No cases found.
              </p>
            )}
            <CommandGroup>
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
                className="text-base text-[#9a9a96]"
              >
                <span className="italic">No link</span>
              </CommandItem>
              {filtered.map((c) => (
                <CommandItem
                  key={c.record_id}
                  value={`${c.record_id} ${c.taxpayer_name} ${c.file_no}`}
                  onSelect={() => {
                    onChange(c.record_id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="text-base"
                >
                  <Check
                    size={13}
                    className={`mr-2 shrink-0 ${value === c.record_id ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">
                      {c.record_id}
                      <span className="ml-1.5 text-[10px] font-normal text-[#9a9a96] bg-[#F3F2EF] rounded px-1">
                        {c.is_ir ? "IR" : "NON-IR"}
                      </span>
                    </span>
                    <span className="truncate text-[#9a9a96] text-sm">
                      {c.taxpayer_name || c.file_no || "—"}
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
