import { Button } from '@/components/common/Button';
import type { ProductRequest } from '@/lib/types/request';

interface RequestActionsProps {
  request: ProductRequest;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onComplete: () => Promise<void>;
}

export function RequestActions({
  request,
  onAccept,
  onReject,
  onComplete,
}: RequestActionsProps) {
  if (request.status === 'Pending') {
    return (
      <div className="row">
        <Button variant="secondary" onClick={() => void onAccept()}>
          Chấp nhận
        </Button>
        <Button variant="secondary" onClick={() => void onReject()}>
          Từ chối
        </Button>
      </div>
    );
  }

  if (request.status === 'Accepted') {
    return (
      <Button variant="primary" onClick={() => void onComplete()}>
        Hoàn tất
      </Button>
    );
  }

  return <span className="small muted">Không còn thao tác</span>;
}
