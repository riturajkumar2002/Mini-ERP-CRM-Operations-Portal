import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="pagination-wrapper">
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        Showing <strong>{start}</strong> to <strong>{end}</strong> of <strong>{total}</strong> entries
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', padding: '0 0.5rem', fontWeight: 600 }}>
          Page {page} of {totalPages || 1}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
