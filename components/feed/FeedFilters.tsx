import { categoryLabelVi } from '@/lib/utils/post-labels';
import type { FeedFilters as FeedFiltersValue } from '@/lib/services/mockApi';
import type { Category } from '@/lib/types/category';

interface FeedFiltersProps {
  categories: Category[];
  value: FeedFiltersValue;
  onChange: (next: FeedFiltersValue) => void;
}

export function FeedFilters({ categories, value, onChange }: FeedFiltersProps) {
  return (
    <div className="toolbar">
      <input
        className="input"
        placeholder="Tìm bài đăng, chiến dịch, người đăng..."
        value={value.keyword ?? ''}
        onChange={(event) =>
          onChange({
            ...value,
            keyword: event.target.value,
          })
        }
      />

      <select
        value={value.type ?? 'All'}
        onChange={(event) =>
          onChange({
            ...value,
            type: event.target.value as FeedFiltersValue['type'],
          })
        }
        aria-label="Loại giao dịch"
      >
        <option value="All">Tất cả loại</option>
        <option value="Sale">Bán lại</option>
        <option value="Exchange">Trao đổi</option>
        <option value="Donation">Quyên góp</option>
      </select>

      <select
        value={value.category ?? 'All'}
        onChange={(event) =>
          onChange({
            ...value,
            category: event.target.value,
          })
        }
        aria-label="Danh mục"
      >
        <option value="All">Tất cả danh mục</option>
        {categories.map((category) => (
          <option key={category.name} value={category.name}>
            {categoryLabelVi(category.name)}
          </option>
        ))}
      </select>

      <select
        value={value.sort ?? 'Newest'}
        onChange={(event) =>
          onChange({
            ...value,
            sort: event.target.value as FeedFiltersValue['sort'],
          })
        }
        aria-label="Sắp xếp"
      >
        <option value="Newest">Mới nhất</option>
        <option value="Price low to high">Giá thấp → cao</option>
        <option value="Price high to low">Giá cao → thấp</option>
      </select>
    </div>
  );
}
