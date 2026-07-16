"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGroupFilteredSioUsers } from "@/hooks/useGroupFilteredSioUsers";
import { getWorkspaceId } from "@/lib/action/workspace";
import { DGGI_GROUPS } from "@/lib/dggi-constants";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CaseIdCombobox, type DGGICaseOption } from "./CaseIdCombobox";
import {
  REGISTER_PREFIXES,
  exportRegisterToExcel,
  fetchCaseOptions,
  generateWorkspaceRecordId,
} from "./register-utils";
import {
  RegisterRecordDialog,
  type RegisterColumn,
  type WorkspaceUser,
} from "./RegisterRecordDialog";
import { parseAdgComments } from "./AdgCommentThread";

const TABLE_NAME = "dggi_str_records";
const RECORD_PREFIX = REGISTER_PREFIXES.STR;

interface STRRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  str_reference_no: string;
  date_of_str: string;
  entity_name: string;
  gstin: string;
  amount_involved: string;
  nature_of_offence: string;
  fiu_reference_no: string;
  action_taken: string;
  status: string;
  remarks: string;
  sio_group: string;
  sio: string;
  sio_name: string;
  group: string;
  pr_adg_comments?: string;
  pr_adg_comments_updated_at?: string | null;
}

const COLUMNS: RegisterColumn[] = [
  {
    key: "record_id",
    label: "ID",
    type: "text",
    width: "140px",
    readOnly: true,
  },
  {
    key: "pr_adg_comments",
    label: "Pr.ADG Comments",
    type: "adgcomments",
    width: "200px",
  },
  {
    key: "linked_case_id",
    label: "Linked Case",
    type: "caselink",
    width: "180px",
  },
  {
    key: "str_reference_no",
    label: "STR Reference No.",
    type: "text",
    width: "180px",
  },
  {
    key: "date_of_str",
    label: "Date of STR",
    type: "datepicker",
    width: "150px",
  },
  { key: "entity_name", label: "Taxpayer Name", type: "text", width: "180px" },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  {
    key: "amount_involved",
    label: "Amount Involved",
    type: "text",
    width: "150px",
  },
  {
    key: "nature_of_offence",
    label: "Nature of Offence",
    type: "text",
    width: "200px",
  },
  {
    key: "fiu_reference_no",
    label: "FIU Reference No.",
    type: "text",
    width: "170px",
  },
  { key: "action_taken", label: "Action Taken", type: "text", width: "200px" },
  { key: "status", label: "Status", type: "text", width: "130px" },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: DGGI_GROUPS,
    width: "120px",
  },
  { key: "remarks", label: "Remarks", type: "text", width: "220px" },
];

const TOTAL_COLS = COLUMNS.length + 1;
const EMPTY_RECORD: Omit<STRRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  str_reference_no: "",
  date_of_str: "",
  entity_name: "",
  gstin: "",
  amount_involved: "",
  nature_of_offence: "",
  fiu_reference_no: "",
  action_taken: "",
  status: "",
  remarks: "",
  sio_group: "",
  sio: "",
  sio_name: "",
  group: "",
  pr_adg_comments: "",
  pr_adg_comments_updated_at: null,
};

