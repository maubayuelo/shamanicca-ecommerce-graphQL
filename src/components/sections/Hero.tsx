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
  // ACF Image Array format — prefer the original upload so the desktop crop
  // (larger, portrait panel) isn't upscaled from WP's capped "large" size.
  // next/image's `sizes` prop still derives a small file for mobile from this.
  return field.url ?? field.sizes?.large ?? null;
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

  const bgUrl = resolveBgUrl(data.background_image) || '/images/hero-image.png';

  return (
    <section className="hero">
      <div className="main">
        <div className="hero__grid">
          <div className="hero__text">
            {data.hero_subtitle && (
              <p className="hero__eyebrow type-md type-extrabold type-uppercase fade-up m-0">
                {data.hero_subtitle}
              </p>
            )}
            {data.hero_title && (
              <h1 className="hero__title type-5xl type-extrabold fade-up mt-0 mb-md-responsive">
                {data.hero_title}
              </h1>
            )}
            {data.hero_body_text && (
              <p className="hero__body type-lg fade-up">{data.hero_body_text}</p>
            )}

            {(data.cta_1_label || data.cta_2_label) && (
              <div className="hero__ctas fade-up">
                {data.cta_1_label && data.cta_1_url && (
                  <Link href={data.cta_1_url} className="btn btn-primary btn-large">
                    {data.cta_1_label}
                  </Link>
                )}
                {data.cta_2_label && data.cta_2_url && (
                  <Link href={data.cta_2_url} className="btn btn-secondary btn-large">
                    {data.cta_2_label}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="hero__media fade-in">
            <Image
              src={bgUrl}
              alt=""
              fill
              priority
              quality={90}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="hero__media-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
