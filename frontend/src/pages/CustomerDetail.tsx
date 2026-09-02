import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Customer, CustomerType, CustomerStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  MessageSquare,
  FileSpreadsheet,
  Edit3,
  UserCheck,
} from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Follow-up modal state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  // Edit Customer modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
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
  const [editError, setEditError] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const { hasRole } = useAuth();
  const toast = useToast();
  const canEdit = hasRole('ADMIN', 'SALES');

  useEffect(() => {
    fetchCustomerDetail();
  }, [id]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!customer) return;
    setEditFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.followUpDate ? customer.followUpDate.split('T')[0] : '',
      notes: customer.notes || '',
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setSubmittingEdit(true);

    try {
      const res = await api.put(`/customers/${id}`, editFormData);
      if (res.data.success) {
        toast.success(`Customer '${editFormData.name}' updated successfully!`, 'Profile Updated');
        setIsEditModalOpen(false);
        fetchCustomerDetail();
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update customer profile');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFollowUp(true);
    try {
      const res = await api.post(`/customers/${id}/follow-ups`, {
        note: followUpNote,
        followUpDate: nextDate,
      });
      if (res.data.success) {
        toast.success('Follow-up recorded successfully', 'CRM Logged');
        setIsFollowUpModalOpen(false);
        setFollowUpNote('');
        setNextDate('');
        fetchCustomerDetail();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record follow-up', 'Follow-up Error');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  if (loading && !customer) return <LoadingSkeleton message="Loading customer CRM profile..." />;
  if (error || !customer) return <ErrorState message={error || 'Customer profile not found'} onRetry={fetchCustomerDetail} />;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/customers" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Customer Directory</span>
        </Link>

        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={openEditModal}>
            <Edit3 size={15} />
            <span>Edit Customer Profile</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Customer Profile Summary Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'white' }}>{customer.name}</h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Account ID: <code>#{customer.id}</code>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
              <span className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</span>
              <span className={`badge badge-${customer.customerType.toLowerCase()}`}>{customer.customerType}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Building size={16} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Business Name</div>
                <div style={{ color: 'white', fontWeight: 600 }}>{customer.businessName}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Phone size={16} color="var(--accent-emerald)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile Number</div>
                <div>{customer.mobile}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Mail size={16} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                <div>{customer.email}</div>
              </div>
            </div>

            {customer.gstNumber && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <UserCheck size={16} color="var(--accent-amber)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GST Registration</div>
                  <div style={{ fontWeight: 600 }}>{customer.gstNumber}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <MapPin size={16} color="var(--accent-rose)" style={{ marginTop: '0.2rem' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Address</div>
                <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>{customer.address}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Calendar size={16} color="var(--accent-amber)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next Scheduled Follow-Up</div>
                <div style={{ fontWeight: 600, color: customer.followUpDate ? 'var(--accent-amber)' : 'var(--text-dim)' }}>
                  {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'None Scheduled'}
                </div>
              </div>
            </div>

            {customer.notes && (
              <div style={{ marginTop: '0.5rem', padding: '0.85rem', background: '#0f172a', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>INTERNAL CRM NOTES</div>
                <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>{customer.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & Follow-ups Section */}
        <div>
          <div className="card-table" style={{ marginBottom: '1.5rem' }}>
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <MessageSquare size={18} color="var(--primary)" />
                <span>CRM Follow-Up Interaction History</span>
              </div>
              {canEdit && (
                <button className="btn btn-primary btn-sm" onClick={() => setIsFollowUpModalOpen(true)}>
                  <Plus size={14} />
                  <span>Log Follow-Up</span>
                </button>
              )}
            </div>

            {!customer.followUps || customer.followUps.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No follow-up interactions recorded yet for this client.
              </div>
            ) : (
              <div style={{ padding: '1.5rem' }}>
                {customer.followUps.map((f) => (
                  <div key={f.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <MessageSquare size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{f.createdBy?.name || 'Sales Executive'}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', background: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', lineHeight: 1.4 }}>
                        {f.note}
                      </div>
                      {f.followUpDate && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} />
                          <span>Next action scheduled for: {new Date(f.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Sales Challans */}
          <div className="card-table">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <FileSpreadsheet size={18} color="var(--accent-cyan)" />
                <span>Associated Sales Delivery Challans</span>
              </div>
            </div>

            {!customer.challans || customer.challans.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No sales delivery challans generated for this customer yet.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Challan No.</th>
                      <th>Total Quantity</th>
                      <th>Status</th>
                      <th>Date Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.challans.map((ch) => (
                      <tr key={ch.id}>
                        <td>
                          <Link to={`/challans/${ch.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            <code>{ch.challanNumber}</code>
                          </Link>
                        </td>
                        <td>{ch.totalQuantity} units</td>
                        <td>
                          <span className={`badge badge-${ch.status.toLowerCase()}`}>{ch.status}</span>
                        </td>
                        <td>{new Date(ch.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Customer Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Profile">
        {editError && (
          <div style={{ color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {editError}
          </div>
        )}

        <form onSubmit={handleEditSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input required className="form-control" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input required className="form-control" value={editFormData.businessName} onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input required className="form-control" value={editFormData.mobile} onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input required type="email" className="form-control" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">GST Number (Optional)</label>
              <input className="form-control" value={editFormData.gstNumber} onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Type *</label>
              <select className="form-control" value={editFormData.customerType} onChange={(e) => setEditFormData({ ...editFormData, customerType: e.target.value as CustomerType })}>
                <option value="RETAIL">RETAIL</option>
                <option value="WHOLESALE">WHOLESALE</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Office Address *</label>
            <input required className="form-control" value={editFormData.address} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-control" value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as CustomerStatus })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="LEAD">LEAD</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Next Follow-Up Date</label>
              <input type="date" className="form-control" value={editFormData.followUpDate} onChange={(e) => setEditFormData({ ...editFormData, followUpDate: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal CRM Notes</label>
            <textarea className="form-control" rows={3} value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submittingEdit}>
              {submittingEdit ? 'Saving...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Follow-Up Modal */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Log Customer Follow-Up">
        <form onSubmit={handleAddFollowUp}>
          <div className="form-group">
            <label className="form-label">Interaction Note *</label>
            <textarea
              required
              className="form-control"
              rows={4}
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="Record details of conversation, email, or client meeting..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Next Scheduled Follow-Up Date *</label>
            <input
              type="date"
              required
              className="form-control"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submittingFollowUp}>
              {submittingFollowUp ? 'Logging...' : 'Save Follow-Up'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
