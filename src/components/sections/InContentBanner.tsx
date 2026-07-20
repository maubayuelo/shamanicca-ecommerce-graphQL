import Link from 'next/link';
import type { AcfBanner } from '../../types/banners';

type Props = { banner: AcfBanner; className?: string };

export default function InContentBanner({ banner, className = '' }: Props) {
  const isAffiliate = banner.banner_type === 'affiliate';
  const inner = (
    <div className={`blog-banner${isAffiliate ? ' is-affilliated' : ''}`}>
      <div className="blog-banner__image">
        <picture>
          {/* Tablet+ (≥601px): image is 150–210px wide — medium is sufficient */}
          {banner.banner_image_medium && (
            <source media="(min-width: 601px)" srcSet={banner.banner_image_medium} />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.banner_image_large || banner.banner_image} alt={banner.banner_headline} />
        </picture>
      </div>
      <div className="blog-banner__body">
        <div className="blog-banner__title type-2xl type-extrabold">{banner.banner_headline}</div>
        {banner.banner_subtext && (
          <div className="blog-banner__subtitle type-sm mb-0">{banner.banner_subtext}</div>
        )}
        {isAffiliate && (
          <div className="type-xs mt-0 type-italic" aria-label="Affiliated">Affiliated Ad</div>
        )}
      </div>
      {banner.banner_cta_label && (
        <div className="btn btn-primary mb-sm-responsive">
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
