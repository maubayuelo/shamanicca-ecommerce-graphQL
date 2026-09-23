import React from 'react';
import Image from 'next/image';

export type Banner = {
  id: string | number;
  title: string;
  subtitle?: string;
  href?: string;
  imageUrl?: string;
};

type Props = {
  banners: [Banner, Banner];
  className?: string;
};

/**
 * Two side-by-side promotional banners with background image and overlayed text.
 * - Mobile: stacked
 * - Tablet: 2 columns
 * - Desktop: fixed width container
 */
export default function HomeBanners({ banners, className = '' }: Props) {
  return (
    <div className='main'>
          <section className={`section-home-banners grid grid-cols-[1fr] gap-7.5 sm:grid-cols-[repeat(2,1fr)] ${className}`}>
          {banners.map((b) => (
            <a
              key={b.id}
              href={b.href || '#'}
              className="banner-card group/banner relative flex items-end min-h-67.5 w-[calc(100%-30px)] p-legacy-15 overflow-hidden bg-black bg-cover bg-center no-underline lg:p-7.5 lg:w-[calc(100%-60px)] xl:min-h-75 after:content-[''] after:absolute after:inset-0 after:rounded-[inherit] after:[background:linear-gradient(to_bottom,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.45)_100%)]"
              aria-label={b.title}
            >
              {b.imageUrl && (
                <Image
                  src={b.imageUrl}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="absolute inset-0 block w-full h-full object-cover object-center z-0 rounded-[inherit] [transform:scale(1)] transition-[transform] duration-300 ease-[ease] group-hover/banner:[transform:scale(1.03)]"
                  width={1000}
                  height={800}
                />
              )}
              <div className="relative z-1 flex flex-col gap-1.75">
                <h3 className="type-4xl type-extrabold type-white m-0">{b.title}</h3>
                {b.subtitle && <p className="type-2xl type-bold type-white m-0">{b.subtitle}</p>}
              </div>
            </a>
          ))}
        </section>
    </div>
    
  );
}
