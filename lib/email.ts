// lib/email.ts
// Handles all transactional emails via Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@mconnect.co.ke";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://mconnect.co.ke";
const APP_NAME = "mconnect";

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
              m<span style="opacity:.85">connect</span>
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
      : { label: "Find a Masseuse", href: `${APP_URL}/search` };

  const body =
    params.role === "MASSEUSE"
      ? "Your account is verified. Complete your profile to start receiving bookings — it only takes a few minutes."
      : "Your account is verified. Start browsing professional masseuses across Kenya and book your first session.";

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
