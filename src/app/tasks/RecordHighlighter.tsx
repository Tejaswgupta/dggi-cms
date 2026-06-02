"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const HIGHLIGHT_CLASS = "record-highlight-flash";

export default function RecordHighlighter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    if (!highlightId) return;

    let attempts = 0;
    const maxAttempts = 50; // 50 × 300ms = 15s window — covers slow data fetches
    const interval = setInterval(() => {
      attempts++;
      const el = document.querySelector(
        `[data-record-id="${CSS.escape(highlightId)}"]`,
      );
      if (el) {
        clearInterval(interval);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add(HIGHLIGHT_CLASS);
        setTimeout(() => el.classList.remove(HIGHLIGHT_CLASS), 3000);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("highlight");
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [highlightId, router, pathname, searchParams]);

  return null;
}
