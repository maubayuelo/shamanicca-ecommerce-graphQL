import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type BannerData = {
  banner_text: string;
  banner_cta_label: string;
  banner_cta_url: string;
  banner_enabled: boolean;
};

const WP_BASE = (process.env.NEXT_PUBLIC_WP_BASE_URL || '').replace(/\/$/, '');

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    if (!WP_BASE) return;
    fetch(`${WP_BASE}/wp-json/acf/v3/options/options`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const group: BannerData | undefined = data?.acf?.top_novelties_banner;
        if (group?.banner_enabled) setBanner(group);
      })
      .catch(() => null);
  }, []);

  if (!banner) return null;

  return (
    <div className="announcement-banner">
      <span className="announcement-banner__text">{banner.banner_text}</span>
      {banner.banner_cta_label && banner.banner_cta_url && (
        <Link href={banner.banner_cta_url} className="announcement-banner__cta">
          {banner.banner_cta_label}
        </Link>
      )}
    </div>
  );
}
