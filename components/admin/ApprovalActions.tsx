import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/common/Button';
import { Field } from '@/components/common/Field';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/components/common/Toast';
import {
  rejectReasonSchema,
  type RejectReasonInput,
} from '@/lib/types/schemas';

interface ApprovalActionsProps {
  onView: () => void;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export function ApprovalActions({
  onView,
  onApprove,
  onReject,
}: ApprovalActionsProps) {
  const { show } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RejectReasonInput>({
    resolver: zodResolver(rejectReasonSchema),
    defaultValues: { reason: '' },
  });

  const handleReject = handleSubmit(
    async (values) => {
      try {
        await onReject(values.reason.trim());
        setRejectOpen(false);
        reset();
      } catch {
        // error already handled by parent via toast
      }
    },
    () => {
      show('Cần nhập lý do từ chối.', 'error');
    },
  );

  return (
    <>
      <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
        <Button
          variant="ghost"
          onClick={onView}
          style={{ flexShrink: 0, paddingLeft: 8, paddingRight: 8, minHeight: 36, fontSize: 13 }}
        >
          Xem
        </Button>
        <Button
          variant="primary"
          onClick={() => void onApprove()}
          style={{ flexShrink: 0, paddingLeft: 10, paddingRight: 10, minHeight: 36, fontSize: 13 }}
        >
          Duyệt
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            reset({ reason: '' });
            setRejectOpen(true);
          }}
          style={{ flexShrink: 0, paddingLeft: 10, paddingRight: 10, minHeight: 36, fontSize: 13 }}
        >
          Từ chối
        </Button>
      </div>

      <Modal
        open={rejectOpen}
        title="Lý do từ chối"
        onClose={() => setRejectOpen(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleReject();
          }}
        >
          <Field label="Lý do" error={errors.reason?.message}>
            <Textarea
              placeholder="Nhập lý do từ chối bài đăng..."
              {...register('reason')}
            />
          </Field>
          <div className="row">
            <Button variant="danger" type="submit" loading={isSubmitting}>
              Xác nhận từ chối
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setRejectOpen(false)}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
