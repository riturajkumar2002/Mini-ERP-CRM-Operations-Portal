import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Challan } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { Search, Plus, Eye, RotateCcw, Building } from 'lucide-react';

export const Challans: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();
  const canCreate = hasRole('ADMIN', 'SALES');

  useEffect(() => {
    fetchChallans(page, search, statusFilter);
  }, [page, statusFilter]);

  const fetchChallans = async (p = page, searchQuery = search, statusF = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      let url = `/challans?page=${p}&limit=10&search=${encodeURIComponent(searchQuery)}`;
      if (statusF) url += `&status=${encodeURIComponent(statusF)}`;

      const res = await api.get(url);
      if (res.data.success) {
        setChallans(res.data.data);
        setMeta(res.data.meta || { total: res.data.data.length, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sales delivery challans');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearch(query);
    setPage(1);
    fetchChallans(1, query, statusFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
    fetchChallans(1, '', '');
  };

  if (loading && challans.length === 0) return <LoadingSkeleton message="Loading sales delivery challans..." />;
  if (error && challans.length === 0) return <ErrorState message={error} onRetry={() => fetchChallans(1)} />;

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="search-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search by challan # or customer business..."
            value={search}
            onChange={handleSearchChange}
          />
          <Search size={16} className="search-icon" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto', fontSize: '0.82rem' }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {(search || statusFilter) && (
            <button onClick={handleClearFilters} className="btn btn-secondary btn-sm" title="Clear filters">
              <RotateCcw size={14} />
            </button>
          )}

          {canCreate && (
            <Link to="/challans/new" className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>+ Create Challan</span>
            </Link>
          )}
        </div>
      </div>

      {/* Challans Table */}
      {challans.length === 0 ? (
        <EmptyState
          title="No Sales Delivery Challans"
          description={search || statusFilter ? 'No delivery challans match your search query.' : 'No sales delivery challans generated yet.'}
          actionText={canCreate ? 'Create First Delivery Challan' : undefined}
          onAction={canCreate ? () => window.location.href = '/challans/new' : undefined}
        />
      ) : (
        <div className="card-table">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan Number</th>
                  <th>Customer Business</th>
                  <th>Date Created</th>
                  <th>Total Units</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        <code>{c.challanNumber}</code>
                      </Link>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        By: {c.createdBy?.name || 'Sales Manager'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.customer?.businessName || c.customer?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Building size={12} />
                        <span>{c.customer?.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {c.totalQuantity} units
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td>
                      <Link to={`/challans/${c.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} />
                        <span>Inspect</span>
                      </Link>
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
            limit={10}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
};
