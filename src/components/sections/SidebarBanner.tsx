import Link from 'next/link';
import Image from 'next/image';
import type { AcfBanner } from '../../types/banners';

type Props = { banner: AcfBanner; className?: string };

export default function SidebarBanner({ banner, className = '' }: Props) {
  if (!banner.banner_enabled) return null;

  const isAffiliate = banner.banner_type === 'affiliate';
  const inner = (
    <div className={`blog-sidebar__banner${isAffiliate ? ' is-affilliated' : ''} ${className}`}>
      <div className="blog-sidebar__banner-image">
        <Image src={banner.banner_image} alt={banner.banner_headline} width={180} height={180} />
      </div>
      <div className="blog-sidebar__banner-body">
        <div className="flex flex-col gap-[3px]">
          <div className="type-xl type-extrabold">{banner.banner_headline}</div>
          {banner.banner_subtext && (
            <div className="type-md mb-xm-responsive">{banner.banner_subtext}</div>
          )}
          {isAffiliate && (
            <div className="type-italic type-xs mt-0" aria-label="Affiliated">Affiliated Ad</div>
          )}
        </div>
        {banner.banner_cta_label && (
          <div className="btn btn-primary btn-large self-stretch">
            <span>{banner.banner_cta_label}</span>
            {isAffiliate && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/images/icon-external-link.svg" alt="" aria-hidden="true" width={20} height={20} />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isAffiliate) {
    return (
      <a href={banner.banner_cta_url} target="_blank" rel="noopener noreferrer sponsored">
        {inner}
      </a>
    );
  }

  return <Link href={banner.banner_cta_url}>{inner}</Link>;
}
