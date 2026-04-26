import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { Input, Button, Card } from '../components';
import { productService } from '../services/productService';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type AddProductScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddProduct'
>;

interface Props {
  navigation: AddProductScreenNavigationProp;
}

interface ProductFormData {
  name: string;
  description: string;
  barcode: string;
  buyingPrice: string;
  sellingPrice: string;
  currentStock: string;
  minStockLevel: string;
  unit: string;
  categoryId?: string;
  productImage?: string;
}

const AddProductScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [_categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    barcode: '',
    buyingPrice: '',
    sellingPrice: '',
    currentStock: '0',
    minStockLevel: '5',
    unit: 'pieces',
    categoryId: undefined,
    productImage: undefined,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await productService.getCategories();
      setCategories(result);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Categories are optional, so we continue without them
      setCategories([]);
    }
  };

  const updateField = (field: keyof ProductFormData, value: string) => {
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
      Alert.alert(
        'Permission Denied',
        'Please grant gallery permission to select images',
      );
      return;
    }

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
        Alert.alert('Error', 'Failed to pick image');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setFormData(prev => ({ ...prev, productImage: asset.uri }));
        }
      }
    });
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, productImage: undefined }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return false;
    }

    const buyingPrice = parseFloat(formData.buyingPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);

    if (isNaN(buyingPrice) || buyingPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid buying price');
      return false;
    }

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid selling price');
      return false;
    }

    if (sellingPrice <= buyingPrice) {
      Alert.alert('Error', 'Selling price must be greater than buying price');
      return false;
    }

    const currentStock = parseFloat(formData.currentStock);
    if (isNaN(currentStock) || currentStock < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const productData = {
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
        productImage: formData.productImage,
      };

      await productService.createProduct(productData);

      Alert.alert('Success', 'Product added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating product:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to add product',
      );
    } finally {
      setLoading(false);
    }
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

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

          <Text style={styles.imageLabel}>Product Image (Optional)</Text>
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
              <Text style={styles.imageUploadText}>+ Add Product Image</Text>
            </TouchableOpacity>
          )}
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

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={loading ? 'Adding...' : 'Add Product'}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.button}
          />
        </View>
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
    paddingBottom: SPACING.xl,
  },
  card: {
    margin: SPACING.md,
    marginBottom: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
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
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
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
    borderRadius: 12,
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
  profitMargin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border || '#E0E0E0',
  },
  profitLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
  buttonContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
  },
});

export default AddProductScreen;
