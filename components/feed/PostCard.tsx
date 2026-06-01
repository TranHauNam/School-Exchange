import Link from 'next/link';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/lib/utils/formatDate';
import { money } from '@/lib/utils/money';
import {
  avatarText,
  categoryLabelVi,
  typeBadgeStatus,
  typeLabel,
} from '@/lib/utils/post-labels';
import type { Post } from '@/lib/types/post';

interface PostCardProps {
  post: Post;
  isOwn: boolean;
  onRequest?: (post: Post) => void;
  onOpenCampaign?: (campaignId: string) => void;
}

// ---- helpers ----

function requestActionLabel(post: Post, isOwn: boolean): string {
  if (isOwn) return 'Bài của bạn';
  if (post.type === 'Sale') return 'Gửi yêu cầu mua';
  if (post.type === 'Exchange') return 'Gửi yêu cầu trao đổi';
  return 'Xin nhận quyên góp';
}

// ---- component ----

export function PostCard({ post, isOwn, onRequest, onOpenCampaign }: PostCardProps) {
  const canRequest = !isOwn && post.status === 'Approved';

  return (
    <article className={`post-card ${post.campaignId ? 'campaign-post' : ''}`}>
      {/* ---- header: avatar + name + role/date + kind badge ---- */}
      <header className="post-header">
        <div className="avatar post-avatar">{avatarText(post.owner)}</div>
        <div className="post-author">
          <strong>{post.owner}</strong>
          <span>
            {post.ownerRole} · {formatDate(post.date)}
          </span>
        </div>
        <span className={`post-kind${post.campaignId ? ' post-kind-campaign' : ''}`}>
          {post.campaignId ? 'Chiến dịch' : 'Bài thường'}
        </span>
      </header>

      {/* ---- campaign tag (if any) ---- */}
      {post.campaignId ? (
        onOpenCampaign ? (
          <button
            type="button"
            className="campaign-tag"
            onClick={() => onOpenCampaign(post.campaignId!)}
          >
            <svg className="campaign-tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
            <span>Chiến dịch</span>
            {post.campaignName}
          </button>
        ) : (
          <Link
            className="campaign-tag"
            href={`/member/campaigns/${post.campaignId}`}
          >
            <svg className="campaign-tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
            <span>Chiến dịch</span>
            {post.campaignName}
          </Link>
        )
      ) : null}

      {/* ---- content ---- */}
      <div className="post-copy">
        <p>{post.content || post.description || post.title}</p>
      </div>

      {/* ---- image ---- */}
      {post.icon && post.icon.startsWith('data:image/') ? (
        <div className="post-image post-image-real">
          <img
            src={post.icon}
            alt={post.title || 'Ảnh bài đăng'}
            className="post-image-img"
          />
        </div>
      ) : (
        <div className="post-image" aria-label="Ảnh sản phẩm">
          <div className="post-image-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>{post.icon || 'Chưa có ảnh sản phẩm'}</span>
          </div>
        </div>
      )}

      {/* ---- metadata: type badge + price + category ---- */}
      <div className="post-meta-row">
        <Badge status={typeBadgeStatus(post.type)} label={typeLabel(post.type)} />
        {post.type === 'Sale' ? (
          <span className="price-chip">{money(post.price)}</span>
        ) : null}
        <span className="post-category">{categoryLabelVi(post.category)}</span>
      </div>

      {/* ---- actions ---- */}
      <footer className="post-actions">
        <Link className="post-btn post-btn-detail" href={`/products/${post.id}`}>
          Xem chi tiết
        </Link>
        {isOwn ? (
          <Link className="post-btn post-btn-edit" href={`/member/create-post?edit=${post.id}`}>
            Chỉnh sửa bài
          </Link>
        ) : (
          <Button
            variant={canRequest ? 'primary' : 'secondary'}
            disabled={!canRequest}
            onClick={() => onRequest?.(post)}
          >
            {requestActionLabel(post, isOwn)}
          </Button>
        )}
      </footer>
    </article>
  );
}
