import React, { useEffect, useState } from 'react';
import { productService } from '../api/products';
import { formatCurrency } from '../utils/format';
import Modal from '../components/Modal';

interface Product {
  id: number;
  name: string;
  selling_price: number;
  current_stock: number;
  buying_price?: number;
  min_stock_level?: number;
  category_id?: number;
  category_name?: string;
  category?: string;
  barcode?: string;
  description?: string;
  cost_price?: number;
  min_stock?: number;
  product_image?: string;
  unit?: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [formData, setFormData] = useState({
    name: '',
    selling_price: '',
    current_stock: '',
    category: '',
    barcode: '',
    description: '',
    cost_price: '',
    min_stock: '0',
    unit: 'pieces',
    productImage: undefined as string | undefined,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const result = await productService.getCategories();
      setCategories(result);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const filteredProducts = products
    .filter(
      product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter(product => {
      if (filterStock === 'low') {
        return product.current_stock <= (product.min_stock_level ?? 5);
      }
      if (filterStock === 'out') {
        return product.current_stock === 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        return b.selling_price - a.selling_price;
      }
      if (sortBy === 'stock') {
        return a.current_stock - b.current_stock;
      }
      return a.name.localeCompare(b.name);
    });

  const handleAddProduct = async () => {
    setIsSubmitting(true);
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
        unit: 'pieces',
        productImage: undefined,
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to add product', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      selling_price: product.selling_price.toString(),
      current_stock: product.current_stock.toString(),
      category:
        product.category_id?.toString() ||
        product.category_name ||
        product.category ||
        '',
      barcode: product.barcode || '',
      description: product.description || '',
      cost_price:
        product.buying_price?.toString() ||
        product.cost_price?.toString() ||
        '',
      min_stock:
        product.min_stock_level?.toString() ||
        product.min_stock?.toString() ||
        '0',
      unit: product.unit || 'pieces',
      productImage: product.product_image || undefined,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, productImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    setIsSubmitting(true);
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
        unit: 'pieces',
        productImage: undefined,
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product', error);
    } finally {
      setIsSubmitting(false);
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">📦</div>
          <p className="text-lg text-slate-600">Loading products...</p>
        </div>
      </div>
    );

  const totalProducts = products.length;
  const lowStockCount = products.filter(
    p => p.current_stock <= (p.min_stock_level ?? 5),
  ).length;
  const outOfStockCount = products.filter(p => p.current_stock === 0).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage stock, pricing, and product details.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 font-semibold text-white transition hover:from-amber-600 hover:to-amber-700 sm:w-auto"
        >
          + Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Products',
            value: totalProducts,
            icon: '📦',
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Low Stock',
            value: lowStockCount,
            icon: '⚠️',
            color: 'from-amber-500 to-orange-500',
          },
          {
            label: 'Out of Stock',
            value: outOfStockCount,
            icon: '❌',
            color: 'from-rose-500 to-red-500',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="group rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:shadow-xl"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color} rounded-t-3xl`}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-950">
                  {stat.value}
                </p>
              </div>
              <span className="text-3xl opacity-20 group-hover:opacity-30 transition">
                {stat.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="rounded-3xl border border-white/10 bg-white p-4 shadow-lg shadow-slate-900/5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Search by name or barcode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value as any)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price (High to Low)</option>
            <option value="stock">Sort by Stock (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div
              key={product.id}
              className="group rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:shadow-xl hover:border-white/20"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.category_name ||
                      product.category ||
                      'Uncategorized'}
                  </p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                    product.current_stock === 0
                      ? 'bg-rose-100 text-rose-700'
                      : product.current_stock <= (product.min_stock_level ?? 5)
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {product.current_stock === 0
                    ? '❌ Out'
                    : product.current_stock <= (product.min_stock_level ?? 5)
                    ? '⚠️ Low'
                    : '✓ OK'}
                </span>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Price</p>
                  <p className="font-bold text-slate-950">
                    {formatCurrency(product.selling_price)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Stock</p>
                  <p className="font-bold text-slate-950">
                    {product.current_stock} units
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm text-slate-600">
              No products found matching your filters
            </p>
          </div>
        )}
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
                  {product.category_name || product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {formatCurrency(product.selling_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      product.current_stock <= (product.min_stock_level ?? 0)
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
      <Modal
        isOpen={showAddModal || !!editingProduct}
        onClose={() => {
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
            unit: 'pieces',
            productImage: undefined,
          });
        }}
        title={editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              placeholder="Enter product name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Category
            </label>
            <select
              value={formData.category}
              onChange={e =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">No Category</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Cost Price
            </label>
            <input
              type="number"
              value={formData.cost_price}
              onChange={e =>
                setFormData({ ...formData, cost_price: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={e =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="e.g., pieces, kg"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Min Stock Level
              </label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={e =>
                  setFormData({
                    ...formData,
                    min_stock: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Barcode
            </label>
            <input
              type="text"
              value={formData.barcode}
              onChange={e =>
                setFormData({ ...formData, barcode: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              placeholder="Optional barcode"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              placeholder="Product description"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-600"
            />
            {formData.productImage && (
              <img
                src={formData.productImage}
                alt="Product preview"
                className="mt-4 h-32 w-32 rounded-2xl object-cover"
              />
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
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
                unit: 'pieces',
                productImage: undefined,
              });
            }}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-2 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 font-semibold text-white transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {isSubmitting
              ? editingProduct
                ? 'Updating...'
                : 'Adding...'
              : editingProduct
              ? 'Update Product'
              : 'Add Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Products;
