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
      className={`go-top btn btn-primary ${visible ? 'is-visible' : ''}`}
      onClick={onClick}
    >
      <img src="/images/icon-chevron-up.svg" alt="" aria-hidden="true" />
    </button>
  );
}
