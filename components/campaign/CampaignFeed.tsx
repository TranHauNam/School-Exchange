import Link from 'next/link';

import { PostCard } from '@/components/feed/PostCard';
import type { Post, TransactionType } from '@/lib/types/post';

interface CampaignFeedProps {
  posts: Post[];
  currentUserName?: string;
  typeFilter: TransactionType | 'All';
  onTypeChange: (type: TransactionType | 'All') => void;
  onRequest?: (post: Post) => void;
}

export function CampaignFeed({
  posts,
  currentUserName,
  typeFilter,
  onTypeChange,
  onRequest,
}: CampaignFeedProps) {
  return (
    <section className="feed-layout" style={{ marginTop: 20 }}>
      <div className="stack">
        <section className="card">
          <div className="between">
            <div>
              <h2>Bảng tin chiến dịch</h2>
              <p>Chỉ hiển thị bài đăng thuộc campaign này.</p>
            </div>
            <select
              style={{ maxWidth: 180 }}
              value={typeFilter}
              onChange={(event) =>
                onTypeChange(event.target.value as TransactionType | 'All')
              }
            >
              <option value="All">Tất cả</option>
              <option value="Sale">Bán lại</option>
              <option value="Exchange">Trao đổi</option>
              <option value="Donation">Quyên góp</option>
            </select>
          </div>
        </section>

        <div className="post-feed">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwn={post.owner === currentUserName}
              onRequest={onRequest}
            />
          ))}
        </div>
      </div>

      <aside className="feed-side">
        <article className="card stack">
          <h3>Về chiến dịch này</h3>
          <p>
            Bài đăng trong chiến dịch cũng xuất hiện trên Bảng tin trường kèm tag chiến dịch.
          </p>
          <Link href="/member/feed">Xem bảng tin trường</Link>
        </article>
      </aside>
    </section>
  );
}
