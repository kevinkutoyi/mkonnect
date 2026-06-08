// components/profile/ProfileBio.tsx
import { Globe2 } from "lucide-react";

export function ProfileBio({ profile }: { profile: any }) {
  if (!profile.bio && !profile.languages?.length && !profile.nationality) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">About</h2>
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        {profile.bio && (
          <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
            {profile.bio}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t">
          {profile.nationality && (
            <span><span className="font-semibold text-foreground">Nationality:</span> {profile.nationality}</span>
          )}
          {profile.languages?.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">Languages:</span>{" "}
              {profile.languages.join(", ")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
