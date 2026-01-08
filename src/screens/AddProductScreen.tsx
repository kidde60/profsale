import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
}

const AddProductScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
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
          ? parseInt(formData.categoryId)
          : undefined,
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
  buttonContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
  },
});

export default AddProductScreen;
