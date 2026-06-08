"use client";

// components/notifications/NotificationBell.tsx
// Bell icon with unread badge, dropdown list, mark-read on click.
// Polls every 30 s — lightweight since it's just a count + small list.

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  read:      boolean;
  link?:     string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  payment_confirmed:  "💳",
  listing_activated:  "🎉",
  listing_expiring:   "⏰",
  listing_rejected:   "⚠️",
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const [open,        setOpen]        = useState(false);
  const [items,       setItems]       = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading,     setLoading]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!session) return;
    try {
      const res  = await fetch("/api/notifications?limit=15");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silent
    }
  }, [session]);

  // Initial load + polling every 30 s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return ()  => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!session) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function markRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
  }

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setLoading(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs font-normal text-gray-500">
                  ({unreadCount} new)
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markRead}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single notification item ────────────────────────────────────────────────
function NotificationItem({
  notification: n,
  onRead,
  onClose,
}: {
  notification: Notification;
  onRead:       (id: string) => void;
  onClose:      () => void;
}) {
  const icon = TYPE_ICON[n.type] ?? "🔔";
  const time = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });

  function handleClick() {
    if (!n.read) onRead(n.id);
    onClose();
  }

  const inner = (
    <div
      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors
        ${n.read
          ? "hover:bg-gray-50 dark:hover:bg-gray-800/50"
          : "bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        }`}
      onClick={n.link ? undefined : handleClick}
    >
      <span className="mt-0.5 text-base leading-none flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className={`text-sm font-medium leading-snug ${n.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
            {n.title}
          </p>
          {!n.read && (
            <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {n.message}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{time}</p>
      </div>
      {n.link && (
        <ExternalLink className="w-3.5 h-3.5 text-gray-400 mt-1 flex-shrink-0" />
      )}
    </div>
  );

  if (n.link) {
    return (
      <Link href={n.link} onClick={handleClick}>
        {inner}
      </Link>
    );
  }

  return inner;
}
