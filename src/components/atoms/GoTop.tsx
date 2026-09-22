import { useEffect, useState } from 'react';

type GoTopProps = {
  threshold?: number; // pixels scrolled before showing the button
  label?: string;
};

export default function GoTop({ threshold = 300, label = 'Go to top' }: GoTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const onClick = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label={label}
      className={`btn btn-primary fixed right-2.5 bottom-2.5 lg:right-7.5 lg:bottom-7.5 size-9 p-0! rounded-full! z-[1000] shadow-[0_3px_9px_rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      onClick={onClick}
    >
      <img className="size-4.5 invert" src="/images/icon-chevron-up.svg" alt="" aria-hidden="true" />
    </button>
  );
}
