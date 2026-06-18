// components/contact/ContactBar.tsx
"use client";
import { useState } from "react";
import { MessageCircle, Phone, Video, Mic } from "lucide-react";
import { MessageModal }   from "@/components/contact/MessageModal";
import { VideoCallModal } from "@/components/contact/VideoCallModal";

interface Props {
  profile: {
    id: string;
    user: { name: string; phone?: string | null };
    avatarUrl?: string | null;
    isOnline?: boolean;
  };
  currentUserId?: string | null; // null = not logged in
}

type Modal = "message" | "video" | "audio" | null;

async function track(type: string, profileId: string) {
  await fetch("/api/analytics/contact", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ type, profileId }),
  }).catch(() => {});
}

export function ContactBar({ profile, currentUserId }: Props) {
  const [modal, setModal] = useState<Modal>(null);

  const phone = profile.user.phone?.replace(/\D/g, "");
  const waMsg = encodeURIComponent(
    `Hi ${profile.user.name}, I found your profile on modelsraha and I'd like to book a session.`
  );
  const waUrl = phone ? `https://wa.me/${phone}?text=${waMsg}` : null;

  const handleWhatsApp = () => {
    track("whatsapp", profile.id);
    if (waUrl) window.open(waUrl, "_blank");
  };

  const handlePhone = () => {
    track("phone", profile.id);
    if (phone) window.location.href = `tel:+${phone}`;
  };

  const handleMessage = () => {
    if (!currentUserId) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setModal("message");
  };

  const handleCall = (type: "video" | "audio") => {
    if (!currentUserId) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setModal(type);
  };

  return (
    <>
      {/* Contact bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* WhatsApp */}
        {waUrl && (
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 rounded-xl border-2 border-[#25D366] px-4 py-2.5 text-sm font-bold text-[#25D366] transition-all hover:bg-[#25D366]/10 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
        )}

        {/* Phone call */}
        {phone && (
          <button
            onClick={handlePhone}
            className="flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2.5 text-sm font-bold transition-all hover:bg-muted active:scale-95"
          >
            <Phone className="h-4 w-4" />
            Call
          </button>
        )}

        {/* Platform message */}
        <button
          onClick={handleMessage}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </button>

        {/* Video call */}
        <button
          onClick={() => handleCall("video")}
          title={profile.isOnline ? "Online — start a video call" : "Video call (may not answer instantly)"}
          className="relative flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2.5 text-sm font-bold transition-all hover:bg-muted active:scale-95"
        >
          <Video className="h-4 w-4" />
          Video
          {profile.isOnline && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
          )}
        </button>

        {/* Audio call */}
        <button
          onClick={() => handleCall("audio")}
          className="flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2.5 text-sm font-bold transition-all hover:bg-muted active:scale-95"
        >
          <Mic className="h-4 w-4" />
          Audio
        </button>
      </div>

      {/* Modals */}
      {modal === "message" && currentUserId && (
        <MessageModal
          profileId={profile.id}
          profileName={profile.user.name}
          profileAvatar={profile.avatarUrl ?? undefined}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
          onTrack={() => track("message", profile.id)}
        />
      )}
      {(modal === "video" || modal === "audio") && (
        <VideoCallModal
          profileId={profile.id}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
