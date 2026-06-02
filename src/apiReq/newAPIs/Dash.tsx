"use client";
import clientConnectionWithSupabase from "@/lib/supabase/client";

export const getTodaySession = async (
  user_id: string,
  workspace_id: string
) => {
  try {
    const supabase = clientConnectionWithSupabase();

    // Fetch tasks assigned to or created by the user
    const { data: userTasks, error } = await supabase
      .from("votum_tasks")
      .select("*")
      .eq("workspace_id", workspace_id)
      .or(`assigned_to.eq.${user_id},created_by.eq.${user_id}`);

    if (error) {
      console.error("Error fetching tasks:", error);
      return { success: false, error: error.message };
    }

    // Calculate tasks due today
    const todaysTaskCount = Array.isArray(userTasks)
      ? userTasks.filter(
          (task) => isTodayTask(task.dueDate) && task.status !== 2
        ).length
      : 0;

    return {
      success: true,
      tasks: userTasks || [],

      dueTaskToday: todaysTaskCount,
    };
  } catch (err) {
    console.error("Unexpected error in getTodaySession:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

function isTodayTask(timestamp: string): boolean {
  if (!timestamp) return false;

  try {
    const timestampDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return timestampDate.toDateString() === today.toDateString();
  } catch (e) {
    console.error("Error parsing date:", e);
    return false;
  }
}

function isTodayEvent(timestamp: string): boolean {
  if (!timestamp) return false;

  try {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const dateFromTimestamp = timestamp.split("T")[0];
    return dateFromTimestamp === todayString;
  } catch (e) {
    console.error("Error parsing date:", e);
    return false;
  }
}

export const getUpcomingCases = async (
  user_id: string,
  workspace_id: string
) => {
  try {
    const supabase = clientConnectionWithSupabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch cases with next_listing_date from today onwards, visible to this user
    const { data: cases, error } = await supabase
      .from("votum_cases")
      .select("*")
      .eq("workspace_id", workspace_id)
      .or(
        [
          `created_by.eq.${user_id}`,
          `assigned_user_ids.cs.{${user_id}}`,
          `guest_user_ids.cs.{${user_id}}`,
        ].join(","),
      )
      .gte("next_listing_date", today.toISOString())
      .order("next_listing_date", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Error fetching cases:", error);
      return { success: false, error: error.message };
    }

    // Get unique assignee IDs
    const assigneeIds = Array.from(
      new Set(
        (cases || [])
          .flatMap((caseItem: any) => caseItem.assigned_user_ids || [])
          .filter((id: string | null | undefined): id is string => Boolean(id)),
      ),
    );

    let assigneesById: Record<string, any> = {};

    if (assigneeIds.length > 0) {
      const { data: assignees, error: assigneesError } = await supabase
        .from("votum_users")
        .select("id, name, email, avatar_url")
        .in("id", assigneeIds);

      if (!assigneesError && assignees) {
        assigneesById = assignees.reduce(
          (acc, user) => ({ ...acc, [user.id]: user }),
          {},
        );
      }
    }

    const casesWithAssignees =
      cases?.map((caseItem: any) => ({
        ...caseItem,
        assigned_users: (caseItem.assigned_user_ids || [])
          .map((id: string) => assigneesById[id])
          .filter(Boolean),
      })) || [];

    return {
      success: true,
      cases: casesWithAssignees,
    };
  } catch (err) {
    console.error("Unexpected error in getUpcomingCases:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};
