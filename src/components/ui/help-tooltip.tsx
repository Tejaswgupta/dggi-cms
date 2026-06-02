"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { ReactNode } from "react";

interface HelpTooltipProps {
  content: string | ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md" | "lg";
}

export function HelpTooltip({
  content,
  side = "top",
  size = "sm",
}: HelpTooltipProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <HelpCircle
            className={`text-muted-foreground cursor-help inline-block ${sizeClasses[size]}`}
          />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
