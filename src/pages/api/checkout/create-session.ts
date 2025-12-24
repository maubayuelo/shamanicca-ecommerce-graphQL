import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-11-20' }) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!stripe) {
      return res.status(200).json({ url: null });
    }

    const { items } = req.body as {
      items: Array<{ name: string; price: number; qty: number; image?: string; slug?: string; options?: { size?: string } }>
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    const origin = (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'])
      ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map((i) => ({
        quantity: i.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(i.price * 100),
          product_data: {
            name: i.name,
            images: i.image ? [i.image] : undefined,
            metadata: {
              slug: i.slug || '',
              size: i.options?.size || '',
            },
          },
        },
      })),
      success_url: `${origin}/cart?status=success`,
      cancel_url: `${origin}/cart?status=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error('Stripe error', e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
