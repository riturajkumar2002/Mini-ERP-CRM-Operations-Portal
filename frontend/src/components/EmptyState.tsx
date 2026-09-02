import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no records matching your criteria.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.1)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
        }}
      >
        {icon || <FolderOpen size={26} />}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.4rem' }}>{title}</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
