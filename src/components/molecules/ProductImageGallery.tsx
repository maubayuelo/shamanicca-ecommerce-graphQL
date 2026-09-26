/**
 * ProductImageGallery.tsx — Product photo gallery with zoom modal (Molecule)
 *
 * Renders a horizontally scrollable image carousel with:
 *  - Thumbnail strip below the main image
 *  - Prev/next arrow navigation
 *  - Click-to-zoom fullscreen modal
 *  - Keyboard support (ArrowLeft / ArrowRight, Escape to close modal)
 *
 * ATOMIC DESIGN LEVEL: Molecule
 * Combines multiple images with scroll/navigation and modal logic.
 *
 * SCROLL-BASED CAROUSEL (no carousel library):
 *  Images are laid out in a horizontal flex container (gallery__track) that overflows.
 *  CSS `scroll-snap-type: x mandatory` snaps to each image naturally.
 *  The `scroll` event listener on the viewport reads scrollLeft / clientWidth
 *  to determine which slide is active — this syncs the thumbnail highlights.
 *
 * TWO IMAGE SIZES PER SLIDE:
 *  Each GalleryImage has:
 *    src       — large version for desktop (e.g. woocommerce_single, 600×600)
 *    sources[] — additional <source> elements for <picture>, e.g.:
 *                  { srcSet: "...medium.jpg", media: "(max-width: 600px)" }
 *                This serves a smaller image to mobile browsers automatically.
 *    fullSrc   — the original WooCommerce upload, only loaded in the zoom modal
 *
 * PLACEHOLDER IMAGES:
 *  If no real images are passed, `buildPlaceholderSet()` generates 5 labelled
 *  placeholder images (Front, Back, Side, Top, Bottom) from placehold.co.
 *  This prevents broken UI during development or when WooCommerce images fail.
 *
 * FULLSCREEN MODAL:
 *  Clicking any image opens a modal overlay showing the full-size image.
 *  The modal uses role="dialog" aria-modal="true" for accessibility.
 *  Backdrop click or Escape key closes it.
 *
 * SALE BADGE:
 *  If isOnSale is true, a "SALE" badge overlays the top-left of the first image.
 */

import React from 'react';

type GalleryImage = {
  src: string;
  alt?: string;
  thumb?: string;
  fullSrc?: string; // original upload URL — used only in the zoom modal
  // Optional additional <source> entries for <picture>
  sources?: Array<{
    srcSet: string;
    type?: string;
    media?: string;
  }>;
};

export type ProductImageGalleryProps = {
  images?: GalleryImage[];
  title?: string;
  isOnSale?: boolean;
  initialIndex?: number;
  className?: string;
};

// Shared by the strip and the modal; only the border colour differs per context.
const THUMB_BASE =
  'thumb border-2 rounded-[9px] [padding:0] bg-transparent bg-none cursor-pointer w-fit h-fit [&_img]:w-13.5 [&_img]:h-13.5 sm:[&_img]:w-18 sm:[&_img]:h-18 [&_img]:object-cover [&_img]:block [&_img]:rounded-md';

// Utility to generate 5 placeholder images with different angles in WebP
function buildPlaceholderSet(title = 'Product'): GalleryImage[] {
  const angles = ['Front', 'Back', 'Side', 'Top', 'Bottom'] as const;
  const sizeLg = 1000;
  const sizeMd = 700;
  const sizeSm = 400;

  return angles.map((label) => {
    const text = encodeURIComponent(`${title} ${label}`);
    const baseWebp = `https://placehold.co/${sizeLg}x${sizeLg}.webp?text=${text}`;
    const basePng = `https://placehold.co/${sizeLg}x${sizeLg}.png?text=${text}`;
    const thumb = `https://placehold.co/160x160.webp?text=${encodeURIComponent(label)}`;

    const srcSetWebp = [
      `https://placehold.co/${sizeSm}x${sizeSm}.webp?text=${text} ${sizeSm}w`,
      `https://placehold.co/${sizeMd}x${sizeMd}.webp?text=${text} ${sizeMd}w`,
      `${baseWebp} ${sizeLg}w`,
    ].join(', ');
    const srcSetPng = [
      `https://placehold.co/${sizeSm}x${sizeSm}.png?text=${text} ${sizeSm}w`,
      `https://placehold.co/${sizeMd}x${sizeMd}.png?text=${text} ${sizeMd}w`,
      `${basePng} ${sizeLg}w`,
    ].join(', ');

    return {
      src: basePng,
      thumb,
      alt: `${title} — ${label}`,
      sources: [
        { srcSet: srcSetWebp, type: 'image/webp' },
        { srcSet: srcSetPng, type: 'image/png' },
      ],
    };
  });
}

