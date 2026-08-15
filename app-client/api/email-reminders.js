import crypto from "node:crypto";

export const maxDuration = 60;

const resendEndpoint = "https://api.resend.com";
const warmRateLimits = new Map();

function sendJson(response, status, body) {
  response.setHeader("Cache-Control", "no-store");
  response.status(status).json(body);
}

function configured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function signingSecret() {
  const source = process.env.EMAIL_TOKEN_SECRET || `${process.env.RESEND_API_KEY}|dermacare-email-reminders-v1`;
  return crypto.createHash("sha256").update(source).digest();
}

function encodeToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", signingSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function decodeToken(token, allowedKinds) {
  if (!configured() || typeof token !== "string" || token.length > 4096) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", signingSecret()).update(encoded).digest();
  let received;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!allowedKinds.includes(payload.kind) || !payload.email || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  try {
    return JSON.parse(request.body || "{}");
  } catch {
    return {};
  }
}

function validEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

function rateLimited(request, key, limit, windowMs) {
  const ip = String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = warmRateLimits.get(bucketKey) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < windowMs);
  recent.push(now);
  warmRateLimits.set(bucketKey, recent);
  return recent.length > limit;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

async function resend(path, options = {}, retry = true) {
  const response = await fetch(`${resendEndpoint}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "DermaCare-Reminders/1.0",
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 429 && retry) {
    const retryAfter = Math.min(Number(response.headers.get("retry-after")) || 1, 2);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return resend(path, options, false);
  }
  if (!response.ok) {
    const error = new Error(result?.message || result?.error?.message || "The email provider rejected the request.");
    error.status = response.status;
    throw error;
  }
  return result;
}

function normalizeReminders(items) {
  const grouped = new Map();
  (Array.isArray(items) ? items : []).slice(0, 40).forEach((item) => {
    const time = String(item?.time || "");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
    const existing = grouped.get(time) || { time, medications: [] };
    const name = String(item?.name || "Medication").trim().slice(0, 80);
    const type = item?.type === "oral" ? "oral" : "topical";
    if (existing.medications.length < 8 && !existing.medications.some((medication) => medication.name === name && medication.type === type)) {
      existing.medications.push({ name: name || "Medication", type });
    }
    grouped.set(time, existing);
  });
  return [...grouped.values()].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 6);
}

function scheduledOccurrences(reminders, timezoneOffset, days) {
  const offset = Math.max(-840, Math.min(840, Number(timezoneOffset) || 0));
  const localNow = new Date(Date.now() - offset * 60_000);
  const occurrences = [];
  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const localDate = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate() + dayIndex));
    reminders.forEach((reminder) => {
      const [hours, minutes] = reminder.time.split(":").map(Number);
      const timestamp = Date.UTC(
        localDate.getUTCFullYear(),
        localDate.getUTCMonth(),
        localDate.getUTCDate(),
        hours,
        minutes,
      ) + offset * 60_000;
      if (timestamp > Date.now() + 120_000) occurrences.push({ ...reminder, timestamp });
    });
  }
  return occurrences;
}

function reminderContent(occurrence, includeDetails) {
  const detail = includeDetails
    ? occurrence.medications.map((item) => `${item.name} (${item.type})`).join(", ")
    : "your scheduled medication";
  const safeDetail = escapeHtml(detail);
  return {
    subject: "DermaCare medication reminder",
    text: `It is time for ${detail}. Follow the instructions from your healthcare professional. Open DermaCare to update today's progress.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#193b35"><div style="background:#2d7a6d;color:white;padding:18px 22px;border-radius:16px 16px 0 0"><strong style="font-size:20px">DermaCare reminder</strong></div><div style="border:1px solid #dce9e6;border-top:0;padding:24px;border-radius:0 0 16px 16px"><p style="font-size:17px;margin-top:0">It is time for <strong>${safeDetail}</strong>.</p><p style="line-height:1.6;color:#5d716d">Follow the instructions from your healthcare professional, then open DermaCare to update today's progress.</p><p style="font-size:12px;line-height:1.5;color:#83918d;margin-bottom:0">This is a schedule reminder, not medical advice. Manage or disable email reminders from your DermaCare Profile on the device where you enabled them.</p></div></div>`,
  };
}

async function requestVerification(request, response, body) {
  if (rateLimited(request, "verify", 3, 15 * 60_000)) {
    sendJson(response, 429, { error: "Too many verification emails were requested. Try again in 15 minutes." });
    return;
  }
  if (body.website) {
    sendJson(response, 200, { ok: true });
    return;
  }
  const email = validEmail(body.email);
  if (!email) {
    sendJson(response, 400, { error: "Enter a valid email address." });
    return;
  }
  const token = encodeToken({ kind: "verify", email, nonce: crypto.randomUUID(), exp: Date.now() + 30 * 60_000 });
  const origin = String(request.headers.origin);
  const verificationUrl = `${origin}/profile?emailVerification=${encodeURIComponent(token)}`;
  const from = process.env.REMINDER_FROM || "DermaCare <onboarding@resend.dev>";
  await resend("/emails", {
    method: "POST",
    headers: { "Idempotency-Key": `verify-${crypto.createHash("sha256").update(token).digest("hex").slice(0, 40)}` },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirm DermaCare email reminders",
      text: `Confirm email reminders: ${verificationUrl}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#193b35"><h1 style="font-size:24px">Confirm medication reminders</h1><p style="line-height:1.6">Use the button below to confirm that DermaCare may send schedule reminders to this address.</p><p><a href="${escapeHtml(verificationUrl)}" style="display:inline-block;background:#2d7a6d;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:bold">Confirm email reminders</a></p><p style="font-size:12px;color:#71827e">The link expires in 30 minutes. If you did not request this, ignore the email.</p></div>`,
    }),
  });
  sendJson(response, 200, { ok: true });
}

