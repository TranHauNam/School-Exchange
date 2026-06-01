import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/common/Button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ErrorState } from '@/components/common/ErrorState';
import { Field } from '@/components/common/Field';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHead } from '@/components/layout/PageHead';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi, type CreateCampaignInput } from '@/lib/services/mockApi';
import type { CampaignType } from '@/lib/types/campaign';
import {
  createCampaignSchema,
  type CreateCampaignInput as CreateCampaignFormInput,
} from '@/lib/types/schemas';
import { useRequireRole } from '@/lib/withRoleGuard';

type PageMode = 'create' | 'edit';

const CAMPAIGN_TYPES: CampaignType[] = ['Fundraising', 'Donation', 'Mixed'];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['activity-admin']);

  const editId =
    typeof router.query.edit === 'string' ? router.query.edit : undefined;
  const mode: PageMode = editId ? 'edit' : 'create';

  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [loadError, setLoadError] = useState('');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCampaignFormInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      organizer: '',
      description: '',
      type: 'Donation',
      is_free: true,
      intermediary_fee: 0,
      start: todayDate(),
      end: futureDate(20),
    },
  });

  const isFree = watch('is_free');

  // Load existing campaign for edit mode
  const loadCampaign = useCallback(
    async (campaignId: string) => {
      setLoadingCampaign(true);
      setLoadError('');
      try {
        const c = await mockApi.campaigns.getCampaign(campaignId);
        reset({
          name: c.name,
          organizer: c.organizer,
          description: c.description,
          type: c.type,
          is_free: c.is_free,
          intermediary_fee: c.intermediary_fee ?? 0,
          start: c.start,
          end: c.end,
        });
      } catch (e) {
        setLoadError(
          e instanceof ApiError
            ? e.message
            : 'Không thể tải thông tin campaign.',
        );
      } finally {
        setLoadingCampaign(false);
      }
    },
    [reset],
  );

  useEffect(() => {
    if (!isAuthorized) return;
    if (editId) {
      const t = setTimeout(() => { void loadCampaign(editId); }, 120);
      return () => clearTimeout(t);
    }
  }, [isAuthorized, editId, loadCampaign]);

  const submit = handleSubmit(
    async (values) => {
      const input: CreateCampaignInput = {
        name: values.name.trim(),
        organizer: values.organizer?.trim() || '',
        description: values.description ?? '',
        type: values.type,
        is_free: values.is_free,
        intermediary_fee: values.intermediary_fee ?? 0,
        start: values.start,
        end: values.end,
      };

      if (mode === 'edit' && editId) {
        await mockApi.campaigns.updateCampaign(editId, input);
        show('Đã cập nhật campaign.', 'success');
      } else {
        await mockApi.campaigns.createCampaign(input);
        show('Đã tạo campaign. Campaign sẽ hiện ở My Campaigns.', 'success');
      }
      router.push('/activity-admin/my-campaigns');
    },
    () => {
      show('Vui lòng kiểm tra các trường được đánh dấu.', 'error');
    },
  );

  if (guardLoading || !isAuthorized) return null;

  const pageTitle = mode === 'edit' ? 'Sửa campaign' : 'Tạo / sửa chiến dịch';

  return (
    <>
      <Head>
        <title>{pageTitle} · School Item Exchange</title>
      </Head>
      <DashboardLayout
        eyebrow="Cổng trường học"
        title={mode === 'edit' ? 'Sửa hoạt động' : 'Tạo hoạt động'}
      >
        <PageHead
          title={pageTitle}
          description="Form campaign có validation ngày kết thúc sau ngày bắt đầu."
        />

        {mode === 'edit' && loadingCampaign && (
          <LoadingState message="Đang tải thông tin campaign..." />
        )}
        {mode === 'edit' && loadError && (
          <ErrorState
            message={loadError}
            onRetry={() => editId && loadCampaign(editId)}
          />
        )}
        {(!editId || (!loadingCampaign && !loadError)) && (
          <section className="grid cols-2">
            <form
              className="card stack"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Field
                label="Tên hoạt động"
                htmlFor="campaignName"
                error={errors.name?.message}
              >
                <Input
                  id="campaignName"
                  placeholder="Ngày hội trao tặng dụng cụ học tập"
                  {...register('name')}
                />
              </Field>

              <Field label="Mô tả" htmlFor="campaignDesc">
                <Textarea
                  id="campaignDesc"
                  placeholder="Kêu gọi học sinh gửi dụng cụ còn tốt cho tủ đồ dùng chung."
                  {...register('description')}
                />
              </Field>

              <Field label="Đơn vị tổ chức" htmlFor="organizer">
                <Input
                  id="organizer"
                  placeholder="CLB Green Life"
                  {...register('organizer')}
                />
              </Field>

              <div className="grid cols-2">
                <Field label="Loại hoạt động" htmlFor="campaignType">
                  <Select id="campaignType" {...register('type')}>
                    {CAMPAIGN_TYPES.map((t) => {
                      const label =
                        t === 'Fundraising'
                          ? 'Gây quỹ'
                          : t === 'Donation'
                          ? 'Quyên góp'
                          : 'Kết hợp';
                      return (
                        <option key={t} value={t}>
                          {label}
                        </option>
                      );
                    })}
                  </Select>
                </Field>

                <Field label="Miễn phí tham gia?" htmlFor="isFree">
                  <Controller
                    control={control}
                    name="is_free"
                    render={({ field }) => (
                      <Select
                        id="isFree"
                        value={field.value ? 'Yes' : 'No'}
                        onChange={(e) =>
                          field.onChange(e.target.value === 'Yes')
                        }
                      >
                        <option value="Yes">Có</option>
                        <option value="No">Không</option>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              {!isFree && (
                <Field
                  label="Phí tham gia (%)"
                  htmlFor="intermediaryFee"
                  error={errors.intermediary_fee?.message}
                >
                  <Input
                    id="intermediaryFee"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="5"
                    {...register('intermediary_fee', { valueAsNumber: true })}
                  />
                </Field>
              )}

              <div className="grid cols-2">
                <Field
                  label="Ngày bắt đầu"
                  htmlFor="startDate"
                  error={errors.start?.message}
                >
                  <Input id="startDate" type="date" {...register('start')} />
                </Field>

                <Field
                  label="Ngày kết thúc"
                  htmlFor="endDate"
                  error={errors.end?.message}
                >
                  <Input id="endDate" type="date" {...register('end')} />
                </Field>
              </div>

              <Button variant="primary" loading={isSubmitting} type="submit">
                {mode === 'edit' ? 'Cập nhật hoạt động' : 'Lưu hoạt động'}
              </Button>
            </form>

            <aside className="card" style={{ padding: 24 }}>
              {/* Header: title + subtitle on left, badge on right */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 650,
                      color: 'var(--fg)',
                      lineHeight: 1.3,
                    }}
                  >
                    Kiểm tra trước khi lưu
                  </h2>
                  <p className="mt-1 text-sm muted">
                    Hoàn tất các thông tin cần thiết trước khi lưu hoạt động.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold whitespace-nowrap text-blue-700">
                  Sắp diễn ra
                </span>
              </div>

              {/* Validation checklist */}
              <div
                className="mt-5 rounded-lg"
                style={{ background: 'var(--bg)', padding: 16 }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: 'var(--muted)',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Điều kiện bắt buộc
                </p>
                <ul
                  className="space-y-3"
                  style={{ listStyle: 'none', margin: 0, padding: 0 }}
                >
                  <li className="flex gap-3">
                    <span
                      style={{
                        color: 'var(--success)',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ✓
                    </span>
                    <div>
                      <p
                        className="text-sm"
                        style={{ fontWeight: 600, color: 'var(--fg)' }}
                      >
                        Tên hoạt động
                      </p>
                      <p className="text-xs muted" style={{ marginTop: 2 }}>
                        Không được bỏ trống.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span
                      style={{
                        color: 'var(--success)',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ✓
                    </span>
                    <div>
                      <p
                        className="text-sm"
                        style={{ fontWeight: 600, color: 'var(--fg)' }}
                      >
                        Ngày kết thúc
                      </p>
                      <p className="text-xs muted" style={{ marginTop: 2 }}>
                        Phải sau ngày bắt đầu.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span
                      style={{
                        color: 'var(--success)',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ✓
                    </span>
                    <div>
                      <p
                        className="text-sm"
                        style={{ fontWeight: 600, color: 'var(--fg)' }}
                      >
                        Phí trung gian
                      </p>
                      <p className="text-xs muted" style={{ marginTop: 2 }}>
                        Nếu có, phải từ 0–100%.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </aside>
          </section>
        )}
      </DashboardLayout>
    </>
  );
}
