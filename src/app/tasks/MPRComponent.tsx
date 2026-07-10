"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { Check, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const REPORT_TYPES = [
  "NCLT Report",
  "HSNS Cess_Central Excise Duty Report Format Annexure I and II (Offence Monthly report)",
  "Arrest Intimation Report under HSNS CESS Act and Central Excise Act, 1944 by DGGI",
  "ARREST (with Fake ITC Arrest details)",
  "Monthly Offence Report",
  "Consolidated Operation Report Format",
  "MPR",
  "GST Evasion Parliamentary Matter",
  "PQ data & Monthly Snapshot",
  "SAADHIT Target",
  "Fake ITC Report",
  "Monthly Performance Snapshot",
  "Arrest Report",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MprRecord {
  id: string;
  workspace_id: string;
  year: number;
  month: number;
  report_type: string;
  filed: boolean;
  filed_date: string | null;
  filed_by: string | null;
  remarks: string | null;
}

type StatusMap = Record<string, MprRecord>;

const rowKey = (reportType: string) => reportType;

const MPRComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [statusMap, setStatusMap] = useState<StatusMap>({});

  const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
    };
    init();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    fetchRecords();
  }, [workspaceId, year, month]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dggi_mpr_records")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("year", year)
      .eq("month", month);

    if (error) {
      toast.error("Failed to load: " + error.message);
      setLoading(false);
      return;
    }

    const map: StatusMap = {};
    for (const r of data ?? []) {
      map[rowKey(r.report_type)] = r;
    }
    setStatusMap(map);
    setLoading(false);
  };

  const toggleFiled = async (reportType: string) => {
    const key = rowKey(reportType);
    const existing = statusMap[key];
    const newFiled = !existing?.filed;
    setSaving(key);

    if (existing) {
      const { error } = await supabase
        .from("dggi_mpr_records")
        .update({
          filed: newFiled,
          filed_date: newFiled ? new Date().toISOString().slice(0, 10) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        toast.error("Failed to update: " + error.message);
      } else {
        setStatusMap((prev) => ({
          ...prev,
          [key]: {
            ...existing,
            filed: newFiled,
            filed_date: newFiled ? new Date().toISOString().slice(0, 10) : null,
          },
        }));
      }
    } else {
      const { data, error } = await supabase
        .from("dggi_mpr_records")
        .insert({
          workspace_id: workspaceId,
          year,
          month,
          report_type: reportType,
          filed: true,
          filed_date: new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to save: " + error.message);
      } else {
        setStatusMap((prev) => ({ ...prev, [key]: data }));
      }
    }
    setSaving(null);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const filedCount = REPORT_TYPES.filter((r) => statusMap[rowKey(r)]?.filed).length;

  const handleExport = () => {
    const rows = REPORT_TYPES.map((r) => {
      const rec = statusMap[rowKey(r)];
      return {
        "Report": r,
        "Filed": rec?.filed ? "YES" : "NO",
        "Filed Date": rec?.filed_date ?? "",
        "Filed By": rec?.filed_by ?? "",
        "Remarks": rec?.remarks ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MPR");
    XLSX.writeFile(wb, `MPR_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
    toast.success("Exported successfully");
  };

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">

        {/* Header */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">Monthly Performance Report</h1>
              <p className="text-base text-[#9a9a96]">
                {filedCount} of {REPORT_TYPES.length} reports filed for {MONTH_NAMES[month - 1]} {year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4"
                onClick={handleExport}
              >
                <Download size={15} className="mr-1" />Export
              </Button>
            </div>
          </div>
        </div>

        {/* Month/Year picker */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-medium text-[#6b6b6b]">Period</span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg border-[#EDEDEA]"
                onClick={prevMonth}
              >
                <ChevronLeft size={14} />
              </Button>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="h-9 w-[130px] rounded-lg border-[#EDEDEA] text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="h-9 w-[100px] rounded-lg border-[#EDEDEA] text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg border-[#EDEDEA]"
                onClick={nextMonth}
              >
                <ChevronRight size={14} />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-base text-[#9a9a96]">{filedCount}/{REPORT_TYPES.length}</span>
              <div className="w-32 h-2 rounded-full bg-[#EDEDEA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4A5FD4] transition-all duration-300"
                  style={{ width: `${(filedCount / REPORT_TYPES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report list */}
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-[#EDEDEA] bg-white">
                  <th className="text-left px-5 py-3 font-semibold text-[#6b6b6b] w-8">#</th>
                  <th className="text-left px-3 py-3 font-semibold text-[#6b6b6b]">Report</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#6b6b6b] w-[110px]">Status</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#6b6b6b] w-[140px]">Filed Date</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#6b6b6b] w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_TYPES.map((reportType, idx) => {
                  const key = rowKey(reportType);
                  const rec = statusMap[key];
                  const filed = rec?.filed ?? false;
                  const isSaving = saving === key;

                  return (
                    <tr
                      key={reportType}
                      className={`border-b border-[#EDEDEA] transition-colors ${filed ? "bg-[#F0FDF4]" : "hover:bg-[#FAFAFA]"}`}
                    >
                      <td className="px-5 py-3 text-[#9a9a96] text-sm">{idx + 1}</td>
                      <td className="px-3 py-3 text-[#1a1a1a]">{reportType}</td>
                      <td className="px-3 py-3 text-center">
                        {filed ? (
                          <Badge className="bg-[#DCFCE7] text-[#15803D] border-0 font-medium px-3 py-1 text-sm">
                            <Check size={12} className="mr-1" />YES
                          </Badge>
                        ) : (
                          <Badge className="bg-[#FEF2F2] text-[#DC2626] border-0 font-medium px-3 py-1 text-sm">
                            <X size={12} className="mr-1" />NO
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-[#6b6b6b]">
                        {rec?.filed_date
                          ? new Date(rec.filed_date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Button
                          size="sm"
                          variant={filed ? "outline" : "default"}
                          className={`h-8 rounded-lg text-sm px-3 shadow-none ${
                            filed
                              ? "border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:border-[#DC2626]"
                              : "bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white border-0"
                          }`}
                          onClick={() => toggleFiled(reportType)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent inline-block" />
                          ) : filed ? (
                            "Mark Unfiled"
                          ) : (
                            "Mark Filed"
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MPRComponent;
