export type CategoryStatus = 'Active' | 'Inactive';

export interface Category {
  name: string;               // dùng làm khóa (tên duy nhất)
  desc: string;               // mô tả
  status: CategoryStatus;     // chỉ 'Active' mới chọn được khi tạo Post
  count: number;              // số lượng sản phẩm liên kết (product count)
}
