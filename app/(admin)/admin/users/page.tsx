"use client";
// app/(admin)/admin/users/page.tsx
import { useCallback, useEffect, useState } from "react";
import { Search, Trash2, RefreshCw, Loader2, X, CheckCircle2, Pencil } from "lucide-react";

type Role = "VISITOR" | "MASSEUSE" | "ADMIN";

interface User {
  id:        string;
  name:      string;
  email:     string;
  role:      Role;
  createdAt: string;
}

const ROLE_BADGE: Record<Role, string> = {
  VISITOR:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  MASSEUSE: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  ADMIN:    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ROLES: Role[] = ["VISITOR", "MASSEUSE", "ADMIN"];

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState<User[]>([]);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState<string | null>(null);
  const [confirm,    setConfirm]    = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);


  // Edit modal
  const [editModal,   setEditModal]   = useState<User | null>(null);
  const [editForm,    setEditForm]    = useState({ name: "", email: "", phone: "", role: "VISITOR" as Role, password: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search)     qs.set("search", search);
      if (roleFilter) qs.set("role",   roleFilter);
      const res  = await fetch(`/api/admin/users?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? res.statusText);
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const deleteUser = async (id: string) => {
    setActing(id);
    setConfirm(null);
    try {
      const res = await fetch("/api/admin/users", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        showToast("User deleted");
      } else {
        showToast("Delete failed", false);
      }
    } finally {
      setActing(null);
    }
  };

  const changeRole = async (id: string, role: Role) => {
    // Optimistically update UI immediately
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    setActing(id);
    try {
      const res  = await fetch("/api/admin/users", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, role }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Role updated to ${role}`);
      } else {
        // Revert on failure
        load();
        showToast(json.error ?? "Role update failed", false);
      }
    } finally {
      setActing(null);
    }
  };


  const openEdit = (user: User) => {
    setEditModal(user);
    setEditForm({ name: user.name, email: user.email, phone: "", role: user.role, password: "" });
    setEditError(null);
    // Fetch current phone separately (not in list query)
    fetch(`/api/admin/users/${user.id}`)
      .then((r) => r.json())
      .then((d) => setEditForm((f) => ({ ...f, phone: d.phone ?? "" })));
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const body: Record<string, any> = {
        name:  editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role:  editForm.role,
      };
      if (editForm.password) body.password = editForm.password;

      const res  = await fetch(`/api/admin/users/${editModal.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setEditError(json.error ?? "Update failed"); return; }

      // Update local state
      setUsers((prev) => prev.map((u) =>
        u.id === editModal.id
          ? { ...u, name: json.user.name, email: json.user.email, role: json.user.role }
          : u
      ));
      setEditModal(null);
      showToast(`${json.user.name} updated`);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all registered accounts</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all ${
          toast.ok
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300"
            : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
        }`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast.msg}
        </div>
      )}


      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Edit User</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{editModal.email}</p>
              </div>
              <button onClick={() => setEditModal(null)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Full name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 0712345678"
                  className="mt-1.5 w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="mt-1.5 w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* New password (optional) */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  New password <span className="text-muted-foreground/60">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="mt-1.5 w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {editError && (
                <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{editError}</p>
              )}

              <button
                onClick={saveEdit}
                disabled={editLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          onClick={load}
          className="rounded-xl border px-3 py-2.5 hover:bg-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No users found</td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id} className="bg-card hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">
                  {user.name}
                  <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value as Role)}
                    disabled={acting === user.id}
                    className={`rounded-full border-0 px-2 py-0.5 text-xs font-semibold outline-none cursor-pointer ${ROLE_BADGE[user.role]}`}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">
                  {acting === user.id ? (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                  ) : confirm === user.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">Delete?</span>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        title="Edit user"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirm(user.id)}
                        title="Delete user"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
