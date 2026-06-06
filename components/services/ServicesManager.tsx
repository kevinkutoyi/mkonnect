"use client";
// components/services/ServicesManager.tsx
// Full client-side service management — list, add, edit, delete, reorder, toggle active

import { useState, useCallback } from "react";
import { Plus, ListChecks, Info } from "lucide-react";
import { ServiceCard }   from "./ServiceCard";
import { ServiceForm }   from "./ServiceForm";
import { DeleteConfirm } from "./DeleteConfirm";

interface Category { id: number; name: string; icon: string; type: string }

interface ServicesManagerProps {
  initialServices: any[];
  categories:      Category[];
  profileStatus:   string | null;
}

export function ServicesManager({ initialServices, categories, profileStatus }: ServicesManagerProps) {
  const [services,    setServices]    = useState<any[]>(initialServices);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<any | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleteName,  setDeleteName]  = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  // Drag state for reorder
  const [dragId,      setDragId]      = useState<string | null>(null);

  // ── Create / Update ──────────────────────────────────────────────────────────
  const handleSaved = useCallback((saved: any) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit   = (s: any) => { setEditTarget(s); setFormOpen(true); };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    const res  = await fetch(`/api/services/${deleteId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setDeleteError(json.error ?? "Delete failed.");
      setDeleting(false);
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  };

  // ── Toggle active ────────────────────────────────────────────────────────────
  const toggleActive = async (id: string, isActive: boolean) => {
    // Optimistic update
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, isActive } : s));
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      // Revert
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !isActive } : s));
    }
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDragId(id);

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setServices((prev) => {
      const fromIdx = prev.findIndex((s) => s.id === dragId);
      const toIdx   = prev.findIndex((s) => s.id === overId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const handleDrop = async () => {
    setDragId(null);
    // Persist new order
    const order = services.map((s, i) => ({ id: s.id, sortOrder: i }));
    await fetch("/api/services/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const activeCount   = services.filter((s) => s.isActive).length;
  const inactiveCount = services.length - activeCount;
  const totalBookings = services.reduce((n, s) => n + (s.bookingCount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the massage services you offer. Drag to reorder.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={services.length >= 20}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add service
        </button>
      </div>

      {/* Profile status banner */}
      {profileStatus === "PENDING" && (
        <div className="flex items-start gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
          <p className="text-yellow-700 dark:text-yellow-400">
            Your profile is pending admin approval. Services will be visible to clients once approved.
          </p>
        </div>
      )}

      {/* Stats row */}
      {services.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: services.length },
            { label: "Active",   value: activeCount     },
            { label: "Bookings", value: totalBookings   },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-card px-4 py-3 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Service list */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed bg-muted/30 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ListChecks className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No services yet</p>
            <p className="text-sm text-muted-foreground">Add your first service to start accepting bookings.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add your first service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active services */}
          {services.filter((s) => s.isActive).map((service) => (
            <div
              key={service.id}
              draggable
              onDragStart={() => handleDragStart(service.id)}
              onDragOver={(e) => handleDragOver(e, service.id)}
              onDrop={handleDrop}
              onDragEnd={() => setDragId(null)}
            >
              <ServiceCard
                service={service}
                onEdit={openEdit}
                onDelete={(id, name) => { setDeleteId(id); setDeleteName(name); setDeleteError(null); }}
                onToggle={toggleActive}
                dragging={dragId === service.id}
              />
            </div>
          ))}

          {/* Inactive services (separate section) */}
          {inactiveCount > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inactive ({inactiveCount})
              </p>
              {services.filter((s) => !s.isActive).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={openEdit}
                  onDelete={(id, name) => { setDeleteId(id); setDeleteName(name); setDeleteError(null); }}
                  onToggle={toggleActive}
                />
              ))}
            </div>
          )}

          {services.length >= 20 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Maximum 20 services reached.
            </p>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      <ServiceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        initial={editTarget ?? undefined}
        categories={categories}
      />

      {/* Delete confirm */}
      <DeleteConfirm
        open={!!deleteId}
        serviceName={deleteName}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteId(null); setDeleteError(null); }}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
