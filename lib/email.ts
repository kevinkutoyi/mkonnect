// lib/email.ts
// Handles all transactional emails via Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@mconnect.co.ke";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://mconnect.co.ke";
const APP_NAME = "modelsraha";

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:#e11d48;padding:24px 32px;">
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
              modelsraha
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              © ${new Date().getFullYear()} ${APP_NAME} · Kenya's massage marketplace<br/>
              If you didn't request this email, you can safely ignore it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Button component ─────────────────────────────────────────────────────────
function emailButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td>
        <a href="${href}"
           style="display:inline-block;background:#e11d48;color:#fff;font-size:14px;
                  font-weight:600;text-decoration:none;padding:12px 28px;
                  border-radius:8px;letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── 1. Welcome / Email Verification ─────────────────────────────────────────
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const verifyUrl = `${APP_URL}/auth/verify-email?token=${params.token}`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Welcome to ${APP_NAME}, ${params.name}! 👋
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Thanks for signing up. Please verify your email address to activate your account.
      This link expires in <strong>24 hours</strong>.
    </p>
    ${emailButton(verifyUrl, "Verify Email Address")}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Or copy this URL into your browser:<br/>
      <span style="color:#64748b;word-break:break-all;">${verifyUrl}</span>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Verify your ${APP_NAME} account`,
    html,
  });
}

// ─── 2. Password Reset ────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${params.token}`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Reset your password
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${params.name}</strong>, we received a request to reset your ${APP_NAME} password.
      Click the button below — the link expires in <strong>1 hour</strong>.
    </p>
    ${emailButton(resetUrl, "Reset Password")}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you didn't request a password reset, no action is needed — your account is safe.<br/><br/>
      Or copy this URL: <span style="color:#64748b;word-break:break-all;">${resetUrl}</span>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Reset your ${APP_NAME} password`,
    html,
  });
}

// ─── 3. Password Changed Confirmation ────────────────────────────────────────
export async function sendPasswordChangedEmail(params: {
  to: string;
  name: string;
}) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Password changed ✅
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${params.name}</strong>, your ${APP_NAME} password was just changed successfully.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      If you made this change, you're all set. If you <strong>didn't</strong> change your password,
      please reset it immediately and contact our support team.
    </p>
    ${emailButton(`${APP_URL}/auth/forgot-password`, "Reset Password Now")}
  `);

  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Your ${APP_NAME} password was changed`,
    html,
  });
}

// ─── 4. Welcome after email verification ─────────────────────────────────────
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  role: "VISITOR" | "MASSEUSE";
}) {
  const cta =
    params.role === "MASSEUSE"
      ? { label: "Set Up Your Profile", href: `${APP_URL}/dashboard/profile` }
      : { label: "Find a Model", href: `${APP_URL}/search` };

  const body =
    params.role === "MASSEUSE"
      ? "Your account is verified. Complete your profile to start receiving bookings — it only takes a few minutes."
      : "Your account is verified. Start browsing professional models across Kenya and book your first session.";

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      You're all set, ${params.name}! 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      ${body}
    </p>
    ${emailButton(cta.href, cta.label)}
  `);

  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Welcome to ${APP_NAME}!`,
    html,
  });
}

// =============================================================================
// NOTIFICATION EMAILS
// =============================================================================

// ─── 5. Payment Confirmed ─────────────────────────────────────────────────────
export async function sendPaymentConfirmedEmail(params: {
  to:        string;
  name:      string;
  tierName:  string;
  amount:    number;
  expiresAt: Date;
}) {
  const dashUrl = `${APP_URL}/dashboard/listing`;
  const expires = params.expiresAt.toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Payment confirmed ✅
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${params.name}</strong>, we've received your payment for your
      <strong>${params.tierName}</strong> listing plan on ${APP_NAME}.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#64748b;padding-bottom:8px;">Amount paid</td>
              <td style="font-size:13px;font-weight:700;color:#0f172a;text-align:right;padding-bottom:8px;">
                KES ${params.amount.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#64748b;padding-bottom:8px;">Plan</td>
              <td style="font-size:13px;font-weight:700;color:#0f172a;text-align:right;padding-bottom:8px;">
                ${params.tierName}
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#64748b;">Valid until</td>
              <td style="font-size:13px;font-weight:700;color:#0f172a;text-align:right;">
                ${expires}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.6;">
      Your listing is now <strong>active</strong> and visible to clients across Kenya.
    </p>
    ${emailButton(dashUrl, "View Your Dashboard")}
  `);

  return resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Payment confirmed — ${params.tierName} plan activated`,
    html,
  });
}

// ─── 6. Listing Activated ─────────────────────────────────────────────────────
export async function sendListingActivatedEmail(params: {
  to:       string;
  name:     string;
  slug:     string;
  tierName: string;
}) {
  const profileUrl = `${APP_URL}/model/${params.slug}`;
  const dashUrl    = `${APP_URL}/dashboard`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      Your listing is live! 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${params.name}</strong>, great news — your <strong>${params.tierName}</strong>
      listing on ${APP_NAME} is now publicly visible to clients across Kenya.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Clients can now find your profile, view your services, and book sessions with you.
      Make sure your profile is complete to maximise your bookings.
    </p>
    ${emailButton(profileUrl, "View Your Public Profile")}
    <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      Or manage from your <a href="${dashUrl}" style="color:#e11d48;">dashboard →</a>
    </p>
  `);

  return resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Your ${APP_NAME} listing is now live 🎉`,
    html,
  });
}

// ─── 7. Listing Expiring Soon ─────────────────────────────────────────────────
export async function sendListingExpiringEmail(params: {
  to:        string;
  name:      string;
  tierName:  string;
  daysLeft:  number;
  expiresAt: Date;
}) {
  const renewUrl = `${APP_URL}/dashboard/listing`;
  const expires  = params.expiresAt.toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });
  const urgency  = params.daysLeft <= 1 ? "⚠️ Last chance!" : params.daysLeft <= 3 ? "⏳ Expiring soon" : "📅 Heads up";

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      ${urgency} — Listing expires in ${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""}
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${params.name}</strong>, your <strong>${params.tierName}</strong> listing
      on ${APP_NAME} will expire on <strong>${expires}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Once it expires, your profile will be hidden from search results and clients
      won't be able to find you. Renew now to stay visible without any interruption.
    </p>
    ${emailButton(renewUrl, "Renew My Listing")}
    <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
      Questions? Reply to this email or visit our <a href="${APP_URL}/help" style="color:#e11d48;">help centre</a>.
    </p>
  `);

  return resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `⚠️ Your ${APP_NAME} listing expires in ${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""}`,
    html,
  });
}

