import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Customer, CustomerType, CustomerStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { Search, Plus, Eye, Edit3, Trash2, RotateCcw, Phone, Mail, User } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasRole } = useAuth();
  const toast = useToast();
  const canEdit = hasRole('ADMIN', 'SALES');
  const canDelete = hasRole('ADMIN');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE' as CustomerType,
    address: '',
    status: 'ACTIVE' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers(page, search, typeFilter, statusFilter);
  }, [page, typeFilter, statusFilter]);

  const fetchCustomers = async (
    p = page,
    searchQuery = search,
    tFilter = typeFilter,
    sFilter = statusFilter
  ) => {
    setLoading(true);
    setError('');
    try {
      let url = `/customers?page=${p}&limit=10&search=${encodeURIComponent(searchQuery)}`;
      if (sFilter) url += `&status=${encodeURIComponent(sFilter)}`;

      const res = await api.get(url);
      if (res.data.success) {
        let list: Customer[] = res.data.data;
        if (tFilter) {
          list = list.filter((c) => c.customerType === tFilter);
        }
        setCustomers(list);
        setMeta(res.data.meta || { total: list.length, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customer list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearch(query);
    setPage(1);
    fetchCustomers(1, query, typeFilter, statusFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
    fetchCustomers(1, '', '', '');
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'ACTIVE',
      followUpDate: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '',
      notes: c.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer.id}`, formData);
        if (res.data.success) {
          toast.success(`Customer '${formData.name}' updated successfully`, 'Customer Updated');
          setIsModalOpen(false);
          fetchCustomers(page);
        }
      } else {
        const res = await api.post('/customers', formData);
        if (res.data.success) {
          toast.success(`Customer '${formData.name}' created successfully`, 'Customer Created');
          setIsModalOpen(false);
          fetchCustomers(1);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save customer details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/customers/${deleteId}`);
      if (res.data.success) {
        toast.success('Customer profile deleted', 'Deleted');
        setDeleteId(null);
        fetchCustomers(page);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete customer profile', 'Delete Error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && customers.length === 0) return <LoadingSkeleton message="Loading customer directory..." />;
  if (error && customers.length === 0) return <ErrorState message={error} onRetry={() => fetchCustomers(1)} />;

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="search-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search by client name, business, mobile, GST..."
            value={search}
            onChange={handleSearchChange}
          />
          <Search size={16} className="search-icon" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Customer Type Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {(['', 'WHOLESALE', 'RETAIL', 'DISTRIBUTOR'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: typeFilter === t ? 600 : 500,
                  cursor: 'pointer',
                  background: typeFilter === t ? 'var(--primary)' : 'transparent',
                  color: typeFilter === t ? 'white' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}
              >
                {t === '' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto', fontSize: '0.82rem' }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="LEAD">LEAD</option>
          </select>

          {(search || typeFilter || statusFilter) && (
            <button onClick={handleClearFilters} className="btn btn-secondary btn-sm" title="Clear search & filters">
              <RotateCcw size={14} />
            </button>
          )}

          {canEdit && (
            <button onClick={openCreateModal} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>+ Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Table */}
      {customers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description={search || typeFilter || statusFilter ? 'No client accounts match your query criteria.' : 'No customer profiles recorded in CRM directory.'}
          actionText={canEdit ? 'Add New Customer' : undefined}
          onAction={canEdit ? openCreateModal : undefined}
        />
      ) : (
        <div className="card-table">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Client / Business</th>
                  <th>Contact info</th>
                  <th>Customer Type</th>
                  <th>GST Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.businessName || c.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={12} />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} color="var(--text-muted)" />
                        <span>{c.mobile}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={12} />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.customerType.toLowerCase()}`}>
                        {c.customerType}
                      </span>
                    </td>
                    <td>
                      {c.gstNumber ? <code>{c.gstNumber}</code> : <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>N/A</span>}
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Link to={`/customers/${c.id}`} className="btn btn-secondary btn-sm" title="View Profile">
                          <Eye size={14} />
                        </Link>
                        {canEdit && (
                          <button onClick={() => openEditModal(c)} className="btn btn-secondary btn-sm" title="Edit Profile">
                            <Edit3 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteId(c.id)} className="btn btn-danger btn-sm" title="Delete Profile">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer Profile'}
      >
        {formError && (
          <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '0.75rem 0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Person Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business / Company Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Apex Industrial Corp"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="+91 98765 43210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="rajesh@apexind.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Type *</label>
              <select
                className="form-control"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
              >
                <option value="WHOLESALE">WHOLESALE</option>
                <option value="RETAIL">RETAIL</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="LEAD">LEAD</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">GST Number (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="27AAAAA0000A1Z5"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Business Address *</label>
            <textarea
              required
              rows={2}
              className="form-control"
              placeholder="Plot 42, Industrial Area, Pune"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Profile"
        message="Are you sure you want to permanently remove this customer profile? This action cannot be undone."
        loading={isDeleting}
      />
    </div>
  );
};
