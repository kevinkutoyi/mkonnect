"use client";
// app/(admin)/admin/newsletter/page.tsx

import { useState, useEffect } from "react";
import {
  Mail, Send, Users, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, AlertTriangle, UserCheck, ShoppingBag,
} from "lucide-react";

type Audience = "ALL" | "MODELS" | "CLIENTS";

interface Counts { all: number; models: number; clients: number }

function plainToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">${
      p.replace(/\n/g, "<br/>")
    }</p>`)
    .join("");
}

const AUDIENCES: { key: Audience; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key:   "ALL",
    label: "All Users",
    icon:  <Users className="h-4 w-4" />,
    desc:  "Every subscribed user — models and clients",
  },
  {
    key:   "MODELS",
    label: "Models only",
    icon:  <UserCheck className="h-4 w-4" />,
    desc:  "Only masseuse profiles",
  },
  {
    key:   "CLIENTS",
    label: "Clients only",
    icon:  <ShoppingBag className="h-4 w-4" />,
    desc:  "Visitors and booked clients",
  },
];

export default function AdminNewsletterPage() {
  const [audience,  setAudience]  = useState<Audience>("ALL");
  const [subject,   setSubject]   = useState("");
  const [body,      setBody]      = useState("");
  const [preview,   setPreview]   = useState(false);
  const [counts,    setCounts]    = useState<Counts | null>(null);
  const [sending,   setSending]   = useState(false);
  const [result,    setResult]    = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/newsletter")
      .then((r) => r.json())
      .then((d) => setCounts(d))
      .catch(() => setCounts({ all: 0, models: 0, clients: 0 }));
  }, []);

  const recipientCount = counts
    ? audience === "ALL" ? counts.all : audience === "MODELS" ? counts.models : counts.clients
    : null;

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    setError(null);
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ subject: subject.trim(), bodyHtml: plainToHtml(body), audience }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] ?? "Failed to send.");
      } else {
        setResult(json);
        setSubject("");
        setBody("");
        setConfirmed(false);
        fetch("/api/admin/newsletter").then((r) => r.json()).then((d) => setCounts(d));
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  const bodyHtmlPreview = plainToHtml(body || "Your email body will appear here…");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compose and broadcast an email to a specific audience
        </p>
      </div>

      {/* Audience selector */}
      <div className="grid grid-cols-3 gap-3">
        {AUDIENCES.map(({ key, label, icon, desc }) => {
          const count = counts
            ? key === "ALL" ? counts.all : key === "MODELS" ? counts.models : counts.clients
            : null;
          const active = audience === key;
          return (
            <button
              key={key}
              onClick={() => { setAudience(key); setConfirmed(false); setResult(null); }}
              className={`flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "bg-card hover:border-primary/40"
              }`}
            >
              <div className={`flex items-center gap-2 font-semibold text-sm ${active ? "text-primary" : ""}`}>
                {icon} {label}
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
              <p className={`text-lg font-bold mt-1 ${active ? "text-primary" : ""}`}>
                {count === null ? "…" : count.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-muted-foreground">subscribers</span>
              </p>
            </button>
          );
        })}
      </div>

      {/* Success result */}
      {result && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 dark:border-green-700 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0 dark:text-green-400" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Broadcast sent!</p>
            <p className="mt-0.5 text-sm text-green-700 dark:text-green-400">
              {result.sent.toLocaleString()} emails delivered
              {result.failed > 0 && `, ${result.failed} failed`}
              {" "}out of {result.total.toLocaleString()} recipients.
            </p>
          </div>
        </div>
      )}

      {/* Compose card */}
      <div className="rounded-2xl border bg-card">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setPreview(false)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
              !preview ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" /> Compose
          </button>
          <button
            onClick={() => setPreview(true)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
              preview ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-4 w-4" /> Preview email
          </button>
        </div>

        <div className="p-6">
          {!preview ? (
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Subject line</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. New features on modelsraha 🎉"
                  maxLength={200}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">{subject.length}/200</p>
              </div>

              {/* Body */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Message body
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(plain text — double line-break = new paragraph)</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={"Write your message here.\n\nA blank line between sections creates a new paragraph in the email."}
                  rows={10}
                  className="w-full resize-y rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <XCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {/* Warning + confirm */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    This will email{" "}
                    {recipientCount === null ? "…" : recipientCount.toLocaleString()}{" "}
                    {audience === "ALL" ? "subscribers" : audience === "MODELS" ? "models" : "clients"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="rounded"
                  />
                  I've previewed the email and I'm ready to send
                </label>
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !confirmed || !subject.trim() || !body.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {sending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  : <><Send className="h-4 w-4" /> Send to {AUDIENCES.find(a => a.key === audience)?.label}</>
                }
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                This is how the email will look to recipients. "Hi [Name]" is prepended automatically.
              </p>
              <div className="overflow-hidden rounded-xl border">
                <div className="border-b bg-muted/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">From:</span> modelsraha &lt;noreply@modelsraha.com&gt;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">To:</span>{" "}
                    {AUDIENCES.find(a => a.key === audience)?.label} ({recipientCount === null ? "…" : recipientCount?.toLocaleString()} recipients)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Subject:</span>{" "}
                    {subject || <em className="opacity-50">No subject</em>}
                  </p>
                </div>
                <div className="bg-[#f4f4f5] px-4 py-6">
                  <div className="mx-auto max-w-[560px] overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="bg-[#e11d48] px-8 py-5">
                      <span className="text-lg font-bold text-white tracking-tight">modelsraha</span>
                    </div>
                    <div className="px-8 py-7">
                      <p className="mb-1 text-sm text-[#475569]">Hi <strong>Jane</strong>,</p>
                      <div
                        className="text-sm text-[#475569] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: bodyHtmlPreview }}
                      />
                    </div>
                    <div className="border-t border-[#f1f5f9] px-8 py-4">
                      <p className="text-center text-[11px] text-[#94a3b8]">
                        © {new Date().getFullYear()} modelsraha · Kenya's massage marketplace<br />
                        <span className="underline cursor-pointer">Unsubscribe</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreview(false)}
                className="mt-4 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <EyeOff className="h-3.5 w-3.5" /> Back to compose
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border bg-card px-5 py-4 text-sm text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground">How it works</p>
        <p>Only users with <strong>Newsletter subscribed</strong> on receive emails. New users opt in by default. Users can unsubscribe via the link in every email footer.</p>
        <p>Emails are sent in batches of 100 via Resend. Large lists may take a moment to complete.</p>
      </div>
    </div>
  );
}
