"use client";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { addOneDay } from "@/utils/shirnkDate";

/**
 * Types
 */
export interface TaskEvent {
  start: string | Date;
  end: string | Date;
  className: string;
  allDay: boolean;
  title: string;
  type: string;
  name?: string;
  dueDate?: string;
  [key: string]: any;
}

export interface EventType extends TaskEvent {
  startDate: string;
  endDate: string;
}

export interface EventData {
  startDate: string;
  endDate: string;
  title: string;
  user_id: string;
  allDay?: boolean;
}

/**
 * Utility: Detect if an event is all-day based on date format
 */
const isAllDayEvent = (startDate: string, endDate?: string): boolean => {
  if (!startDate) return false;
  const hasNoTimeComponent = (dateStr: string): boolean =>
    dateStr.includes("T00:00:00") ||
    !dateStr.includes("T") ||
    dateStr.endsWith("T00:00:00.000Z");
  return (
    hasNoTimeComponent(startDate) && (!endDate || hasNoTimeComponent(endDate))
  );
};

/**
 * Add a new event to the database and Google Calendar (if integrated)
 */
export const addEvent = async (eventData: EventData) => {
  const supabase = clientConnectionWithSupabase();
  const { startDate, endDate, title, user_id, allDay = false } = eventData;

  const { data: insertData, error: insertError } = await supabase
    .from("votum_events")
    .insert([{ title, startDate, endDate, user_id }])
    .select();

  if (insertError) {
    return { error: insertError, success: false };
  }

  // Check Google Calendar integration
  const { data: userData } = await supabase
    .from("votum_users")
    .select("google_calender_integrated")
    .eq("id", user_id)
    .single();

  if (userData?.google_calender_integrated) {
    try {
      const response = await fetch("/api/google/add-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user_id,
          title,
          start: startDate,
          end: endDate,
          allDay,
          description: "",
        }),
      });
      if (response.ok) {
        const googleEvent = await response.json();
        await supabase.from("calendar_event_mappings").insert({
          user_id,
          app_event_id: insertData[0].id,
          google_event_id: googleEvent.id,
          last_synced: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Optionally log or handle Google sync errors
    }
  }

  return { data: insertData, success: true };
};

/**
 * Get all events for a user (internal events only)
 */
export const getAllEvents = async (user_id: string) => {
  const supabase = clientConnectionWithSupabase();
  const { data: userEvents, error } = await supabase
    .from("votum_events")
    .select("*")
    .eq("user_id", user_id);
  if (error) return [];
  return (userEvents || []).map((event: any) => ({
    ...event,
    start: event.startDate,
    end: event.endDate,
    className:
      "bg-[#029BE6] min-h-[30px] text-white hover:bg-[#029BE6] text-[0.8rem] text-[450] ",
    allDay: isAllDayEvent(event.startDate, event.endDate),
    type: "events",
  }));
};

/**
 * Get all events for a user, merging with Google Calendar events if integrated
 */
export const getAllEventsWithGoogleCalendar = async (user_id: string) => {
  const supabase = clientConnectionWithSupabase();
  const { data: userEvents, error } = await supabase
    .from("votum_events")
    .select("*")
    .eq("user_id", user_id);
  if (error) return [];
  let formattedEvents = (userEvents || []).map((event: any) => ({
    ...event,
    start: event.startDate,
    end: event.endDate,
    className:
      "bg-[#029BE6] min-h-[30px] text-white hover:bg-[#029BE6] text-[0.8rem] text-[450] ",
    allDay: isAllDayEvent(event.startDate, event.endDate),
    type: "events",
    source: "app",
  }));

  // Merge Google Calendar events if integrated
  const { data: userData } = await supabase
    .from("votum_users")
    .select("google_calender_integrated")
    .eq("id", user_id)
    .single();
  if (userData?.google_calender_integrated) {
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const params = new URLSearchParams({ userId: user_id });
      params.set("timeMin", timeMin.toISOString());
      params.set("timeMax", timeMax.toISOString());

      const response = await fetch(
        `/api/google/sync-calendar?${params.toString()}`
      );
      if (response.ok) {
        const events = await response.json();
        const { data: mappings } = await supabase
          .from("calendar_event_mappings")
          .select("google_event_id")
          .eq("user_id", user_id);
        const mappedGoogleEventIds =
          mappings?.map((m) => m.google_event_id) || [];
        const googleEvents = (events || [])
          .filter(
            (event: any) =>
              event?.id && !mappedGoogleEventIds.includes(event.id)
          )
          .map((event: any) => {
            const startInfo = event.start || {};
            const endInfo = event.end || {};
            const startValue = startInfo.dateTime || startInfo.date;
            const endValue = endInfo.dateTime || endInfo.date;
            const isAllDay = Boolean(startInfo.date && !startInfo.dateTime);
            return {
              id: `google-${event.id}`,
              title: event.summary || "(No title)",
              start: startValue,
              end: endValue,
              className:
                "bg-[#4285F4] min-h-[30px] text-white hover:bg-[#4285F4] text-[0.8rem] text-[450] ",
              allDay: isAllDay,
              type: "google_events",
              source: "google",
              googleId: event.id,
              description: event.description || "",
              location: event.location || "",
              htmlLink: event.htmlLink,
            };
          });
        formattedEvents = [...formattedEvents, ...googleEvents];
      }
    } catch (err) {
      // Optionally log or handle Google fetch errors
    }
  }
  return formattedEvents;
};

