// lib/notifications.ts
// Single helper to create an in-app Notification + send the matching email.
// Every notification event goes through here — one call does both.

import { prisma } from "@/lib/prisma";
import {
  sendPaymentConfirmedEmail,
  sendListingActivatedEmail,
  sendListingExpiringEmail,
  sendListingRejectedEmail,
} from "@/lib/email";

export type NotificationType =
  | "payment_confirmed"
  | "listing_activated"
  | "listing_expiring"
  | "listing_rejected";

// ── Internal: create DB record ────────────────────────────────────────────────
async function createNotification(params: {
  userId:   string;
  type:     NotificationType;
  title:    string;
  message:  string;
  link?:    string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.notification.create({ data: params });
}

// ── 1. Payment confirmed ──────────────────────────────────────────────────────
export async function notifyPaymentConfirmed(params: {
  userId:    string;
  email:     string;
  name:      string;
  tierName:  string;
  amount:    number;
  expiresAt: Date;
}) {
  await Promise.allSettled([
    createNotification({
      userId:  params.userId,
      type:    "payment_confirmed",
      title:   "Payment confirmed",
      message: `Your ${params.tierName} listing plan is now active.`,
      link:    "/dashboard/listing",
      metadata: { tierName: params.tierName, amount: params.amount },
    }),
    sendPaymentConfirmedEmail({
      to:        params.email,
      name:      params.name,
      tierName:  params.tierName,
      amount:    params.amount,
      expiresAt: params.expiresAt,
    }),
  ]);
}

// ── 2. Listing activated ──────────────────────────────────────────────────────
export async function notifyListingActivated(params: {
  userId:   string;
  email:    string;
  name:     string;
  slug:     string;
  tierName: string;
}) {
  await Promise.allSettled([
    createNotification({
      userId:  params.userId,
      type:    "listing_activated",
      title:   "Your listing is live!",
      message: `Your ${params.tierName} profile is now visible to clients across Kenya.`,
      link:    `/model/${params.slug}`,
      metadata: { tierName: params.tierName },
    }),
    sendListingActivatedEmail({
      to:       params.email,
      name:     params.name,
      slug:     params.slug,
      tierName: params.tierName,
    }),
  ]);
}

// ── 3. Listing expiring ───────────────────────────────────────────────────────
export async function notifyListingExpiring(params: {
  userId:    string;
  email:     string;
  name:      string;
  tierName:  string;
  daysLeft:  number;
  expiresAt: Date;
}) {
  await Promise.allSettled([
    createNotification({
      userId:  params.userId,
      type:    "listing_expiring",
      title:   `Listing expiring in ${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""}`,
      message: `Your ${params.tierName} plan expires ${params.daysLeft === 1 ? "tomorrow" : `in ${params.daysLeft} days`}. Renew now to stay visible.`,
      link:    "/dashboard/listing",
      metadata: { daysLeft: params.daysLeft },
    }),
    sendListingExpiringEmail({
      to:        params.email,
      name:      params.name,
      tierName:  params.tierName,
      daysLeft:  params.daysLeft,
      expiresAt: params.expiresAt,
    }),
  ]);
}

// ── 4. Listing rejected / suspended ──────────────────────────────────────────
export async function notifyListingRejected(params: {
  userId:  string;
  email:   string;
  name:    string;
  action:  "SUSPEND" | "BAN" | "PENDING";
  reason?: string;
}) {
  const titles = {
    SUSPEND: "Your listing has been suspended",
    BAN:     "Your account has been banned",
    PENDING: "Your profile is under review",
  };
  const messages = {
    SUSPEND: "Your profile is temporarily hidden from clients. Contact support for more info.",
    BAN:     "Your account has been permanently removed from the platform.",
    PENDING: "Your profile has been returned to pending status for additional review.",
  };

  await Promise.allSettled([
    createNotification({
      userId:   params.userId,
      type:     "listing_rejected",
      title:    titles[params.action],
      message:  params.reason ? `${messages[params.action]} Reason: ${params.reason}` : messages[params.action],
      link:     "/dashboard",
      metadata: { action: params.action, reason: params.reason },
    }),
    sendListingRejectedEmail({
      to:     params.email,
      name:   params.name,
      action: params.action,
      reason: params.reason,
    }),
  ]);
}
