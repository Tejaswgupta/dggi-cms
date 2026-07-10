"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-base text-[#6b6b6b]">
      <span className="shrink-0">
        {total === 0 ? "No records" : `${from}–${to} of ${total}`}
      </span>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#9a9a96]">Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] border-[#EDEDEA] text-base shadow-none rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF] disabled:opacity-30"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF] disabled:opacity-30"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={14} />
          </Button>

          <span className="px-3 text-base text-[#1a1a1a] font-medium">
            {page} / {totalPages}
          </span>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF] disabled:opacity-30"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF] disabled:opacity-30"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
