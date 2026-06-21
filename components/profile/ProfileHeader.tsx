// components/profile/ProfileHeader.tsx
"use client";
import { useState } from "react";
import { MapPin, Star, Clock, Globe2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Props {
  profile: any;
}

export function ProfileHeader({ profile }: Props) {
  const [avatarBroken, setAvatarBroken] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
          {profile.avatarUrl && !avatarBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.user.name}
              className="h-full w-full object-cover"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {getInitials(profile.user.name)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.user.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.city?.name}{profile.city?.county ? `, ${profile.city.county.name}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {profile.avgRating.toFixed(1)} ({profile.totalReviews} reviews)
            </span>
            {profile.yearsExperience && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {profile.yearsExperience} years experience
              </span>
            )}
          </div>
          {profile.languages?.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Globe2 className="h-3 w-3" />
              {profile.languages.join(", ")}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">About</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
      </div>
    </div>
  );
}
