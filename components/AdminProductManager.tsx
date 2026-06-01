'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { ProductWithHistory } from '@/lib/types';

export function AdminProductManager() {
  const [products, setProducts] = useState<ProductWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/products');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load products');
      }

      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    }
  }, []);

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  const handleDelete = async (product: ProductWithHistory) => {
    if (!confirm(`Delete ${product.name} from tracked products?`)) {
      return;
    }

    setDeletingId(product.id);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((item) => item.id !== product.id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tracked Products</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review scraped products and remove entries you no longer want to track.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchProducts().finally(() => setLoading(false));
          }}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
          No tracked products found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Store</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">per {product.unit}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.store_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.currency}{product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-gray-500">Total tracked products: {products.length}</div>
    </div>
  );
}
