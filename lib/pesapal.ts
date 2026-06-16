// lib/pesapal.ts
// Pesapal v3 API client — mconnect
//
// Pesapal status_code reference:
//   1 = Invalid   (payment not found or still processing — treat as Pending)
//   2 = Completed (funds received — activate subscription)
//   3 = Failed    (payment declined or timed out)
//   4 = Reversed  (chargeback / refund after completion)

import axios, { AxiosError } from "axios";

// ─── Base URL ─────────────────────────────────────────────────────────────────
const PESAPAL_BASE =
  process.env.PESAPAL_ENV === "live"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

// ─── Typed error ──────────────────────────────────────────────────────────────
export class PesapalError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = "PesapalError";
  }
}

function wrapAxiosError(err: unknown, context: string): never {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const msg    = err.response?.data?.message ?? err.message;
    throw new PesapalError(`[Pesapal/${context}] ${msg}`, err.code, status);
  }
  throw err;
}

// ─── Auth token (with simple mutex to prevent parallel refresh) ───────────────
let cachedToken: { token: string; expiresAt: number } | null = null;
let tokenRefreshPromise: Promise<string> | null = null;

export async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  // If a refresh is already in-flight, wait for it
  if (tokenRefreshPromise) return tokenRefreshPromise;

  tokenRefreshPromise = (async () => {
    try {
      const res = await axios.post(
        `${PESAPAL_BASE}/api/Auth/RequestToken`,
        {
          consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
          consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
        },
        { headers: { Accept: "application/json", "Content-Type": "application/json" } }
      );

      const { token, expiryDate } = res.data;
      // Subtract 60s buffer so we refresh before the token actually expires
      cachedToken = { token, expiresAt: new Date(expiryDate).getTime() - 60_000 };
      return token as string;
    } catch (err) {
      cachedToken = null; // Force retry next call
      wrapAxiosError(err, "Auth/RequestToken");
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

// ─── IPN registration (cached per process — registered once per deployment) ───
// Pass PESAPAL_IPN_ID as an env var to skip registration entirely.
let cachedIpnId: string | null = process.env.PESAPAL_IPN_ID ?? null;

export async function getOrRegisterIPN(): Promise<string> {
  if (cachedIpnId) return cachedIpnId;

  const token = await getAuthToken();

  try {
    const res = await axios.post(
      `${PESAPAL_BASE}/api/URLSetup/RegisterIPN`,
      {
        url:                   process.env.PESAPAL_IPN_URL ?? `${process.env.NEXTAUTH_URL}/api/tiers/callback`,
        ipn_notification_type: "POST",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:         "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    cachedIpnId = res.data.ipn_id as string;
    // Log so the value can be copied into PESAPAL_IPN_ID for next deployment
    console.info(`[Pesapal] Registered new IPN ID: ${cachedIpnId}`);
    return cachedIpnId!;
  } catch (err) {
    wrapAxiosError(err, "URLSetup/RegisterIPN");
  }
}

// ─── Submit order ─────────────────────────────────────────────────────────────
export interface SubmitOrderParams {
  merchantReference:  string;
  amount:             number;
  currency?:          string; // defaults to KES
  description:        string;
  callbackUrl:        string;
  ipnId:              string;
  billingEmail:       string;
  billingPhone?:      string;
  billingFirstName:   string;
  billingLastName:    string;
  cancellationUrl?:   string;
}

export interface SubmitOrderResult {
  order_tracking_id: string;
  redirect_url:      string;
  status:            string;
  error?:            { message: string };
}

export async function submitOrder(params: SubmitOrderParams): Promise<SubmitOrderResult> {
  const token = await getAuthToken();

  const payload = {
    id:              params.merchantReference,
    currency:        params.currency ?? "KES",
    amount:          params.amount,
    description:     params.description,
    callback_url:    params.callbackUrl,
    cancellation_url: params.cancellationUrl ?? params.callbackUrl,
    notification_id: params.ipnId,
    billing_address: {
      email_address: params.billingEmail,
      phone_number:  params.billingPhone ?? "",
      first_name:    params.billingFirstName,
      last_name:     params.billingLastName,
    },
  };

  try {
    const res = await axios.post(
      `${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:         "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data.error) {
      throw new PesapalError(
        res.data.error.message ?? "SubmitOrderRequest returned an error",
        "SUBMIT_ERROR"
      );
    }

    return res.data as SubmitOrderResult;
  } catch (err) {
    if (err instanceof PesapalError) throw err;
    wrapAxiosError(err, "Transactions/SubmitOrderRequest");
  }
}

// ─── Transaction status ───────────────────────────────────────────────────────
export type PesapalStatusCode = 1 | 2 | 3 | 4;

export const PESAPAL_STATUS: Record<PesapalStatusCode, string> = {
  1: "INVALID",    // Not yet processed / not found
  2: "COMPLETED",  // Payment received
  3: "FAILED",     // Payment declined / expired
  4: "REVERSED",   // Refunded / chargeback
};

export interface TransactionStatus {
  payment_method:               string;
  amount:                       number;
  created_date:                 string;
  confirmation_code:            string;
  payment_status_description:   string;
  description:                  string;
  message:                      string;
  payment_account:              string;
  order_tracking_id:            string;
  merchant_reference:           string;
  /** 1=Invalid 2=Completed 3=Failed 4=Reversed */
  status_code:                  PesapalStatusCode;
  error?:                       { message: string };
}

export async function getTransactionStatus(orderTrackingId: string): Promise<TransactionStatus> {
  const token = await getAuthToken();

  try {
    const res = await axios.get(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:         "application/json",
        },
      }
    );

    if (res.data.error) {
      throw new PesapalError(
        res.data.error.message ?? "GetTransactionStatus returned an error",
        "STATUS_ERROR"
      );
    }

    return res.data as TransactionStatus;
  } catch (err) {
    if (err instanceof PesapalError) throw err;
    wrapAxiosError(err, "Transactions/GetTransactionStatus");
  }
}

// ─── Get registered IPNs (useful for debugging / admin tools) ─────────────────
export async function getRegisteredIPNs() {
  const token = await getAuthToken();
  try {
    const res = await axios.get(`${PESAPAL_BASE}/api/URLSetup/GetIpnList`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    return res.data as Array<{ url: string; ipn_id: string; ipn_status: string; created_date: string }>;
  } catch (err) {
    wrapAxiosError(err, "URLSetup/GetIpnList");
  }
}

// ─── Normalize Pesapal status_code → app SubscriptionStatus ──────────────────
import type { SubscriptionStatus } from "@prisma/client";

export function pesapalCodeToSubscriptionStatus(code: PesapalStatusCode): SubscriptionStatus | null {
  switch (code) {
    case 2: return "ACTIVE";
    case 3: return "FAILED";
    case 4: return "CANCELLED";
    case 1:
    default: return null; // Still pending — don't change subscription status
  }
}
