"use client";

import clientConnectionWithSupabase from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/action/workspace";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Users, ChevronDown, X, Plus, Search } from "lucide-react";

const DGGI_ROLES = ["ADG", "DD_INT", "DD", "ADC", "SIO", "IO"] as const;
type DggiRole = (typeof DGGI_ROLES)[number];

const ROLE_LABELS: Record<DggiRole, string> = {
  ADG: "Additional Director General",
  DD_INT: "Deputy Director (Intelligence)",
  DD: "Deputy Director",
  ADC: "Assistant Deputy Commissioner",
  SIO: "Senior Intelligence Officer",
  IO: "Intelligence Officer",
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  dggi_role: string | null;
  workspace_id: string;
  created_at: string;
}

interface GroupAssignment {
  id: string;
  user_id: string;
  group_name: string;
}

interface UserWithGroups extends User {
  groups: string[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithGroups[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithGroups | null>(null);
  const [saving, setSaving] = useState(false);
  const [newGroup, setNewGroup] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const supabase = clientConnectionWithSupabase();
      const workspace_id = await getWorkspaceId();
      if (!workspace_id) return;

      const [{ data: usersData }, { data: groupData }] = await Promise.all([
        supabase.from("votum_users").select("*").eq("workspace_id", workspace_id).order("name"),
        supabase.from("dggi_user_group_assignments").select("*"),
      ]);

      const groupsByUser: Record<string, string[]> = {};
      for (const g of groupData ?? []) {
        if (!groupsByUser[g.user_id]) groupsByUser[g.user_id] = [];
        groupsByUser[g.user_id].push(g.group_name);
      }

      setUsers(
        (usersData ?? []).map((u) => ({
          ...u,
          groups: groupsByUser[u.id] ?? [],
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user: UserWithGroups) => {
    setEditingUser({ ...user, groups: [...user.groups] });
    setNewGroup("");
  };

  const addGroup = () => {
    const trimmed = newGroup.trim().toUpperCase();
    if (!trimmed || !editingUser) return;
    if (editingUser.groups.includes(trimmed)) {
      setNewGroup("");
      return;
    }
    setEditingUser({ ...editingUser, groups: [...editingUser.groups, trimmed] });
    setNewGroup("");
  };

  const removeGroup = (group: string) => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, groups: editingUser.groups.filter((g) => g !== group) });
  };

  const saveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const supabase = clientConnectionWithSupabase();

      // Update dggi_role on votum_users
      const { error: roleError } = await supabase
        .from("votum_users")
        .update({ dggi_role: editingUser.dggi_role || null })
        .eq("id", editingUser.id);

      if (roleError) throw roleError;

      // Sync group assignments: delete all then re-insert
      const { error: deleteError } = await supabase
        .from("dggi_user_group_assignments")
        .delete()
        .eq("user_id", editingUser.id);

      if (deleteError) throw deleteError;

      if (editingUser.groups.length > 0) {
        const { error: insertError } = await supabase
          .from("dggi_user_group_assignments")
          .insert(editingUser.groups.map((group_name) => ({ user_id: editingUser.id, group_name })));

        if (insertError) throw insertError;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, dggi_role: editingUser.dggi_role, groups: editingUser.groups }
            : u
        )
      );
      setEditingUser(null);
      toast.success("User updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-white border-b border-[#EDEDEA] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users size={18} className="text-[#4A5FD4]" />
          <h1 className="text-base font-semibold text-[#1a1a1a]">User Management</h1>
          <span className="text-xs text-[#9a9a96] bg-[#F3F2EF] px-2 py-0.5 rounded-full">
            {users.length} users
          </span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a96]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-8 pr-3 py-1.5 text-sm border border-[#EDEDEA] rounded-lg bg-white outline-none focus:border-[#4A5FD4] w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#4A5FD4] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EDEDEA] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDEDEA] bg-[#FAFAF8]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">DGGI Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9a9a96] uppercase tracking-wider">Groups</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#9a9a96] text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, i) => (
                    <tr
                      key={user.id}
                      className={`border-b border-[#EDEDEA] last:border-0 hover:bg-[#FAFAF8] transition-colors ${i % 2 === 0 ? "" : "bg-[#FDFCFB]"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4A5FD4] flex items-center justify-center text-xs font-semibold shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-medium text-[#1a1a1a]">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{user.email}</td>
                      <td className="px-4 py-3">
                        {user.dggi_role ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#EEF2FF] text-[#4A5FD4]">
                            {user.dggi_role}
                          </span>
                        ) : (
                          <span className="text-[#9a9a96] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.groups.length === 0 ? (
                            <span className="text-[#9a9a96] text-xs">—</span>
                          ) : (
                            user.groups.map((g) => (
                              <span
                                key={g}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#F3F2EF] text-[#4a4a4a]"
                              >
                                {g}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(user)}
                          className="text-xs text-[#4A5FD4] hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDEDEA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4A5FD4] flex items-center justify-center text-sm font-semibold">
                  {editingUser.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a]">{editingUser.name}</p>
                  <p className="text-xs text-[#9a9a96]">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[#9a9a96] hover:text-[#1a1a1a] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* DGGI Role */}
              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-2">
                  DGGI Role
                </label>
                <div className="relative">
                  <select
                    value={editingUser.dggi_role ?? ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, dggi_role: e.target.value || null })
                    }
                    className="w-full appearance-none px-3 py-2 text-sm border border-[#EDEDEA] rounded-lg bg-white outline-none focus:border-[#4A5FD4] pr-8"
                  >
                    <option value="">No role assigned</option>
                    {DGGI_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r} — {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a96] pointer-events-none" />
                </div>
              </div>

              {/* Group Assignments */}
              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-2">
                  Group Assignments
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                  {editingUser.groups.length === 0 ? (
                    <p className="text-xs text-[#9a9a96]">No groups assigned</p>
                  ) : (
                    editingUser.groups.map((g) => (
                      <span
                        key={g}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#EEF2FF] text-[#4A5FD4]"
                      >
                        {g}
                        <button
                          onClick={() => removeGroup(g)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addGroup()}
                    placeholder="Group name (e.g. GROUP-A)"
                    className="flex-1 px-3 py-2 text-sm border border-[#EDEDEA] rounded-lg outline-none focus:border-[#4A5FD4]"
                  />
                  <button
                    onClick={addGroup}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-[#EEF2FF] text-[#4A5FD4] rounded-lg hover:bg-[#4A5FD4] hover:text-white transition-colors font-medium"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#EDEDEA] flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUser}
                disabled={saving}
                className="px-4 py-2 text-sm bg-[#4A5FD4] text-white rounded-lg hover:bg-[#3a4fc4] transition-colors font-medium disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
