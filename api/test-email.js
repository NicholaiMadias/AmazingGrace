/**
 * Test email endpoint — GET /api/test-email
 *
 * Sends a quick delivery-verification email to admin@amazinggracehl.org.
 * Useful for confirming SMTP credentials are working after deployment.
 *
 * Protect this endpoint behind an auth check or remove it after verification.
 */

import { timingSafeEqual, createHash } from "crypto";
import nodemailer from "nodemailer";

const TO_ADDRESS = "admin@amazinggracehl.org";

function buildTransport() {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
    });
  }
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
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
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  throw new Error("No email transport configured.");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Require a secret token to prevent public abuse.
  // Set TEST_EMAIL_SECRET in the server environment variables (e.g., Railway or GitHub Actions).
  const expectedSecret = process.env.TEST_EMAIL_SECRET;
  if (!expectedSecret) {
    res.status(503).json({ error: "Test endpoint is disabled (TEST_EMAIL_SECRET not configured)." });
    return;
  }
  const providedSecret = req.headers["x-test-email-secret"] || "";
  // Use constant-time comparison to prevent timing attacks.
  const expected = Buffer.from(createHash("sha256").update(expectedSecret).digest("hex"));
  const provided = Buffer.from(createHash("sha256").update(providedSecret).digest("hex"));
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const transport = buildTransport();
    const info = await transport.sendMail({
      from: `"Amazing Grace Test" <${TO_ADDRESS}>`,
      to: TO_ADDRESS,
      subject: "✅ Email delivery test — Amazing Grace Home Living",
      text: "This is a delivery verification test. If you received this, the contact form email is working correctly.",
      html: `<p>✅ <strong>Email delivery confirmed.</strong><br>The Amazing Grace Home Living contact form email is working correctly.</p><p style="color:#6b7280;font-size:0.875rem">Sent: ${new Date().toISOString()}</p>`,
    });

    console.log("[test-email] sent:", info.messageId);
    res.status(200).json({ ok: true, messageId: info.messageId, sent: new Date().toISOString() });
  } catch (err) {
    console.error("[test-email] failed:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}
