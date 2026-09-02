import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { Search, Plus, Edit3, AlertTriangle, RotateCcw, Tag, MapPin } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { hasRole } = useAuth();
  const toast = useToast();
  const canEdit = hasRole('ADMIN', 'WAREHOUSE');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockQty: 5,
    warehouse: 'Main Warehouse',
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts(page, search, categoryFilter, lowStockFilter);
  }, [page, categoryFilter, lowStockFilter]);

  const fetchProducts = async (
    p = page,
    searchQuery = search,
    catFilter = categoryFilter,
    lowStock = lowStockFilter
  ) => {
    setLoading(true);
    setError('');
    try {
      let url = `/products?page=${p}&limit=10&search=${encodeURIComponent(searchQuery)}`;
      if (catFilter) url += `&category=${encodeURIComponent(catFilter)}`;
      if (lowStock) url += `&lowStock=true`;

      const res = await api.get(url);
      if (res.data.success) {
        setProducts(res.data.data);
        setMeta(res.data.meta || { total: res.data.data.length, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load catalog products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearch(query);
    setPage(1);
    fetchProducts(1, query, categoryFilter, lowStockFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setLowStockFilter(false);
    setPage(1);
    fetchProducts(1, '', '', false);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minStockQty: 5,
      warehouse: 'Main Warehouse',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockQty: p.minStockQty,
      warehouse: p.warehouse || 'Main Warehouse',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, formData);
        if (res.data.success) {
          toast.success(`Product '${formData.name}' updated`, 'Product Updated');
          setIsModalOpen(false);
          fetchProducts(page);
        }
      } else {
        const res = await api.post('/products', formData);
        if (res.data.success) {
          toast.success(`Product '${formData.name}' created`, 'Product Added');
          setIsModalOpen(false);
          fetchProducts(1);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && products.length === 0) return <LoadingSkeleton message="Loading products catalog..." />;
  if (error && products.length === 0) return <ErrorState message={error} onRetry={() => fetchProducts(1)} />;

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="search-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search catalog by product name, SKU, or category..."
            value={search}
            onChange={handleSearchChange}
          />
          <Search size={16} className="search-icon" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Low Stock Toggle Button */}
          <button
            onClick={() => { setLowStockFilter(!lowStockFilter); setPage(1); }}
            className={`btn btn-sm ${lowStockFilter ? 'btn-warning' : 'btn-secondary'}`}
          >
            <AlertTriangle size={14} />
            <span>{lowStockFilter ? 'Filtering Low Stock' : 'Show Low Stock'}</span>
          </button>

          {(search || categoryFilter || lowStockFilter) && (
            <button onClick={handleClearFilters} className="btn btn-secondary btn-sm" title="Clear filters">
              <RotateCcw size={14} />
            </button>
          )}

          {canEdit && (
            <button onClick={openCreateModal} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>+ Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Catalog Table */}
      {products.length === 0 ? (
        <EmptyState
          title="No Products Found"
          description={search || categoryFilter || lowStockFilter ? 'No catalog products match your search filters.' : 'No products created in the inventory catalog.'}
          actionText={canEdit ? 'Add New Product' : undefined}
          onAction={canEdit ? openCreateModal : undefined}
        />
      ) : (
        <div className="card-table">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Unit Price (₹)</th>
                  <th>Current Stock</th>
                  <th>Min Threshold</th>
                  <th>Warehouse</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLowStock = p.currentStock <= p.minStockQty;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                        <div><code>{p.sku}</code></div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                          <Tag size={12} />
                          <span>{p.category}</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${isLowStock ? 'badge-low_stock' : 'badge-in_stock'}`}>
                          {p.currentStock} units
                        </span>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{p.minStockQty} units</td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={12} />
                          <span>{p.warehouse}</span>
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <button onClick={() => openEditModal(p)} className="btn btn-secondary btn-sm" title="Edit Catalog Product">
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add Catalog Product'}
      >
        {formError && (
          <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '0.75rem 0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Heavy Duty Industrial Pump"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">SKU Code *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="PROD-PUMP-01"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                disabled={!!editingProduct}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Machinery, Fittings, etc."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="form-control"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Opening Stock *</label>
              <input
                type="number"
                min="0"
                required
                className="form-control"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                disabled={!!editingProduct}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Threshold *</label>
              <input
                type="number"
                min="0"
                required
                className="form-control"
                value={formData.minStockQty}
                onChange={(e) => setFormData({ ...formData, minStockQty: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Location *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Warehouse A, Bay 4"
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