/**
 * Get all tasks for a workspace
 */
export const getAlltasks = async (workspace_id: string) => {
  const supabase = clientConnectionWithSupabase();
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);
  if (!parsedUserDetails) return "User session Not Found";
  const { data: userTasks } = await supabase
    .from("votum_tasks")
    .select("*")
    .eq("workspace_id", workspace_id);
  if (!userTasks) return "User Data not found, please login again";
  return userTasks.map((task: any) => {
    const obj: TaskEvent = { ...task };
    if (obj.dueDate) {
      const dateStr = obj.dueDate.split("+")[0];
      obj.start = addOneDay(dateStr);
      obj.end = addOneDay(dateStr);
      obj.title = obj.name || "";
    }
    obj.className =
      "bg-[#83D17F] tasks min-h-[25px]  !text-white text-[0.75rem] text-[450] ";
    obj.allDay = true;
    obj.type = "tasks";
    return obj;
  });
};

/**
 * Remove a Gmail integration for a user
 */
export const deLinkGmail = async (email: string) => {
  const supabase = clientConnectionWithSupabase();
  await fetch("/api/oAuth/gmail/revoke", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const { data } = await supabase
    .from("votum_users")
    .update({ gmail_integrated: false, refresh_token: "" })
    .eq("email", email)
    .select();
  localStorage.setItem("VotumUserDetails", JSON.stringify(data?.[0]));
  window.location.reload();
  return { data: "", success: true };
};

/**
 * Update an event (and Google Calendar if integrated)
 */
export const changeEvent = async (userData: any) => {
  const supabase = clientConnectionWithSupabase();
  try {
    const { data: updatedEvent, error } = await supabase
      .from("votum_events")
      .update({
        startDate: userData.start,
        endDate: userData.end,
      })
      .eq("id", userData.id)
      .select()
      .single();
    if (error) throw error;
    const { data: userInfo } = await supabase
      .from("votum_users")
      .select("google_calender_integrated")
      .eq("id", updatedEvent.user_id)
      .single();
    if (userInfo?.google_calender_integrated) {
      const { data: mappingData } = await supabase
        .from("calendar_event_mappings")
        .select("google_event_id")
        .eq("app_event_id", userData.id)
        .eq("user_id", updatedEvent.user_id)
        .single();
      if (mappingData?.google_event_id) {
        try {
          const response = await fetch("/api/google/update-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: updatedEvent.user_id,
              eventId: mappingData.google_event_id,
              start: userData.start,
              end: userData.end,
              allDay: isAllDayEvent(userData.start, userData.end),
              title: updatedEvent.title,
              description: updatedEvent.description,
              location: updatedEvent.location,
            }),
          });
          if (response.ok) {
            await supabase
              .from("calendar_event_mappings")
              .update({ last_synced: new Date().toISOString() })
              .eq("app_event_id", userData.id)
              .eq("user_id", updatedEvent.user_id);
          }
        } catch {}
      } else {
        try {
          const result = await fetch("/api/google/add-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: updatedEvent.user_id,
              title: updatedEvent.title,
              start: userData.start,
              end: userData.end,
              allDay: isAllDayEvent(userData.start, userData.end),
              description: updatedEvent.description,
              location: updatedEvent.location,
            }),
          });
          if (result.ok) {
            const googleEvent = await result.json();
            await supabase.from("calendar_event_mappings").insert({
              user_id: updatedEvent.user_id,
              app_event_id: userData.id,
              google_event_id: googleEvent.id,
              last_synced: new Date().toISOString(),
            });
          }
        } catch {}
      }
    }
    return { success: true, obj: updatedEvent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Get user details by ID
 */
export const getUserDetailById = async (id: string) => {
  const supabase = clientConnectionWithSupabase();
  const { data: users } = await supabase
    .from("votum_users")
    .select("*")
    .eq("id", id);
  return users?.[0];
};

/**
 * Integrate Gmail for a user
 */
export const integrateGmail = async (email: string, refresh_token: string) => {
  const supabase = clientConnectionWithSupabase();
  const { data } = await supabase
    .from("votum_users")
    .update({ gmail_integrated: true, refresh_token })
    .eq("email", email)
    .select();
  if (data?.length) return { success: true };
  return { error: "Some issue with the server", success: false };
};
