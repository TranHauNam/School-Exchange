import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'softPrimary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  full?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  full = false,
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn('btn', variant, full && 'full', className)}
      disabled={disabled || loading}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  );
}
