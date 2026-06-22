// components/search/SearchResults.tsx
import Link from "next/link";
import { MasseuseCard } from "./MasseuseCard";
import { SearchX } from "lucide-react";

interface Props {
  masseuses: any[];
  total:     number;
  page:      number;
  pageSize:  number;
}

export function SearchResults({ masseuses, total, page, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  if (masseuses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-24 text-center">
        <SearchX className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold">No models found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try broadening your filters or searching a different location.
        </p>
        <Link
          href="/search"
          className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Clear all filters
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {masseuses.map((m) => (
          <MasseuseCard key={m.id} masseuse={m} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-1">
          {page > 1 && (
            <PaginationLink page={page - 1} label="← Prev" />
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <PaginationLink key={p} page={p as number} label={String(p)} current={page} />
              )
            )}

          {page < totalPages && (
            <PaginationLink page={page + 1} label="Next →" />
          )}
        </nav>
      )}
    </div>
  );
}

function PaginationLink({
  page, label, current,
}: { page: number; label: string; current?: number }) {
  const isActive = page === current;
  return (
    <Link
      href={`?page=${page}`}
      className={`flex min-w-[36px] items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );
}
