"use client";
// app/(admin)/admin/newsletter/page.tsx
// Admin tool: compose and broadcast a newsletter email to all subscribed users.

import { useState, useEffect } from "react";
import {
  Mail, Send, Users, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, AlertTriangle,
} from "lucide-react";

// Minimal sanitiser — convert plain newlines to <br> and <p> tags for the email body
function plainToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">${
      p.replace(/\n/g, "<br/>")
    }</p>`)
    .join("");
}

export default function AdminNewsletterPage() {
  const [subject,       setSubject]       = useState("");
  const [body,          setBody]          = useState("");
  const [preview,       setPreview]       = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [sending,       setSending]       = useState(false);
  const [result,        setResult]        = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [confirmed,     setConfirmed]     = useState(false);

  // Load subscriber count on mount
  useEffect(() => {
    fetch("/api/admin/newsletter")
      .then((r) => r.json())
      .then((d) => setSubscriberCount(d.count ?? 0))
      .catch(() => setSubscriberCount(0));
  }, []);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    setError(null);
    setSending(true);
    setResult(null);
    try {
      const res  = await fetch("/api/admin/newsletter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ subject: subject.trim(), bodyHtml: plainToHtml(body) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] ?? "Failed to send.");
      } else {
        setResult(json);
        setSubject("");
        setBody("");
        setConfirmed(false);
        // Refresh count
        fetch("/api/admin/newsletter").then((r) => r.json()).then((d) => setSubscriberCount(d.count ?? 0));
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compose and broadcast an email to all subscribed users
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {subscriberCount === null ? "…" : subscriberCount.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">subscribers</span>
        </div>
      </div>

      {/* Success result */}
      {result && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 dark:border-green-700 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0 dark:text-green-400" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">
              Broadcast sent!
            </p>
            <p className="mt-0.5 text-sm text-green-700 dark:text-green-400">
              {result.sent.toLocaleString()} emails delivered
              {result.failed > 0 && `, ${result.failed} failed`}
              {" "}out of {result.total.toLocaleString()} subscribers.
            </p>
          </div>
        </div>
      )}

      {/* Compose card */}
      <div className="rounded-2xl border bg-card">
        {/* Tabs: compose / preview */}
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
                    This will email {subscriberCount === null ? "all" : subscriberCount?.toLocaleString()} subscribers
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
                  : <><Send className="h-4 w-4" /> Send newsletter</>
                }
              </button>
            </div>
          ) : (
            /* Email preview */
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                This is how the email will look to recipients. "Hi [Name]" is prepended automatically.
              </p>
              <div className="overflow-hidden rounded-xl border">
                {/* Fake email header */}
                <div className="border-b bg-muted/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">From:</span> modelsraha &lt;noreply@modelsraha.com&gt;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Subject:</span>{" "}
                    {subject || <em className="opacity-50">No subject</em>}
                  </p>
                </div>
                {/* Email body preview */}
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

      {/* Info box */}
      <div className="rounded-2xl border bg-card px-5 py-4 text-sm text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground">How it works</p>
        <p>Emails are sent to all users with <strong>Newsletter subscribed</strong> set to on. New users opt in by default on signup. Users can unsubscribe via the link in every email footer.</p>
        <p>Batching: emails are sent in groups of 100 via Resend. Large lists may take a minute to complete.</p>
      </div>
    </div>
  );
}
