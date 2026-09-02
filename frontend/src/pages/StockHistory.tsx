import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { StockMovement } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { History, Filter, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

export const StockHistory: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStockHistory(page, typeFilter);
  }, [page, typeFilter]);

  const fetchStockHistory = async (p = page, typeF = typeFilter) => {
    setLoading(true);
    setError('');
    try {
      let url = `/products/stock/history?page=${p}&limit=15`;
      if (typeF) url += `&type=${typeF}`;

      const res = await api.get(url);
      if (res.data.success) {
        setMovements(res.data.data);
        setMeta(res.data.meta || { total: res.data.data.length, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stock movement logs');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setTypeFilter('');
    setPage(1);
    fetchStockHistory(1, '');
  };

  if (loading && movements.length === 0) return <LoadingSkeleton message="Loading stock audit trail..." />;
  if (error && movements.length === 0) return <ErrorState message={error} onRetry={() => fetchStockHistory(1)} />;

  return (
    <div>
      <div className="card-table">
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.95rem' }}>
            <History size={17} color="var(--primary)" />
            <span>Inventory Audit Trail & Stock Movement History</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              style={{ minWidth: '150px', fontSize: '0.82rem' }}
            >
              <option value="">All Movement Types</option>
              <option value="IN">Stock IN (Receipts)</option>
              <option value="OUT">Stock OUT (Dispatches)</option>
            </select>

            {typeFilter && (
              <button className="btn btn-secondary btn-sm" onClick={handleClearFilters} title="Reset Filter">
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {movements.length === 0 ? (
          <EmptyState
            title="No Stock Movements Logged"
            description="There are no inventory stock transactions recorded in the audit history."
            icon={<History size={26} />}
          />
        ) : (
          <>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Product Name</th>
                    <th>SKU Code</th>
                    <th>Movement</th>
                    <th>Quantity</th>
                    <th>Reason / Reference</th>
                    <th>Executed By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.product?.name || 'Deleted Product'}</div>
                      </td>
                      <td><code>{m.product?.sku}</code></td>
                      <td>
                        <span className={`badge ${m.type === 'IN' ? 'badge-in' : 'badge-out'}`}>
                          {m.type === 'IN' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                          <span>{m.type}</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        <span style={{ color: m.type === 'IN' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity} units
                        </span>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--text-main)', maxWidth: '300px' }}>
                        {m.reason}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{m.createdBy?.name || 'System User'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Role: {m.createdBy?.role}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={15}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
};
