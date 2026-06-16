// lib/mpesa.ts
// Safaricom Daraja B2C client for masseuse payouts.
//
// Required env vars:
//   MPESA_CONSUMER_KEY          — from developer.safaricom.co.ke
//   MPESA_CONSUMER_SECRET       — from developer.safaricom.co.ke
//   MPESA_B2C_SHORT_CODE        — your M-Pesa Business shortcode (paybill / till)
//   MPESA_B2C_INITIATOR_NAME    — Daraja initiator name (from Safaricom portal)
//   MPESA_B2C_SECURITY_CRED     — encrypted security credential (from portal)
//   MPESA_ENV                   — "sandbox" | "live"  (default: "sandbox")
//   NEXT_PUBLIC_APP_URL         — e.g. https://mconnect.co.ke  (for callback URLs)

const DARAJA_BASE = process.env.MPESA_ENV === "live"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

// ── Token cache (process-level, reused across requests) ─────────────────────
let _tokenCache: { token: string; expiresAt: number } | null = null;

export async function getDarajaToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 30_000) {
    return _tokenCache.token;
  }

  const key    = process.env.MPESA_CONSUMER_KEY    ?? "";
  const secret = process.env.MPESA_CONSUMER_SECRET ?? "";

  if (!key || !secret) {
    throw new MpesaError("MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET not set");
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  if (!res.ok) {
    throw new MpesaError(`Daraja token fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  _tokenCache = {
    token:     json.access_token,
    expiresAt: Date.now() + Number(json.expires_in) * 1000,
  };

  return _tokenCache.token;
}

// ── B2C request ──────────────────────────────────────────────────────────────

export interface B2CRequest {
  /** Recipient M-Pesa phone, format: 2547XXXXXXXX */
  phone:       string;
  /** Amount in KES (integer) */
  amount:      number;
  /** Internal reference — stored as OriginatorConversationID */
  reference:   string;
  /** Human-readable label e.g. "Weekly payout – mconnect" */
  remarks:     string;
}

export interface B2CResponse {
  /** Daraja's conversation ID — store this to match callbacks */
  conversationId:          string;
  originatorConversationId: string;
  responseCode:            string;  // "0" = accepted
  responseDescription:     string;
}

export async function sendB2CPayment(req: B2CRequest): Promise<B2CResponse> {
  const token        = await getDarajaToken();
  const shortCode    = process.env.MPESA_B2C_SHORT_CODE     ?? "";
  const initiator    = process.env.MPESA_B2C_INITIATOR_NAME ?? "";
  const securityCred = process.env.MPESA_B2C_SECURITY_CRED  ?? "";
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL       ?? "https://mconnect.co.ke";

  if (!shortCode || !initiator || !securityCred) {
    throw new MpesaError("Daraja B2C env vars not configured (SHORT_CODE / INITIATOR_NAME / SECURITY_CRED)");
  }

  const body = {
    InitiatorName:          initiator,
    SecurityCredential:     securityCred,
    CommandID:              "BusinessPayment",      // direct payment to personal M-Pesa
    Amount:                 Math.round(req.amount), // integer KES
    PartyA:                 shortCode,
    PartyB:                 req.phone,
    Remarks:                req.remarks.slice(0, 100),
    QueueTimeOutURL:        `${appUrl}/api/payouts/callback?type=timeout`,
    ResultURL:              `${appUrl}/api/payouts/callback?type=result`,
    Occasion:               req.reference.slice(0, 100),
  };

  const res = await fetch(`${DARAJA_BASE}/mpesa/b2c/v3/paymentrequest`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || json.ResponseCode !== "0") {
    throw new MpesaError(
      `Daraja B2C rejected: ${json.ResponseDescription ?? json.errorMessage ?? res.statusText}`,
      json.ResponseCode
    );
  }

  return {
    conversationId:           json.ConversationID,
    originatorConversationId: json.OriginatorConversationID,
    responseCode:             json.ResponseCode,
    responseDescription:      json.ResponseDescription,
  };
}

// ── Result callback parser ───────────────────────────────────────────────────

export interface B2CResult {
  conversationId:          string;
  originatorConversationId: string;
  resultCode:              number;  // 0 = success
  resultDesc:              string;
  mpesaReceiptNumber?:     string;
  transactionAmount?:      number;
  recipientName?:          string;
  completedAt?:            string;
}

/** Parse the JSON body Daraja POSTs to your ResultURL */
export function parseB2CResult(body: unknown): B2CResult {
  const result = (body as any)?.Result;
  if (!result) throw new MpesaError("Invalid B2C callback body — missing Result");

  const params: Record<string, unknown> = {};
  const items = result.ResultParameters?.ResultParameter ?? [];
  for (const item of items) {
    params[item.Key] = item.Value;
  }

  return {
    conversationId:           result.ConversationID,
    originatorConversationId: result.OriginatorConversationID,
    resultCode:               Number(result.ResultCode),
    resultDesc:               result.ResultDesc,
    mpesaReceiptNumber:       params.TransactionReceipt as string | undefined,
    transactionAmount:        params.TransactionAmount !== undefined
                                ? Number(params.TransactionAmount) : undefined,
    recipientName:            params.ReceiverPartyPublicName as string | undefined,
    completedAt:              params.TransactionCompletedDateTime as string | undefined,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a Kenyan phone to 2547XXXXXXXX / 2541XXXXXXXX format */
export function normaliseMpesaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0")   && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("7")   && digits.length === 9)  return "254" + digits;
  if (digits.startsWith("1")   && digits.length === 9)  return "254" + digits;
  throw new MpesaError(`Cannot normalise phone number: "${raw}"`);
}

/** Check whether Daraja credentials are configured */
export function isDarajaConfigured(): boolean {
  return !!(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_B2C_SHORT_CODE &&
    process.env.MPESA_B2C_INITIATOR_NAME &&
    process.env.MPESA_B2C_SECURITY_CRED
  );
}

// ── Error type ───────────────────────────────────────────────────────────────

export class MpesaError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "MpesaError";
  }
}
