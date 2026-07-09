"use client";

import clientConnectionWithSupabase from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/action/workspace";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Users, ChevronDown, X, Plus, Search, Trash2, UserPlus } from "lucide-react";

const DGGI_ROLES = ["ADG", "DD_INT", "DD", "AD", "ADC", "JD", "SIO", "IO"] as const;
type DggiRole = (typeof DGGI_ROLES)[number];

const ROLE_LABELS: Record<DggiRole, string> = {
  ADG: "Additional Director General",
  DD_INT: "Deputy Director (Intelligence)",
  DD: "Deputy Director",
  AD: "Assistant Director",
  ADC: "Assistant Deputy Commissioner",
  JD: "Joint Director",
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

interface UserWithGroups extends User {
  groups: string[];
}

interface AddUserForm {
  name: string;
  email: string;
  dggi_role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithGroups[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDggiRole, setCurrentDggiRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithGroups | null>(null);
  const [saving, setSaving] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddUserForm>({ name: "", email: "", dggi_role: "" });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadCurrentUser = async () => {
    const supabase = clientConnectionWithSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("votum_users")
      .select("dggi_role")
      .eq("id", user.id)
      .single();
    setCurrentDggiRole(data?.dggi_role ?? null);
  };

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

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const canManage = ["ADG", "DD_INT"].includes(currentDggiRole ?? "");

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
    const trimmedName = editingUser.name.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const supabase = clientConnectionWithSupabase();

      const { error: updateError } = await supabase
        .from("votum_users")
        .update({ name: trimmedName, dggi_role: editingUser.dggi_role || null })
        .eq("id", editingUser.id);

      if (updateError) throw updateError;

      const originalGroups = users.find((u) => u.id === editingUser.id)?.groups ?? [];
      const toRemove = originalGroups.filter((g) => !editingUser.groups.includes(g));
      const toAdd = editingUser.groups.filter((g) => !originalGroups.includes(g));

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("dggi_user_group_assignments")
          .delete()
          .eq("user_id", editingUser.id)
          .in("group_name", toRemove);

        if (deleteError) throw deleteError;
      }

      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("dggi_user_group_assignments")
          .insert(
            toAdd.map((group_name) => ({
              user_id: editingUser.id,
              group_name,
              workspace_id: editingUser.workspace_id,
            }))
          );

        if (insertError) throw insertError;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: trimmedName, dggi_role: editingUser.dggi_role, groups: editingUser.groups }
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

  const addUser = async () => {
    const name = addForm.name.trim();
    const email = addForm.email.trim().toLowerCase();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    setAdding(true);
    try {
      const supabase = clientConnectionWithSupabase();
      const workspace_id = await getWorkspaceId();
      if (!workspace_id) return;

      const { data, error } = await supabase
        .from("votum_users")
        .insert({
          name,
          email,
          dggi_role: addForm.dggi_role || null,
          workspace_id,
          role: "member",
        })
        .select()
        .single();

      if (error) throw error;

      setUsers((prev) => [...prev, { ...data, groups: [] }].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAddModal(false);
      setAddForm({ name: "", email: "", dggi_role: "" });
      toast.success("User added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add user");
    } finally {
      setAdding(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      const supabase = clientConnectionWithSupabase();

      const { error: groupError } = await supabase
        .from("dggi_user_group_assignments")
        .delete()
        .eq("user_id", userId);

      if (groupError) throw groupError;

      const { error: userError } = await supabase
        .from("votum_users")
        .delete()
        .eq("id", userId);

      if (userError) throw userError;

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConfirmDeleteId(null);
      toast.success("User removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a96]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-8 pr-3 py-1.5 text-sm border border-[#EDEDEA] rounded-lg bg-white outline-none focus:border-[#4A5FD4] w-56"
            />
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#4A5FD4] text-white rounded-lg hover:bg-[#3a4fc4] transition-colors font-medium"
            >
              <UserPlus size={14} />
              Add User
            </button>
          )}
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
                      <td className="px-4 py-3">
                        {canManage && (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEdit(user)}
                              className="text-xs text-[#4A5FD4] hover:underline font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(user.id)}
                              className="text-[#9a9a96] hover:text-red-500 transition-colors"
                              title="Remove user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
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
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-2">
                  Name
                </label>
                <input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#EDEDEA] rounded-lg outline-none focus:border-[#4A5FD4]"
                  placeholder="Full name"
                />
              </div>

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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDEDEA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4A5FD4] flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <p className="text-sm font-semibold text-[#1a1a1a]">Add New User</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setAddForm({ name: "", email: "", dggi_role: "" }); }}
                className="text-[#9a9a96] hover:text-[#1a1a1a] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#EDEDEA] rounded-lg outline-none focus:border-[#4A5FD4]"
                  placeholder="Full name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addUser()}
                  className="w-full px-3 py-2 text-sm border border-[#EDEDEA] rounded-lg outline-none focus:border-[#4A5FD4]"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-2">
                  DGGI Role
                </label>
                <div className="relative">
                  <select
                    value={addForm.dggi_role}
                    onChange={(e) => setAddForm({ ...addForm, dggi_role: e.target.value })}
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
            </div>

            <div className="px-5 py-4 border-t border-[#EDEDEA] flex justify-end gap-2">
              <button
                onClick={() => { setShowAddModal(false); setAddForm({ name: "", email: "", dggi_role: "" }); }}
                className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                disabled={adding}
                className="px-4 py-2 text-sm bg-[#4A5FD4] text-white rounded-lg hover:bg-[#3a4fc4] transition-colors font-medium disabled:opacity-60"
              >
                {adding ? "Adding..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Remove user?</p>
              <p className="text-sm text-[#6b6b6b]">
                This will remove{" "}
                <span className="font-medium text-[#1a1a1a]">
                  {users.find((u) => u.id === confirmDeleteId)?.name}
                </span>{" "}
                and all their group assignments. This cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-60"
              >
                {deletingId === confirmDeleteId ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
