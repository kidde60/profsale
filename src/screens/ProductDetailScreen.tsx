import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Card, Button, Input, Loading } from '../components';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;

type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductDetail'
>;

interface Props {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    buyingPrice: '',
    sellingPrice: '',
    currentStock: '',
    minStockLevel: '',
    unit: '',
    categoryId: '',
  });

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProduct(productId);
      setProduct(data);

      // Populate form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        barcode: data.barcode || '',
        buyingPrice: String(data.buying_price || data.cost_price || ''),
        sellingPrice: String(data.selling_price || ''),
        currentStock: String(
          data.current_stock ?? data.quantity_in_stock ?? '',
        ),
        minStockLevel: String(data.min_stock_level ?? data.reorder_level ?? ''),
        unit: data.unit || data.unit_of_measure || '',
        categoryId: data.category_id ? String(data.category_id) : '',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        buyingPrice: parseFloat(formData.buyingPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        currentStock: parseFloat(formData.currentStock),
        minStockLevel: parseFloat(formData.minStockLevel) || 5,
        unit: formData.unit || 'pieces',
        categoryId: formData.categoryId
          ? parseInt(formData.categoryId)
          : undefined,
      };

      await productService.updateProduct(productId, updateData);

      Alert.alert('Success', 'Product updated successfully');
      setIsEditing(false);
      await fetchProduct();
    } catch (error: any) {
      console.error('Error updating product:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update product',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              console.error('Error deleting product:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete product',
              );
            }
          },
        },
      ],
    );
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const profitMargin =
    formData.buyingPrice && formData.sellingPrice
      ? (
          ((parseFloat(formData.sellingPrice) -
            parseFloat(formData.buyingPrice)) /
            parseFloat(formData.buyingPrice)) *
          100
        ).toFixed(2)
      : '0.00';

  if (loading) {
    return <Loading message="Loading product details..." />;
  }

  if (!product) {
    return null;
  }

  const stock = product.current_stock ?? product.quantity_in_stock ?? 0;
  const unit = product.unit || product.unit_of_measure || 'units';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {!isEditing ? (
          <>
            {/* View Mode */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Product Information</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{product.name}</Text>
              </View>

              {product.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Description:</Text>
                  <Text style={styles.value}>{product.description}</Text>
                </View>
              )}

              {product.barcode && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Barcode:</Text>
                  <Text style={styles.value}>{product.barcode}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.label}>Unit:</Text>
                <Text style={styles.value}>{unit}</Text>
              </View>

              {product.category_name && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Category:</Text>
                  <Text style={styles.value}>{product.category_name}</Text>
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Pricing</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Buying Price:</Text>
                <Text style={styles.value}>
                  {formatCurrency(
                    product.buying_price || product.cost_price || 0,
                  )}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Selling Price:</Text>
                <Text style={styles.priceValue}>
                  {formatCurrency(product.selling_price)}
                </Text>
              </View>

              {product.profit_margin !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Profit Margin:</Text>
                  <Text style={[styles.value, styles.profitText]}>
                    {product.profit_margin}%
                  </Text>
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Inventory</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Current Stock:</Text>
                <Text
                  style={[
                    styles.value,
                    stock === 0
                      ? styles.outOfStock
                      : stock <=
                        (product.min_stock_level ?? product.reorder_level ?? 5)
                      ? styles.lowStock
                      : null,
                  ]}
                >
                  {stock} {unit}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Minimum Level:</Text>
                <Text style={styles.value}>
                  {product.min_stock_level ?? product.reorder_level ?? 5} {unit}
                </Text>
              </View>

              {product.stock_status && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      product.stock_status === 'out'
                        ? styles.statusOut
                        : product.stock_status === 'low'
                        ? styles.statusLow
                        : styles.statusNormal,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {product.stock_status === 'out'
                        ? 'Out of Stock'
                        : product.stock_status === 'low'
                        ? 'Low Stock'
                        : 'Normal'}
                    </Text>
                  </View>
                </View>
              )}
            </Card>

            <View style={styles.actionButtons}>
              <Button
                title="Edit Product"
                onPress={() => setIsEditing(true)}
                style={styles.button}
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                variant="danger"
                style={styles.button}
              />
            </View>
          </>
        ) : (
          <>
            {/* Edit Mode */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Edit Product</Text>

              <Input
                label="Product Name *"
                value={formData.name}
                onChangeText={value => updateField('name', value)}
                placeholder="Enter product name"
              />

              <Input
                label="Description"
                value={formData.description}
                onChangeText={value => updateField('description', value)}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
              />

              <Input
                label="Barcode/SKU"
                value={formData.barcode}
                onChangeText={value => updateField('barcode', value)}
                placeholder="Enter barcode or SKU"
              />

              <Input
                label="Unit"
                value={formData.unit}
                onChangeText={value => updateField('unit', value)}
                placeholder="e.g., pieces, kg, liters"
              />
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Pricing</Text>

              <Input
                label="Buying Price *"
                value={formData.buyingPrice}
                onChangeText={value => updateField('buyingPrice', value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Input
                label="Selling Price *"
                value={formData.sellingPrice}
                onChangeText={value => updateField('sellingPrice', value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              {formData.buyingPrice && formData.sellingPrice && (
                <View style={styles.profitMargin}>
                  <Text style={styles.profitLabel}>Profit Margin:</Text>
                  <Text
                    style={[
                      styles.profitValue,
                      parseFloat(profitMargin) > 0
                        ? styles.profitPositive
                        : styles.profitNegative,
                    ]}
                  >
                    {profitMargin}%
                  </Text>
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Inventory</Text>

              <Input
                label="Current Stock"
                value={formData.currentStock}
                onChangeText={value => updateField('currentStock', value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <Input
                label="Minimum Stock Level"
                value={formData.minStockLevel}
                onChangeText={value => updateField('minStockLevel', value)}
                placeholder="5"
                keyboardType="decimal-pad"
              />
            </Card>

            <View style={styles.actionButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setIsEditing(false);
                  // Reset form data to product values
                  setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    barcode: product.barcode || '',
                    buyingPrice: String(
                      product.buying_price || product.cost_price || '',
                    ),
                    sellingPrice: String(product.selling_price || ''),
                    currentStock: String(
                      product.current_stock ?? product.quantity_in_stock ?? '',
                    ),
                    minStockLevel: String(
                      product.min_stock_level ?? product.reorder_level ?? '',
                    ),
                    unit: product.unit || product.unit_of_measure || '',
                    categoryId: product.category_id
                      ? String(product.category_id)
                      : '',
                  });
                }}
                variant="outline"
                style={styles.button}
              />
              <Button
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleUpdate}
                disabled={saving}
                style={styles.button}
              />
            </View>
          </>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: SPACING.md,
  },
  card: {
    margin: SPACING.md,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    flex: 2,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 2,
    textAlign: 'right',
  },
  profitText: {
    color: COLORS.success,
    fontWeight: '600',
  },
  lowStock: {
    color: COLORS.warning,
    fontWeight: '600',
  },
  outOfStock: {
    color: COLORS.error,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusOut: {
    backgroundColor: COLORS.error,
  },
  statusLow: {
    backgroundColor: COLORS.warning,
  },
  statusNormal: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  profitMargin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  profitLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  profitValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
  },
});

export default ProductDetailScreen;
