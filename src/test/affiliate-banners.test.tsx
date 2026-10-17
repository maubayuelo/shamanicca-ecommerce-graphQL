import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BlogBanner from '../components/sections/BlogBanner';
import BlogBannerSidebar from '../components/sections/BlogBannerSidebar';
import InContentBanner from '../components/sections/InContentBanner';
import type { AcfBanner } from '../types/banners';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}));

const AFFILIATE_REL = ['noopener', 'noreferrer', 'sponsored'];

function relTokens(link: HTMLElement) {
  return (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
}

describe('affiliate banner links', () => {
  it('BlogBanner marks affiliate links as sponsored', () => {
    render(<BlogBanner title="Deck" href="https://partner.example/x" imageUrl="/a.png" isAffilliated />);
    const link = screen.getByRole('link');
    expect(relTokens(link)).toEqual(expect.arrayContaining(AFFILIATE_REL));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('BlogBanner leaves owned links unmarked', () => {
    render(<BlogBanner title="Shop" href="/shop" imageUrl="/a.png" />);
    const link = screen.getByRole('link');
    expect(link).not.toHaveAttribute('rel');
    expect(link).not.toHaveAttribute('target');
  });

  it('BlogBannerSidebar marks affiliate links as sponsored', () => {
    render(<BlogBannerSidebar title="Deck" href="https://partner.example/x" imageUrl="/a.png" isAffilliated />);
    expect(relTokens(screen.getByRole('link'))).toEqual(expect.arrayContaining(AFFILIATE_REL));
  });

  it('BlogBannerSidebar leaves owned links unmarked', () => {
    render(<BlogBannerSidebar title="Shop" href="/shop" imageUrl="/a.png" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('rel');
  });

  it('InContentBanner marks affiliate links as sponsored', () => {
    const banner = {
      banner_type: 'affiliate',
      banner_cta_url: 'https://partner.example/x',
      banner_image: '/a.png',
      banner_headline: 'Deck',
    } as AcfBanner;
    render(<InContentBanner banner={banner} />);
    expect(relTokens(screen.getByRole('link'))).toEqual(expect.arrayContaining(AFFILIATE_REL));
  });
});
