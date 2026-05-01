import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Card, Button, Input, Loading } from '../components';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency, formatStock } from '../utils/helpers';
import {
  handleError,
  handleSuccess,
  handleWarning,
  showToast,
} from '../utils/errorHandler';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  ImagePickerResponse,
  launchImageLibrary,
} from 'react-native-image-picker';

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
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockReason, setRestockReason] = useState('');
  const [restockCostPrice, setRestockCostPrice] = useState('');
  const [restockSellingPrice, setRestockSellingPrice] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageQuantity, setDamageQuantity] = useState('');
  const [damageReason, setDamageReason] = useState('');
  const [damageType, setDamageType] = useState<'damage' | 'expiry'>('damage');
  const [recordingDamage, setRecordingDamage] = useState(false);

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
    productImage: '',
  });

  const fetchProduct = useCallback(async () => {
    try {
      const data = await productService.getProduct(productId);
      console.log('Fetched product data:', data);
      setProduct(data);

      // Populate form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        barcode: data.barcode || '',
        buyingPrice: String(data.buying_price || data.cost_price || ''),
        sellingPrice: String(data.selling_price || ''),
        currentStock: String(
          String(data.current_stock ?? data.quantity_in_stock ?? ''),
        ),
        minStockLevel: String(data.min_stock_level ?? data.reorder_level ?? ''),
        unit: data.unit || data.unit_of_measure || '',
        categoryId: data.category_id ? String(data.category_id) : '',
        productImage: data.product_image || '',
      });
    } catch {
      handleError(null, 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

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
          ? parseInt(formData.categoryId, 10)
          : undefined,
        productImage: formData.productImage || undefined,
      };

      await productService.updateProduct(productId, updateData);

      handleSuccess('Product updated successfully');
      setTimeout(() => navigation.goBack(), 1000);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating product:', error);
      handleError(error, 'Failed to update product');
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
              handleSuccess('Product deleted successfully');
              setTimeout(() => navigation.goBack(), 1000);
            } catch (error: any) {
              console.error('Error deleting product:', error);
              handleError(error, 'Failed to delete product');
            }
          },
        },
      ],
    );
  };

  const handleRestock = async () => {
    const quantity = parseFloat(restockQuantity);
    if (!quantity || quantity <= 0) {
      handleWarning('Please enter a valid quantity');
      return;
    }

    try {
      setRestocking(true);
      const costPrice = restockCostPrice
        ? parseFloat(restockCostPrice)
        : undefined;
      const sellingPrice = restockSellingPrice
        ? parseFloat(restockSellingPrice)
        : undefined;

      await productService.restockProduct(
        productId,
        quantity,
        restockReason.trim() || undefined,
        costPrice,
        sellingPrice,
      );
      handleSuccess('Product restocked successfully');
      setShowRestockModal(false);
      setRestockQuantity('');
      setRestockReason('');
      setRestockCostPrice('');
      setRestockSellingPrice('');
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error) {
      handleError(error, 'Failed to restock product');
    } finally {
      setRestocking(false);
    }
  };

  const handleDamage = async () => {
    const quantity = parseFloat(damageQuantity);
    if (!quantity || quantity <= 0) {
      handleWarning('Please enter a valid quantity');
      return;
    }

    try {
      setRecordingDamage(true);
      await productService.recordDamage(productId, {
        quantity,
        reason: damageReason.trim() || '',
        changeType: damageType,
      });
      handleSuccess(
        `${
          damageType === 'damage' ? 'Damaged' : 'Expired'
        } products recorded successfully`,
      );
      setShowDamageModal(false);
      setDamageQuantity('');
      setDamageReason('');
      setDamageType('damage');
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error) {
      handleError(error, 'Failed to record damage/expiry');
    } finally {
      setRecordingDamage(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Gallery Permission',
            message: 'App needs access to your gallery to pick images',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      handleWarning('Please grant gallery permission to select images');
      return;
    }

    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as any,
        maxWidth: 800,
        maxHeight: 800,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
          return;
        }

        if (response.errorCode) {
          handleError(null, 'Failed to pick image');
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          if (asset.uri) {
            updateField('productImage', asset.uri);
          }
        }
      });
    } catch (error) {
      console.error('Image picker error:', error);
      handleError(
        null,
        'Image picker is not available. Please rebuild the app.',
      );
    }
  };

  const removeImage = () => {
    updateField('productImage', '');
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

  const stock = parseFloat(
    String(product.current_stock ?? product.quantity_in_stock ?? 0),
  );
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
                        parseFloat(
                          String(
                            product.min_stock_level ??
                              product.reorder_level ??
                              5,
                          ),
                        )
                      ? styles.lowStock
                      : null,
                  ]}
                >
                  {formatStock(stock)} {unit}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Minimum Level:</Text>
                <Text style={styles.value}>
                  {formatStock(
                    product.min_stock_level ?? product.reorder_level ?? 5,
                  )}{' '}
                  {unit}
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
                title="Restock"
                onPress={() => setShowRestockModal(true)}
                style={styles.button}
              />
              <Button
                title="Damage/Expiry"
                onPress={() => setShowDamageModal(true)}
                variant="outline"
                style={styles.button}
              />
            </View>
            <View style={styles.actionButtons}>
              <Button
                title="Edit"
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

              <Text style={styles.imageLabel}>Product Image</Text>
              {formData.productImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: formData.productImage }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <Text style={styles.removeImageText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={handleImagePicker}
                >
                  <Text style={styles.imageUploadText}>
                    + Add Product Image
                  </Text>
                </TouchableOpacity>
              )}

              <Input
                label="Product Name"
                required
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
                      parseInt(
                        String(
                          product.current_stock ??
                            product.quantity_in_stock ??
                            '',
                        ),
                        10,
                      ),
                    ),
                    minStockLevel: String(
                      product.min_stock_level ?? product.reorder_level ?? '',
                    ),
                    unit: product.unit || product.unit_of_measure || '',
                    categoryId: product.category_id
                      ? String(product.category_id)
                      : '',
                    productImage: product.product_image || '',
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

      {/* Restock Modal */}
      <Modal
        visible={showRestockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRestockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restock Product</Text>
            <Text style={styles.modalSubtitle}>{product.name}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <Input
                label="Quantity"
                required
                placeholder="Enter quantity"
                value={restockQuantity}
                onChangeText={setRestockQuantity}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Input
                label="Buying price (Optinal)"
                placeholder="Enter cost price"
                value={restockCostPrice}
                onChangeText={setRestockCostPrice}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Input
                label="Selling price (Optional)"
                placeholder="Enter selling price"
                value={restockSellingPrice}
                onChangeText={setRestockSellingPrice}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Reason for restocking"
                value={restockReason}
                onChangeText={setRestockReason}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowRestockModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={restocking ? 'Restocking...' : 'Restock'}
                onPress={handleRestock}
                disabled={restocking}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Damage/Expiry Modal */}
      <Modal
        visible={showDamageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDamageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Damage/Expiry</Text>
            <Text style={styles.modalSubtitle}>{product.name}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    damageType === 'damage' && styles.typeButtonActive,
                  ]}
                  onPress={() => setDamageType('damage')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      damageType === 'damage' && styles.typeButtonTextActive,
                    ]}
                  >
                    Damaged
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    damageType === 'expiry' && styles.typeButtonActive,
                  ]}
                  onPress={() => setDamageType('expiry')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      damageType === 'expiry' && styles.typeButtonTextActive,
                    ]}
                  >
                    Expired
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={damageQuantity}
                onChangeText={setDamageQuantity}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={`Reason for ${damageType}`}
                value={damageReason}
                onChangeText={setDamageReason}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowDamageModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={recordingDamage ? 'Recording...' : 'Record'}
                onPress={handleDamage}
                disabled={recordingDamage}
                variant="danger"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  imageLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  imagePreviewContainer: {
    marginTop: SPACING.sm,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 4,
  },
  removeImageText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  imageUploadButton: {
    marginTop: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border || '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  imageUploadText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
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
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: COLORS.white,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.xl,
  },
  button: {
    flex: 1,
  },
});

export default ProductDetailScreen;
