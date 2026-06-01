import { useEffect } from 'react';
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

interface HideRemoveModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function HideRemoveModal({
  open,
  onClose,
  onConfirm,
}: HideRemoveModalProps) {
  const { show } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RejectReasonInput>({
    resolver: zodResolver(rejectReasonSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ reason: '' });
    }
  }, [open, reset]);

  const handleConfirm = handleSubmit(
    async (values) => {
      try {
        await onConfirm(values.reason.trim());
        reset();
        onClose();
      } catch {
        // error already handled by parent via toast
      }
    },
    () => {
      show('Cần nhập lý do ẩn/xóa bài vi phạm.', 'error');
    },
  );

  return (
    <Modal open={open} title="Hide / remove post" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleConfirm();
        }}
      >
        <Field label="Lý do" error={errors.reason?.message}>
          <Textarea
            placeholder="Nhập lý do ẩn/xóa bài vi phạm..."
            {...register('reason')}
          />
        </Field>
        <div className="row">
          <Button variant="danger" type="submit" loading={isSubmitting}>
            Xác nhận
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy
          </Button>
        </div>
      </form>
    </Modal>
  );
}