export default function ProductImageGallery({
  images,
  title = 'Product',
  isOnSale,
  initialIndex = 0,
  className,
}: ProductImageGalleryProps) {
  const imgs = React.useMemo(() => (images && images.length > 0 ? images : buildPlaceholderSet(title)), [images, title]);
  const [active, setActive] = React.useState(Math.min(Math.max(0, initialIndex), imgs.length - 1));
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const slideRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [isModalOpen, setModalOpen] = React.useState(false);

  // Keep active index in sync with scroll position
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => {
      const { scrollLeft, clientWidth } = viewport;
      const i = Math.round(scrollLeft / clientWidth);
      setActive(Math.min(Math.max(0, i), imgs.length - 1));
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, [imgs.length]);

  // Scroll to active when thumbnails/arrows change it
  const scrollToIndex = (idx: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const clamped = Math.min(Math.max(0, idx), imgs.length - 1);
    setActive(clamped); // Update state immediately
    const slide = slideRefs.current[clamped];
    if (slide) slide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const goPrev = () => {
    const newIndex = Math.max(0, active - 1);
    scrollToIndex(newIndex);
  };
  
  const goNext = () => {
    const newIndex = Math.min(imgs.length - 1, active + 1);
    scrollToIndex(newIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section
      className={["product-image-gallery relative", className].filter(Boolean).join(' ')}
      aria-label="Product image gallery"
    >
      <div className="gallery__viewport relative overflow-hidden" ref={viewportRef} onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="gallery__track flex overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch] scroll-smooth [&::-webkit-scrollbar]:hidden">
          {imgs.map((img, i) => (
            <div
              key={i}
              className="gallery__slide min-w-full snap-start"
              ref={(el) => { slideRefs.current[i] = el; }}
            >
              <div className="gallery__image-wrapper relative overflow-hidden after:content-[''] after:absolute after:inset-0 after:rounded-[inherit] after:[box-shadow:inset_0_0_0_1px_oklch(0.9067_0_0)] after:z-[1] after:pointer-events-none">
                {isOnSale && (
                  <div className="badge badge--sale type-bold absolute top-3 left-3 bg-highlighted-500 py-1.5 px-2.5 rounded-sm z-[2] [&>span]:text-white" aria-label="On sale">
                    <span>SALE</span>
                  </div>
                )}
                <button
                  type="button"
                  className="image-button block w-full cursor-zoom-in [padding:0] [border:0] bg-transparent bg-none [&_img]:w-full [&_img]:h-auto [&_img]:block"
                  onClick={() => setModalOpen(true)}
                  aria-label={`Open fullscreen view for image ${i + 1}`}
                >
                  <picture>
                    {img.sources?.map((s, idx) => (
                      <source key={idx} srcSet={s.srcSet} {...(s.type ? { type: s.type } : {})} media={s.media} />
                    ))}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.alt || title}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  </picture>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows (desktop priority) */}
        <button
          type="button"
          className="nav nav--prev type-extrabold left-2 absolute top-1/2 [transform:translateY(-50%)] w-9.5 h-9.5 rounded-[999px] [border:none] bg-black/45 text-white max-sm:hidden sm:inline-flex items-center justify-center cursor-pointer z-[3] disabled:opacity-40 disabled:cursor-default [&_img]:w-2.25 [&_img]:h-auto"
          onClick={goPrev}
          aria-label="Previous image"
          disabled={active === 0}
        >
          <img src={"/images/icon-chevron-left.svg"} alt="" aria-hidden />
        </button>
        <button
          type="button"
          className="nav nav--next type-extrabold right-2 absolute top-1/2 [transform:translateY(-50%)] w-9.5 h-9.5 rounded-[999px] [border:none] bg-black/45 text-white max-sm:hidden sm:inline-flex items-center justify-center cursor-pointer z-[3] disabled:opacity-40 disabled:cursor-default [&_img]:w-2.25 [&_img]:h-auto"
          onClick={goNext}
          aria-label="Next image"
          disabled={active === imgs.length - 1}
        >
          <img src={"/images/icon-chevron-right.svg"} alt="" aria-hidden />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="gallery__thumbs mt-md-responsive grid grid-flow-col auto-cols-max overflow-x-auto [justify-content:start] [align-items:start] gap-2.25 sm:gap-3" role="tablist" aria-label="Image thumbnails">
        {imgs.map((img, i) => (
          <button
            type="button"
            key={i}
            className={[THUMB_BASE, i === active ? 'is-active border-black' : 'border-transparent'].join(' ')}
            role="tab"
            aria-selected={i === active}
            aria-controls={`slide-${i}`}
            onClick={() => {
              setActive(i);
              scrollToIndex(i);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.thumb || img.src} alt={img.alt || `${title} thumbnail ${i + 1}`} />
          </button>
        ))}
      </div>

      {/* Fullscreen modal */}
      {isModalOpen && (
        <div className="gallery__modal fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Fullscreen image viewer">
          <button className="modal__backdrop absolute inset-0 bg-black/81 w-full h-full [border:0]" onClick={() => setModalOpen(false)} aria-label="Close viewer" />
          <div className="modal__content pt-md-responsive absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-y-5 justify-center pb-5">
            <button className="modal__close absolute top-4.5 right-4.5 bg-black/60 text-white [border:0] rounded-[999px] w-9 h-9 cursor-pointer z-[2]" onClick={() => setModalOpen(false)} aria-label="Close">✕</button>
            <div className="modal__image grid place-items-center [&_img]:max-w-[90vw] [&_img]:max-h-[90vh] [&_img]:w-auto [&_img]:h-auto [&_img]:rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgs[active].fullSrc || imgs[active].src}
                alt={imgs[active].alt || title}
              />
            </div>
            <div className="modal__thumbs grid grid-flow-col w-full h-fit justify-center overflow-x-auto gap-2.25 sm:gap-3">
              {imgs.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  className={[THUMB_BASE, i === active ? 'is-active border-white' : 'border-[rgba(255,255,255,0.7)]'].join(' ')}
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb || img.src} alt={img.alt || `${title} thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
