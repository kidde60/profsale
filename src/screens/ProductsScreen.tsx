import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Loading, Input, Button } from '../components';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency } from '../utils/helpers';
import { canAccessFeature } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProductsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

interface Props {
  navigation: ProductsScreenNavigationProp;
}

const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const canCreateProduct = canAccessFeature(
    user?.role || '',
    user?.permissions,
    'create_product',
  );

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, []),
  );

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ search });
      // Backend returns { success, data: { products, pagination, summary } }
      const productsData =
        (response as any)?.data?.products || response.data || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const stock = item.current_stock ?? item.quantity_in_stock ?? 0;
    const unit = item.unit || item.unit_of_measure || 'units';
    const minStock = item.min_stock_level ?? item.reorder_level ?? 5;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item.id })
        }
      >
        <Card>
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              {(item.sku || item.barcode) && (
                <Text style={styles.productSku}>
                  {item.sku ? `SKU: ${item.sku}` : `Barcode: ${item.barcode}`}
                </Text>
              )}
              <Text style={styles.productStock}>
                Stock: {stock} {unit}
              </Text>
            </View>
            <View style={styles.productPrice}>
              <Text style={styles.priceLabel}>Price</Text>
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
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          onSubmitEditing={fetchProducts}
        />
        <Button title="Search" onPress={fetchProducts} size="small" />
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
          <Text style={styles.emptyText}>No products found</Text>
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
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  list: {
    padding: SPACING.md,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  productSku: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  productStock: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  productPrice: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: SPACING.xs,
  },
  lowStockText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.xl,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabPressed: {
    backgroundColor: COLORS.primaryDark || '#1e40af',
    elevation: 2,
  },
  fabText: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default ProductsScreen;
