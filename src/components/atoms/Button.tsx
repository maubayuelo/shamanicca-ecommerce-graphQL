import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

export default function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  const base = 'px-4 py-2 rounded-md font-medium';
  const style = variant === 'primary'
    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
    : 'bg-transparent text-gray-800 border border-gray-200';
  return (
    <button className={`${base} ${style} ${className}`} {...props}>
      {children}
    </button>
  );
}
