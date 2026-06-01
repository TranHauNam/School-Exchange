import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';

import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { money } from '@/lib/utils/money';
import {
  avatarText,
  categoryLabelVi,
  typeBadgeStatus,
  typeLabel,
} from '@/lib/utils/post-labels';
import type { CreatePostInput } from '@/lib/types/schemas';
import type { Campaign } from '@/lib/types/campaign';

// ---- component ----

interface PostPreviewProps {
  control: Control<CreatePostInput>;
  campaigns: Campaign[];
  /** Object URLs from UploadField for immediate preview before base64 read completes. */
  imagePreviews?: string[];
}

export function PostPreview({ control, campaigns, imagePreviews }: PostPreviewProps) {
  const watched = useWatch({ control });

  const title = watched.title ?? '';
  const content = watched.content ?? '';
  const type = watched.type ?? 'Sale';
  const price = watched.price;
  const category = watched.category ?? '';
  const campaignId = watched.campaignId ?? '';
  const imageName = watched.imageName ?? '';

  // Resolve the best image source:
  // 1. Object URL from UploadField (instant preview)
  // 2. data:image/... from form state (base64 after FileReader completes)
  // 3. Fallback to placeholder
  const previewImage =
    (imagePreviews && imagePreviews.length > 0 ? imagePreviews[0] : null) ??
    (imageName && imageName.startsWith('data:image/') ? imageName : null);

  const hasContent =
    title.trim().length > 0 ||
    content.trim().length > 0 ||
    category.length > 0;

  const selectedCampaign = campaignId
    ? campaigns.find((c) => c.id === campaignId)
    : null;

  if (!hasContent) {
    return (
      <EmptyState message="Bản xem trước sẽ hiển thị khi bạn nhập thông tin bài đăng." />
    );
  }

  const today = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="post-card">
      {/* ---- pending badge ---- */}
      <Badge status="pending-approval" label="Chờ duyệt" />

      {/* ---- header: avatar + name + date + kind badge ---- */}
      <header className="post-header">
        <div className="avatar post-avatar">{avatarText('Bạn')}</div>
        <div className="post-author">
          <strong>Bạn (xem trước)</strong>
          <span>Member · {today}</span>
        </div>
        <span className="post-kind">
          {campaignId ? 'Chiến dịch' : 'Bài thường'}
        </span>
      </header>

      {/* ---- campaign tag (if any) ---- */}
      {selectedCampaign ? (
        <div className="campaign-tag">
          <span>Chiến dịch</span>
          {selectedCampaign.name}
        </div>
      ) : null}

      {/* ---- content ---- */}
      <div className="post-copy">
        <p>
          {title ? (
            <>
              <strong>{title}</strong>
              {content ? <br /> : null}
            </>
          ) : null}
          {content || 'Chưa có nội dung'}
        </p>
      </div>

      {/* ---- image ---- */}
      {previewImage ? (
        <div className="post-image post-image-real">
          <img
            src={previewImage}
            alt={title || 'Ảnh xem trước'}
            className="post-image-img"
          />
        </div>
      ) : (
        <div className="post-image" aria-label="Ảnh sản phẩm">
          <span className="post-image-placeholder">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Chưa có ảnh sản phẩm</span>
          </span>
        </div>
      )}

      {/* ---- metadata: type badge + price + category ---- */}
      <div className="post-meta-row">
        <Badge status={typeBadgeStatus(type)} label={typeLabel(type)} />
        {type === 'Sale' && price !== undefined ? (
          <span className="price-chip">{money(price)}</span>
        ) : null}
        {type === 'Exchange' && price !== undefined && price > 0 ? (
          <span className="price-chip">{money(price)}</span>
        ) : null}
        {category ? (
          <span className="post-category">{categoryLabelVi(category)}</span>
        ) : null}
      </div>

      {/* ---- actions (disabled preview) ---- */}
      <footer className="post-actions">
        <span className="btn secondary" style={{ opacity: 0.5, cursor: 'default' }}>
          Xem chi tiết
        </span>
        <span className="btn primary" style={{ opacity: 0.5, cursor: 'default' }}>
          Gửi yêu cầu
        </span>
      </footer>
    </article>
  );
}
