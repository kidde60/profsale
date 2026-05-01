import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Loading, Input, Button } from '../components';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency, formatStock } from '../utils/helpers';
import { canAccessFeature } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';
import { handleError } from '../utils/errorHandler';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProductsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Back'
>;

interface Props {
  navigation: ProductsScreenNavigationProp;
}

const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const canCreateProduct = canAccessFeature(
    user?.role || '',
    user?.permissions,
    'create_product',
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts();
      const productsData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.products || [];
      setAllProducts(productsData);
      setProducts(productsData);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.message);
      if (error.response?.status !== 401) {
        handleError(error, 'Failed to load products');
      } else {
        console.log('Got 401 - user will be logged out by API interceptor');
      }
      // Clear products on error
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    if (!searchTerm.trim()) {
      setProducts(allProducts);
      return;
    }

    // Filter products locally by name, barcode, or description
    const filtered = allProducts.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.barcode?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    });

    setProducts(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const stock = parseFloat(
      String(item.current_stock ?? item.quantity_in_stock ?? 0),
    );
    const unit = item.unit || item.unit_of_measure || 'units';
    const minStock = parseFloat(
      String(item.min_stock_level ?? item.reorder_level ?? 5),
    );

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.productCard}>
          {item.product_image && (
            <Image
              source={{ uri: item.product_image }}
              style={styles.productImage}
            />
          )}
          <View
            style={[
              styles.productInfo,
              !item.product_image && styles.productInfoFull,
            ]}
          >
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            {(item.sku || item.barcode) && (
              <Text style={styles.productSku}>
                {item.sku ? `SKU: ${item.sku}` : `Barcode: ${item.barcode}`}
              </Text>
            )}
            <View style={styles.stockContainer}>
              <Text style={styles.stockLabel}>Stock:</Text>
              <Text
                style={[
                  styles.stockValue,
                  stock <= minStock && styles.stockLow,
                ]}
              >
                {formatStock(stock)} {unit}
              </Text>
            </View>
          </View>
          <View style={styles.productPrice}>
            <Text style={styles.priceValue}>
              {formatCurrency(item.selling_price)}
            </Text>
            {stock <= minStock && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Products</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {
                products.filter(p => {
                  const stock = parseFloat(
                    String(p.current_stock ?? p.quantity_in_stock ?? 0),
                  );
                  const minStock = parseFloat(
                    String(p.min_stock_level ?? p.reorder_level ?? 5),
                  );
                  return stock <= minStock;
                }).length
              }
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          value={search}
          onChangeText={handleSearch}
          placeholder="Search products..."
        />
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              Add your first product to get started
            </Text>
          </View>
        }
      />

      {canCreateProduct && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border || '#E0E0E0',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  list: {
    padding: SPACING.md,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: SPACING.md,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: SPACING.md,
    backgroundColor: COLORS.border || '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productInfoFull: {
    flex: 1,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  productSku: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  stockValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  stockLow: {
    color: COLORS.error,
  },
  productPrice: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: SPACING.xs,
  },
  lowStockText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabPressed: {
    backgroundColor: COLORS.primaryDark || '#1e40af',
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default ProductsScreen;
