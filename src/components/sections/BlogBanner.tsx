import React from 'react';
// Using a native img for easier responsive sizing

export type BlogBannerProps = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
  imageUrl: string;
  className?: string;
};

export default function BlogBanner({ title, subtitle, ctaLabel, href = '#', imageUrl, className = '' }: BlogBannerProps) {
  return (
    <div className={`blog-banner ${className}`}>
      <div className="blog-banner__image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} />
      </div>
      <div className="blog-banner__body">
        <div className="blog-banner__title type-2xl type-extrabold">{title}</div>
        {subtitle && <div className="blog-banner__subtitle type-lg">{subtitle}</div>}
      </div>
      {ctaLabel && (
        <a className="btn btn-primary" href={href}>{ctaLabel}</a>
      )}
    </div>
  );
}
