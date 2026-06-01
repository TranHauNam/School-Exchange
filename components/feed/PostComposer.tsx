import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Field } from '@/components/common/Field';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { UploadField } from '@/components/common/UploadField';
import { useToast } from '@/components/common/Toast';
import { PostPreview } from '@/components/feed/PostPreview';
import {
  createPostSchema,
  type CreatePostInput as CreatePostFormInput,
} from '@/lib/types/schemas';
import type { Campaign } from '@/lib/types/campaign';
import type { Category } from '@/lib/types/category';
import type { CreatePostInput } from '@/lib/services/mockApi';

interface PostComposerProps {
  categories: Category[];
  campaigns: Campaign[];
  defaultCampaignId?: string;
  initial?: Partial<CreatePostInput>;
  onSubmit: (input: CreatePostInput) => Promise<void>;
}

export function PostComposer({
  categories,
  campaigns,
  defaultCampaignId,
  initial,
  onSubmit,
}: PostComposerProps) {
  const { show } = useToast();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handlePreviewsChange = useCallback((urls: string[]) => {
    setImagePreviews(urls);
  }, []);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      category: initial?.category ?? '',
      type: initial?.type ?? 'Sale',
      price: initial?.price ?? 0,
      imageName: initial?.imageName ?? '',
      contact: initial?.contact ?? '',
      campaignId: defaultCampaignId ?? initial?.campaignId ?? '',
    },
  });

  const transactionType = useWatch({ control, name: 'type' });

  useEffect(() => {
    if (transactionType !== 'Sale') {
      setValue('price', 0);
    }
  }, [transactionType, setValue]);

  const submit = handleSubmit(
    async (values) => {
      await onSubmit({
        title: values.title,
        content: values.content,
        imageName: values.imageName,
        type: values.type,
        price: values.price,
        category: values.category,
        contact: values.contact,
        campaignId: values.campaignId || undefined,
      });
    },
    () => {
      show('Vui lòng kiểm tra lại các trường được đánh dấu.', 'error');
    },
  );

  return (
    <section className="grid cols-2" style={{ alignItems: 'start' }}>
      {/* ---- left: form ---- */}
      <form className="card stack" onSubmit={submit}>
        <Field
          label="Bạn muốn chia sẻ món đồ gì?"
          htmlFor="description"
          error={errors.content?.message}
        >
          <Textarea
            id="description"
            placeholder="Ví dụ: Mình muốn bán lại đèn bàn học còn tốt cho bạn nào cần..."
            {...register('content')}
          />
        </Field>

        <Field
          label="Tải ảnh lên"
          htmlFor="imageName"
          error={errors.imageName?.message}
        >
          <UploadField
            id="imageName"
            hint="Tối thiểu 1 ảnh, tối đa 5 ảnh."
            onPreviewsChange={handlePreviewsChange}
            {...register('imageName')}
          />
        </Field>

        <div className="grid cols-2">
          <Field label="Hình thức giao dịch" htmlFor="transactionType">
            <Select id="transactionType" {...register('type')}>
              <option value="Sale">Bán lại</option>
              <option value="Exchange">Trao đổi</option>
              <option value="Donation">Quyên góp</option>
            </Select>
          </Field>

          <Field
            label="Danh mục"
            htmlFor="category"
            error={errors.category?.message}
          >
            <Select id="category" {...register('category')}>
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {transactionType === 'Sale' ? (
          <Field
            label="Giá bán"
            htmlFor="price"
            error={errors.price?.message}
          >
            <Input
              id="price"
              type="number"
              min={0}
              placeholder="Nhập giá bán"
              {...register('price', { valueAsNumber: true })}
            />
          </Field>
        ) : transactionType === 'Exchange' ? (
          <Field label="Giá tham khảo (nếu có)" htmlFor="price">
            <Input
              id="price"
              type="number"
              min={0}
              placeholder="Không bắt buộc"
              {...register('price', { valueAsNumber: true })}
            />
          </Field>
        ) : (
          <Field label="Giá" htmlFor="price-donation">
            <Input id="price-donation" value="Miễn phí" disabled />
          </Field>
        )}

        <Field
          label="Chiến dịch"
          htmlFor="campaignId"
          helperText="Nếu chọn chiến dịch, bài đăng sẽ xuất hiện trong feed của chiến dịch sau khi được duyệt."
        >
          <Select id="campaignId" {...register('campaignId')}>
            <option value="">Không tham gia chiến dịch</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tiêu đề / tên món đồ" htmlFor="productTitle">
          <Input id="productTitle" {...register('title')} />
        </Field>

        <Field
          label="Thông tin liên hệ"
          htmlFor="contact"
          error={errors.contact?.message}
        >
          <Input id="contact" {...register('contact')} />
        </Field>

        <Button type="submit" variant="primary" loading={isSubmitting}>
          Gửi duyệt bài
        </Button>

        <p className="small muted">
          Trước khi gửi, hãy đảm bảo bài đăng có nội dung, danh mục và ít nhất 1 ảnh.
        </p>
      </form>

      {/* ---- right: preview ---- */}
      <aside
        className="card stack"
        style={{ position: 'sticky', top: '92px' }}
      >
        <h2>Xem trước bài đăng</h2>
        <PostPreview control={control} campaigns={campaigns} imagePreviews={imagePreviews} />
      </aside>
    </section>
  );
}
