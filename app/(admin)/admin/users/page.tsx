"use client";
// app/(admin)/admin/users/page.tsx
import { useCallback, useEffect, useState } from "react";
import { Search, Trash2, RefreshCw, Loader2, UserCog } from "lucide-react";

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
  const [users,   setUsers]   = useState<User[]>([]);
  const [search,  setSearch]  = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null); // id to confirm delete

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search)     qs.set("search", search);
      if (roleFilter) qs.set("role",   roleFilter);
      const res  = await fetch(`/api/admin/users?${qs}`);
      const data = await res.json();
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
      await fetch("/api/admin/users", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setActing(null);
    }
  };

  const changeRole = async (id: string, role: Role) => {
    setActing(id);
    try {
      await fetch("/api/admin/users", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, role }),
      });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all registered accounts</p>
      </div>

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
                    <button
                      onClick={() => setConfirm(user.id)}
                      title="Delete user"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
