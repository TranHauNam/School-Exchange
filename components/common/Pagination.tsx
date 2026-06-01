interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  itemLabel?: string;
  onChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  itemLabel = 'kết quả',
  onChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="pagination">
      <span className="result-summary">
        {typeof totalItems === 'number' ? `${totalItems} ${itemLabel}` : null}
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
      >
        ‹
      </button>
      <button type="button" className="active" disabled>
        {Math.min(page, safeTotalPages)}
      </button>
      <button
        type="button"
        disabled={page >= safeTotalPages}
        onClick={() => onChange(Math.min(safeTotalPages, page + 1))}
      >
        ›
      </button>
    </div>
  );
}
