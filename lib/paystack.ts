// lib/paystack.ts
// Paystack payment gateway client
// Docs: https://paystack.com/docs/api/

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL   = "https://api.paystack.co";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function paystackFetch<T>(
  method: "GET" | "POST",
  path:   string,
  body?:  Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization:  `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok || !json.status) {
    throw new PaystackError(
      json.message ?? `Paystack error ${res.status}`,
      res.status
    );
  }

  return json.data as T;
}

export class PaystackError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = "PaystackError";
  }
}

// ── Initialize Transaction ────────────────────────────────────────────────────

export interface InitializeParams {
  email:       string;
  amountKES:   number;     // in KES — we convert to kobo (× 100) internally
  reference:   string;     // your unique merchantReference
  callbackUrl: string;
  metadata?:   Record<string, unknown>;
}

export interface InitializeResult {
  authorization_url: string;
  access_code:       string;
  reference:         string;
}

export async function initializeTransaction(
  params: InitializeParams
): Promise<InitializeResult> {
  return paystackFetch<InitializeResult>("POST", "/transaction/initialize", {
    email:        params.email,
    amount:       Math.round(params.amountKES * 100), // KES → kobo
    reference:    params.reference,
    callback_url: params.callbackUrl,
    currency:     "KES",
    metadata:     params.metadata,
  });
}

// ── Verify Transaction ────────────────────────────────────────────────────────

export type PaystackStatus = "success" | "failed" | "abandoned" | "pending";

export interface VerifyResult {
  id:         number;
  reference:  string;
  status:     PaystackStatus;
  amount:     number;   // in kobo
  currency:   string;
  paid_at:    string | null;
  customer:   { email: string; name?: string };
  metadata:   Record<string, unknown> | null;
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  return paystackFetch<VerifyResult>("GET", `/transaction/verify/${reference}`);
}

// ── Webhook Signature Verification ───────────────────────────────────────────

import { createHmac } from "crypto";

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const hash = createHmac("sha512", SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
