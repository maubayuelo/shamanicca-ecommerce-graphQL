export type AcfBanner = {
  banner_type: 'shamanicca' | 'affiliate';
  banner_image: string;
  banner_image_medium?: string | null;
  banner_image_large?: string | null;
  banner_headline: string;
  banner_subtext: string;
  banner_cta_label: string;
  banner_cta_url: string;
  banner_new_tab: boolean;
  banner_enabled: boolean;
};

export type BannersResult = {
  banner: AcfBanner | null;
  loading: boolean;
};
