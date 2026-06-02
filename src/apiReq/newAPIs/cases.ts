"use client";

import { clientBackendFetch } from "@/lib/client-backend-fetch";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { ConciseJson } from "@/lib/types";

type CaseFolderData = Pick<ConciseJson, "registration_no">;

type CaseStatusFilter = "upcoming" | "disposed" | "all";
type CaseTaskStatusFilter =
  | "all"
  | "overdue"
  | "active"
  | "completed"
  | "no_tasks";

interface CaseFilterParams {
  search?: string;
  status?: CaseStatusFilter;
  court?: string;
  collaboratorId?: string;
  taskStatus?: CaseTaskStatusFilter;
  dateRange?: "all" | "today" | "week" | "month";
  page?: number;
  pageSize?: number;
  /** Skip pagination — fetches all matching rows (e.g. for CSV export) */
  all?: boolean;
}

const buildCaseFolderName = (caseData: CaseFolderData, caseId: number) => {
  const registrationNo = (caseData.registration_no || "").toString().trim();

  if (registrationNo) {
    return registrationNo;
  }

  return caseId.toString();
};

const slugifyFolderName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_") || "folder";

const ensureCaseDocumentFolder = async (
  supabase: ReturnType<typeof clientConnectionWithSupabase>,
  workspaceId: string,
  caseId: number,
  caseData: CaseFolderData,
) => {
  const existing = await supabase
    .from("document_folders")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("case_id", caseId)
    .is("parent_id", null)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.id) return existing.data.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = buildCaseFolderName(caseData, caseId);
  const payload = {
    workspace_id: workspaceId,
    name,
    slug: slugifyFolderName(name),
    parent_id: null,
    created_by: user?.id ?? null,
    case_id: caseId,
  };

  const created = await supabase
    .from("document_folders")
    .insert(payload)
    .select()
    .single();

  if (!created.error) {
    return created.data?.id ?? null;
  }

  const fallbackName = `${name} (${caseId})`;
  const fallback = await supabase
    .from("document_folders")
    .insert({
      ...payload,
      name: fallbackName,
      slug: slugifyFolderName(fallbackName),
    })
    .select()
    .single();

  if (fallback.error) {
    throw fallback.error;
  }

  return fallback.data?.id ?? null;
};

const getSessionDetails = () => {
  const userDetails = localStorage.getItem("VotumUserDetails");
  if (!userDetails) return null;
  try {
    return JSON.parse(userDetails);
  } catch (error) {
    console.error("Failed to parse user session:", error);
    return null;
  }
};

const applyVisibilityFilter = (query: any, userId: string) =>
  query.or(
    [
      `created_by.eq.${userId}`,
      `assigned_user_ids.cs.{${userId}}`,
      `guest_user_ids.cs.{${userId}}`,
    ].join(","),
  );

const hydrateCasesWithCollaborators = async (
  supabase: ReturnType<typeof clientConnectionWithSupabase>,
  cases: any[],
) => {
  if (!cases || cases.length === 0) return [];

  const collaboratorIds = Array.from(
    new Set(
      cases
        .flatMap((caseItem: any) => [
          ...(caseItem.assigned_user_ids || []),
          ...(caseItem.guest_user_ids || []),
        ])
        .filter((id: string | null | undefined): id is string => Boolean(id)),
    ),
  );

  let usersById: Record<string, any> = {};

  if (collaboratorIds.length > 0) {
    const { data: collaborators, error: collaboratorsError } = await supabase
      .from("votum_users")
      .select("id, name, email, avatar_url")
      .in("id", collaboratorIds);

    if (!collaboratorsError && collaborators) {
      usersById = collaborators.reduce(
        (acc, user) => ({ ...acc, [user.id]: user }),
        {},
      );
    } else if (collaboratorsError) {
      console.error(
        "Failed to load case collaborators:",
        collaboratorsError.message,
      );
    }
  }

  return cases.map((caseItem: any) => ({
    ...caseItem,
    assigned_users: (caseItem.assigned_user_ids || [])
      .map((id: string) => usersById[id])
      .filter(Boolean),
    guest_users: (caseItem.guest_user_ids || [])
      .map((id: string) => usersById[id])
      .filter(Boolean),
  }));
};

