import { Button } from '@/components/common/Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Có lỗi xảy ra khi tải dữ liệu.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="error-state stack">
      <p>{message}</p>
      {onRetry ? (
        <div className="row">
          <Button variant="secondary" onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      ) : null}
    </div>
  );
}
