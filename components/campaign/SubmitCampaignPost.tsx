import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Field } from '@/components/common/Field';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { UploadField } from '@/components/common/UploadField';
import { useToast } from '@/components/common/Toast';
import {
  submitCampaignPostSchema,
  type SubmitCampaignPostInput as SubmitCampaignPostFormInput,
} from '@/lib/types/schemas';
import type { Campaign } from '@/lib/types/campaign';
import type { Post } from '@/lib/types/post';
import type { SubmitCampaignPostInput } from '@/lib/services/mockApi';

interface SubmitCampaignPostProps {
  campaign: Campaign;
  myApprovedPosts: Post[];
  onSubmit: (input: SubmitCampaignPostInput) => Promise<void>;
}

export function SubmitCampaignPost({
  campaign,
  myApprovedPosts,
  onSubmit,
}: SubmitCampaignPostProps) {
  const { show } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmitCampaignPostFormInput>({
    resolver: zodResolver(submitCampaignPostSchema),
    defaultValues: {
      fromApprovedPostId: '',
      content: '',
      imageName: 'campaign-post-photo.jpg',
      note: '',
    },
  });

  const submit = handleSubmit(
    async (values) => {
      await onSubmit({
        campaignId: campaign.id,
        fromApprovedPostId: values.fromApprovedPostId || undefined,
        content: values.content,
        imageName: values.imageName,
        note: values.note,
      });
    },
    () => {
      show('Vui lòng chọn bài đã duyệt hoặc nhập nội dung bài mới.', 'error');
    },
  );

  return (
    <section className="grid cols-2">
      <form className="card stack" onSubmit={submit}>
        <Field label="Chọn bài đã duyệt" htmlFor="myApprovedProduct">
          <Select id="myApprovedProduct" {...register('fromApprovedPostId')}>
            <option value="">Không chọn — tạo bài mới</option>
            {myApprovedPosts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Hoặc nhập nội dung mới"
          htmlFor="itemDesc"
          error={errors.content?.message}
        >
          <Textarea
            id="itemDesc"
            placeholder="Mô tả vật phẩm muốn gửi vào campaign"
            {...register('content')}
          />
        </Field>

        <Field label="Tải ảnh lên" htmlFor="campaignImage">
          <UploadField
            id="campaignImage"
            hint="Ảnh mock cho campaign post."
            {...register('imageName')}
          />
        </Field>

        <Field label="Ghi chú" htmlFor="note">
          <Textarea
            id="note"
            placeholder="Ghi chú cho Activity Admin"
            {...register('note')}
          />
        </Field>

        <Button type="submit" variant="primary" loading={isSubmitting}>
          Gửi duyệt bài
        </Button>
      </form>

      <aside className="card stack">
        <h2>Trạng thái sau khi gửi</h2>
        <div>
          <Badge status="pending-approval" label="Chờ duyệt" />
        </div>
        <p className="muted" style={{ fontSize: 14 }}>
          Admin hoặc Activity Admin duyệt trước khi bài hiển thị trong Campaign
          Feed và School Feed.
        </p>
        <Link
          className="btn secondary"
          href={`/member/campaigns/${campaign.id}`}
          style={{ width: 'fit-content' }}
        >
          Quay lại chiến dịch
        </Link>
      </aside>
    </section>
  );
}
