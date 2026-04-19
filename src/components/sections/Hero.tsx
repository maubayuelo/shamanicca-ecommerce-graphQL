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

export default function Hero() {
  const [data, setData] = useState<HeroData | null>(null);

  useEffect(() => {
    fetch('/api/cms/hero')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const hero: HeroData | undefined = json?.hero;
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
