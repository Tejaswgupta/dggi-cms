"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  nullifyEmpty,
} from "./register-utils";
import { DGGI_GROUPS } from "@/lib/dggi-constants";
import {
  RegisterRecordDialog,
  type RegisterColumn,
  type WorkspaceUser,
} from "./RegisterRecordDialog";

const RECORD_PREFIX = REGISTER_PREFIXES.ALERT_CIRCULAR;
const TABLE_NAME = "dggi_alert_circular_records";

interface AlertCircularRecord {
  id: string;
  record_id: string;
  linked_case_id: string;
  alert_circular_no_date: string;
  gstin: string;
  cgst_commissionerate: string;
  cgst_zone: string;
  legal_trade_name: string;
  jurisdiction: string;
  itc_tax_involved_lakhs: string;
  tax_period_involved: string;
  docs_shared: string;
  scn_ruds_shared: string;
  remarks: string;
  sio: string;
  sio_name: string;
  group: string;
}

const COLUMNS: {
  key: keyof Omit<AlertCircularRecord, "id">;
  label: string;
  type: "text" | "select" | "usercombobox" | "caselink";
  options?: string[];
  width?: string;
  readOnly?: boolean;
}[] = [
  {
    key: "record_id",
    label: "ID",
    type: "text",
    width: "140px",
    readOnly: true,
  },
  {
    key: "linked_case_id",
    label: "Linked Case",
    type: "caselink",
    width: "180px",
  },
  {
    key: "alert_circular_no_date",
    label: "Alert Circular No. & Date",
    type: "text",
    width: "200px",
  },
  { key: "gstin", label: "GSTIN", type: "text", width: "160px" },
  {
    key: "legal_trade_name",
    label: "Taxpayer Name",
    type: "text",
    width: "180px",
  },
  {
    key: "jurisdiction",
    label: "Jurisdiction",
    type: "select",
    options: ["State", "Centre"],
    width: "130px",
  },
  {
    key: "docs_shared",
    label: "Docs Shared (Y/N)",
    type: "select",
    options: ["Y", "N"],
    width: "130px",
  },
  {
    key: "scn_ruds_shared",
    label: "SCN+RUDs Shared (Y/N)",
    type: "select",
    options: ["Y", "N"],
    width: "150px",
  },
  { key: "sio", label: "SIO", type: "usercombobox", width: "160px" },
  {
    key: "group",
    label: "Group",
    type: "select",
    options: [...DGGI_GROUPS],
    width: "120px",
  },
  { key: "remarks", label: "Remarks", type: "text", width: "240px" },
];

const TOTAL_COLS = COLUMNS.length + 1;

const EMPTY_RECORD: Omit<AlertCircularRecord, "id"> = {
  record_id: "",
  linked_case_id: "",
  alert_circular_no_date: "",
  gstin: "",
  cgst_commissionerate: "",
  cgst_zone: "",
  legal_trade_name: "",
  jurisdiction: "",
  itc_tax_involved_lakhs: "",
  tax_period_involved: "",
  docs_shared: "",
  scn_ruds_shared: "",
  remarks: "",
  sio: "",
  sio_name: "",
  group: "",
};

function EditableCell({
  value,
  type,
  options,
  users,
  caseOptions,
  storedName,
}: {
  value: string;
  type: "text" | "select" | "usercombobox" | "caselink";
  options?: string[];
  users?: WorkspaceUser[];
  caseOptions?: DGGICaseOption[];
  storedName?: string;
}) {
  if (type === "caselink")
    return (
      <CaseIdCombobox
        value={value}
        onChange={() => {}}
        cases={caseOptions ?? []}
        editing={false}
      />
    );
  if (type === "usercombobox")
    return (
      <span>{users?.find((u) => u.id === value)?.name || storedName || "—"}</span>
    );
  return <span>{value || "—"}</span>;
}

