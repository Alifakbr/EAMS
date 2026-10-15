import React, { useState } from 'react';
import { Product, ProductType } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Boxes,
  Search,
  Plus,
  X,
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onRefresh: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Material Handling',
    brand: '',
    model: '',
    productType: 'SERIALIZED' as ProductType,
    unitOfMeasure: 'Unit',
    salesPrice: '15000',
    purchaseCost: '11000',
    stockQuantity: '5',
    reorderLevel: '2',
    warehouse: 'Dallas Central Depot',
  });

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ALL' || p.productType === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      alert('SKU and Product Name are required.');
      return;
    }

    try {
      await api.createProduct({
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        productType: formData.productType,
        unitOfMeasure: formData.unitOfMeasure,
        salesPrice: parseFloat(formData.salesPrice) || 0,
        purchaseCost: parseFloat(formData.purchaseCost) || 0,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        warehouse: formData.warehouse,
      });

      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error adding product: ${err.message}`);
    }
  };

  const getTypeBadge = (type: ProductType) => {
    switch (type) {
      case 'SERIALIZED':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
            <Package className="w-3 h-3" />
            SERIALIZED
          </span>
        );
      case 'QUANTITY_BASED':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
            <Layers className="w-3 h-3" />
            BULK / STOCK
          </span>
        );
      case 'SERVICE':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3" />
            SERVICE
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Commercial Product &amp; Sellable Catalog</h2>
          <span className="text-xs text-slate-400">({products.length} catalog items)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search SKU, name, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 w-52"
            />
          </div>

          {/* Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs border border-slate-200 rounded bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Product Types</option>
            <option value="SERIALIZED">Serialized Assets</option>
            <option value="QUANTITY_BASED">Quantity-Based Items</option>
            <option value="SERVICE">Non-Stock Services</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Catalog Product
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">SKU / Item</th>
                <th className="py-2.5 px-4">Inventory Type</th>
                <th className="py-2.5 px-4">Category &amp; Warehouse</th>
                <th className="py-2.5 px-4 text-right">Available Stock</th>
                <th className="py-2.5 px-4 text-right">Purchase Cost</th>
                <th className="py-2.5 px-4 text-right">List Sales Price</th>
                <th className="py-2.5 px-4 text-right">Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((prod) => {
                const margin = prod.salesPrice > 0 ? ((prod.salesPrice - prod.purchaseCost) / prod.salesPrice) * 100 : 0;
                const isLowStock = prod.productType !== 'SERVICE' && prod.stockQuantity <= prod.reorderLevel;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                            <Boxes className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{prod.name}</div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">{prod.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(prod.productType)}</td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{prod.category}</div>
                      <div className="text-[11px] text-slate-400">{prod.warehouse}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers">
                      {prod.productType === 'SERVICE' ? (
                        <span className="text-slate-400">On-Demand</span>
                      ) : (
                        <div>
                          <div className={`font-semibold ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                            {prod.stockQuantity} {prod.unitOfMeasure}s
                          </div>
                          {isLowStock && (
                            <div className="text-[10px] text-rose-500 font-sans flex items-center justify-end gap-1">
                              <AlertTriangle className="w-3 h-3" /> Reorder Alert
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-slate-600">
                      ${prod.purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-semibold text-slate-900">
                      ${prod.salesPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-emerald-700 font-medium">
                      {margin.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No products found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add Sellable Catalog Product</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">SKU / Product Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MHE-FORK-5000"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Inventory Type *</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
                    <option value="SERIALIZED">Individually Tracked Serialized Asset</option>
                    <option value="QUANTITY_BASED">Quantity-Based Bulk / Consumable</option>
                    <option value="SERVICE">Non-Stock Service Item</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yale ERC-050 Electric Counterbalance Forklift"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Technical specifications, features, applications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sales Price ($)</label>
                  <input
                    type="number"
                    value={formData.salesPrice}
                    onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Purchase Cost ($)</label>
                  <input
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                >
                  Save Catalog Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