async function scheduleReminders(request, response, body) {
  if (rateLimited(request, "schedule", 4, 10 * 60_000)) {
    sendJson(response, 429, { error: "Too many schedule changes were requested. Wait a few minutes and retry." });
    return;
  }
  const authorization = decodeToken(body.token, ["verify", "manage"]);
  if (!authorization) {
    sendJson(response, 401, { error: "The email verification link expired or is invalid. Request a new verification email." });
    return;
  }
  const reminders = normalizeReminders(body.reminders);
  if (!reminders.length) {
    sendJson(response, 400, { error: "Add at least one medication time before enabling email reminders." });
    return;
  }
  const days = Math.max(1, Math.min(30, Number(process.env.EMAIL_SCHEDULE_DAYS) || 14));
  const occurrences = scheduledOccurrences(reminders, body.timezoneOffset, days);
  const from = process.env.REMINDER_FROM || "DermaCare <onboarding@resend.dev>";
  const ids = [];
  try {
    for (const occurrence of occurrences) {
      const content = reminderContent(occurrence, Boolean(body.includeDetails));
      const unique = crypto.createHash("sha256")
        .update(`${authorization.nonce || authorization.email}|${occurrence.timestamp}|${occurrence.time}`)
        .digest("hex")
        .slice(0, 48);
      const result = await resend("/emails", {
        method: "POST",
        headers: { "Idempotency-Key": `reminder-${unique}` },
        body: JSON.stringify({
          from,
          to: [authorization.email],
          subject: content.subject,
          text: content.text,
          html: content.html,
          scheduled_at: new Date(occurrence.timestamp).toISOString(),
          tags: [{ name: "type", value: "medication_reminder" }],
        }),
      });
      if (result.id) ids.push(result.id);
      await new Promise((resolve) => setTimeout(resolve, 210));
    }
  } catch (error) {
    for (const id of ids) {
      await resend(`/emails/${id}/cancel`, { method: "POST" }, false).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 210));
    }
    throw error;
  }
  const managementToken = encodeToken({
    kind: "manage",
    email: authorization.email,
    nonce: authorization.nonce || crypto.randomUUID(),
    exp: Date.now() + 45 * 24 * 60 * 60_000,
  });
  const scheduledUntil = occurrences.length ? new Date(Math.max(...occurrences.map((item) => item.timestamp))).toISOString() : null;
  sendJson(response, 200, {
    ok: true,
    email: authorization.email,
    ids,
    managementToken,
    scheduledUntil,
    reminderCount: ids.length,
    dailyTimes: reminders.map((item) => item.time),
  });
}

async function cancelReminders(request, response, body) {
  const authorization = decodeToken(body.token, ["manage"]);
  if (!authorization) {
    sendJson(response, 401, { error: "Reminder management authorization expired. Verify the email again to make changes." });
    return;
  }
  const ids = (Array.isArray(body.ids) ? body.ids : [])
    .filter((id) => /^[0-9a-f-]{36}$/i.test(String(id)))
    .slice(0, 200);
  let cancelled = 0;
  for (const id of ids) {
    try {
      await resend(`/emails/${id}/cancel`, { method: "POST" });
      cancelled += 1;
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 210));
  }
  sendJson(response, 200, { ok: true, cancelled });
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    const days = Math.max(1, Math.min(30, Number(process.env.EMAIL_SCHEDULE_DAYS) || 14));
    sendJson(response, 200, { configured: configured(), scheduleDays: days });
    return;
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  if (!sameOrigin(request)) {
    sendJson(response, 403, { error: "Requests must come from the DermaCare website." });
    return;
  }
  if (!configured()) {
    sendJson(response, 503, { error: "Email reminders are not configured on this deployment yet." });
    return;
  }

  const body = getBody(request);
  try {
    if (body.action === "request-verification") await requestVerification(request, response, body);
    else if (body.action === "schedule") await scheduleReminders(request, response, body);
    else if (body.action === "cancel") await cancelReminders(request, response, body);
    else sendJson(response, 400, { error: "Unknown email reminder action." });
  } catch (error) {
    const publicMessage = error.status === 403
      ? "The sender domain or email provider credentials are not valid. Check the Vercel email settings."
      : error.status === 429
        ? "The email provider rate limit was reached. Wait a minute and retry."
        : error.message || "Email reminders could not be updated.";
    sendJson(response, error.status >= 400 && error.status < 500 ? error.status : 502, { error: publicMessage });
  }
}