const AlertCircularRegisterComponent = () => {
  const supabase = clientConnectionWithSupabase();
  const [workspaceId, setWorkspaceId] = useState("");
  const [records, setRecords] = useState<AlertCircularRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingRow, setSavingRow] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogDraft, setDialogDraft] = useState<Partial<AlertCircularRecord>>(
    {},
  );

  const { allUsers: workspaceUsers, sioUsers, loading: usersLoading } = useGroupFilteredSioUsers();
  const [caseOptions, setCaseOptions] = useState<DGGICaseOption[]>([]);

  useEffect(() => {
    const init = async () => {
      const wid = await getWorkspaceId();
      setWorkspaceId(wid);
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      const [{ data: userRow }, { data: groupRows }] = await Promise.all([
        supabase
          .from("votum_users")
          .select("dggi_role")
          .eq("id", uid!)
          .single(),
        supabase
          .from("dggi_user_group_assignments")
          .select("group_name")
          .eq("user_id", uid!),
      ]);
      const role = userRow?.dggi_role ?? "";
      const groups = (groupRows ?? []).map(
        (g: { group_name: string }) => g.group_name,
      );

      let query = supabase.from(TABLE_NAME).select("*").eq("workspace_id", wid);
      if (role !== "ADG" && role !== "DD_INT") {
        if (role === "IO" || role === "SIO") {
          query = query.eq("sio", uid!);
        } else if (groups.length > 0) {
          query = query.in("group", groups);
        } else {
          query = query.eq("group", "__none__");
        }
      }
      const [{ data, error }, cases] = await Promise.all([
        query,
        fetchCaseOptions(supabase, wid),
      ]);
      if (!error) setRecords(data ?? []);
      setCaseOptions(cases);
      setLoading(false);
    };
    init();
  }, []);

  const tableRecords = records
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [
        r.gstin,
        r.legal_trade_name,
        r.alert_circular_no_date,
      ].some((v) => v?.toLowerCase().includes(q));
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
    const updatePayload = nullifyEmpty({ ...dialogDraft }, COLUMNS);
    (updatePayload as any).sio_name = workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null;
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updatePayload)
      .eq("id", dialogDraft.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === dialogDraft.id ? { ...r, ...dialogDraft } : r,
        ),
      );
      toast.success("Record saved");
      setDialogOpen(false);
    }
    setSavingRow(false);
  };

  const deleteRecord = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    let toastId: ReturnType<typeof toast.info>;
    const timerId = setTimeout(async () => {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
      if (error) {
        setRecords((prev) => [...prev, record]);
        toast.error("Delete failed: " + error.message);
      }
    }, 5000);
    toastId = toast.info(
      <div className="flex items-center justify-between gap-3 w-full">
        <span>{record.record_id} deleted</span>
        <button
          onClick={() => { clearTimeout(timerId); setRecords((prev) => [...prev, record]); toast.dismiss(toastId); }}
          className="font-medium underline underline-offset-2 shrink-0"
        >
          Undo
        </button>
      </div>,
      { autoClose: 5000, closeOnClick: false, pauseOnHover: true },
    );
  };

  const saveNew = async () => {
    if (!workspaceId) return;
    setSavingRow(true);
    const payload = nullifyEmpty({
      ...dialogDraft,
      record_id: await generateWorkspaceRecordId(
        supabase,
        TABLE_NAME,
        RECORD_PREFIX,
        workspaceId,
      ),
      workspace_id: workspaceId,
    }, COLUMNS);
    (payload as any).sio_name = workspaceUsers.find((u) => u.id === (dialogDraft.sio ?? ""))?.name || null;
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
    exportRegisterToExcel(tableRecords, COLUMNS, "Alert_Circular", (msg) =>
      toast.success(msg),
    );
  };

  const renderRow = (record: AlertCircularRecord) => (
    <TableRow
      key={record.id}
      className="border-b border-[#EDEDEA] text-base hover:bg-white"
    >
      {COLUMNS.map((col) => (
        <TableCell key={col.key} className="px-3 py-2 text-[#1a1a1a]">
          <EditableCell
            value={(record as any)[col.key] ?? ""}
            type={col.type}
            options={col.options}
            users={workspaceUsers}
            caseOptions={caseOptions}
            storedName={col.key === "sio" ? (record as any).sio_name : undefined}
          />
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg text-[#C0432A] hover:bg-[#FEE2E2]"
              >
                <Trash2 size={13} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete alert circular record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {record.record_id} and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#C0432A] hover:bg-[#a83823] text-white"
                  onClick={() => deleteRecord(record.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );

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
                Alert Circular Register
              </h1>
              <p className="text-base text-[#9a9a96]">
                {tableRecords.length} record
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
              <span className="font-medium">Filters</span>
            </div>
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-3 text-[#9a9a96] pointer-events-none"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search GSTIN, name, unit…"
                className="h-9 pl-8 pr-3 min-w-[220px] border-[#EDEDEA] text-base rounded-lg"
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
                {tableRecords.map(renderRow)}
                {tableRecords.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={TOTAL_COLS}
                      className="py-12 text-center text-base text-[#9a9a96]"
                    >
                      No alert circular records found.
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
        columns={COLUMNS as RegisterColumn[]}
        draft={dialogDraft as Record<string, string>}
        onDraftChange={(k, v) =>
          setDialogDraft((prev) => ({ ...prev, [k]: v }))
        }
        onSave={dialogMode === "add" ? saveNew : saveEdit}
        saving={savingRow}
        users={sioUsers}
        caseOptions={caseOptions}
      />
    </div>
  );
};

export default AlertCircularRegisterComponent;
