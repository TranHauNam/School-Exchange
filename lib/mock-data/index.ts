// Re-export tất cả seed dữ liệu để import tiện lợi.
// Lưu ý: chỉ mockStore/mockApi được import từ đây — components/pages KHÔNG import trực tiếp.
export { seedPosts } from './posts';
export { seedCampaigns } from './campaigns';
export { seedRequests } from './requests';
export { seedCategories } from './categories';
export { seedUsers } from './users';
export type { MockUser } from './users';
