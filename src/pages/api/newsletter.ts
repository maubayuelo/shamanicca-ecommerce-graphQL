import type { NextApiRequest, NextApiResponse } from 'next';

const FAILURE_MESSAGE = 'Could not send a confirmation email. Please try again later.';

function positiveId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body: unknown = req.body;
  const email = body && typeof body === 'object' && 'email' in body && typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = positiveId(process.env.BREVO_LIST_ID);
  const templateId = positiveId(process.env.BREVO_DOI_TEMPLATE_ID);
  const confirmationUrl =
    process.env.BREVO_DOI_REDIRECT_URL ||
    "https://shamanicca.com/newsletter?confirmed=1";


  if (!apiKey || !listId || !templateId) {
    console.error('[newsletter] Missing or invalid Brevo configuration');
    return res.status(503).json({ error: FAILURE_MESSAGE });
  }

  try {
    const brevo = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        includeListIds: [listId],
        templateId,
        redirectionUrl: confirmationUrl,
      }),
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });

    // DOI returns 201 without a required response body; it does not confirm membership.
    if (brevo.status !== 201) {
      console.error('[newsletter] Brevo DOI request rejected:', brevo.status);
      return res.status(502).json({ error: FAILURE_MESSAGE });
    }

    return res.status(200).json({ ok: true });
  } catch {
    console.error('[newsletter] Brevo DOI request failed');
    return res.status(502).json({ error: FAILURE_MESSAGE });
  }
}
