import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type HeroData = {
  hero_subtitle?: string;
  hero_title?: string;
  hero_body_text?: string;
  cta_1_label?: string;
  cta_1_url?: string;
  cta_2_label?: string;
  cta_2_url?: string;
  background_image?: string;
  show_overlay?: boolean;
  overlay_opacity?: number;
  hero_enabled?: boolean;
};

const WP_BASE = (process.env.NEXT_PUBLIC_WP_BASE_URL || '').replace(/\/$/, '');
// Slug of the WordPress page that holds the Home Page Banners field group.
const HOME_SLUG = process.env.NEXT_PUBLIC_WP_HOME_SLUG || 'home';

export default function Hero() {
  const [data, setData] = useState<HeroData | null>(null);

  useEffect(() => {
    if (!WP_BASE) return;
    // Field group "Home Page Banners" is attached to the Home page (not Options).
    // Fetch the page by slug via the standard WP REST API — ACF fields are
    // included in the response when ACF to REST API plugin is active.
    fetch(`${WP_BASE}/wp-json/wp/v2/pages?slug=${HOME_SLUG}&_fields=acf`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const hero: HeroData | undefined = Array.isArray(json) ? json[0]?.acf?.hero : undefined;
        if (hero && hero.hero_enabled !== false) setData(hero);
      })
      .catch(() => null);
  }, []);

  if (!data) return null;

  const overlayStyle: React.CSSProperties =
    data.show_overlay && data.overlay_opacity != null
      ? { background: `rgba(0,0,0,${data.overlay_opacity})` }
      : { background: 'transparent' };

  return (
    <section className="hero">
      <div className="layer" style={overlayStyle} />

      <div className="main">
        {data.hero_subtitle && (
          <h1 className="type-2xl m-0 type-bold">{data.hero_subtitle}</h1>
        )}
        {data.hero_title && (
          <p className="type-4xl mt-0 mb-md-responsive type-extrabold">{data.hero_title}</p>
        )}
        {data.hero_body_text && (
          <p className="hero__body type-lg">{data.hero_body_text}</p>
        )}

        {(data.cta_1_label || data.cta_2_label) && (
          <div className="hero__ctas">
            {data.cta_1_label && data.cta_1_url && (
              <Link href={data.cta_1_url} className="btn btn-white btn-medium">
                {data.cta_1_label}
              </Link>
            )}
            {data.cta_2_label && data.cta_2_url && (
              <Link href={data.cta_2_url} className="btn btn-white btn-medium">
                {data.cta_2_label}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="bg-image">
        {data.background_image ? (
          <Image
            src={data.background_image}
            alt={data.hero_title || 'Shamanicca hero'}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <Image
            src="/images/hero-image.png"
            alt="Shamanicca Collection"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        )}
      </div>
    </section>
  );
}
