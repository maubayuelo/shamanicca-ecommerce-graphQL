import { useState, useEffect } from 'react';
import type { AcfBanner, BannersResult } from '../types/banners';

// ACF image fields return either a URL string or an object { url: '...' }
function resolveImageUrl(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return (obj.url ?? obj.URL ?? obj.src ?? '') as string;
  }
  return '';
}

// ACF boolean fields can return true/false, 1/0, or "1"/"" strings.
function resolveBool(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') return raw === '1' || raw.toLowerCase() === 'true';
  return false;
}

function normalizeBanner(raw: Record<string, unknown>): AcfBanner {
  return {
    banner_type: (raw.banner_type === 'affiliate' ? 'affiliate' : 'shamanicca') as AcfBanner['banner_type'],
    banner_image: resolveImageUrl(raw.banner_image),
    banner_headline: String(raw.banner_headline ?? ''),
    banner_subtext: String(raw.banner_subtext ?? ''),
    banner_cta_label: String(raw.banner_cta_label ?? ''),
    banner_cta_url: String(raw.banner_cta_url ?? '#'),
    banner_new_tab: resolveBool(raw.banner_new_tab),
    banner_enabled: resolveBool(raw.banner_enabled),
  };
}

function isEnabled(b: AcfBanner): boolean {
  // banner_enabled can be stale from WP cache; use image + headline presence as the signal.
  // To hide a banner, clear its headline or image in WP Admin.
  return !!b.banner_image && !!b.banner_headline;
}

async function fetchAcf(localUrl: string): Promise<Record<string, unknown>> {
  const res = await fetch(localUrl);
  if (!res.ok) throw new Error(`ACF ${res.status}`);
  const json = await res.json();
  // ACF REST v3 wraps fields under `.acf`; v2 returns them at root
  return (json?.acf ?? json ?? {}) as Record<string, unknown>;
}

function extractBanner(data: Record<string, unknown>): AcfBanner | null {
  if (!data || !data.banner_headline && !data.banner_image) return null;
  const banner = normalizeBanner(data);
  return isEnabled(banner) ? banner : null;
}

export function useBanners(categoryId?: number | null): BannersResult {
  const [banner, setBanner] = useState<AcfBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let result: AcfBanner | null = null;

      if (categoryId) {
        try {
          const data = await fetchAcf(`/api/acf-banners?type=category&id=${categoryId}`);
          result = extractBanner(data);
        } catch (err) {
          console.warn('[useBanners] category fetch failed:', err);
        }
      }

      // Fall back to global site settings if no category banner found
      if (!result) {
        try {
          const data = await fetchAcf(`/api/acf-banners?type=options`);
          result = extractBanner(data);
        } catch (err) {
          console.warn('[useBanners] global fallback fetch failed:', err);
        }
      }

      if (!cancelled) {
        setBanner(result);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [categoryId]);

  return { banner, loading };
}
