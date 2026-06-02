// components/search/SearchResults.tsx
import Link from "next/link";
import { MasseuseCard } from "./MasseuseCard";

interface Props {
  masseuses: any[];
  total: number;
  page: number;
  pageSize: number;
}

export function SearchResults({ masseuses, total, page, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  if (masseuses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold">No masseuses found</p>
        <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {masseuses.map((m) => (
          <MasseuseCard key={m.id} masseuse={m} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
