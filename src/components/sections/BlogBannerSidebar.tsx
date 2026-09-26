import React from 'react';
import Image from 'next/image';

export type BlogBannerSidebarProps = {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
  className?: string;
  isAffilliated?: boolean;
};

export default function BlogBannerSidebar({
  imageUrl,
  title,
  subtitle,
  ctaLabel,
  href = '#',
  className = '',
  isAffilliated = false
}: BlogBannerSidebarProps) {
  return (
    <a
      href={href}
      className={`blog-sidebar__banner group self-stretch pr-legacy-15 bg-white overflow-hidden outline-1 outline-solid outline-gray-800 justify-start mt-legacy-15 -mb-7.5 items-center gap-legacy-15 inline-flex [&.is-affilliated]:bg-gray-100 ${isAffilliated ? ' is-affilliated' : ''} ${className}`}
      target={isAffilliated ? '_blank' : undefined}
      rel={isAffilliated ? 'noopener noreferrer' : undefined}
    >
      <div className="blog-sidebar__banner-image w-37.5 [height:-webkit-fill-available] [padding:0] relative bg-black">
        <Image className="w-full h-full object-cover block" src={imageUrl} alt={title || ''} width={180} height={180} />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/50 opacity-0 [transition:opacity_200ms_ease] motion-reduce:transition-none [.group:hover_&]:opacity-100" />
      </div>
      <div className="blog-sidebar__banner-body [flex:1_1_0] inline-flex flex-col justify-start items-start py-legacy-15 px-0 gap-legacy-15">
        <div>
          {title && <div className="type-xl type-extrabold [.group:hover_&]:text-[#675dff]">{title}</div>}
          {subtitle && <div className="type-md [.group:hover_&]:text-[#675dff]">{subtitle}</div>}
          {isAffilliated && (
          <div className="type-italic type-xs mt-0" aria-label="Affiliated">Affilliated Ad</div>
        )}
        </div>
        {ctaLabel && (
          <div className="btn btn-primary btn-large self-stretch">
            <span>{ctaLabel}</span>
            {isAffilliated && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/images/icon-external-link.svg" alt="" aria-hidden="true" width={20} height={20} />
            )}
          </div>
        )}
      </div>
    </a>
  );
}
