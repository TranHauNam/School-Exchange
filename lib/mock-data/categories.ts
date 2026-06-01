import { Category } from '@/lib/types/category';

// Seed nguyên văn từ seedState.categories trong open_design/js/app.js.
export const seedCategories: Category[] = [
  {
    name: 'Books',
    desc: 'Sách giáo khoa, sách tham khảo được phép trao đổi.',
    status: 'Active',
    count: 42,
  },
  {
    name: 'Uniforms',
    desc: 'Đồng phục còn sử dụng tốt, đúng quy định trường.',
    status: 'Active',
    count: 18,
  },
  {
    name: 'Study electronics',
    desc: 'Máy tính, đèn học, thiết bị học tập nhỏ.',
    status: 'Active',
    count: 15,
  },
  {
    name: 'Sports equipment',
    desc: 'Dụng cụ thể thao cho CLB và giờ thể dục.',
    status: 'Active',
    count: 9,
  },
  {
    name: 'School supplies',
    desc: 'Balo, hộp bút, vở, dụng cụ học tập.',
    status: 'Active',
    count: 27,
  },
  {
    name: 'Other allowed items',
    desc: 'Các vật phẩm khác sau khi admin duyệt.',
    status: 'Inactive',
    count: 4,
  },
];
