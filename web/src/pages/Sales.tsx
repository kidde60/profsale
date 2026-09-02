import React, { useEffect, useState } from 'react';
import { productService } from '../api/products';
import { salesService } from '../api/sales';
import { customerService } from '../api/customers';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

interface Product {
  id: number;
  name: string;
  selling_price: number;
  current_stock: number;
  category?: string;
  barcode?: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface Sale {
  id: number;
  sale_number: string;
  total_amount: number;
  customer_name: string;
  sale_date: string;
}

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } =
    useCart();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, customersRes, salesRes] = await Promise.all([
        productService.getProducts({ all: true }),
        customerService.getCustomers({ all: true }),
        salesService.getSales({ limit: 50 }),
      ]);
      setProducts(productsRes.data?.products || productsRes.data || []);
      setCustomers(customersRes.data?.customers || customersRes.data || []);
      setSales(salesRes.data?.sales || salesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = parseFloat(discountAmount) || 0;
    return Math.max(0, subtotal - discount);
  };

  const calculateChange = () => {
    const total = calculateTotal();
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - total);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      const saleData = {
        customerId: selectedCustomer?.id,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        paymentMethod,
        discountAmount: parseFloat(discountAmount) || 0,
        amountPaid:
          paymentMethod === 'credit'
            ? undefined
            : parseFloat(amountTendered) || undefined,
        total: calculateTotal(),
      };

      await salesService.createSale(saleData);

      // Clear cart and reset form
      clearCart();
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setAmountTendered('');
      setDiscountAmount('0');
      setShowCheckout(false);

      alert('Sale completed successfully!');
      fetchData(); // Refresh sales history
    } catch (error) {
      console.error('Failed to complete sale', error);
      alert('Failed to complete sale');
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">🛒</div>
          <p className="text-lg text-slate-600">Loading POS...</p>
        </div>
      </div>
    );

  if (showSalesHistory) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-950">Sales History</h1>
            <button
              onClick={() => setShowSalesHistory(false)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
            >
              Back to POS
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-lg shadow-slate-900/5">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                    Sale #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-950">
                      {sale.sale_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {sale.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Point of Sale
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Fast checkout view tuned for mobile and desktop.
            </p>
          </div>
          <button
            onClick={() => setShowSalesHistory(true)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
          >
            Sales History
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="mb-6 rounded-3xl border border-white/10 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-950">
                  📦 Products
                </h2>
                <span className="text-sm text-slate-500">
                  {filteredProducts.length} available
                </span>
              </div>
              <input
                type="text"
                placeholder="🔍 Search products or scan barcode..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              />

              {/* Empty State */}
              {filteredProducts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-sm text-slate-600">No products found</p>
                </div>
              )}

              {/* Mobile Product Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="group cursor-pointer rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 transition hover:border-amber-200 hover:shadow-lg"
                    onClick={() => addToCart(product)}
                  >
                    <h3 className="font-semibold text-slate-950">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500">{product.category}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(product.selling_price)}
                      </p>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          product.current_stock > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {product.current_stock > 0
                          ? `✓ ${product.current_stock}`
                          : '❌ Out'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Product Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 lg:block">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(product => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-amber-50/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-950">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {product.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-amber-600">
                            {formatCurrency(product.selling_price)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
                              product.current_stock > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {product.current_stock > 0
                              ? `✓ ${product.current_stock}`
                              : '❌ Out'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => addToCart(product)}
                            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700"
                          >
                            Add to Cart
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="mb-6 rounded-3xl border border-white/10 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-950">
                Cart
              </h2>

              {/* Customer Selection */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer
                </label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={e => {
                    const customer = customers.find(
                      c => c.id === parseInt(e.target.value),
                    );
                    setSelectedCustomer(customer || null);
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items */}
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="py-4 text-center text-slate-500">
                    Cart is empty
                  </p>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between border-b border-slate-100 py-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-950">
                          {item.product.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="rounded-lg bg-slate-100 px-2 py-1 text-sm transition hover:bg-slate-200"
                        >
                          -
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="rounded-lg bg-slate-100 px-2 py-1 text-sm transition hover:bg-slate-200"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="rounded-lg bg-rose-600 px-2 py-1 text-sm text-white transition hover:bg-rose-500"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-2 flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(
                      cart.reduce((sum, item) => sum + item.subtotal, 0),
                    )}
                  </span>
                </div>
                <div className="mb-2 flex justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Discount:
                  </label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-slate-950/60 px-4 py-8">
            <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-slate-950/20">
              <h3 className="mb-4 text-lg font-bold text-slate-950">
                Checkout
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                {paymentMethod !== 'credit' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Amount Tendered
                    </label>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={e => setAmountTendered(e.target.value)}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                )}

                {paymentMethod !== 'credit' &&
                  parseFloat(amountTendered) > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium">Change:</span>
                      <span className="font-bold">
                        {formatCurrency(calculateChange())}
                      </span>
                    </div>
                  )}

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {formatCurrency(
                        cart.reduce((sum, item) => sum + item.subtotal, 0),
                      )}
                    </span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span>Discount:</span>
                    <span>{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="mb-2 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-500"
                >
                  Complete Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
