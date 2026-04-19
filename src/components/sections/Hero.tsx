import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type AcfImage = string | { url?: string; sizes?: Record<string, string> } | null | undefined;

type HeroData = {
  hero_subtitle?: string;
  hero_title?: string;
  hero_body_text?: string;
  cta_1_label?: string;
  cta_1_url?: string;
  cta_2_label?: string;
  cta_2_url?: string;
  background_image?: AcfImage;
  show_overlay?: boolean | 1 | 0;
  overlay_opacity?: number | string;
  hero_enabled?: boolean | 1 | 0;
};

// Shown immediately and as fallback if the API call fails.
const FALLBACK: HeroData = {
  hero_subtitle: 'Shamanicca Apparel',
  hero_title: 'Intentioned Mystical Style',
  cta_1_label: "SHOP WOMEN'S",
  cta_1_url: '/shop/women',
  cta_2_label: "SHOP MEN'S",
  cta_2_url: '/shop/men',
  show_overlay: true,
  overlay_opacity: 0.5,
  hero_enabled: true,
};

function resolveBgUrl(field: AcfImage): string | null {
  if (!field) return null;
  if (typeof field === 'string') return field;
  // ACF Image Array format — prefer large size, fall back to full URL
  if (field.sizes?.large) return field.sizes.large;
  return field.url ?? null;
}

export default function Hero() {
  // Start with fallback so the hero always renders immediately
  const [data, setData] = useState<HeroData>(FALLBACK);

  useEffect(() => {
    fetch('/api/cms/hero')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const hero: HeroData | undefined = json?.hero;
        // hero_enabled can be boolean true or integer 1
        if (hero && hero.hero_enabled !== false && hero.hero_enabled !== 0) {
          setData(hero);
        }
      })
      .catch(() => {
        // keep FALLBACK
      });
  }, []);

  const showOverlay = data.show_overlay === true || data.show_overlay === 1;
  const opacity = parseFloat(String(data.overlay_opacity ?? 0.5));
  const overlayStyle: React.CSSProperties = showOverlay
    ? { background: `rgba(0,0,0,${opacity})` }
    : { background: 'transparent' };

  const bgUrl = resolveBgUrl(data.background_image);

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
        <Image
          src={bgUrl || '/images/hero-image.png'}
          alt={data.hero_title || 'Shamanicca Collection'}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      </div>
    </section>
  );
}