const fmt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const STRRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [records, setRecords] = useState<STRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<STRRecord>>({});
  const [userRole, setUserRole] = useState("");

  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const [{ data }, cases, authUserRes] = await Promise.all([
        supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid),
        fetchCaseOptions(supabase, wid),
        supabase.auth.getUser(),
      ]);
      setRecords(data ?? []);
      setCaseOptions(cases);
      
      const uid = authUserRes.data.user?.id;
      if (uid) {
        const { data: profile } = await supabase
          .from("votum_users")
          .select("dggi_role")
          .eq("id", uid)
          .single();
        if (profile?.dggi_role) setUserRole(profile.dggi_role);
      }
      setLoading(false);
    };
    init();
  }, []);

  const tableRecords = records
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [r.str_reference_no, r.entity_name, r.gstin, r.sio_group].some(
        (v) => v?.toLowerCase().includes(q),
      );
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      const cmp = String((a as any)[sortCol] ?? "").localeCompare(
        String((b as any)[sortCol] ?? ""),
      );
      return sortDir === "asc" ? cmp : -cmp;
    });

  const saveEdit = async () => {
    if (!dialogDraft.id) return;
    setSavingRow(true);
    const existingRecord = records.find((r) => r.id === dialogDraft.id);
    const commentChanged =
      userRole === "ADG" &&
      (dialogDraft.pr_adg_comments ?? "") !== (existingRecord?.pr_adg_comments ?? "");

    const updatePayload = {
      ...dialogDraft,
      sio_name: workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null,
    };
    if (userRole !== "ADG") delete updatePayload.pr_adg_comments;
    if (commentChanged) {
      updatePayload.pr_adg_comments_updated_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updatePayload)
      .eq("id", dialogDraft.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === dialogDraft.id
            ? { ...r, ...dialogDraft, ...(commentChanged ? { pr_adg_comments_updated_at: updatePayload.pr_adg_comments_updated_at } : {}) }
            : r,
        ),
      );
      toast.success("Record saved");
      setDialogOpen(false);
    }
    setSavingRow(false);
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.success("Record deleted");
    }
  };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const payload = {
      ...dialogDraft,
      record_id: await generateWorkspaceRecordId(
        supabase,
        TABLE_NAME,
        RECORD_PREFIX,
        workspaceId,
      ),
      workspace_id: workspaceId,
      sio_name: workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null,
    };
    if (userRole !== "ADG") delete payload.pr_adg_comments;
    if (payload.pr_adg_comments) {
      payload.pr_adg_comments_updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add: " + error.message);
    } else {
      setRecords((prev) => [...prev, data]);
      setDialogOpen(false);
      toast.success("Record added");
    }
    setSavingRow(false);
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    exportRegisterToExcel(tableRecords, COLUMNS, "STR", (msg) =>
      toast.success(msg),
    );
  };

  const renderCell = (value: string, type: RegisterColumn["type"], storedName?: string) => {
    if (type === "adgcomments") {
      const comments = parseAdgComments(value);
      if (comments.length === 0) return <span className="text-[#9a9a96]">—</span>;
      const last = comments[comments.length - 1];
      return (
        <div className="flex flex-col gap-0.5 max-w-[190px]">
          <span className="text-base text-[#1a1a1a] truncate" title={last.text}>{last.text}</span>
          {comments.length > 1 && (
            <span className="text-xs text-[#9a9a96]">+{comments.length - 1} more</span>
          )}
        </div>
      );
    }
    if (type === "caselink")
      return (
        <CaseIdCombobox
          value={value}
          onChange={() => {}}
          cases={caseOptions}
          editing={false}
        />
      );
    if (type === "datepicker")
      return <span className="whitespace-nowrap">{fmt(value)}</span>;
    if (type === "usercombobox")
      return (
        <span>
          {workspaceUsers.find((u) => u.id === value)?.name || storedName || "—"}
        </span>
      );
    return <span>{value || "—"}</span>;
  };

  if (loading || usersLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" />
      </div>
    );

  return (
    <div className="w-full min-h-full bg-white font-['DM_Sans'] pt-4 pb-10">
      <div className="px-3 sm:px-6 space-y-5">
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-medium text-[#1a1a1a]">
                STR Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                Suspicious Transaction Reports · {tableRecords.length} record
                {tableRecords.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4"
                onClick={handleExport}
                disabled={tableRecords.length === 0}
              >
                <Download size={15} className="mr-1" />
                Export to Excel
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4"
                onClick={() => {
                  setDialogMode("add");
                  setDialogDraft({ ...EMPTY_RECORD });
                  setDialogOpen(true);
                }}
              >
                <Plus size={15} className="mr-1" />
                Add Record
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base text-[#6b6b6b] shrink-0">
              <SlidersHorizontal size={14} />
              <span className="font-medium">Search</span>
            </div>
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-3 text-[#9a9a96] pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search STR ref, entity, GSTIN…"
                className="h-9 pl-8 pr-3 min-w-[240px] border-[#EDEDEA] text-base rounded-lg"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="flex items-center gap-1 text-base text-[#6b6b6b] hover:text-[#C0432A] px-2 py-1 rounded-lg hover:bg-[#FEE2E2]"
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-[#EDEDEA] bg-white shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-b border-[#EDEDEA]">
                  {COLUMNS.map((col) => (
                    <TableHead
                      key={col.key}
                      style={{ minWidth: col.width }}
                      className="text-base font-semibold text-[#6b6b6b] py-3 px-3 whitespace-nowrap cursor-pointer select-none hover:text-[#1a1a1a]"
                      onClick={() => toggleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {sortCol === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          ))}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-base font-semibold text-[#6b6b6b] py-3 px-3 w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-b border-[#EDEDEA] text-base hover:bg-white"
                  >
                    {COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className="px-3 py-2 text-[#1a1a1a]"
                      >
                        {renderCell((record as any)[col.key] ?? "", col.type, col.key === "sio" ? (record as any).sio_name : undefined)}
                      </TableCell>
                    ))}
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-[#6b6b6b] hover:bg-[#F3F2EF]"
                          onClick={() => {
                            setDialogMode("edit");
                            setDialogDraft({ ...record });
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]"
                          onClick={() => deleteRecord(record.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      No STR records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <RegisterRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        columns={COLUMNS}
        draft={dialogDraft as Record<string, string>}
        onDraftChange={(k, v) =>
          setDialogDraft((prev) => ({ ...prev, [k]: v }))
        }
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        users={sioUsers}
        caseOptions={caseOptions}
        userRole={userRole}
      />
    </div>
  );
};

export default STRRegisterComponent;
