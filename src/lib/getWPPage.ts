const WP_BASE = (
  process.env.NEXT_PUBLIC_WP_BASE_URL || 'https://master.shamanicca.com'
).replace(/\/$/, '');

export type WPPage = {
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
};

export async function getWPPage(slug: string): Promise<WPPage | null> {
  try {
    const res = await fetch(
      `${WP_BASE}/wp-json/wp/v2/pages?slug=${slug}&_fields=slug,title,content,excerpt`,
    );
    if (!res.ok) return null;
    const pages: WPPage[] = await res.json();
    return pages[0] ?? null;
  } catch {
    return null;
  }
}
