import { describe, expect, it } from 'vitest';
import { mapAnnouncement } from './announcement';

describe('mapAnnouncement', () => {
  it('maps an enabled banner to the API response shape', () => {
    expect(mapAnnouncement({
      siteSettings: {
        topNoveltiesBanner: {
          bannerText: 'New drops & offers →',
          bannerCtaLabel: 'Join the list',
          bannerCtaUrl: 'https://shamanicca.com/newsletter',
          bannerEnabled: true,
        },
      },
    })).toEqual({
      banner_text: 'New drops & offers →',
      banner_cta_label: 'Join the list',
      banner_cta_url: 'https://shamanicca.com/newsletter',
      banner_enabled: true,
    });
  });

  it('rejects disabled banners', () => {
    expect(mapAnnouncement({
      siteSettings: { topNoveltiesBanner: { bannerText: 'Hidden', bannerEnabled: false } },
    })).toBeNull();
  });

  it('requires an explicitly true enabled flag and non-empty text', () => {
    expect(mapAnnouncement({
      siteSettings: { topNoveltiesBanner: { bannerText: 'Missing flag' } },
    })).toBeNull();
    expect(mapAnnouncement({
      siteSettings: { topNoveltiesBanner: { bannerText: '   ', bannerEnabled: true } },
    })).toBeNull();
  });

  it('maps missing optional CTA fields to empty strings', () => {
    expect(mapAnnouncement({
      siteSettings: { topNoveltiesBanner: { bannerText: 'Text', bannerEnabled: true } },
    })).toEqual({
      banner_text: 'Text',
      banner_cta_label: '',
      banner_cta_url: '',
      banner_enabled: true,
    });
  });

  it('returns null for a missing page or settings group', () => {
    expect(mapAnnouncement(null)).toBeNull();
    expect(mapAnnouncement({ siteSettings: null })).toBeNull();
    expect(mapAnnouncement({ siteSettings: { topNoveltiesBanner: null } })).toBeNull();
  });
});
