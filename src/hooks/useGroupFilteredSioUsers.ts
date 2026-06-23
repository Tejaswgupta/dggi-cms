import { useEffect, useState } from "react";
import clientConnectionWithSupabase from "@/lib/supabase/client";
import { getAllUsers } from "@/hooks/useWorkspaceUsers";
import type { WorkspaceUser } from "@/app/tasks/RegisterRecordDialog";

interface UseGroupFilteredSioUsersResult {
  /** All workspace users — use for name resolution in read-only display. */
  allUsers: WorkspaceUser[];
  /** Users filtered to the active user's group(s). ADG/DD_INT get all users. */
  sioUsers: WorkspaceUser[];
  loading: boolean;
}

/**
 * Returns workspace users filtered to the active user's DGGI group so the
 * SIO selector only shows colleagues within the same group.
 * ADG and DD_INT roles see all users.
 */
export function useGroupFilteredSioUsers(): UseGroupFilteredSioUsersResult {
  const supabase = clientConnectionWithSupabase();
  const [allUsers, setAllUsers] = useState<WorkspaceUser[]>([]);
  const [sioUsers, setSioUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id;
      if (!uid) { setLoading(false); return; }

      const [{ data: userRow }, { data: groupRows }, usersRes] = await Promise.all([
        supabase.from("votum_users").select("dggi_role").eq("id", uid).single(),
        supabase.from("dggi_user_group_assignments").select("group_name").eq("user_id", uid),
        getAllUsers(),
      ]);

      const role: string = userRow?.dggi_role ?? "";
      const groups: string[] = (groupRows ?? []).map((g: { group_name: string }) => g.group_name);
      const users: WorkspaceUser[] = usersRes.success ? (usersRes.data ?? []) : [];

      setAllUsers(users);

      if (role === "ADG" || role === "DD_INT") {
        setSioUsers(users);
      } else if (groups.length > 0) {
        const { data: mateRows } = await supabase
          .from("dggi_user_group_assignments")
          .select("user_id")
          .in("group_name", groups);
        const mateIds = new Set((mateRows ?? []).map((r: { user_id: string }) => r.user_id));
        setSioUsers(users.filter((u) => mateIds.has(u.id)));
      } else {
        setSioUsers([]);
      }

      setLoading(false);
    };
    run();
  }, []);

  return { allUsers, sioUsers, loading };
}
