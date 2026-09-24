import React from 'react';
import { decodeEntities } from '../../utils/html';

type BlogHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function BlogHeader({ title, subtitle, className = '' }: BlogHeaderProps) {
  return (
    <div className={`blog-header bg-[#ececec] p-legacy-15 text-center sm:p-6 ${className}`}>
      <div className="blog-header__title type-xl type-bold text-black">{title}</div>
      {subtitle && (
        <div className="blog-header__subtitle type-lg text-black">{decodeEntities(subtitle)}</div>
      )}
    </div>
  );
}
