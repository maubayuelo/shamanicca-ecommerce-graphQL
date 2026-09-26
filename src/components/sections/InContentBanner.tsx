import Link from 'next/link';
import type { AcfBanner } from '../../types/banners';

type Props = { banner: AcfBanner; className?: string };

export default function InContentBanner({ banner, className = '' }: Props) {
  const isAffiliate = banner.banner_type === 'affiliate';
  const inner = (
    <div className={`blog-banner group flex flex-col items-stretch border border-solid border-gray-600 overflow-hidden gap-0 mt-[0px] mb-7.5 lg:mb-legacy-45 sm:flex-row sm:items-center sm:gap-legacy-15 sm:pr-legacy-15 xl:gap-7.5 [.post-content_&]:my-5 lg:[.post-content_&]:my-7.5 [&.is-affilliated]:bg-gray-50 ${isAffiliate ? ' is-affilliated' : ''}`}>
      <div className="blog-banner__image w-full h-52.5 relative overflow-hidden sm:w-37.5 sm:h-37.5 sm:shrink-0 xl:w-52.5">
        <picture>
          {/* Tablet+ (≥601px): image is 150–210px wide — medium is sufficient */}
          {banner.banner_image_medium && (
            <source media="(min-width: 601px)" srcSet={banner.banner_image_medium} />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="w-full h-full object-cover block" src={banner.banner_image_large || banner.banner_image} alt={banner.banner_headline} />
        </picture>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/50 opacity-0 [transition:opacity_200ms_ease] motion-reduce:transition-none [.group:hover_&]:opacity-100" />
      </div>
      <div className="blog-banner__body flex-1 flex flex-col gap-1.5 p-legacy-15 sm:p-0">
        <div className="blog-banner__title type-2xl type-extrabold text-black transition-[color] duration-200 ease-[ease-in-out] [.group:hover_&]:text-[#675dff]">{banner.banner_headline}</div>
        {banner.banner_subtext && (
          <div className="blog-banner__subtitle type-sm mb-0 text-black transition-[color] duration-200 ease-[ease-in-out] [.group:hover_&]:text-[#675dff]">{banner.banner_subtext}</div>
        )}
        {isAffiliate && (
          <div className="type-xs mt-0 type-italic" aria-label="Affiliated">Affiliated Ad</div>
        )}
      </div>
      {banner.banner_cta_label && (
        <div className="btn btn-primary mt-[0px] mx-legacy-15 mb-legacy-15 self-stretch sm:m-0 sm:self-center">
          <span>{banner.banner_cta_label}</span>
          {isAffiliate && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/icon-external-link.svg" alt="" aria-hidden="true" width={20} height={20} />
          )}
        </div>
      )}
    </div>
  );

  if (isAffiliate) {
    return (
      <a
        href={banner.banner_cta_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block ${className}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={banner.banner_cta_url} className={`block ${className}`}>
      {inner}
    </Link>
  );
}
