import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Field } from '@/components/common/Field';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/components/common/Toast';
import { requestSchema, type RequestInput } from '@/lib/types/schemas';
import { requestTypeLabel } from '@/lib/utils/post-labels';
import type { Post } from '@/lib/types/post';

interface RequestModalProps {
  open: boolean;
  post: Post;
  onClose: () => void;
  onSubmit: (message: string, contact: string) => Promise<void>;
}

export function RequestModal({ open, post, onClose, onSubmit }: RequestModalProps) {
  const { show } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      message: '',
      contact: 'an@student.school.edu',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ message: '', contact: 'an@student.school.edu' });
    }
  }, [open, reset]);

  const submit = handleSubmit(
    async (values) => {
      await onSubmit(values.message, values.contact);
      onClose();
    },
    () => {
      show('Vui lòng nhập lời nhắn và thông tin liên hệ.', 'error');
    },
  );

  return (
    <Modal open={open} onClose={onClose} title="Gửi yêu cầu">
      <p className="muted">{post.title}</p>
      <p className="small muted">Loại yêu cầu: {requestTypeLabel(post.type)}</p>

      <form className="stack" onSubmit={submit}>
        <Field label="Lời nhắn" htmlFor="requestMessage" error={errors.message?.message}>
          <Textarea
            id="requestMessage"
            placeholder="Ví dụ: Mình muốn nhận sau giờ học hôm nay."
            {...register('message')}
          />
        </Field>

        <Field
          label="Thông tin liên hệ"
          htmlFor="requestContact"
          error={errors.contact?.message}
        >
          <Input id="requestContact" {...register('contact')} />
        </Field>

        <div className="row">
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Gửi yêu cầu
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
        </div>
      </form>
    </Modal>
  );
}
