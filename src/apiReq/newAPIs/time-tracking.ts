import clientConnectionWithSupabase from "@/lib/supabase/client";

// Define TypeScript interfaces for type safety
export interface TimeEntry {
  id?: string;
  task_id: string;
  user_id: string;
  description: string;
  duration: number; // Duration in seconds
  date: string;
  client_id?: string | null;
  workspace_id: string;
  created_at?: string;
  updated_at?: string;
  // Billing related fields:
  billed?: boolean; // Whether this entry has been included in an invoice (true = billed, false = unbilled)
  invoice_id?: string | null; // Reference to the invoice this entry is billed in. Use this to join with votum_invoice table.
  // Note: To determine if a time entry is paid, check the billed status of the linked invoice through invoice_id.
}

/**
 * Add a new time entry
 * @param timeEntry - The time entry to add
 * @returns The added time entry or error
 */
export const addTimeEntry = async (
  timeEntry: Omit<TimeEntry, "id" | "created_at" | "updated_at">
) => {
  try {
    const supabase = clientConnectionWithSupabase();

    // Add the time entry
    const { data, error } = await supabase
      .from("votum_time_entries")
      .insert([timeEntry])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("ADD_TIME_ENTRY_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all time entries for a task
 * @param taskId - The task ID
 * @returns List of time entries or error
 */
export const getTimeEntriesByTask = async (taskId: string) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Get time entries for the task
    const { data, error } = await supabase
      .from("votum_time_entries")
      .select("*, user:user_id(id,name,email)")
      .eq("task_id", taskId)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("GET_TIME_ENTRIES_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all time entries for a client
 * @param clientId - The client ID
 * @returns List of time entries or error
 */
export const getTimeEntriesByClient = async (clientId: string) => {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Get time entries for the client
    const { data, error } = await supabase
      .from("votum_time_entries")
      .select("*, user:user_id(id,name,email), task:task_id(*)")
      .eq("client_id", clientId)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("GET_CLIENT_TIME_ENTRIES_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a time entry
 * @param timeEntryId - The time entry ID to update
 * @param updateObj - Object with fields to update
 * @returns The updated time entry or error
 */
export const updateTimeEntry = async (
  timeEntryId: string,
  updateObj: Partial<TimeEntry>
) => {
  try {
    if (!timeEntryId) {
      throw new Error("Time entry ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Update the time entry
    const { data, error } = await supabase
      .from("votum_time_entries")
      .update({ ...updateObj, updated_at: new Date().toISOString() })
      .eq("id", timeEntryId)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("UPDATE_TIME_ENTRY_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a time entry
 * @param timeEntryId - The time entry ID to delete
 * @returns Success status or error
 */
export const deleteTimeEntry = async (timeEntryId: string) => {
  try {
    if (!timeEntryId) {
      throw new Error("Time entry ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Delete the time entry
    const { error } = await supabase
      .from("votum_time_entries")
      .delete()
      .eq("id", timeEntryId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error("DELETE_TIME_ENTRY_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get total hours for a client within a date range
 * @param clientId - The client ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Total hours or error
 */
const getClientTotalHours = async (
  clientId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Build query for time entries
    let query = supabase
      .from("votum_time_entries")
      .select("duration")
      .eq("client_id", clientId);

    // Add date filters if provided
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculate total duration in seconds
    const totalSeconds = data.reduce(
      (total, entry) => total + entry.duration,
      0
    );

    // Convert to hours
    const totalHours = totalSeconds / 3600;

    return {
      success: true,
      data: {
        totalSeconds,
        totalHours,
        formattedHours: totalHours.toFixed(2),
      },
    };
  } catch (error) {
    console.error("GET_CLIENT_TOTAL_HOURS_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark time entries as billed
 * @param timeEntryIds - Array of time entry IDs to mark as billed
 * @param invoiceId - The ID of the invoice these entries are billed in
 * @returns Success status or error
 *
 * This function links time entries to an invoice by:
 * 1. Setting billed=true on each time entry
 * 2. Storing the invoice_id reference
 *
 * After calling this function, you can:
 * - Find all entries for an invoice using getTimeEntriesByInvoice()
 * - Check if entries are paid by joining with the invoice table and checking its billed status
 */
export const markTimeEntriesAsBilled = async (
  timeEntryIds: string[],
  invoiceId: string
) => {
  try {
    if (!timeEntryIds || timeEntryIds.length === 0) {
      throw new Error("Time entry IDs are required");
    }

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Update the time entries to set billed to true and store invoice reference
    const { error } = await supabase
      .from("votum_time_entries")
      .update({
        billed: true,
        invoice_id: invoiceId,
        updated_at: new Date().toISOString(),
      })
      .in("id", timeEntryIds);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error("MARK_TIME_ENTRIES_AS_BILLED_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all time entries (optionally filtered by date range, client, billable)
 * @param filters - Optional filters: { from, to, clientId, billable }
 * @returns List of time entries or error
 */
export const getAllTimeEntries = async (filters?: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  clientId?: string;
  billable?: boolean;
}) => {
  try {
    const supabase = clientConnectionWithSupabase();
    let query = supabase
      .from("votum_time_entries")
      .select("*, user:user_id(id,name,email), task:task_id(*)")
      .order("date", { ascending: false });

    if (filters?.from) {
      query = query.gte("date", filters.from);
    }
    if (filters?.to) {
      query = query.lte("date", filters.to);
    }
    if (filters?.clientId && filters.clientId !== "all") {
      query = query.eq("client_id", filters.clientId);
    }
    if (typeof filters?.billable === "boolean") {
      query = query.eq("billable", filters.billable);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, data };
  } catch (error) {
    console.error("GET_ALL_TIME_ENTRIES_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unbilled time entries for a client
 * @param clientId - The client ID to filter by
 * @returns List of unbilled time entries or error
 */
export const getUnbilledTimeEntriesByClient = async (clientId: string) => {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Get time entries for the client that haven't been billed yet
    const { data, error } = await supabase
      .from("votum_time_entries")
      .select("*, user:user_id(id,name,email), task:task_id(*)")
      .eq("client_id", clientId)
      .eq("billed", false)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("GET_UNBILLED_TIME_ENTRIES_ERROR:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get time entries by invoice ID
 * @param invoiceId - The invoice ID
 * @returns List of time entries associated with an invoice or error
 */
export const getTimeEntriesByInvoice = async (invoiceId: string) => {
  try {
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    const supabase = clientConnectionWithSupabase();

    // Get time entries for the invoice
    const { data, error } = await supabase
      .from("votum_time_entries")
      .select("*, user:user_id(id,name,email), task:task_id(*)")
      .eq("invoice_id", invoiceId)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("GET_INVOICE_TIME_ENTRIES_ERROR:", error);
    return { success: false, error: error.message };
  }
};
