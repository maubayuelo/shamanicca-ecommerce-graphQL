import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type BannerData = {
  banner_text: string;
  banner_cta_label?: string;
  banner_cta_url?: string;
  banner_enabled?: boolean;
};

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    fetch('/api/cms/announcement')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const group: BannerData | undefined = json?.banner;
        if (group?.banner_text && group?.banner_enabled !== false) {
          setBanner(group);
        }
      })
      .catch(() => null);
  }, []);

  if (!banner) return null;

  return (
    <div className="announcement-banner bg-black text-white [font-family:var(--font-main)] text-sm font-medium leading-none p-2 text-center flex items-center justify-center gap-1.5 flex-wrap">
      <span className="announcement-banner__text text-white">{banner.banner_text}</span>
      {banner.banner_cta_label && banner.banner_cta_url && (
        <Link href={banner.banner_cta_url} className="announcement-banner__cta text-white font-bold underline underline-offset-2 [&:hover]:opacity-80">
          {banner.banner_cta_label}
        </Link>
      )}
    </div>
  );
}
