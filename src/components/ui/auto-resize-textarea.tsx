"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  wrapperClassName?: string;
  maxHeight?: string | number;
}

export function AutoResizeTextarea({
  value,
  className,
  wrapperClassName,
  maxHeight = "none",
  onChange,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = `${textarea.scrollHeight}px`;
      if (maxHeight !== "none") {
        textarea.style.maxHeight =
          typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
        textarea.style.height = newHeight;
      } else {
        textarea.style.maxHeight = "none";
        textarea.style.height = newHeight;
      }
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  return (
    <div className={wrapperClassName}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        className={cn(
          "min-h-[200px] w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          className
        )}
        {...props}
      />
    </div>
  );
}
