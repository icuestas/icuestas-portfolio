import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'Invalid request.' }, 400);
  }

  const { name, email, subject, message, _hp, recaptcha_token } = body as Record<string, string>;

  // Honeypot: bots fill hidden fields, humans leave them empty
  if (_hp) {
    return respond({ success: true }, 200); // silently discard
  }

  // Verify reCAPTCHA token
  if (recaptcha_token) {
    const recaptchaScore = await verifyRecaptcha(recaptcha_token);
    if (recaptchaScore < 0.5) {
      // Score too low (likely spam), silently discard like honeypot
      return respond({ success: true }, 200);
    }
  }

  // Validate required fields
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return respond({ error: 'All fields are required.' }, 400);
  }

  // Field length limits
  if (name.length > 100 || subject.length > 200 || message.length > 5000) {
    return respond({ error: 'One or more fields exceed the maximum length.' }, 400);
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond({ error: 'Invalid email address.' }, 400);
  }

  const smtpUser = import.meta.env.SMTP_USER;
  const smtpPass = import.meta.env.SMTP_PASS;
  const smtpTo   = import.meta.env.SMTP_TO || smtpUser;

  if (!smtpUser || !smtpPass) {
    console.error('[contact] SMTP credentials are not configured');
    return respond({ error: 'Server configuration error. Please try again later.' }, 500);
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.sendMail({
      from:    `"Portfolio Contact" <${smtpUser}>`,
      to:      smtpTo,
      replyTo: `"${sanitize(name)}" <${email}>`,
      subject: `[Portfolio] ${sanitize(subject)}`,
      text: [
        'New message from your portfolio contact form',
        '',
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Subject: ${subject}`,
        '',
        message,
      ].join('\n'),
      html: buildEmailHtml({ name, email, subject, message }),
    });

    return respond({ success: true }, 200);
  } catch (err) {
    console.error('[contact] nodemailer error:', err);
    return respond({ error: 'Failed to send your message. Please try again later.' }, 500);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function respond(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmailHtml(f: { name: string; email: string; subject: string; message: string }) {
  const s = {
    name:    sanitize(f.name),
    subject: sanitize(f.subject),
    message: sanitize(f.message),
  };
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#12111a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">New Contact Message</h1>
      <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">From your portfolio contact form</p>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;width:72px;vertical-align:top;">Name</td>
          <td style="padding:8px 0;color:#fff;font-weight:600;">${s.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${f.email}" style="color:#a78bfa;text-decoration:none;">${f.email}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Subject</td>
          <td style="padding:8px 0;color:#fff;font-weight:600;">${s.subject}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:20px 0;"/>
      <p style="margin:0 0 10px;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;">Message</p>
      <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.75;white-space:pre-wrap;">${s.message}</p>
    </div>
    <div style="padding:20px 32px 28px;text-align:center;">
      <a href="mailto:${f.email}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Reply to ${s.name}
      </a>
    </div>
  </div>
</body>
</html>`;
}

async function verifyRecaptcha(token: string): Promise<number> {
  const secretKey = import.meta.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn('[contact] RECAPTCHA_SECRET_KEY not configured, skipping verification');
    return 1.0; // Allow if not configured
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });
    const data = await response.json() as { success: boolean; score: number };
    return data.success ? data.score : 0;
  } catch (err) {
    console.error('[contact] reCAPTCHA verification error:', err);
    return 0; // Treat as spam on error
  }
}
