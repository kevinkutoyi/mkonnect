// components/contact/MessageModal.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl?: string };
}

interface Props {
  profileId:    string;
  profileName:  string;
  profileAvatar?: string;
  currentUserId: string;
  onClose: () => void;
  onTrack: () => void;
}

export function MessageModal({
  profileId, profileName, profileAvatar, currentUserId, onClose, onTrack,
}: Props) {
  const [convId,    setConvId]    = useState<string | null>(null);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sinceRef  = useRef<string | null>(null);

  // Init — get or create conversation
  useEffect(() => {
    onTrack();
    fetch("/api/conversations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ profileId }),
    })
      .then((r) => r.json())
      .then((conv) => {
        setConvId(conv.id);
        setMessages(conv.messages ?? []);
        if (conv.messages?.length) {
          sinceRef.current = conv.messages.at(-1).createdAt;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll every 3 seconds for new messages
  const poll = useCallback(() => {
    if (!convId) return;
    const qs = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : "";
    fetch(`/api/conversations/${convId}/messages${qs}`)
      .then((r) => r.json())
      .then((newMsgs: Message[]) => {
        if (newMsgs.length) {
          setMessages((prev) => [...prev, ...newMsgs]);
          sinceRef.current = newMsgs.at(-1)!.createdAt;
        }
      })
      .catch(() => {});
  }, [convId]);

  useEffect(() => {
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [poll]);

  const send = async () => {
    if (!input.trim() || !convId || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content: input.trim(),
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "You" },
    };
    setMessages((p) => [...p, optimistic]);
    const text = input.trim();
    setInput("");

    try {
      const res  = await fetch(`/api/conversations/${convId}/messages`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: text }),
      });
      const msg: Message = await res.json();
      setMessages((p) => p.map((m) => m.id === optimistic.id ? msg : m));
      sinceRef.current = msg.createdAt;
    } catch {
      setMessages((p) => p.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="flex w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:max-w-lg sm:rounded-2xl"
           style={{ height: "min(85vh, 600px)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileAvatar} alt={profileName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-bold text-primary">
                {getInitials(profileName)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold leading-none">{profileName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Platform message</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Say hello to {profileName} 👋
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              style={{ maxHeight: 120 }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || !convId}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
