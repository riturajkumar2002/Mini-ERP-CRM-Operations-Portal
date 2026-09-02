import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Customer, Product } from '../types';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { ArrowLeft, Plus, Trash2, FileSpreadsheet, AlertTriangle, Package } from 'lucide-react';

interface ItemRow {
  productId: number;
  quantity: number;
}

export const CreateChallan: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [items, setItems] = useState<ItemRow[]>([{ productId: 0, quantity: 1 }]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100'),
      ]);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) {
          setItems([{ productId: prodRes.data.data[0].id, quantity: 1 }]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load catalog for challan builder');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const productMap = new Map(products.map((p) => [p.id, p]));

  const requestedTotals = new Map<number, number>();
  items.forEach((item) => {
    if (item.productId) {
      requestedTotals.set(item.productId, (requestedTotals.get(item.productId) || 0) + Number(item.quantity || 0));
    }
  });

  let hasStockWarning = false;
  requestedTotals.forEach((reqQty, prodId) => {
    const prod = productMap.get(prodId);
    if (prod && reqQty > prod.currentStock) {
      hasStockWarning = true;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a target customer profile for this delivery challan');
      return;
    }

    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      setError('All line items must specify a valid product and quantity > 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/challans', {
        customerId: Number(selectedCustomerId),
        items: items.map((i) => ({ productId: Number(i.productId), quantity: Number(i.quantity) })),
      });

      if (res.data.success) {
        toast.success(`Draft Challan '${res.data.data.challanNumber}' generated successfully!`, 'Challan Created');
        navigate(`/challans/${res.data.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create sales delivery challan');
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotalUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const estimatedOrderVal = items.reduce((sum, item) => {
    const p = productMap.get(item.productId);
    return sum + (p ? p.unitPrice * (Number(item.quantity) || 0) : 0);
  }, 0);

  if (loading) return <LoadingSkeleton message="Initializing delivery challan builder..." />;
  if (error && customers.length === 0) return <ErrorState message={error} onRetry={fetchInitialData} />;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} />
          <span>Back to Challans</span>
        </Link>
      </div>

      <div className="card-table" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Create Sales Delivery Challan</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Generate a DRAFT challan with snapshot catalog pricing. Stock is deducted upon confirmation.</div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '0.75rem 0.85rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Select Customer Account *</label>
            <select
              required
              className="form-control"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.name} - {c.customerType})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Package size={16} color="var(--primary)" />
                <span>Challan Line Items</span>
              </h3>
              <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                <Plus size={14} />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Product</th>
                    <th>Unit Price</th>
                    <th>Available Stock</th>
                    <th style={{ width: '15%' }}>Quantity</th>
                    <th>Subtotal (₹)</th>
                    <th style={{ width: '80px' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const selectedProd = productMap.get(item.productId);
                    const lineSubtotal = selectedProd ? selectedProd.unitPrice * (Number(item.quantity) || 0) : 0;
                    const reqTotal = requestedTotals.get(item.productId) || 0;
                    const isExceeding = selectedProd && reqTotal > selectedProd.currentStock;

                    return (
                      <tr key={index}>
                        <td>
                          <select
                            required
                            className="form-control"
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', Number(e.target.value))}
                          >
                            <option value={0}>-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {selectedProd ? `₹${selectedProd.unitPrice.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td>
                          {selectedProd ? (
                            <span className={`badge ${selectedProd.currentStock === 0 ? 'badge-out_of_stock' : isExceeding ? 'badge-low_stock' : 'badge-in_stock'}`}>
                              {selectedProd.currentStock} units
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            required
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{lineSubtotal.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length === 1}
                            className="btn btn-danger btn-sm"
                            title="Remove Line Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Warning Alert Banner */}
          {hasStockWarning && (
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--accent-amber)', padding: '0.85rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Inventory Warning:</strong> One or more requested quantities exceed current available stock. The draft can be created, but confirming it will fail unless stock is replenished.
              </div>
            </div>
          )}

          {/* Summary Card */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Line Items: <strong>{items.length}</strong></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Dispatch Units: <strong>{grandTotalUnits} units</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Total Value</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>₹{estimatedOrderVal.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <Link to="/challans" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Generating DRAFT...' : 'Save DRAFT Delivery Challan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
