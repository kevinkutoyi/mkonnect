"use client";
// components/ui/toaster.tsx
// Minimal toast container — replace with shadcn/ui Toaster if you install it via `npx shadcn-ui add toast`
import { useState, createContext, useContext, useCallback } from "react";

interface Toast { id: string; message: string; type?: "success" | "error" | "info" }
const ToastContext = createContext<{ addToast: (t: Omit<Toast, "id">) => void } | null>(null);

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg text-white ${
              t.type === "error" ? "bg-destructive" : t.type === "success" ? "bg-green-600" : "bg-foreground"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside Toaster");
  return ctx;
}
