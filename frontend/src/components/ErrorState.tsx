import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message,
  onRetry,
}) => {
  return (
    <div
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(239,68,68,0.08)',
        borderRadius: 'var(--radius)',
        border: '1px solid rgba(239,68,68,0.3)',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.2)',
          color: 'var(--accent-rose)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto',
        }}
      >
        <AlertCircle size={26} />
      </div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.35rem' }}>{title}</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', maxWidth: '460px', margin: '0 auto 1.25rem auto', lineHeight: 1.5 }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
