import React from 'react';

type BlogHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function BlogHeader({ title, subtitle, className = '' }: BlogHeaderProps) {
  return (
    <div className={`blog-header ${className}`}>
      <div className="blog-header__title type-xl type-bold">{title}</div>
      {subtitle && (
        <div className="blog-header__subtitle type-lg">{subtitle}</div>
      )}
    </div>
  );
}
