import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="empty">
      {icon ? <div className="empty-icon">{icon}</div> : null}
      {message}
    </div>
  );
}
