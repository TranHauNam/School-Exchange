// RequestType phản chiếu TransactionType của Post:
//   'Purchase'  <-> Sale
//   'Exchange'  <-> Exchange
//   'Donation'  <-> Donation
export type RequestType = 'Purchase' | 'Exchange' | 'Donation';

export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Cancelled';

export interface ProductRequest {
  id: string;                 // 'r1', 'r' + Date.now()
  productId: string;          // -> Post.id
  product: string;            // tiêu đề Post tại thời điểm gửi (snapshot)
  sender: string;             // tên người gửi yêu cầu
  receiver: string;           // tên owner của Post
  type: RequestType;          // Sale -> Purchase; còn lại giữ nguyên
  status: RequestStatus;
  date: string;               // ISO date
}
