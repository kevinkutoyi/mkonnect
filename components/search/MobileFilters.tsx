"use client";
// components/search/MobileFilters.tsx
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SearchFilters } from "./SearchFilters";
import { useSearchParams } from "next/navigation";

interface FilterProps {
  counties:   { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
}

export function MobileFilters({ counties, categories }: FilterProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeCount = Array.from(searchParams.keys()).filter(
    (k) => !["page", "sort"].includes(k)
  ).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-semibold shadow-sm"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-background shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="font-bold">Filters</span>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <SearchFilters counties={counties} categories={categories} />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-background px-4 py-3">
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            See results
          </button>
        </div>
      </div>
    </>
  );
}
