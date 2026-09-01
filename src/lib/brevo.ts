interface BrevoRecipient {
  email: string;
  name?: string;
}

interface BrevoEmailInput {
  to: BrevoRecipient;
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
}

const BREVO_API_URL = 'https://api.brevo.com/v3';

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail = process.env.BREVO_FROM_EMAIL?.trim();
  if (!apiKey || !fromEmail) return null;
  return {
    apiKey,
    fromEmail,
    fromName: process.env.BREVO_FROM_NAME?.trim() || 'USH BY USHUAIA',
    replyTo: process.env.BREVO_REPLY_TO_EMAIL?.trim() || fromEmail,
    marketingListId: Number(process.env.BREVO_MARKETING_LIST_ID || 0) || null,
  };
}

export function isBrevoConfigured() {
  return !!getBrevoConfig();
}

async function brevoFetch(path: string, init: RequestInit) {
  const config = getBrevoConfig();
  if (!config) return { configured: false, response: null as Response | null };

  const response = await fetch(`${BREVO_API_URL}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': config.apiKey,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  return { configured: true, response };
}

export async function upsertBrevoContact(input: {
  email: string;
  name?: string;
  marketingOptIn: boolean;
}) {
  const config = getBrevoConfig();
  if (!config) return { configured: false, success: false };

  const normalizedEmail = input.email.trim().toLowerCase();
  const attributes: Record<string, string | boolean> = {
    FIRSTNAME: (input.name || 'Cliente').trim().slice(0, 80),
    MARKETING_OPT_IN: input.marketingOptIn,
  };
  const body: Record<string, unknown> = {
    email: normalizedEmail,
    attributes,
    updateEnabled: true,
  };
  if (config.marketingListId && input.marketingOptIn) body.listIds = [config.marketingListId];

  const { configured, response } = await brevoFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!configured || !response) return { configured: false, success: false };
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.warn('Brevo contact upsert failed:', response.status, detail.slice(0, 300));
  }
  return { configured: true, success: response.ok };
}

export async function sendBrevoEmail(input: BrevoEmailInput) {
  const config = getBrevoConfig();
  if (!config) return { configured: false, success: false };

  const payload = {
    sender: { email: config.fromEmail, name: config.fromName },
    replyTo: { email: config.replyTo, name: config.fromName },
    to: [input.to],
    subject: input.subject,
    htmlContent: input.htmlContent,
    textContent: input.textContent,
    tags: input.tags,
  };
  const { configured, response } = await brevoFetch('/smtp/email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!configured || !response) return { configured: false, success: false };
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.warn('Brevo email send failed:', response.status, detail.slice(0, 300));
  }
  return { configured: true, success: response.ok };
}

