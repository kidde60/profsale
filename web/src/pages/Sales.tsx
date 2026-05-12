import React, { useEffect, useState } from 'react';
import { productService } from '../api/products';
import { salesService } from '../api/sales';
import { customerService } from '../api/customers';
import { useCart } from '../context/CartContext';

interface Product {
  id: number;
  name: string;
  selling_price: number;
  current_stock: number;
  category?: string;
  barcode?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
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

  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  } = useCart();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );

  if (showSalesHistory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
            <button
              onClick={() => setShowSalesHistory(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to POS
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sale #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.sale_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      KES {sale.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <button
            onClick={() => setShowSalesHistory(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Sales History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Products</h2>
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              />

              {/* Mobile Product Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:hidden gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => addToCart(product)}
                  >
                    <h3 className="font-medium text-gray-900">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <p className="text-lg font-semibold text-blue-600">
                      KES {product.selling_price}
                    </p>
                    <p
                      className={`text-sm ${
                        product.current_stock > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      Stock: {product.current_stock}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Product Table */}
              <div className="hidden lg:block">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          KES {product.selling_price}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              product.current_stock > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.current_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => addToCart(product)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cart</h2>

              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <p className="text-gray-500 text-center py-4">
                    Cart is empty
                  </p>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-500">
                          KES {item.unitPrice}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>
                    KES {cart.reduce((sum, item) => sum + item.subtotal, 0)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Discount:
                  </label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>KES {calculateTotal()}</span>
                </div>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Checkout</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                {paymentMethod !== 'credit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount Tendered
                    </label>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={e => setAmountTendered(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {paymentMethod !== 'credit' &&
                  parseFloat(amountTendered) > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium">Change:</span>
                      <span className="font-bold">KES {calculateChange()}</span>
                    </div>
                  )}

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>
                      KES {cart.reduce((sum, item) => sum + item.subtotal, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Discount:</span>
                    <span>KES {discountAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mb-2">
                    <span>Total:</span>
                    <span>KES {calculateTotal()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
