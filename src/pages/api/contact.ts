import type { NextApiRequest, NextApiResponse } from 'next';

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body as ContactPayload;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // TODO: wire to nodemailer / SendGrid / Resend using SMTP_* env vars
  console.info('[contact]', { name, email, subject, message: message.slice(0, 100) });

  return res.status(200).json({ ok: true });
}
