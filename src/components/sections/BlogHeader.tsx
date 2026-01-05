import React from 'react';
import { decodeEntities } from '../../utils/html';

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
        <div className="blog-header__subtitle type-lg">{decodeEntities(subtitle)}</div>
      )}
    </div>
  );
}
