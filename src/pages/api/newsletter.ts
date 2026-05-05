import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body ?? {};

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const server = process.env.MAILCHIMP_SERVER;

  if (!apiKey || !audienceId || !server) {
    console.warn('[newsletter] Mailchimp env vars not set — skipping');
    return res.status(200).json({ ok: true });
  }

  const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`;

  try {
    const mc = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email.toLowerCase().trim(),
        status_if_new: 'subscribed',
      }),
    });

    if (!mc.ok) {
      const data = await mc.json();
      // Mailchimp 400 "Member Exists" or compliance errors — treat as success
      if (data.title === 'Member Exists' || data.title === 'Forgotten Email Not Subscribed') {
        return res.status(200).json({ ok: true });
      }
      console.error('[newsletter] Mailchimp error:', data);
      return res.status(500).json({ error: 'Could not subscribe. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[newsletter] fetch error:', err);
    return res.status(500).json({ error: 'Could not subscribe. Please try again.' });
  }
}
