import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Card, Button, Input, Loading } from '../components';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency, formatStock } from '../utils/helpers';
import { handleError, handleSuccess } from '../utils/errorHandler';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

type POSScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type POSScreenRouteProp = RouteProp<{ POS: { clearCart?: boolean } }, 'POS'>;

const POSScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<POSScreenNavigationProp>();
  const route = useRoute<POSScreenRouteProp>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [editingQuantityId, setEditingQuantityId] = useState<number | null>(
    null,
  );
  const [tempQuantity, setTempQuantity] = useState('');

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, []),
  );

  useEffect(() => {
    // Clear cart when returning from successful checkout
    if (route.params?.clearCart) {
      setCart([]);
      // Reset navigation params
      navigation.setParams({ clearCart: undefined } as any);
    }
    if (search.trim()) {
      const filtered = products.filter(
        p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(search.toLowerCase()),
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [search, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts({});
      const productsData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.products || [];
      setProducts(productsData);
    } catch (error) {
      handleError(error, 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const stock = product.current_stock ?? product.quantity_in_stock ?? 0;

    if (stock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is out of stock`);
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= stock) {
        Alert.alert('Insufficient Stock', `Only ${stock} units available`);
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const unitPrice = parseFloat(String(product.selling_price));
      const newItem: CartItem = {
        product,
        quantity: 1,
        unitPrice: unitPrice,
        subtotal: unitPrice,
      };
      setCart([...cart, newItem]);
    }

    setSearch('');
    setShowProductModal(false);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map(item => {
        if (item.product.id === productId) {
          const stock =
            item.product.current_stock ?? item.product.quantity_in_stock ?? 0;
          const quantity = Math.min(newQuantity, stock);
          const unitPrice = parseFloat(String(item.unitPrice));
          return {
            ...item,
            quantity,
            subtotal: quantity * unitPrice,
          };
        }
        return item;
      }),
    );
  };

  const handleQuantityUpdate = (productId: number, value: string) => {
    const quantity = parseFloat(value);
    if (!isNaN(quantity) && quantity > 0) {
      updateQuantity(productId, quantity);
    }
    setEditingQuantityId(null);
    setTempQuantity('');
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updatePrice = (productId: number, newPrice: number) => {
    const price = parseFloat(String(newPrice));
    setCart(
      cart.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            unitPrice: price,
            subtotal: item.quantity * price,
          };
        }
        return item;
      }),
    );
    setEditingPriceId(null);
    setTempPrice('');
  };

  const calculateTotal = () => {
    return cart.reduce(
      (sum, item) => sum + parseFloat(String(item.subtotal)),
      0,
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout');
      return;
    }
    setShowCartModal(false);
    navigation.navigate('Checkout', {
      cart: cart,
      total: calculateTotal(),
    });
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const stock = parseFloat(
      String(item.product.current_stock ?? item.product.quantity_in_stock ?? 0),
    );
    const isLowStock =
      stock <=
      (item.product.min_stock_level || item.product.reorder_level || 5);
    const isEditingPrice = editingPriceId === item.product.id;

    return (
      <Card style={styles.cartItem}>
        <View style={styles.cartItemHeader}>
          <View style={styles.cartItemTitleContainer}>
            <Text style={styles.cartItemName}>{item.product.name}</Text>
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => removeFromCart(item.product.id)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cartItemContent}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price:</Text>
            {isEditingPrice ? (
              <View style={styles.priceEditContainer}>
                <TextInput
                  style={styles.priceInput}
                  value={tempPrice}
                  onChangeText={setTempPrice}
                  keyboardType="decimal-pad"
                  placeholder={String(item.unitPrice)}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.priceEditButton}
                  onPress={() => {
                    const newPrice = parseFloat(tempPrice);
                    if (newPrice > 0) {
                      updatePrice(item.product.id, newPrice);
                    } else {
                      setEditingPriceId(null);
                      setTempPrice('');
                    }
                  }}
                >
                  <Text style={styles.priceEditButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priceEditButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingPriceId(null);
                    setTempPrice('');
                  }}
                >
                  <Text style={styles.priceEditButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setEditingPriceId(item.product.id);
                  setTempPrice(String(item.unitPrice));
                }}
              >
                <Text style={styles.priceValue}>
                  {formatCurrency(item.unitPrice)}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                updateQuantity(
                  item.product.id,
                  Math.max(0.25, item.quantity - 0.25),
                )
              }
            >
              <Text style={styles.quantityButtonText}>-0.25</Text>
            </TouchableOpacity>

            {editingQuantityId === item.product.id ? (
              <TextInput
                style={styles.quantityInput}
                value={tempQuantity}
                onChangeText={setTempQuantity}
                onSubmitEditing={() =>
                  handleQuantityUpdate(item.product.id, tempQuantity)
                }
                onBlur={() => {
                  if (editingQuantityId === item.product.id) {
                    handleQuantityUpdate(item.product.id, tempQuantity);
                  }
                }}
                keyboardType="decimal-pad"
                autoFocus
              />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setEditingQuantityId(item.product.id);
                  setTempQuantity(String(item.quantity));
                }}
              >
                <Text style={styles.quantity}>
                  {formatStock(item.quantity)}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.quantityButton,
                item.quantity >= stock && styles.quantityButtonDisabled,
              ]}
              onPress={() =>
                updateQuantity(item.product.id, item.quantity + 0.25)
              }
              disabled={item.quantity >= stock}
            >
              <Text style={styles.quantityButtonText}>+0.25</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cartItemTotal}>
            <Text style={styles.cartItemTotalText}>
              {formatCurrency(item.subtotal)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const stock = parseFloat(
      String(item.current_stock ?? item.quantity_in_stock ?? 0),
    );
    const cartItem = cart.find(c => c.product.id === item.id);
    const inCart = !!cartItem;

    return (
      <Card
        style={
          inCart
            ? [styles.productItem, styles.productItemInCart]
            : styles.productItem
        }
      >
        <TouchableOpacity
          style={styles.productItemTouchable}
          onPress={() => addToCart(item)}
        >
          {inCart && (
            <>
              <View style={styles.inCartBadge}>
                <Text style={styles.inCartBadgeText}>{cartItem.quantity}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeFromCartButton}
                onPress={e => {
                  e.stopPropagation();
                  removeFromCart(item.id);
                }}
              >
                <Text style={styles.removeFromCartButtonText}>×</Text>
              </TouchableOpacity>
            </>
          )}
          {item.product_image && (
            <Image
              source={{ uri: item.product_image }}
              style={styles.productImage}
            />
          )}
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.productDetails}>
            <Text style={styles.productPrice}>
              {formatCurrency(item.selling_price)}
            </Text>
            <Text
              style={[
                styles.productStock,
                stock <= 0 ? styles.outOfStock : null,
              ]}
            >
              Stock: {formatStock(stock)}
            </Text>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Point of Sale</Text>
            <Text style={styles.headerSubtitle}>
              {products.length} products available
            </Text>
          </View>
          {cart.length > 0 && (
            <View style={styles.cartStats}>
              <View style={styles.cartStatItem}>
                <Text style={styles.cartStatValue}>{cart.length}</Text>
                <Text style={styles.cartStatLabel}>Items</Text>
              </View>
              <View style={styles.cartStatItem}>
                <Text style={styles.cartStatValue}>
                  {formatCurrency(calculateTotal())}
                </Text>
                <Text style={styles.cartStatLabel}>Total</Text>
              </View>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search products by name or barcode..."
            style={styles.searchInput}
          />
        </View>

        {/* Products Grid */}
        <FlatList
          data={search.trim() ? filteredProducts : products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productGrid}
          columnWrapperStyle={styles.productRow}
          ListEmptyComponent={
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyProductsText}>
                {search.trim() ? 'No products found' : 'No products available'}
              </Text>
            </View>
          }
        />

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setShowCartModal(true)}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Cart Modal */}
        <Modal
          visible={showCartModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCartModal(false)}
        >
          <View style={styles.cartModalOverlay}>
            <View style={styles.cartModalContent}>
              <View style={styles.cartModalHeader}>
                <Text style={styles.cartModalTitle}>
                  Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                </Text>
                <TouchableOpacity onPress={() => setShowCartModal(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyCartModal}>
                  <Text style={styles.emptyCartText}>Cart is empty</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={cart}
                    renderItem={renderCartItem}
                    keyExtractor={item => item.product.id.toString()}
                    contentContainerStyle={styles.cartModalList}
                  />

                  <View style={styles.cartModalFooter}>
                    <View style={styles.cartTotalSection}>
                      <Text style={styles.cartTotalLabel}>Total:</Text>
                      <Text style={styles.cartTotalAmount}>
                        {formatCurrency(calculateTotal())}
                      </Text>
                    </View>
                    <Button
                      title="Proceed to Checkout"
                      onPress={handleCheckout}
                      style={styles.proceedButton}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  headerContent: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  cartStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cartStatItem: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border || '#E0E0E0',
  },
  cartStatValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cartStatLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  searchInput: {
    marginBottom: 0,
  },
  browseButton: {
    paddingHorizontal: SPACING.lg,
  },
  searchResults: {
    maxHeight: 300,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResultsList: {
    padding: SPACING.sm,
  },
  productGrid: {
    padding: SPACING.sm,
  },
  productRow: {
    gap: SPACING.sm,
  },
  productItem: {
    flex: 1,
    marginBottom: SPACING.md,
    minHeight: 180,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: 16,
  },
  productItemTouchable: {
    flex: 1,
    padding: SPACING.sm,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: SPACING.sm,
  },
  productItemInCart: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  inCartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 1,
  },
  inCartBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '700',
  },
  removeFromCartButton: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 1,
  },
  removeFromCartButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyProducts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyProductsText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  productDetails: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  productStock: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  outOfStock: {
    color: COLORS.error,
  },
  cartSection: {
    flex: 1,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptyCartSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    marginBottom: SPACING.sm,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cartItemTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  cartItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  priceEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  priceEditButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  priceEditButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quantityButton: {
    minWidth: 70,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  cartItemTotal: {
    alignItems: 'flex-end',
  },
  cartItemTotalText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quantity: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 50,
    textAlign: 'center',
  },
  quantityInput: {
    width: 80,
    height: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    textAlign: 'center',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.white,
    fontWeight: '600',
  },
  checkoutSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paymentMethodSection: {
    marginBottom: SPACING.md,
  },
  paymentLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  paymentMethod: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  paymentMethodActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  paymentMethodTextActive: {
    color: COLORS.white,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkoutButton: {
    width: '100%',
  },
  cartButton: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  cartIcon: {
    fontSize: 28,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '700',
  },
  cartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  cartModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: SPACING.lg,
  },
  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyCartModal: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
  },
  cartModalList: {
    padding: SPACING.md,
  },
  cartModalFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cartTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cartTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  cartTotalAmount: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  proceedButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 32,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  modalSearch: {
    margin: SPACING.md,
    marginBottom: 0,
  },
  modalList: {
    padding: SPACING.md,
  },
  checkoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  checkoutModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: SPACING.xl,
    maxHeight: '80%',
    flex: 1,
  },
  checkoutModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkoutModalTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 28,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  checkoutSummary: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkoutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkoutTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkoutTotal: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkoutLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  checkoutScrollView: {
    flex: 1,
  },
  checkoutItemsList: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkoutItemsHeader: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  checkoutItemsFlatList: {
    paddingHorizontal: SPACING.lg,
  },
  checkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkoutItemInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  checkoutItemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  checkoutItemQty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  checkoutItemPricing: {
    alignItems: 'flex-end',
  },
  checkoutPriceButton: {
    alignItems: 'flex-end',
  },
  checkoutItemPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  checkoutItemSubtotal: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  checkoutPriceEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  checkoutPriceInput: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
    minWidth: 80,
  },
  checkoutPriceSaveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutPriceSaveText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '700',
  },
  checkoutPriceCancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutPriceCancelText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '300',
  },
  customerSection: {
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  customerInput: {
    marginBottom: SPACING.sm,
  },
  paymentMethodContainer: {
    marginBottom: SPACING.lg,
  },
  paymentMethodsModal: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  paymentMethodModal: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  paymentMethodModalActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  paymentMethodModalText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  paymentMethodModalTextActive: {
    color: COLORS.white,
  },
  cashSection: {
    marginTop: SPACING.md,
  },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  changeLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  changeAmount: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.success,
  },
  negativeChange: {
    color: COLORS.error,
  },
  checkoutActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  checkoutActionButton: {
    flex: 1,
  },
  customerTypeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  customerTypeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  customerTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  customerTypeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerTypeButtonTextActive: {
    color: COLORS.white,
  },
  selectedCustomerCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  selectedCustomerName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  selectedCustomerPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  changeCustomerButton: {
    alignSelf: 'flex-start',
  },
  changeCustomerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  customerSearchContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  customerSearchInput: {
    marginBottom: 0,
  },
  customerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
    marginTop: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  customerDropdownScroll: {
    maxHeight: 200,
  },
  customerDropdownItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customerDropdownName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  customerDropdownPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  noCustomersFound: {
    padding: SPACING.md,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});

export default POSScreen;
