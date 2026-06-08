// components/home/Categories.tsx
import Link from "next/link";
import {
  Waves, Dumbbell, Heart, Leaf, Baby, Wind, Zap, Hand,
  Sparkles, Sun, Moon, Star,
} from "lucide-react";

// Map common category names/icons to lucide icons
const ICON_MAP: Record<string, React.ElementType> = {
  swedish:    Waves,
  deep:       Dumbbell,
  sports:     Dumbbell,
  hot:        Sun,
  thai:       Wind,
  prenatal:   Baby,
  reflexology: Hand,
  aromatherapy: Leaf,
  relaxation: Moon,
  couples:    Heart,
  shiatsu:    Zap,
  lymphatic:  Waves,
  default:    Sparkles,
};

function getIcon(name: string, iconField?: string | null): React.ElementType {
  if (iconField) {
    const key = iconField.toLowerCase();
    for (const [k, v] of Object.entries(ICON_MAP)) {
      if (key.includes(k)) return v;
    }
  }
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (lower.includes(k)) return v;
  }
  return ICON_MAP.default;
}

interface Props {
  categories: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    _count: { profiles: number };
  }[];
}

export function Categories({ categories }: Props) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Browse by Type
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight">Service Categories</h2>
          <p className="mt-1 text-muted-foreground">
            Find the exact style of massage you're looking for
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {categories.map((cat) => {
            const Icon = getIcon(cat.name, cat.icon);
            return (
              <Link
                key={cat.id}
                href={`/search?service=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">{cat.name}</p>
                  {cat._count.profiles > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cat._count.profiles} masseuse{cat._count.profiles !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
