"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export type AdgComment = { text: string; timestamp: string };

export const parseAdgComments = (raw: string): AdgComment[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [{ text: String(raw), timestamp: "" }];
  } catch {
    return [{ text: raw, timestamp: "" }];
  }
};

export const serializeAdgComments = (comments: AdgComment[]): string =>
  comments.length ? JSON.stringify(comments) : "";

export function AdgCommentThread({
  value,
  onChange,
  canEdit,
}: {
  value: string;
  onChange: (v: string) => void;
  canEdit: boolean;
}) {
  const comments = parseAdgComments(value);
  const [newText, setNewText] = useState("");

  const addComment = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const updated = [
      ...comments,
      { text: trimmed, timestamp: new Date().toISOString() },
    ];
    onChange(serializeAdgComments(updated));
    setNewText("");
  };

  const deleteComment = (idx: number) => {
    const updated = comments.filter((_, i) => i !== idx);
    onChange(serializeAdgComments(updated));
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {comments.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full">
          {comments.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-[#EDEDEA] bg-[#FAFAF9] px-3 py-2 flex items-start justify-between gap-2 w-full"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-base text-[#1a1a1a] break-words">{c.text}</span>
                {c.timestamp && (
                  <span className="text-xs text-[#9a9a96]">
                    {new Date(c.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              {canEdit && (
                <button
                  onClick={() => deleteComment(i)}
                  className="shrink-0 text-[#9a9a96] hover:text-[#C0432A] transition-colors mt-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canEdit && (
        <div className="flex gap-2 w-full">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), addComment())}
            placeholder="Add comment…"
            className="h-9 flex-1 border-[#EDEDEA] text-base rounded-lg"
          />
          <Button
            type="button"
            size="sm"
            disabled={!newText.trim()}
            onClick={addComment}
            className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white shadow-none px-3"
          >
            <Plus size={14} />
          </Button>
        </div>
      )}
      {!canEdit && comments.length === 0 && (
        <span className="text-base text-[#9a9a96]">—</span>
      )}
    </div>
  );
}
