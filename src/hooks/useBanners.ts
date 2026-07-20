import { useState, useEffect } from 'react';
import type { AcfBanner, BannersResult } from '../types/banners';
import client from '../lib/graphql/apolloClient';
import { GET_CATEGORY_BANNER, GET_SITE_SETTINGS_BANNER } from '../lib/graphql/queries';

type GqlMediaSize = { name: string; sourceUrl: string };

type GqlAffiliatedBanner = {
  bannerType: string[] | null;
  bannerHeadline: string | null;
  bannerSubtext: string | null;
  bannerCtaLabel: string | null;
  bannerCtaUrl: string | null;
  openInNewTab: boolean | null;
  bannerEnabled: boolean | null;
  bannerImage: {
    node: {
      sourceUrl: string;
      altText: string;
      mediaDetails?: { sizes?: GqlMediaSize[] } | null;
    } | null;
  } | null;
} | null;

function pickSize(sizes: GqlMediaSize[] | undefined, name: string): string | null {
  return sizes?.find((s) => s.name === name)?.sourceUrl ?? null;
}

function normalizeBanner(raw: GqlAffiliatedBanner): AcfBanner | null {
  if (!raw) return null;
  const sizes = raw.bannerImage?.node?.mediaDetails?.sizes ?? undefined;
  return {
    banner_type: raw.bannerType?.includes('affiliate') ? 'affiliate' : 'shamanicca',
    banner_image: raw.bannerImage?.node?.sourceUrl ?? '',
    banner_image_medium: pickSize(sizes, 'medium'),
    banner_image_large: pickSize(sizes, 'large') ?? pickSize(sizes, 'medium_large'),
    banner_headline: raw.bannerHeadline ?? '',
    banner_subtext: raw.bannerSubtext ?? '',
    banner_cta_label: raw.bannerCtaLabel ?? '',
    banner_cta_url: raw.bannerCtaUrl ?? '#',
    banner_new_tab: !!raw.openInNewTab,
    banner_enabled: !!raw.bannerEnabled,
  };
}

function isEnabled(b: AcfBanner): boolean {
  // banner_enabled can be stale from WP cache; use image + headline presence as the signal.
  // To hide a banner, clear its headline or image in WP Admin.
  return !!b.banner_image && !!b.banner_headline;
}

function extractBanner(raw: GqlAffiliatedBanner): AcfBanner | null {
  const banner = normalizeBanner(raw);
  if (!banner) return null;
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
          const { data } = await client.query<{ category: { affiliatedBanner: GqlAffiliatedBanner } | null }>({
            query: GET_CATEGORY_BANNER,
            variables: { id: categoryId },
            fetchPolicy: 'no-cache',
          });
          result = extractBanner(data.category?.affiliatedBanner ?? null);
        } catch (err) {
          console.warn('[useBanners] category fetch failed:', err);
        }
      }

      // Fall back to global site settings if no category banner found
      if (!result) {
        try {
          const { data } = await client.query<{ page: { affiliatedBanner: GqlAffiliatedBanner } | null }>({
            query: GET_SITE_SETTINGS_BANNER,
            fetchPolicy: 'no-cache',
          });
          result = extractBanner(data.page?.affiliatedBanner ?? null);
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
