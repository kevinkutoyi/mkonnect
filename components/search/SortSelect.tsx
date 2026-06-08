"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "rating";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="rating">Top Rated</option>
      <option value="price_asc">Price: Low → High</option>
      <option value="price_desc">Price: High → Low</option>
      <option value="newest">Newest</option>
    </select>
  );
}
