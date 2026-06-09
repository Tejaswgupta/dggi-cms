import { getWorkspaceId } from "@/lib/action/workspace";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export const getAllUsers = async () => {
  const supabase = clientConnectionWithSupabase();
  const workspace_id = await getWorkspaceId();
  // const userDetails: any = localStorage.getItem("VotumUserDetails");
  // const parsedUserDetails = JSON.parse(userDetails);

  // If we don't have workspace id, we can't fetch users
  if (!workspace_id) {
    return { success: false, error: "Workspace id not found" };
  }

  const { data, error }: any = await supabase
    .from("votum_users")
    .select("id, name, email, dggi_role")
    .eq("workspace_id", workspace_id);

  if (error === null) {
    return { success: true, data };
  } else {
    return { success: false, error: error.message };
  }
};

export const getCurrentUserDetail = async () => {
  const supabase = clientConnectionWithSupabase();
  const userDetails: any = localStorage.getItem("VotumUserDetails");
  const parsedUserDetails = JSON.parse(userDetails);

  if (!parsedUserDetails) return;

  const { data, error }: any = await supabase
    .from("votum_users")
    .select()
    .eq("id", parsedUserDetails["id"]);

  if (error === null) {
    return { success: true, data: data[0] };
  } else {
    return { success: false, error: error.message };
  }
};

export default function useWorkspaceUsers() {
  const [users, setusers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      // Prevent multiple simultaneous calls
      if (isLoading || hasAttempted) {
        return;
      }

      setIsLoading(true);
      setHasAttempted(true);

      try {
        const res = await getAllUsers();
        if (res.success) {
          setusers(res.data ?? []);
        } else {
          console.warn("Failed to fetch workspace users:", res.error);
          setusers([]);
        }
      } catch (error) {
        console.error("Error fetching workspace users:", error);
        setusers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return users;
}
