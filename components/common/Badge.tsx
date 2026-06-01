import { cn } from '@/lib/utils/cn';

export function statusClass(status: string): string {
  return String(status)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className }: BadgeProps) {
  return (
    <span className={cn('badge', statusClass(status), className)}>
      {label ?? status}
    </span>
  );
}