const buildArrayContainsFilter = (column: string, value: string) => {
  const escapedValue = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim();
  return `${column}.cs.{\"${escapedValue}\"}`;
};

const buildCaseSearchOrQuery = (searchValue: string) => {
  const wildcard = `%${searchValue}%`;
  return [
    `manual_name.ilike.${wildcard}`,
    `registration_no.ilike.${wildcard}`,

    `cin_no.ilike.${wildcard}`,
    `filing_no.ilike.${wildcard}`,
    `case_type.ilike.${wildcard}`,
    `court_code.ilike.${wildcard}`,
    buildArrayContainsFilter("petitioner", searchValue),
    buildArrayContainsFilter("respondent", searchValue),
  ].join(",");
};

const fetchCaseIdsForTaskStatus = async (
  supabase: ReturnType<typeof clientConnectionWithSupabase>,
  workspaceId: string,
  status: CaseTaskStatusFilter,
) => {
  const baseQuery = () =>
    supabase
      .from("votum_tasks")
      .select("case_id,status,dueDate")
      .eq("workspace_id", workspaceId);

  const uniqueCaseIds = (rows: any[]) =>
    Array.from(
      new Set(
        (rows || [])
          .map((row: any) => Number(row.case_id))
          .filter((id: number) => Number.isFinite(id)),
      ),
    );

  if (status === "overdue") {
    const now = new Date().toISOString();
    const { data, error } = await baseQuery()
      .lt("dueDate", now)
      .not("status", "in", "(2,3)");

    if (error) {
      throw error;
    }

    return uniqueCaseIds(data || []);
  }

  if (status === "active") {
    const { data, error } = await baseQuery().not("status", "in", "(2,3)");

    if (error) {
      throw error;
    }

    return uniqueCaseIds(data || []);
  }

  if (status === "completed") {
    const { data: allTasks, error: allError } = await baseQuery();
    if (allError) {
      throw allError;
    }

    const { data: openTasks, error: openError } = await baseQuery().not(
      "status",
      "in",
      "(2,3)",
    );
    if (openError) {
      throw openError;
    }

    const allCaseIds = uniqueCaseIds(allTasks || []);
    const openCaseIds = new Set(uniqueCaseIds(openTasks || []));

    return allCaseIds.filter((caseId) => !openCaseIds.has(caseId));
  }

  if (status === "no_tasks") {
    const { data, error } = await baseQuery();

    if (error) {
      throw error;
    }

    return uniqueCaseIds(data || []);
  }

  return [];
};

