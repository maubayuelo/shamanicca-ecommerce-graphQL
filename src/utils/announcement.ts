import type { SiteSettingsAnnouncement } from '../lib/graphql/types';

export type AnnouncementResponse = {
  banner_text: string;
  banner_cta_label: string;
  banner_cta_url: string;
  banner_enabled: true;
};

type SiteSettingsPage = {
  siteSettings?: {
    topNoveltiesBanner?: SiteSettingsAnnouncement | null;
  } | null;
} | null;

export function mapAnnouncement(page: SiteSettingsPage | null | undefined): AnnouncementResponse | null {
  const banner = page?.siteSettings?.topNoveltiesBanner;
  if (banner?.bannerEnabled !== true || !banner.bannerText?.trim()) return null;

  return {
    banner_text: banner.bannerText,
    banner_cta_label: banner.bannerCtaLabel ?? '',
    banner_cta_url: banner.bannerCtaUrl ?? '',
    banner_enabled: true,
  };
}
