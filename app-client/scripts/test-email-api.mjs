import assert from "node:assert/strict";

process.env.BREVO_API_KEY = "xkeysib-test-key";
process.env.BREVO_SENDER_EMAIL = "contact.dermacareskin@gmail.com";
process.env.BREVO_SENDER_NAME = "DermaCare";
process.env.EMAIL_TOKEN_SECRET = "test-only-secret";

const providerRequests = [];
let emailSequence = 0;
globalThis.fetch = async (url, options = {}) => {
  providerRequests.push({ url: String(url), options });
  if (options.method === "DELETE") return new Response(null, { status: 204 });
  emailSequence += 1;
  return new Response(JSON.stringify({ messageId: `<test-${emailSequence}@relay.brevo.test>` }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};

const { default: handler } = await import("../api/email-reminders.js");

function invoke(method, body = null) {
  const request = {
    method,
    body,
    headers: {
      origin: "https://dermacare.example",
      host: "dermacare.example",
      "x-forwarded-for": "203.0.113.12",
    },
    socket: {},
  };
  const output = { statusCode: 200, headers: {}, body: null };
  const response = {
    setHeader(name, value) { output.headers[name] = value; },
    status(code) { output.statusCode = code; return this; },
    json(value) { output.body = value; return this; },
  };
  return Promise.resolve(handler(request, response)).then(() => output);
}

const status = await invoke("GET");
assert.equal(status.statusCode, 200);
assert.equal(status.body.configured, true);
assert.equal(status.body.provider, "brevo");
assert.equal(status.body.scheduleHours, 72);

const verification = await invoke("POST", {
  action: "request-verification",
  email: "person@example.com",
  website: "",
});
assert.equal(verification.statusCode, 200);
const verificationPayload = JSON.parse(providerRequests[0].options.body);
assert.equal(verificationPayload.sender.email, "contact.dermacareskin@gmail.com");
const tokenMatch = verificationPayload.htmlContent.match(/emailVerification=([^"&]+)/);
assert.ok(tokenMatch, "verification token should be embedded in the email link");
const token = decodeURIComponent(tokenMatch[1]);

const future = new Date(Date.now() + 15 * 60_000);
const time = `${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`;
const scheduled = await invoke("POST", {
  action: "schedule",
  token,
  reminders: [{ name: "Example cream", type: "topical", time }],
  timezoneOffset: new Date().getTimezoneOffset(),
  includeDetails: false,
});
assert.equal(scheduled.statusCode, 200);
assert.equal(scheduled.body.email, "person@example.com");
assert.ok(scheduled.body.ids.length >= 1);
assert.ok(scheduled.body.managementToken);
const scheduledPayload = JSON.parse(providerRequests[1].options.body);
assert.ok(scheduledPayload.scheduledAt);
assert.equal(scheduledPayload.textContent.includes("Example cream"), false, "private mode must omit medication names");

const cancelled = await invoke("POST", {
  action: "cancel",
  token: scheduled.body.managementToken,
  ids: scheduled.body.ids,
});
assert.equal(cancelled.statusCode, 200);
assert.equal(cancelled.body.cancelled, scheduled.body.ids.length);

console.log("Email reminder API checks passed:", {
  verifiedEmail: scheduled.body.email,
  scheduled: scheduled.body.ids.length,
  cancelled: cancelled.body.cancelled,
});
