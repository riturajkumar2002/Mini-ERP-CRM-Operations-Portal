import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Challan } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { ArrowLeft, CheckCircle, XCircle, FileSpreadsheet, ShieldAlert } from 'lucide-react';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmStatus, setConfirmStatus] = useState<'CONFIRMED' | 'CANCELLED' | null>(null);

  const { hasRole } = useAuth();
  const toast = useToast();
  const canUpdateStatus = hasRole('ADMIN', 'SALES', 'WAREHOUSE');

  useEffect(() => {
    fetchChallanDetail();
  }, [id]);

  const fetchChallanDetail = async () => {
    setLoading(true);
    setError('');
    setActionError('');
    try {
      const res = await api.get(`/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load challan details');
    } finally {
      setLoading(false);
    }
  };

  const executeStatusChange = async () => {
    if (!confirmStatus) return;
    setActionError('');
    setSubmitting(true);

    try {
      const res = await api.put(`/challans/${id}/status`, { status: confirmStatus });
      if (res.data.success) {
        toast.success(
          confirmStatus === 'CONFIRMED'
            ? 'Challan confirmed successfully! Inventory deducted atomically.'
            : 'Challan cancelled.',
          confirmStatus === 'CONFIRMED' ? 'Challan Confirmed' : 'Challan Cancelled'
        );
        setConfirmStatus(null);
        fetchChallanDetail();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to update challan status';
      setActionError(errMsg);
      toast.error(errMsg, 'Status Update Failed');
      setConfirmStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !challan) return <LoadingSkeleton message="Loading delivery challan document..." />;
  if (error || !challan) return <ErrorState message={error || 'Challan record not found'} onRetry={fetchChallanDetail} />;

  const totalValue = challan.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} />
          <span>Back to Challans Directory</span>
        </Link>
      </div>

      {actionError && (
        <div style={{ color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', padding: '0.85rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Confirmation Failed (Atomic Rollback):</strong> {actionError}
          </div>
        </div>
      )}

      {/* Main Document Box */}
      <div className="card-table" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.1rem', marginBottom: '1.1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSpreadsheet size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>Delivery Challan #{challan.challanNumber}</h2>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Created on {new Date(challan.createdAt).toLocaleString()} by <strong>{challan.createdBy?.name}</strong> ({challan.createdBy?.role})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span className={`badge badge-${challan.status.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              STATUS: {challan.status}
            </span>

            {challan.status === 'DRAFT' && canUpdateStatus && (
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setConfirmStatus('CONFIRMED')}
                >
                  <CheckCircle size={14} />
                  <span>Confirm Challan</span>
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmStatus('CANCELLED')}
                >
                  <XCircle size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Customer Details</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>{challan.customer?.businessName}</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Contact: {challan.customer?.name}</div>
            {challan.customer?.gstNumber && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                GST: <code>{challan.customer.gstNumber}</code>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Delivery Address & Contact</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{challan.customer?.address}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Phone: {challan.customer?.mobile}</span>
              <span>Email: {challan.customer?.email}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Line Item Snapshots</h3>
        <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '1.25rem' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Snapshot Unit Price</th>
                <th>Quantity</th>
                <th>Line Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.productName}</td>
                  <td><code>{item.sku}</code></td>
                  <td>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700 }}>{item.quantity} units</td>
                  <td style={{ fontWeight: 700 }}>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total Quantity: <strong style={{ color: 'var(--text-main)' }}>{challan.totalQuantity} units</strong>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
            Total Value: ₹{totalValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        onConfirm={executeStatusChange}
        title={confirmStatus === 'CONFIRMED' ? 'Confirm Delivery Challan & Deduct Stock' : 'Cancel Delivery Challan'}
        message={
          confirmStatus === 'CONFIRMED'
            ? 'Confirming this sales delivery challan will deduct stock for all line items atomically inside a single transaction. If stock is insufficient, the entire operation will roll back.'
            : 'Are you sure you want to cancel this draft delivery challan?'
        }
        loading={submitting}
      />
    </div>
  );
};
