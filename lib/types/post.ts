export type TransactionType = 'Sale' | 'Exchange' | 'Donation';

export type PostStatus =
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Removed';

export type OwnerRole = 'Student' | 'Teacher' | 'Member' | 'System Admin' | 'Activity Admin';

export interface Post {
  id: string;                  // ví dụ 'p1', 'p' + Date.now()
  title: string;               // tên món đồ (post title)
  icon: string;                // placeholder ảnh dạng text (∑, BOOK, UNI, POST...)
  type: TransactionType;
  price: number;               // quy tắc giá: Sale >= 0; Exchange/Donation = 0
  category: string;            // tên Category
  owner: string;               // tên người đăng (khớp ROLE_DISPLAY_NAME)
  ownerRole: OwnerRole;        // Student | Teacher (hiển thị trên PostCard)
  status: PostStatus;
  campaignId?: string;         // vắng/undefined => Normal Post; có => Campaign Post
  campaignName?: string;       // tên campaign liên kết (đi kèm campaignId)
  date: string;                // ISO date 'YYYY-MM-DD'
  content: string;             // nội dung văn bản hiển thị trên feed
  description: string;         // mô tả chi tiết (trang Post Detail)
  contact: string;             // thông tin liên hệ
  reason?: string;             // lý do từ chối, chỉ có khi status = 'Rejected'/'Removed'
}
