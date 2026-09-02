import React, { useEffect, useState } from 'react';
import { productService } from '../api/products';
import { formatCurrency } from '../utils/format';

interface Product {
  id: number;
  name: string;
  selling_price: number;
  current_stock: number;
  category?: string;
  barcode?: string;
  description?: string;
  cost_price?: number;
  min_stock?: number;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    selling_price: '',
    current_stock: '',
    category: '',
    barcode: '',
    description: '',
    cost_price: '',
    min_stock: '0',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ all: true });
      setProducts(response.data?.products || response.data || []);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddProduct = async () => {
    try {
      await productService.createProduct(formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        selling_price: '',
        current_stock: '',
        category: '',
        barcode: '',
        description: '',
        cost_price: '',
        min_stock: '0',
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to add product', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      selling_price: product.selling_price.toString(),
      current_stock: product.current_stock.toString(),
      category: product.category || '',
      barcode: product.barcode || '',
      description: product.description || '',
      cost_price: product.cost_price?.toString() || '',
      min_stock: product.min_stock?.toString() || '0',
    });
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      await productService.updateProduct(editingProduct.id, formData);
      setEditingProduct(null);
      setFormData({
        name: '',
        selling_price: '',
        current_stock: '',
        category: '',
        barcode: '',
        description: '',
        cost_price: '',
        min_stock: '0',
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.deleteProduct(id);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Products</h1>
            <p className="mt-1 text-sm text-slate-500">Manage stock, pricing, and product details.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm outline-none transition focus:border-emerald-500 sm:w-64"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => (
            <div key={product.id} className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium text-slate-950">
                  {product.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    product.current_stock <= (product.min_stock || 0)
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  Stock: {product.current_stock}
                </span>
              </div>
              <p className="mb-2 text-sm text-slate-500">{product.category}</p>
              <p className="mb-4 text-lg font-semibold text-slate-950">
                {formatCurrency(product.selling_price)}
              </p>
              <div className="flex justify-between">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm text-white transition hover:bg-rose-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white shadow-lg shadow-slate-900/5 lg:block">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-950">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {formatCurrency(product.selling_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.current_stock <= (product.min_stock || 0)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {product.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="mr-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-sm text-white transition hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Product Modal */}
        {(showAddModal || editingProduct) && (
          <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-slate-950/60 px-4 py-8">
            <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-950">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      value={formData.selling_price}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          selling_price: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={formData.current_stock}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          current_stock: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      selling_price: '',
                      current_stock: '',
                      category: '',
                      barcode: '',
                      description: '',
                      cost_price: '',
                      min_stock: '0',
                    });
                  }}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    editingProduct ? handleUpdateProduct : handleAddProduct
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-500"
                >
                  {editingProduct ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
