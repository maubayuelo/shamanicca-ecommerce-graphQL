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

  const { name, email, subject, message } = req.body ?? {};

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

  try {
    await resend.emails.send({
      from: 'Shamanicca Contact <noreply@shamanicca.com>',
      to: 'contact@shamanicca.com',
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