export const getAllCases = async () => {
  const supabase = clientConnectionWithSupabase();
  const parsedUserDetails = getSessionDetails();
  console.log(parsedUserDetails);
  if (!parsedUserDetails?.workspace_id || !parsedUserDetails?.id) {
    return { success: false, error: "Workspace not found" };
  }

  const userId = parsedUserDetails.id;
  let query = supabase.from("votum_cases").select("*");

  query = applyVisibilityFilter(query, userId).order("created_at");

  const { data: votum_user_cases, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const casesWithAssignees = await hydrateCasesWithCollaborators(
    supabase,
    votum_user_cases || [],
  );

  return { success: true, data: casesWithAssignees };
};

export const getFilteredCases = async (filters: CaseFilterParams = {}) => {
  const supabase = clientConnectionWithSupabase();
  const parsedUserDetails = getSessionDetails();

  if (!parsedUserDetails?.workspace_id || !parsedUserDetails?.id) {
    return { success: false, error: "Workspace not found" };
  }

  const workspaceId = parsedUserDetails.workspace_id;
  const userId = parsedUserDetails.id;

  try {
    let query = supabase
      .from("votum_cases")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId);

    query = applyVisibilityFilter(query, userId);

    if (filters.status === "upcoming") {
      const now = new Date();
      const todayIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      query = query.gte("next_listing_date", todayIso);
    }

    if (filters.status === "disposed") {
      query = query.or(
        "decision_date.not.is.null,and(disposal_nature.not.is.null,disposal_nature.neq.)",
      );
    }

    const searchValue = filters.search?.trim();
    if (searchValue) {
      query = query.or(buildCaseSearchOrQuery(searchValue));
    }

    if (filters.court && filters.court !== "all") {
      const [primary, secondary] = filters.court.split(" ||| ");

      if (primary && secondary) {
        query = query
          .eq("court_display->>court_name", primary)
          .eq("court_display->>bench_name", secondary);
      } else if (primary) {
        query = query.or(
          `court_display->>court_name.eq."${primary}",court_code.eq."${primary}"`,
        );
      }
    }

    if (filters.collaboratorId && filters.collaboratorId !== "all") {
      const collaboratorId = filters.collaboratorId;
      query = query.or(
        [
          `assigned_user_ids.cs.{${collaboratorId}}`,
          `guest_user_ids.cs.{${collaboratorId}}`,
        ].join(","),
      );
    }

    if (filters.taskStatus && filters.taskStatus !== "all") {
      const caseIdsForStatus = await fetchCaseIdsForTaskStatus(
        supabase,
        workspaceId,
        filters.taskStatus,
      );

      if (filters.taskStatus === "no_tasks") {
        if (caseIdsForStatus.length > 0) {
          query = query.not("id", "in", `(${caseIdsForStatus.join(",")})`);
        }
      } else if (caseIdsForStatus.length === 0) {
        return { success: true, data: [] };
      } else {
        query = query.in("id", caseIdsForStatus);
      }
    }

    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const localIsoDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .split("T")[0];

      if (filters.dateRange === "today") {
        query = query.or(
          `next_listing_date.eq.${localIsoDate},last_listing_date.eq.${localIsoDate}`,
        );
      } else {
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        let rangeStart: Date;
        let rangeEnd: Date;

        if (filters.dateRange === "week") {
          const day = startOfDay.getDay();
          const diffToMonday = day === 0 ? -6 : 1 - day;
          rangeStart = new Date(startOfDay);
          rangeStart.setDate(rangeStart.getDate() + diffToMonday);
          rangeEnd = new Date(rangeStart);
          rangeEnd.setDate(rangeEnd.getDate() + 7);
        } else {
          rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
          rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }

        const startStr = rangeStart.toISOString().split("T")[0];
        const endStr = rangeEnd.toISOString().split("T")[0];
        query = query.or(
          `and(next_listing_date.gte.${startStr},next_listing_date.lt.${endStr}),and(last_listing_date.gte.${startStr},last_listing_date.lt.${endStr})`,
        );
      }
    }

    const orderedQuery = query
      .order("next_listing_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = filters.all
      ? await orderedQuery
      : await orderedQuery.range(from, to);

    if (error) {
      return { success: false, error: error.message };
    }

    const casesWithAssignees = await hydrateCasesWithCollaborators(
      supabase,
      data || [],
    );

    return { success: true, data: casesWithAssignees, totalCount: count ?? 0 };
  } catch (error) {
    console.error("Error fetching filtered cases:", error);
    return { success: false, error: "Failed to fetch filtered cases" };
  }
};

