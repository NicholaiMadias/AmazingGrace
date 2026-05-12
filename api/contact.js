/**
 * Contact form handler — /api/contact
 *
 * Accepts POST with JSON body: { name, phone, email?, property?, message? }
 * Sends mail to admin@amazinggracehl.org with BCC to owner/backup addresses.
 *
 * Provider priority:
 *   1. SendGrid  (SENDGRID_API_KEY)
 *   2. Mailgun   (MAILGUN_API_KEY + MAILGUN_DOMAIN)
 *   3. Gmail     (GMAIL_USER + GMAIL_APP_PASSWORD)  — default fallback
 */

import nodemailer from "nodemailer";

const TO_ADDRESS  = "admin@amazinggracehl.org";
const BCC_ADDRESSES = ["nicholaimadias@gmail.com", "gulfnexus@gmail.com"];

function buildTransport() {
  if (process.env.SENDGRID_API_KEY) {
    console.log("[contact] using SendGrid transport");
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    console.log("[contact] using Mailgun transport");
    return nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
        pass: process.env.MAILGUN_API_KEY,
      },
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log("[contact] using Gmail transport");
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  throw new Error(
    "No email transport configured. Set SENDGRID_API_KEY, MAILGUN_API_KEY/MAILGUN_DOMAIN, or GMAIL_USER/GMAIL_APP_PASSWORD."
  );
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(fields) {
  const rows = Object.entries(fields)
    .map(([k, v]) => `<tr><th align="left" style="padding:6px 12px;background:#f3f4f6">${escapeHtml(k)}</th><td style="padding:6px 12px">${escapeHtml(v || '—')}</td></tr>`)
    .join("");
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e3a8a">New Room Application — Amazing Grace Home Living</h2>
      <table style="border-collapse:collapse;width:100%">${rows}</table>
      <p style="margin-top:16px;color:#6b7280;font-size:0.875rem">
        Sent via amazinggracehl.org contact form
      </p>
    </div>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, phone, email = "", property = "", message = "" } = req.body || {};

  if (!name || !phone) {
    res.status(400).json({ error: "name and phone are required" });
    return;
  }

  const fields = {
    Name: name,
    Phone: phone,
    Email: email,
    Property: property,
    Message: message,
  };

  try {
    const transport = buildTransport();
    const info = await transport.sendMail({
      from: `"Amazing Grace Contact" <${TO_ADDRESS}>`,
      to: TO_ADDRESS,
      bcc: BCC_ADDRESSES,
      replyTo: email || TO_ADDRESS,
      subject: `New Room Application from ${name}`,
      html: buildHtml(fields),
      text: Object.entries(fields).map(([k, v]) => `${k}: ${v || "—"}`).join("\n"),
    });

    console.log("[contact] message sent:", info.messageId);
    res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("[contact] send failed:", err.message);
    res.status(500).json({ error: "Failed to send email. Please try calling or texting us directly." });
  }
}
