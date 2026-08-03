"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RecordHighlighter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filterId = searchParams.get("filter") || searchParams.get("highlight");

  useEffect(() => {
    if (!filterId) return;

    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      // Look for a search input element on the page (common across register components)
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Search"], input[placeholder*="search"]',
      );
      if (input) {
        clearInterval(interval);
        // Set search filter value and dispatch native input event so React state updates
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, filterId);
        } else {
          input.value = filterId;
        }
        input.dispatchEvent(new Event("input", { bubbles: true }));

        // Clean up URL query parameters
        const params = new URLSearchParams(searchParams.toString());
        params.delete("filter");
        params.delete("highlight");
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [filterId, router, pathname, searchParams]);

  return null;
}
