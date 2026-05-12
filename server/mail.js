/**
 * Amazing Grace Home Living — Contact / Application Email Handler
 *
 * Receives form submissions from the site and forwards them to the
 * primary inbox while silently BCC-ing both owners.
 *
 * Deploy to Railway (or any Node.js host) and set the environment
 * variables listed below.
 *
 * Required env vars:
 *   SMTP_HOST     — e.g. smtp.gmail.com
 *   SMTP_PORT     — e.g. 587
 *   SMTP_USER     — SMTP login (same as PRIMARY or a relay address)
 *   SMTP_PASS     — SMTP password / app password
 *   ALLOWED_ORIGIN — front-end origin, e.g. https://amazinggracehl.org
 *
 * Optional env vars:
 *   TEST_EMAIL_TOKEN — shared secret for /test-email (required in production)
 *   NODE_ENV         — set to "production" in prod; omit or "development" in dev
 */

import express from "express";
import nodemailer from "nodemailer";
import { rateLimit } from "express-rate-limit";

// ── Startup validation ─────────────────────────────────────────────────────────
function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const SMTP_HOST = requireEnv("SMTP_HOST");
const SMTP_USER = requireEnv("SMTP_USER");
const SMTP_PASS = requireEnv("SMTP_PASS");
const SMTP_PORT_RAW = (process.env.SMTP_PORT ?? "587").trim();
const SMTP_PORT = Number(SMTP_PORT_RAW);
if (!Number.isInteger(SMTP_PORT) || SMTP_PORT <= 0) {
  throw new Error(`Invalid SMTP_PORT: ${SMTP_PORT_RAW}`);
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json());

// ── Recipients ────────────────────────────────────────────────────────────────
const PRIMARY = "admin@amazinggracehl.org";
const CC = ["nicholaimadias@gmail.com", "gulfnexus@gmail.com"];

// ── SMTP transport ────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = process.env.ALLOWED_ORIGIN ?? "https://amazinggracehl.org";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Rate limiting (abuse protection on /contact) ──────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions — please try again in 15 minutes." },
});

// ── HTML entity escaping (prevents XSS in email HTML body) ───────────────────
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── PII-safe email masking for logs ──────────────────────────────────────────
function maskEmail(email) {
  const value = String(email ?? "");
  const atIndex = value.indexOf("@");
  if (atIndex <= 0) return "***";
  return `${value[0]}***${value.slice(atIndex)}`;
}

app.post("/contact", contactLimiter, async (req, res) => {
  const { name, email, phone, property, message } = req.body ?? {};

  console.log("📨 Incoming contact form submission:", {
    email: maskEmail(email),
    property: property || "—",
    timestamp: new Date().toISOString(),
  });

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  const subject = `New Inquiry from ${name}${property ? ` — ${property}` : ""}`;

  const text = [
    `Name:     ${name}`,
    `Email:    ${email}`,
    `Phone:    ${phone || "—"}`,
    `Property: ${property || "—"}`,
    "",
    message || "(no message provided)",
  ].join("\n");

  const html = `
    <table style="font-family:sans-serif;font-size:15px;color:#111;max-width:560px">
      <tr><td><strong>Name</strong></td><td>${esc(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td><strong>Phone</strong></td><td>${esc(phone || "—")}</td></tr>
      <tr><td><strong>Property</strong></td><td>${esc(property || "—")}</td></tr>
    </table>
    ${message ? `<p style="margin-top:1rem;font-family:sans-serif">${esc(message)}</p>` : ""}
  `;

  try {
    await transporter.sendMail({
      from: `"Amazing Grace Home Living" <${SMTP_USER}>`,
      to: PRIMARY,
      bcc: CC,
      replyTo: email,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent successfully");
    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ sendMail error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

// ── Test-email endpoint (smoke-test — requires secret token, dev-only in production) ──
app.get("/test-email", async (req, res) => {
  // Require a secret token to prevent abuse
  const expectedToken = process.env.TEST_EMAIL_TOKEN;
  if (!expectedToken) {
    // No token configured — block the endpoint entirely
    return res.status(403).json({ ok: false, error: "Test endpoint is not enabled." });
  }
  const providedToken = req.headers["x-test-token"];
  if (!providedToken || providedToken !== expectedToken) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }

  const subject = "Amazing Grace — test email";
  const text = "This is a test message from the Amazing Grace Home Living mail server.";
  try {
    await transporter.sendMail({
      from: `"Amazing Grace Home Living" <${SMTP_USER}>`,
      to: PRIMARY,
      subject,
      text,
    });
    console.log("✅ Test email sent");
    return res.json({ ok: true, message: "Test email sent to " + PRIMARY });
  } catch (err) {
    console.error("❌ Test email failed:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: errorMessage });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`mail server listening on :${PORT}`));
