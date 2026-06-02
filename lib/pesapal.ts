// lib/pesapal.ts
import axios from "axios";

const PESAPAL_BASE =
  process.env.PESAPAL_ENV === "live"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await axios.post(
    `${PESAPAL_BASE}/api/Auth/RequestToken`,
    {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    },
    { headers: { Accept: "application/json", "Content-Type": "application/json" } }
  );

  const { token, expiryDate } = res.data;
  cachedToken = { token, expiresAt: new Date(expiryDate).getTime() - 60_000 };
  return token;
}

export async function registerIPN(): Promise<string> {
  const token = await getAuthToken();
  const res = await axios.post(
    `${PESAPAL_BASE}/api/URLSetup/RegisterIPN`,
    {
      url: process.env.PESAPAL_CALLBACK_URL,
      ipn_notification_type: "POST",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  return res.data.ipn_id;
}

export interface SubmitOrderParams {
  merchantReference: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  ipnId: string;
  billingEmail: string;
  billingPhone?: string;
  billingFirstName: string;
  billingLastName: string;
}

export async function submitOrder(params: SubmitOrderParams) {
  const token = await getAuthToken();

  const payload = {
    id: params.merchantReference,
    currency: params.currency,
    amount: params.amount,
    description: params.description,
    callback_url: params.callbackUrl,
    notification_id: params.ipnId,
    billing_address: {
      email_address: params.billingEmail,
      phone_number: params.billingPhone ?? "",
      first_name: params.billingFirstName,
      last_name: params.billingLastName,
    },
  };

  const res = await axios.post(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  return res.data as { order_tracking_id: string; redirect_url: string; status: string };
}

export async function getTransactionStatus(orderTrackingId: string) {
  const token = await getAuthToken();
  const res = await axios.get(
    `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return res.data as {
    payment_method: string;
    amount: number;
    created_date: string;
    confirmation_code: string;
    payment_status_description: string; // "Completed" | "Failed" | "Pending"
    description: string;
    message: string;
    payment_account: string;
    order_tracking_id: string;
    merchant_reference: string;
    status_code: number; // 1=Invalid, 2=Completed, 3=Failed, 4=Reversed
  };
}
