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
    <section className="flex w-full min-h-[75dvh] items-center lg:px-0 lg:py-7.5">
      <div className="main">
        <div className="grid grid-cols-[1fr] items-center gap-5 py-5 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-15 lg:py-0">
          <div className="order-2 max-w-prose lg:order-1">
            {data.hero_subtitle && (
              <p className="type-md type-extrabold type-uppercase fade-up m-0 text-primary-500 tracking-[0.04em]">
                {data.hero_subtitle}
              </p>
            )}
            {data.hero_title && (
              <h1 className="type-5xl type-extrabold fade-up mt-0 mb-md-responsive">
                {data.hero_title}
              </h1>
            )}
            {data.hero_body_text && (
              <p className="type-lg fade-up mx-0 mt-0 mb-legacy-25 max-w-[60ch] text-gray-800">
                {data.hero_body_text}
              </p>
            )}

            {(data.cta_1_label || data.cta_2_label) && (
              <div className="fade-up flex flex-wrap gap-legacy-15">
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

          {/* Fixed offset, not --header-height: that variable is the header's
              viewport-bottom coordinate and changes as the banner scrolls away,
              which made this container grow on scroll. 106px = header (46px) +
              hero top padding (30px) + bottom gap (30px). Update if the header
              height changes. */}
          <div className="hero__media fade-in order-1 relative box-border w-full aspect-square max-h-[50svh] overflow-hidden border border-solid border-gray-300 md:aspect-5/3 lg:order-2 lg:aspect-square lg:max-h-[calc(100svh-106px)]">
            {/* On desktop the landscape source is cover-cropped into a square container, so the rendered image is wider than the slot and needs a larger source. */}
            <Image
              src={bgUrl}
              alt=""
              fill
              priority
              quality={90}
              sizes="(min-width: 1024px) 90vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
