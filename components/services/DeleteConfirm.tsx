"use client";
// components/services/DeleteConfirm.tsx
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmProps {
  open:        boolean;
  serviceName: string;
  onConfirm:   () => void;
  onCancel:    () => void;
  loading:     boolean;
  error?:      string | null;
}

export function DeleteConfirm({ open, serviceName, onConfirm, onCancel, loading, error }: DeleteConfirmProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Delete service?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>"{serviceName}"</strong>?
            This action cannot be undone.
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
