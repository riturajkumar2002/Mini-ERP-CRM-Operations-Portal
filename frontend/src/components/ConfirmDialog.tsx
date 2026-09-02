import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background:
                variant === 'danger'
                  ? 'rgba(239,68,68,0.15)'
                  : variant === 'warning'
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:
                variant === 'danger'
                  ? 'var(--accent-rose)'
                  : variant === 'warning'
                  ? 'var(--accent-amber)'
                  : 'var(--primary)',
              flexShrink: 0,
            }}
          >
            {variant === 'primary' ? <Info size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${variant === 'primary' ? 'primary' : variant === 'warning' ? 'warning' : 'danger'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
