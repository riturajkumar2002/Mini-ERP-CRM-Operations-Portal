import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Product, StockMovementType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { Search, ArrowUpRight, ArrowDownLeft, MapPin, RotateCcw } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stock Movement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<StockMovementType>('IN');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showConfirmOut, setShowConfirmOut] = useState(false);

  const { hasRole } = useAuth();
  const toast = useToast();
  const canManage = hasRole('ADMIN', 'WAREHOUSE');

  useEffect(() => {
    fetchInventory(page, search, warehouseFilter, stockStatusFilter);
  }, [page, warehouseFilter, stockStatusFilter]);

  const fetchInventory = async (
    p = page,
    searchQuery = search,
    wh = warehouseFilter,
    statusF = stockStatusFilter
  ) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/products?page=${p}&limit=10&search=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        let list: Product[] = res.data.data;
        if (wh) {
          list = list.filter((prod) => prod.warehouse?.toLowerCase().includes(wh.toLowerCase()));
        }
        if (statusF) {
          list = list.filter((prod) => {
            if (statusF === 'OUT') return prod.currentStock === 0;
            if (statusF === 'LOW') return prod.currentStock > 0 && prod.currentStock <= prod.minStockQty;
            if (statusF === 'IN') return prod.currentStock > prod.minStockQty;
            return true;
          });
        }
        setProducts(list);
        setMeta(res.data.meta || { total: list.length, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory stock');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearch(query);
    setPage(1);
    fetchInventory(1, query, warehouseFilter, stockStatusFilter);
  };

  const openMovementModal = (p: Product, type: StockMovementType) => {
    setSelectedProduct(p);
    setMovementType(type);
    setQuantity(1);
    setReason(type === 'IN' ? 'Stock replenishment' : 'Dispatched / Internal usage');
    setFormError('');
    setIsModalOpen(true);
  };

  const executeStockMovement = async () => {
    if (!selectedProduct) return;
    setFormError('');

    if (quantity <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }

    if (movementType === 'OUT' && quantity > selectedProduct.currentStock) {
      setFormError(`Insufficient stock. Current available: ${selectedProduct.currentStock} units.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post(`/products/${selectedProduct.id}/stock`, {
        quantity,
        type: movementType,
        reason: reason || (movementType === 'IN' ? 'Manual Receipt' : 'Manual Issue'),
      });

      if (res.data.success) {
        toast.success(
          `Stock ${movementType === 'IN' ? 'increased' : 'decreased'} by ${quantity} units for ${selectedProduct.name}`,
          'Stock Adjusted'
        );
        setIsModalOpen(false);
        setShowConfirmOut(false);
        fetchInventory(page);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record stock movement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (movementType === 'OUT' && selectedProduct && quantity >= 10) {
      setShowConfirmOut(true);
    } else {
      executeStockMovement();
    }
  };

  if (loading && products.length === 0) return <LoadingSkeleton message="Loading inventory stock levels..." />;
  if (error && products.length === 0) return <ErrorState message={error} onRetry={() => fetchInventory(1)} />;

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="search-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search inventory by product name or SKU..."
            value={search}
            onChange={handleSearchChange}
          />
          <Search size={16} className="search-icon" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            value={stockStatusFilter}
            onChange={(e) => { setStockStatusFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto', fontSize: '0.82rem' }}
          >
            <option value="">All Stock Levels</option>
            <option value="IN">In Stock (&gt; Min)</option>
            <option value="LOW">Low Stock (≤ Min)</option>
            <option value="OUT">Out of Stock (0)</option>
          </select>

          {(search || warehouseFilter || stockStatusFilter) && (
            <button onClick={() => { setSearch(''); setWarehouseFilter(''); setStockStatusFilter(''); setPage(1); }} className="btn btn-secondary btn-sm" title="Clear filters">
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Inventory Stock Table */}
      {products.length === 0 ? (
        <EmptyState
          title="No Inventory Records"
          description={search || stockStatusFilter ? 'No inventory products match your filter parameters.' : 'No catalog products available for stock tracking.'}
        />
      ) : (
        <div className="card-table">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Warehouse</th>
                  <th>Current Stock</th>
                  <th>Min Qty Threshold</th>
                  <th>Status</th>
                  {canManage && <th>Adjust Stock</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minStockQty && p.currentStock > 0;
                  const isOut = p.currentStock === 0;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                        <div><code>{p.sku}</code></div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={12} />
                          <span>{p.warehouse}</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.98rem' }}>{p.currentStock} units</td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{p.minStockQty} units</td>
                      <td>
                        <span className={`badge ${isOut ? 'badge-out_of_stock' : isLow ? 'badge-low_stock' : 'badge-in_stock'}`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => openMovementModal(p, 'IN')}
                              className="btn btn-success btn-sm"
                              title="Receipt Stock IN"
                            >
                              <ArrowDownLeft size={14} />
                              <span>Stock IN</span>
                            </button>
                            <button
                              onClick={() => openMovementModal(p, 'OUT')}
                              className="btn btn-secondary btn-sm"
                              title="Issue Stock OUT"
                              disabled={p.currentStock === 0}
                            >
                              <ArrowUpRight size={14} />
                              <span>Stock OUT</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
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

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={movementType === 'IN' ? `Stock Receipt (IN): ${selectedProduct?.sku}` : `Stock Issue (OUT): ${selectedProduct?.sku}`}
      >
        {selectedProduct && (
          <div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem 0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div>Product: <strong>{selectedProduct.name}</strong></div>
              <div>Available: <strong>{selectedProduct.currentStock} units</strong></div>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '0.75rem 0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Quantity to Adjust *</label>
                <input
                  type="number"
                  min="1"
                  max={movementType === 'OUT' ? selectedProduct.currentStock : undefined}
                  required
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference Note *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Shipment receipt #402 / Sales order dispatch"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn ${movementType === 'IN' ? 'btn-success' : 'btn-primary'}`}
                >
                  {submitting ? 'Updating...' : movementType === 'IN' ? 'Confirm Stock IN' : 'Confirm Stock OUT'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Confirm Out Warning Dialog */}
      <ConfirmDialog
        isOpen={showConfirmOut}
        onClose={() => setShowConfirmOut(false)}
        onConfirm={executeStockMovement}
        title="Confirm Large Stock Issue"
        message={`Are you sure you want to issue ${quantity} units of ${selectedProduct?.name}? This will decrease current available stock.`}
        loading={submitting}
      />
    </div>
  );
};
