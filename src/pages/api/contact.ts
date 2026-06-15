/**
 * api/contact.ts — Contact form API endpoint
 *
 * Route: POST /api/contact
 *
 * This is a Next.js API Route — a serverless function that runs on the server.
 * It processes the contact form submission and sends an email via Resend.
 *
 * WHY A SERVER-SIDE API ROUTE?
 * The Resend API key is a secret. If we called Resend directly from the browser,
 * the API key would be visible in the browser's network tab. By routing through
 * this server-side function, the key stays private on the server.
 *
 * SECURITY MEASURES:
 *
 * 1. Method guard: only POST requests are allowed (GET would return 405)
 *
 * 2. Honeypot anti-spam: the contact form has a hidden "website" field that
 *    normal users never fill in. Bots that auto-fill all fields will trigger
 *    `if (website) return 200` — they get a fake success (so they don't retry)
 *    but no email is sent.
 *
 * 3. Input validation:
 *    - All fields required (name, email, subject, message)
 *    - Email format checked with a regex
 *    - Subject must be one of the approved values (prevents injection)
 *
 * 4. Graceful degradation: if RESEND_API_KEY is not set, the handler
 *    returns success without sending — useful for local development.
 *
 * EMAIL:
 * Sent via Resend (https://resend.com) with a formatted HTML template.
 * The `replyTo` is set to the sender's email so the team can reply directly.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const VALID_SUBJECTS = [
  'Order Support',
  'Returns & Exchanges',
  'Sizing Help',
  'Wholesale & Collaboration',
  'Press & Media',
  'Other',
];

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, subject, message, website } = req.body ?? {};

  // Honeypot: bots fill hidden fields, humans don't
  if (website) return res.status(200).json({ ok: true });

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (!VALID_SUBJECTS.includes(subject)) {
    return res.status(400).json({ error: 'Invalid subject.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[contact] RESEND_API_KEY not set — skipping send');
    return res.status(200).json({ ok: true });
  }

  const fromAddress = process.env.RESEND_FROM || 'Shamanicca Contact <onboarding@resend.dev>';
  const toAddress = process.env.CONTACT_EMAIL || 'maubayuelo@gmail.com';

  try {
    await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      replyTo: email,
      subject: `[${subject}] Message from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 24px;font-size:20px;color:#000">[${subject}]</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:100px">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee">
                <a href="mailto:${email}" style="color:#675dff">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Subject</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee">${subject}</td>
            </tr>
          </table>
          <div style="background:#f8f8f8;border-radius:8px;padding:20px;white-space:pre-wrap;line-height:1.6">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top:24px;font-size:12px;color:#aaa">
            Sent from shamanicca.com/contact
          </p>
        </div>
      `,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] Resend error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
