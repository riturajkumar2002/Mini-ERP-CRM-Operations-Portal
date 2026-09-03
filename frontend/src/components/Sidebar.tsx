import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  History,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">N</div>
        <div>
          <div className="brand-title">NexusFlow ERP</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Operations Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Section: MAIN OPERATIONS */}
        <div className="sidebar-section-label">Operations</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/challans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileSpreadsheet size={17} />
          <span>Sales Challans</span>
        </NavLink>

        {(role === 'ADMIN' || role === 'SALES') && (
          <NavLink
            to="/challans/new"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ color: 'var(--primary)', fontWeight: 600 }}
          >
            <PlusCircle size={17} />
            <span>+ Create Challan</span>
          </NavLink>
        )}

        {/* Section: CRM & CATALOG */}
        <div className="sidebar-section-label" style={{ marginTop: '0.75rem' }}>
          Directory & Catalog
        </div>
        <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} />
          <span>Customer CRM</span>
        </NavLink>

        <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={17} />
          <span>Products Catalog</span>
        </NavLink>

        {/* Section: INVENTORY */}
        <div className="sidebar-section-label" style={{ marginTop: '0.75rem' }}>
          Inventory Control
        </div>
        {(role === 'ADMIN' || role === 'WAREHOUSE') && (
          <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Boxes size={17} />
            <span>Inventory Stock</span>
          </NavLink>
        )}

        <NavLink to="/stock-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={17} />
          <span>Stock Audit Log</span>
        </NavLink>
      </nav>

      {/* Footer Role Badge */}
      <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="var(--primary)" />
          <span>Role: <strong style={{ color: 'var(--text-main)' }}>{role}</strong></span>
        </div>
        <span>v1.0</span>
      </div>
    </aside>
  );
};
