const PRINTFUL_API_BASE = 'https://api.printful.com';

export type PrintfulProduct = {
  id: number;
  name: string;
  image?: string;
};

const getApiKey = () => process.env.PRINTFUL_API_KEY || '';

async function fetchPrintful<T>(path: string): Promise<T> {
  const key = getApiKey();
  const resp = await fetch(`${PRINTFUL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });
  if (!resp.ok) throw new Error(`Printful error: ${resp.status}`);
  return resp.json() as Promise<T>;
}

export async function listProducts() {
  // Printful: GET /store/products
  const data = await fetchPrintful<{ result: Array<{ id: number; name: string; thumbnail_url?: string }> }>(
    '/store/products'
  );
  return data.result.map((p) => ({ id: p.id, name: p.name, image: p.thumbnail_url }));
}
