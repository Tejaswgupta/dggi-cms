"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

const CaseViewer = ({ case: caseItem }: { case: any }) => {
  const router = useRouter();

  const formatPartyName = (party?: string[] | null) => {
    const name = Array.isArray(party) ? party.filter(Boolean).join(", ") : "";
    return name.trim() || "Unknown";
  };

  const caseNameFull = `${formatPartyName(caseItem.petitioner)} vs ${formatPartyName(caseItem.respondent)}`;

  const caseNumber = caseItem.registration_no || "N/A";

  const getNextListingStatus = () => {
    if (!caseItem.next_listing_date) {
      return {
        label: "Not Scheduled",
        className: "bg-gray-100 text-gray-600",
      };
    }

    const listingDate = new Date(caseItem.next_listing_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    listingDate.setHours(0, 0, 0, 0);

    const diffTime = listingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: "Overdue",
        className: "bg-rose-100 text-rose-800",
      };
    }

    if (diffDays === 0) {
      return {
        label: "Today",
        className: "bg-amber-100 text-amber-800",
      };
    }

    if (diffDays <= 7) {
      return {
        label: "This Week",
        className: "bg-sky-100 text-sky-800",
      };
    }

    return {
      label: "Upcoming",
      className: "bg-indigo-100 text-indigo-800",
    };
  };

  const formatListingDate = (dateString: string) => {
    if (!dateString) return "Not Scheduled";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const status = getNextListingStatus();

  return (
    <div className="border-b border-[#F3F2EF] last:border-b-0">
      <div
        className="flex gap-3 items-start hover:bg-[#FAFAF8] rounded-[8px] p-3 transition-colors cursor-pointer"
        onClick={() => router.push(`/cases/${caseItem.id}`)}
      >
        <div className="w-2 h-2 mt-2 rounded-full bg-[#4A5FD4] flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {caseNameFull}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-gray-500">
              <div className="flex items-center">
                <span className="font-semibold text-gray-700">
                  {caseNumber}
                </span>
              </div>

              {status.label === "Overdue" ? (
                <div className="px-[7px] py-[2px] text-[11px] rounded-[20px] bg-[#FEF0EE] text-[#C0432A] flex items-center">
                  Overdue · {formatListingDate(caseItem.next_listing_date)}
                </div>
              ) : (
                <>
                  {status.label !== "Upcoming" && (
                    <div
                      className={cn(
                        "px-2 py-0.5 text-[11px] rounded-full flex items-center",
                        status.className,
                      )}
                    >
                      {status.label}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {formatListingDate(caseItem.next_listing_date)}
                  </div>
                </>
              )}

              {(caseItem as any)?.court_display?.court_name ? (
                <div className="ml-auto text-[#b0b0aa]">{(caseItem as any).court_display.court_name}</div>
              ) : (caseItem as any)?.court_code ? (
                <div className="ml-auto text-[#b0b0aa]">{(caseItem as any).court_code}</div>
              ) : null}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/cases/${caseItem.id}`);
          }}
        >
          <ExternalLink size={14} className="text-gray-500" />
        </Button>
      </div>
    </div>
  );
};

export default CaseViewer;
