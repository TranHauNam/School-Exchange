import { ProductRequest } from '@/lib/types/request';

// Seed nguyên văn từ seedState.requests trong open_design/js/app.js (r1–r4).
export const seedRequests: ProductRequest[] = [
  {
    id: 'r1',
    productId: 'p4',
    product: 'Vợt cầu lông Yonex cũ',
    sender: 'Nguyễn Minh An',
    receiver: 'Trần Thị Mai',
    type: 'Purchase',
    status: 'Pending',
    date: '2026-05-29',
  },
  {
    id: 'r2',
    productId: 'p2',
    product: 'Bộ sách giáo khoa lớp 10',
    sender: 'Nguyễn Minh An',
    receiver: 'Trần Thị Mai',
    type: 'Donation',
    status: 'Accepted',
    date: '2026-05-27',
  },
  {
    id: 'r3',
    productId: 'p1',
    product: 'Máy tính Casio fx-580VN X',
    sender: 'Trần Thị Mai',
    receiver: 'Nguyễn Minh An',
    type: 'Purchase',
    status: 'Completed',
    date: '2026-05-25',
  },
  {
    id: 'r4',
    productId: 'p3',
    product: 'Áo đồng phục size M',
    sender: 'Trần Thị Mai',
    receiver: 'Nguyễn Minh An',
    type: 'Exchange',
    status: 'Pending',
    date: '2026-05-31',
  },
];