// ─── 8. Listing Rejected / Suspended ─────────────────────────────────────────
export async function sendListingRejectedEmail(params: {
  to:     string;
  name:   string;
  action: "SUSPEND" | "BAN" | "PENDING";
  reason?: string;
}) {
  const supportUrl = `${APP_URL}/support`;
  const dashUrl    = `${APP_URL}/dashboard`;

  const headlines: Record<typeof params.action, string> = {
    SUSPEND: "Your listing has been suspended",
    BAN:     "Your account has been permanently banned",
    PENDING: "Your profile has been returned for review",
  };

  const bodies: Record<typeof params.action, string> = {
    SUSPEND: `Your <strong>${APP_NAME}</strong> profile has been temporarily suspended and is no longer visible to clients. Please review our community guidelines and contact support if you believe this was an error.`,
    BAN:     `Your <strong>${APP_NAME}</strong> account has been permanently banned due to a violation of our terms of service. If you believe this decision was made in error, please contact our support team.`,
    PENDING: `Your <strong>${APP_NAME}</strong> profile has been returned to pending status for additional review. Our team will get back to you shortly. Please ensure your profile meets our guidelines.`,
  };

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
      ${headlines[params.action]}
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${params.name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      ${bodies[params.action]}
    </p>
    ${params.reason ? `
    <div style="background:#fef2f2;border-left:4px solid #fca5a5;border-radius:4px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#dc2626;font-weight:600;">Reason provided:</p>
      <p style="margin:8px 0 0;font-size:14px;color:#7f1d1d;">${params.reason}</p>
    </div>` : ""}
    ${params.action !== "BAN"
      ? emailButton(dashUrl, "Go to Dashboard")
      : emailButton(supportUrl, "Contact Support")}
  `);

  return resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Important: ${headlines[params.action]}`,
    html,
  });
}
