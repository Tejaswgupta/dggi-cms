"use client";

import clientConnectionWithSupabase from "@/lib/supabase/client";
import { DGGI_ROLE_LABELS } from "@/lib/dggi-constants";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";

interface OfficerRow {
  id: string;
  name: string;
  email: string;
  dggi_role: string | null;
  designation: string | null;
  last_sign_in_at: string | null;
}

type StatusFilter = "all" | "active" | "inactive" | "never";

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function statusBadge(days: number | null) {
  if (days === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EF] px-2.5 py-0.5 text-xs font-medium text-[#6b6b6b]">
        <UserX size={11} />
        Never signed in
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-medium text-[#065F46]">
        <CheckCircle2 size={11} />
        Active ({days}d ago)
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF9C3] px-2.5 py-0.5 text-xs font-medium text-[#92400E]">
        <Clock size={11} />
        {days}d ago
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-medium text-[#991B1B]">
      <AlertCircle size={11} />
      Inactive ({days}d ago)
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function OfficerActivityComponent() {
  const [officers, setOfficers] = useState<OfficerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isAdg, setIsAdg] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = clientConnectionWithSupabase();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setIsAdg(false); setLoading(false); return; }
      const { data } = await supabase
        .from("votum_users")
        .select("dggi_role")
        .eq("id", user.id)
        .single();
      if (data?.dggi_role !== "ADG") { setIsAdg(false); setLoading(false); return; }
      setIsAdg(true);
      loadData();
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dggi/officer-activity");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to load");
      }
      const body = await res.json();
      setOfficers(body.users ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (isAdg === false) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center text-[#6b6b6b]">
          <AlertCircle size={40} className="mx-auto mb-3 text-[#EF4444]" />
          <p className="font-medium">Access restricted to ADG only.</p>
        </div>
      </div>
    );
  }

  const uniqueRoles = [...new Set(officers.map((o) => o.dggi_role ?? "Unknown"))].sort();

  const filtered = officers.filter((o) => {
    const days = daysSince(o.last_sign_in_at);

    const matchesSearch =
      !search ||
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "never" && days === null) ||
      (statusFilter === "active" && days !== null && days <= 7) ||
      (statusFilter === "inactive" && days !== null && days > 7);

    const matchesRole =
      roleFilter === "all" || (o.dggi_role ?? "Unknown") === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Summary stats
  const total = officers.length;
  const neverSigned = officers.filter((o) => !o.last_sign_in_at).length;
  const active = officers.filter((o) => {
    const d = daysSince(o.last_sign_in_at);
    return d !== null && d <= 7;
  }).length;
  const inactive = officers.filter((o) => {
    const d = daysSince(o.last_sign_in_at);
    return d !== null && d > 7;
  }).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#EDEDEA] bg-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <UserCheck size={20} className="text-[#4A5FD4]" />
            <h1 className="text-lg font-semibold text-[#1a1a1a]">Officer Activity Report</h1>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#EDEDEA] bg-white px-3 py-1.5 text-xs text-[#6b6b6b] hover:bg-[#F3F2EF] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        <p className="text-xs text-[#9a9a96]">Application login activity for all officers in your workspace</p>
      </div>

      {/* Summary tiles */}
      <div className="px-6 py-4 grid grid-cols-4 gap-3 bg-white border-b border-[#EDEDEA]">
        {[
          { label: "Total Officers", value: total, color: "text-[#1a1a1a]", bg: "bg-[#F3F2EF]" },
          { label: "Active (≤7 days)", value: active, color: "text-[#065F46]", bg: "bg-[#ECFDF5]" },
          { label: "Inactive (>7 days)", value: inactive, color: "text-[#92400E]", bg: "bg-[#FEF9C3]" },
          { label: "Never Signed In", value: neverSigned, color: "text-[#991B1B]", bg: "bg-[#FEF2F2]" },
        ].map((t) => (
          <div key={t.label} className={`${t.bg} rounded-xl px-4 py-3`}>
            <p className="text-xs text-[#6b6b6b] mb-1">{t.label}</p>
            <p className={`text-2xl font-bold ${t.color}`}>{loading ? "—" : t.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 flex items-center gap-3 bg-white border-b border-[#EDEDEA] flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9a9a96]" />
          <input
            className="w-full rounded-lg border border-[#EDEDEA] bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-[#c4c4c0] focus:outline-none focus:ring-1 focus:ring-[#4A5FD4]"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(["all", "active", "inactive", "never"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#4A5FD4] text-white"
                  : "bg-[#F3F2EF] text-[#6b6b6b] hover:bg-[#EDEDEA]"
              }`}
            >
              {s === "all" ? "All" : s === "active" ? "Active" : s === "inactive" ? "Inactive" : "Never"}
            </button>
          ))}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[#EDEDEA] bg-white px-2.5 py-1.5 text-xs text-[#6b6b6b] focus:outline-none focus:ring-1 focus:ring-[#4A5FD4]"
        >
          <option value="all">All Roles</option>
          {uniqueRoles.map((r) => (
            <option key={r} value={r}>{DGGI_ROLE_LABELS[r] ?? r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {error ? (
          <div className="flex items-center gap-2 text-sm text-[#EF4444] bg-[#FEF2F2] rounded-lg px-4 py-3">
            <AlertCircle size={15} />
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[#F3F2EF] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-auto max-h-[calc(100vh-320px)] rounded-xl border border-[#EDEDEA]">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-[#F8F8F6] z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9a9a96] uppercase tracking-wider border-b border-[#EDEDEA] w-8">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9a9a96] uppercase tracking-wider border-b border-[#EDEDEA]">Officer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9a9a96] uppercase tracking-wider border-b border-[#EDEDEA]">Role</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9a9a96] uppercase tracking-wider border-b border-[#EDEDEA]">Last Signed In</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9a9a96] uppercase tracking-wider border-b border-[#EDEDEA]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#9a9a96] text-sm">
                      No officers match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((o, idx) => {
                    const days = daysSince(o.last_sign_in_at);
                    const rowBg = days === null
                      ? "bg-[#FFFBEB]"
                      : days > 30
                      ? "bg-[#FFF5F5]"
                      : "";
                    return (
                      <tr key={o.id} className={`border-b border-[#EDEDEA] hover:bg-[#F8F8F6] transition-colors ${rowBg}`}>
                        <td className="px-4 py-3 text-[#9a9a96] text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1a1a1a]">{o.name || "—"}</p>
                          <p className="text-xs text-[#9a9a96]">{o.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#6b6b6b]">
                            {o.dggi_role ? (DGGI_ROLE_LABELS[o.dggi_role] ?? o.dggi_role) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6b6b6b] whitespace-nowrap">
                          {formatDate(o.last_sign_in_at)}
                        </td>
                        <td className="px-4 py-3">
                          {statusBadge(days)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <p className="mt-2 text-xs text-[#9a9a96]">
            Showing {filtered.length} of {total} officer{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
