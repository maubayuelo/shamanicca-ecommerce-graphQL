type NewsletterConfirmationProps = {
  title: string;
  message: string;
  className?: string;
  heading?: 'h1' | 'p';
  variant?: 'default' | 'footer';
};

export function NewsletterConfirmation({
  title,
  message,
  className = '',
  heading: Title = 'p',
  variant = 'default',
}: NewsletterConfirmationProps) {
  const isFooter = variant === 'footer';
  const layout = isFooter
    ? 'items-center text-center gap-2 lg:items-start lg:text-left'
    : 'items-center text-center gap-legacy-15';
  const checkSize = isFooter ? 20 : 24;

  return (
    <div className={`newsletter-success flex flex-col ${layout} ${className}`} role="alert">
      <span className={`${isFooter ? 'size-9' : 'size-11'} shrink-0 rounded-full bg-[#675dff] text-white flex items-center justify-center`} aria-hidden="true">
        <svg width={checkSize} height={checkSize} viewBox="0 0 24 24" fill="none" focusable="false">
          <path d="M5 12L10 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      </span>
      <Title className={`${isFooter ? 'type-md' : 'type-lg'} type-bold m-0`}>{title}</Title>
      <p className={isFooter ? 'type-sm m-0 w-full max-w-[34ch]' : 'type-md m-0'}>{message}</p>
    </div>
  );
}