export const getCaseCounts = async (
  filters: Pick<
    CaseFilterParams,
    | "court"
    | "collaboratorId"
    | "dateRange"
    | "taskStatus"
    | "search"
    | "status"
  > = {},
) => {
  const supabase = clientConnectionWithSupabase();
  const parsedUserDetails = getSessionDetails();

  if (!parsedUserDetails?.workspace_id || !parsedUserDetails?.id) {
    return { success: false, error: "Workspace not found" };
  }

  const workspaceId = parsedUserDetails.workspace_id;
  const userId = parsedUserDetails.id;

  // Pre-fetch task status case IDs once (shared across all count queries)
  let taskCaseIds: number[] | null = null;
  if (filters.taskStatus && filters.taskStatus !== "all") {
    try {
      taskCaseIds = await fetchCaseIdsForTaskStatus(
        supabase,
        workspaceId,
        filters.taskStatus,
      );
    } catch {
      taskCaseIds = [];
    }
    // If non-"no_tasks" filter yields no matching cases, all counts are 0
    if (filters.taskStatus !== "no_tasks" && taskCaseIds.length === 0) {
      return { success: true, data: { upcoming: 0, disposed: 0, all: 0 } };
    }
  }

  const now = new Date();
  const localIsoDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const applyFilters = (q: any) => {
    if (filters.court && filters.court !== "all") {
      const [primary, secondary] = filters.court.split(" ||| ");
      if (primary && secondary) {
        q = q
          .eq("court_display->>court_name", primary)
          .eq("court_display->>bench_name", secondary);
      } else if (primary) {
        q = q.or(
          `court_display->>court_name.eq."${primary}",court_code.eq."${primary}"`,
        );
      }
    }
    if (filters.collaboratorId && filters.collaboratorId !== "all") {
      q = q.or(
        `assigned_user_ids.cs.{${filters.collaboratorId}},guest_user_ids.cs.{${filters.collaboratorId}}`,
      );
    }
    if (taskCaseIds !== null) {
      if (filters.taskStatus === "no_tasks") {
        if (taskCaseIds.length > 0) {
          q = q.not("id", "in", `(${taskCaseIds.join(",")})`);
        }
      } else {
        q = q.in("id", taskCaseIds);
      }
    }
    if (filters.dateRange && filters.dateRange !== "all") {
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      if (filters.dateRange === "today") {
        q = q.or(
          `next_listing_date.eq.${localIsoDate},last_listing_date.eq.${localIsoDate}`,
        );
      } else {
        let rangeStart: Date, rangeEnd: Date;
        if (filters.dateRange === "week") {
          const day = startOfDay.getDay();
          const diffToMonday = day === 0 ? -6 : 1 - day;
          rangeStart = new Date(startOfDay);
          rangeStart.setDate(rangeStart.getDate() + diffToMonday);
          rangeEnd = new Date(rangeStart);
          rangeEnd.setDate(rangeEnd.getDate() + 7);
        } else {
          rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
          rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        const startStr = rangeStart.toISOString().split("T")[0];
        const endStr = rangeEnd.toISOString().split("T")[0];
        q = q.or(
          `and(next_listing_date.gte.${startStr},next_listing_date.lt.${endStr}),and(last_listing_date.gte.${startStr},last_listing_date.lt.${endStr})`,
        );
      }
    }
    if (filters.search?.trim()) {
      q = q.or(buildCaseSearchOrQuery(filters.search.trim()));
    }
    return q;
  };

  const base = () => {
    let q = supabase
      .from("votum_cases")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
    q = applyVisibilityFilter(q, userId);
    return applyFilters(q);
  };

  const [all, disposed, upcoming] = await Promise.all([
    base(),
    base().or(
      "decision_date.not.is.null,and(disposal_nature.not.is.null,disposal_nature.neq.)",
    ),
    base().gte("next_listing_date", localIsoDate),
  ]);

  return {
    success: true,
    data: {
      all: all.count ?? 0,
      disposed: disposed.count ?? 0,
      upcoming: upcoming.count ?? 0,
    },
  };
};

export const getCaseFilterOptions = async () => {
  const supabase = clientConnectionWithSupabase();
  const parsedUserDetails = getSessionDetails();

  if (!parsedUserDetails?.workspace_id || !parsedUserDetails?.id) {
    return { success: false, error: "Workspace not found" };
  }

  const workspaceId = parsedUserDetails.workspace_id;
  const userId = parsedUserDetails.id;

  let query = supabase
    .from("votum_cases")
    .select("court_display, court_code, assigned_user_ids, guest_user_ids")
    .eq("workspace_id", workspaceId);

  query = applyVisibilityFilter(query, userId);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const courtsSet = new Set<string>();
  const collaboratorIdSet = new Set<string>();

  for (const c of data || []) {
    const courtName = String((c.court_display as any)?.court_name || "").trim();
    const benchName = String((c.court_display as any)?.bench_name || "").trim();
    const courtCode = String(c.court_code || "").trim();
    const primary = courtName || courtCode;
    if (primary) {
      courtsSet.add(
        benchName && benchName !== primary
          ? `${primary} ||| ${benchName}`
          : primary,
      );
    }
    for (const id of (c.assigned_user_ids as string[]) || [])
      if (id) collaboratorIdSet.add(id);
    for (const id of (c.guest_user_ids as string[]) || [])
      if (id) collaboratorIdSet.add(id);
  }

  let collaborators: { id: string; label: string }[] = [];
  if (collaboratorIdSet.size > 0) {
    const { data: users } = await supabase
      .from("votum_users")
      .select("id, name, email")
      .in("id", Array.from(collaboratorIdSet));

    collaborators = (users || [])
      .map((u) => ({
        id: u.id,
        label: u.name?.trim() || u.email?.trim() || "",
      }))
      .filter((u) => u.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  return {
    success: true,
    data: {
      courts: Array.from(courtsSet).sort(),
      collaborators,
    },
  };
};

export const addCase = async (caseData: ConciseJson, court: string) => {
  const supabase = clientConnectionWithSupabase();

  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  console.log(parsedUserDetails);

  if (parsedUserDetails === null || !parsedUserDetails?.workspace_id) {
    return { success: false, error: "User session Not Found" };
  }

  const convertDate = (dateStr: string | null) => {
    // Handle null, undefined, empty string, or strings containing "undefined"
    if (
      !dateStr ||
      dateStr === null ||
      dateStr.trim() === "" ||
      dateStr.includes("undefined")
    ) {
      return null;
    }

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try to parse DD/MM/YYYY or DD-MM-YYYY format
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;

      // Validate that we have actual numbers
      if (
        day &&
        month &&
        year &&
        !isNaN(Number(day)) &&
        !isNaN(Number(month)) &&
        !isNaN(Number(year))
      ) {
        // Pad day and month with leading zeros if needed
        const paddedDay = day.padStart(2, "0");
        const paddedMonth = month.padStart(2, "0");
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
    }

    // If we can't parse it, return null
    return null;
  };

  const { pet_name, res_name, ...rest } = caseData as ConciseJson;
  console.log("caseData", caseData);

  const updatedCaseData = {
    ...rest,
    petitioner: pet_name,
    respondent: res_name,
    registration_date: convertDate(caseData.registration_date),
    filing_date: convertDate(caseData.filing_date),
    first_listing_date: convertDate(caseData.first_listing_date),
    next_listing_date: convertDate(caseData.next_listing_date),
    last_listing_date: convertDate(caseData.last_listing_date),
    decision_date: convertDate(caseData.decision_date),
  };

  const dataToSave = {
    ...updatedCaseData,
    workspace_id: parsedUserDetails.workspace_id,
    created_by: parsedUserDetails.id,
  };

  console.log("Data to Save:", dataToSave);
  const { data, error } = await supabase
    .from("votum_cases")
    .insert([dataToSave])
    .select();

  if (error !== null) {
    return { success: false, error: error.message };
  }

  const insertedCase = data?.[0];
  const caseId = insertedCase?.id;

  if (caseId) {
    try {
      await ensureCaseDocumentFolder(
        supabase,
        parsedUserDetails.workspace_id,
        caseId,
        updatedCaseData,
      );
    } catch (error) {
      console.warn("Failed to create case document folder:", error);
    }
  }

  const ordersToStore = Array.isArray(updatedCaseData.orders)
    ? updatedCaseData.orders
    : [];

  if (caseId && ordersToStore.length > 0) {
    const storeOrdersResult = await storeOrders(
      ordersToStore,
      String(caseId),
      court,
    );

    if (!storeOrdersResult.success) {
      console.error("Failed to store case orders:", storeOrdersResult.error);
      return {
        success: true,
        caseId,
        storeOrdersError: storeOrdersResult.error,
      };
    }
  }

  return { success: true, caseId };
};

export const getCase = async (caseId: string) => {
  const supabase = clientConnectionWithSupabase();
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  console.log(parsedUserDetails);
  if (parsedUserDetails === null) {
    return { error: "User session Not Found" };
  }

  const { data: caseRows, error } = await supabase
    .from("votum_cases")
    .select("*")
    .eq("id", caseId);

  console.log(caseRows);

  if (error) {
    return { success: false, error: error.message };
  }

  if (!caseRows || caseRows.length === 0) {
    return { success: true, data: [] };
  }

  const caseRow = caseRows[0];
  const assignedIds: string[] = caseRow.assigned_user_ids || [];
  let assignedUsers: any[] = [];

  if (assignedIds.length > 0) {
    const { data: assignedUserData, error: assignedUserError } = await supabase
      .from("votum_users")
      .select("id, name, email, avatar_url")
      .in("id", assignedIds);

    if (assignedUserError) {
      console.error(
        "Error fetching assigned users for case:",
        assignedUserError.message,
      );
    } else {
      assignedUsers = assignedUserData || [];
    }
  }

  const enrichedCase = {
    ...caseRow,
    assigned_user_ids: assignedIds,
    assigned_users: assignedUsers,
  };

  return { success: true, data: [enrichedCase] };
};

export const deleteCase = async (caseID: number) => {
  const supabase = clientConnectionWithSupabase();
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  const workspaceId = parsedUserDetails?.workspace_id;
  const now = new Date().toISOString();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  if (workspaceId) {
    const folderIdsToDelete = new Set<string>();
    const { data: caseFolders, error: caseFoldersError } = await supabase
      .from("document_folders")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("case_id", caseID);

    if (caseFoldersError) {
      console.warn("Failed to fetch case folders for soft-delete:", {
        caseId: caseID,
        message: caseFoldersError.message,
      });
    } else {
      for (const folder of caseFolders || []) {
        const id = (folder as any)?.id;
        if (id) folderIdsToDelete.add(id);
      }
    }

    if (folderIdsToDelete.size > 0) {
      const { data: allFolders, error: allFoldersError } = await supabase
        .from("document_folders")
        .select("id, parent_id, metadata")
        .eq("workspace_id", workspaceId);

      if (allFoldersError) {
        console.warn("Failed to fetch folder tree for case soft-delete:", {
          caseId: caseID,
          message: allFoldersError.message,
        });
      } else {
        const childrenByParent = new Map<string | null, string[]>();
        for (const folder of allFolders || []) {
          const parentId = ((folder as any).parent_id ?? null) as string | null;
          const list = childrenByParent.get(parentId) ?? [];
          list.push((folder as any).id);
          childrenByParent.set(parentId, list);
        }

        const stack = Array.from(folderIdsToDelete);
        while (stack.length > 0) {
          const currentId = stack.pop();
          if (!currentId) continue;
          const children = childrenByParent.get(currentId) ?? [];
          for (const childId of children) {
            if (!folderIdsToDelete.has(childId)) {
              folderIdsToDelete.add(childId);
              stack.push(childId);
            }
          }
        }

        const folderMetadataById = new Map<string, Record<string, any>>();
        for (const folder of allFolders || []) {
          folderMetadataById.set(
            (folder as any).id,
            (((folder as any).metadata ?? {}) as Record<string, any>) || {},
          );
        }

        for (const folderId of folderIdsToDelete) {
          const metadata = folderMetadataById.get(folderId) ?? {};
          const nextMetadata = {
            ...metadata,
            deleted_at: metadata.deleted_at ?? now,
            deleted_by: metadata.deleted_by ?? userId,
          };
          const { error: updateError } = await supabase
            .from("document_folders")
            .update({ metadata: nextMetadata, updated_at: now })
            .eq("id", folderId)
            .eq("workspace_id", workspaceId);
          if (updateError) {
            console.warn("Failed to soft-delete folder metadata:", {
              caseId: caseID,
              folderId,
              message: updateError.message,
            });
          }
        }
      }
    }

    const docsToDelete = new Map<string, Record<string, any>>();
    const { data: caseDocs, error: caseDocsError } = await supabase
      .from("documents")
      .select("id, metadata")
      .eq("workspace_id", workspaceId)
      .eq("case_id", caseID);

    if (caseDocsError) {
      console.warn("Failed to fetch case documents for soft-delete:", {
        caseId: caseID,
        message: caseDocsError.message,
      });
    } else {
      for (const doc of caseDocs || []) {
        const id = (doc as any)?.id;
        if (!id) continue;
        docsToDelete.set(
          id,
          ((doc as any).metadata ?? {}) as Record<string, any>,
        );
      }
    }

    if (folderIdsToDelete.size > 0) {
      const { data: folderDocs, error: folderDocsError } = await supabase
        .from("documents")
        .select("id, metadata")
        .eq("workspace_id", workspaceId)
        .in("folder_id", Array.from(folderIdsToDelete));

      if (folderDocsError) {
        console.warn("Failed to fetch folder documents for soft-delete:", {
          caseId: caseID,
          message: folderDocsError.message,
        });
      } else {
        for (const doc of folderDocs || []) {
          const id = (doc as any)?.id;
          if (!id || docsToDelete.has(id)) continue;
          docsToDelete.set(
            id,
            ((doc as any).metadata ?? {}) as Record<string, any>,
          );
        }
      }
    }

    for (const [docId, metadata] of docsToDelete.entries()) {
      const nextMetadata = {
        ...metadata,
        deleted_at: metadata.deleted_at ?? now,
        deleted_by: metadata.deleted_by ?? userId,
      };
      const { error: updateError } = await supabase
        .from("documents")
        .update({ metadata: nextMetadata, updated_at: now })
        .eq("id", docId)
        .eq("workspace_id", workspaceId);
      if (updateError) {
        console.warn("Failed to soft-delete document metadata:", {
          caseId: caseID,
          documentId: docId,
          message: updateError.message,
        });
      }
    }
  }

  const { error } = await supabase
    .from("votum_cases")
    .delete()
    .eq("id", caseID);

  if (error === null) {
    return { success: true };
  } else {
    return { success: false, error: error.message };
  }
};
export const updateUserInCase = async (detailsToUpdate, caseID: number) => {
  const supabase = clientConnectionWithSupabase();
  const { error } = await supabase
    .from("votum_cases")
    .update(detailsToUpdate)
    .eq("id", caseID);

  if (error) {
    console.error("Failed to update user in case:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const getTasksLinkedToCase = async (caseId: number) => {
  const supabase = clientConnectionWithSupabase();
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);

  if (parsedUserDetails === null || !parsedUserDetails?.workspace_id) {
    return { success: false, error: "User session Not Found" };
  }

  try {
    // Fetch tasks that are linked to this case with assigned user details
    const { data: tasks, error } = await supabase
      .from("votum_tasks")
      .select("*, assigned_user:votum_users!assigned_to(id, name, email)")
      .eq("case_id", caseId)
      .eq("workspace_id", parsedUserDetails.workspace_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks linked to case:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: tasks || [] };
  } catch (error) {
    console.error("Unexpected error fetching tasks linked to case:", error);
    return { success: false, error: "Failed to fetch linked tasks" };
  }
};

export const getTasksForCaseIds = async (caseIds: number[]) => {
  const supabase = clientConnectionWithSupabase();
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);

  if (!parsedUserDetails || !parsedUserDetails?.workspace_id) {
    return { success: false, error: "User session Not Found" };
  }

  if (!caseIds || caseIds.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const { data: tasks, error } = await supabase
      .from("votum_tasks")
      .select("id,status,case_id,dueDate")
      .in("case_id", caseIds)
      .eq("workspace_id", parsedUserDetails.workspace_id);

    if (error) {
      console.error("Error fetching tasks for case list:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: tasks || [] };
  } catch (error) {
    console.error("Unexpected error fetching tasks for cases:", error);
    return { success: false, error: "Failed to fetch tasks for cases" };
  }
};

export const storeOrders = async (
  orders: any[],
  caseId: string,
  courtType: string,
) => {
  try {
    // Default to localhost for development if not configured
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await clientBackendFetch(
      `${API_URL}/ecourts/store_orders/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orders,
          case_id: caseId,
          court_type: courtType,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error storing orders:", errorText);
      return { success: false, error: "Failed to store orders" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error calling store_orders API:", error);
    return { success: false, error: "Network error or server unavailable" };
  }
};

export interface CasePickerItem {
  id: number;
  display: string;
}

/** Lightweight query for dropdowns — returns only the fields needed for display. */
export const getCasesForPicker = async (): Promise<{
  success: boolean;
  data?: CasePickerItem[];
  error?: string;
}> => {
  const supabase = clientConnectionWithSupabase();
  const parsedUserDetails = getSessionDetails();

  if (!parsedUserDetails?.workspace_id || !parsedUserDetails?.id) {
    return { success: false, error: "Workspace not found" };
  }

  let query = supabase
    .from("votum_cases")
    .select("id, registration_no, manual_name, case_type")
    .eq("workspace_id", parsedUserDetails.workspace_id)
    .order("created_at", { ascending: false })
    .limit(200);

  query = applyVisibilityFilter(query, parsedUserDetails.id);

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const items: CasePickerItem[] = (data || []).map((c: any) => ({
    id: c.id,
    display:
      c.manual_name ||
      c.registration_no ||
      `Case #${c.id}${c.case_type ? ` · ${c.case_type}` : ""}`,
  }));

  return { success: true, data: items };
};
