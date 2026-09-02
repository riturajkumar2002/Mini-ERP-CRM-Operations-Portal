import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardData } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import {
  Users,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PlusCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load operational dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <LoadingSkeleton message="Initializing Operations Command Center..." />;
  if (error || !data) return <ErrorState message={error || 'Dashboard state unavailable'} onRetry={fetchDashboard} />;

  return (
    <div>
      {/* Welcome Operations Command Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          padding: '1.35rem 1.5rem',
          marginBottom: '1.35rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
            <Sparkles size={15} />
            <span>Operations Command Center</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Welcome back, {user?.name}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Operating with <strong>{user?.role}</strong> privileges across inventory, CRM & sales delivery workflows.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Link to="/customers" className="btn btn-secondary btn-sm">
            <Users size={15} />
            <span>CRM Directory</span>
          </Link>
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <Link to="/challans/new" className="btn btn-primary btn-sm">
              <PlusCircle size={15} />
              <span>Create Challan</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div>
            <div className="stat-val">{data.totalCustomers}</div>
            <div className="stat-lbl">Total Clients ({data.activeCustomers} Active)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)' }}>
            <Package size={22} />
          </div>
          <div>
            <div className="stat-val">{data.totalProducts}</div>
            <div className="stat-lbl">Catalog Products</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: data.lowStockCount > 0 ? 'rgba(244, 63, 94, 0.35)' : undefined }}>
          <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-val" style={{ color: data.lowStockCount > 0 ? 'var(--accent-rose)' : undefined }}>
              {data.lowStockCount}
            </div>
            <div className="stat-lbl">Low Stock Alerts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="stat-val">{data.totalChallans}</div>
            <div className="stat-lbl">Total Sales Challans</div>
          </div>
        </div>
      </div>

      {/* 2-Column Operational View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Low Stock Warnings */}
        <div className="card-table">
          <div className="table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.92rem' }}>
              <AlertTriangle size={17} color="var(--accent-amber)" />
              <span>Low-Stock Inventory Warnings</span>
            </div>
            <Link to="/inventory" className="btn btn-secondary btn-sm">
              Manage Stock
            </Link>
          </div>

          {data.lowStockProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              All catalog items are currently above minimum stock thresholds.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Min Qty</th>
                    <th>Warehouse</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><code>{p.sku}</code></td>
                      <td style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{p.currentStock} units</td>
                      <td>{p.minStockQty} units</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.warehouse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Challans */}
        <div className="card-table">
          <div className="table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.92rem' }}>
              <TrendingUp size={17} color="var(--primary)" />
              <span>Recent Sales Challans</span>
            </div>
            <Link to="/challans" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>

          {data.recentChallans.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No delivery challans created yet.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Challan No.</th>
                    <th>Customer</th>
                    <th>Total Qty</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentChallans.map((c) => (
                    <tr key={c.id}>
                      <td><code>{c.challanNumber}</code></td>
                      <td style={{ fontWeight: 600 }}>{c.customer?.businessName || c.customer?.name}</td>
                      <td>{c.totalQuantity} units</td>
                      <td>
                        <span className={`badge badge-${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/challans/${c.id}`} style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.82rem' }}>
                          <span>Inspect</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
