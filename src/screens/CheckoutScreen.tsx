import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input, Loading } from '../components';
import { offlineSalesService } from '../services/offlineSalesService';
import { customerService } from '../services/customerService';
import { Customer } from '../types';
import { formatCurrency } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Checkout'
>;

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface Props {
  navigation: CheckoutScreenNavigationProp;
  route: CheckoutScreenRouteProp;
}

const CheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { isOfflineMode, refreshSyncStatus } = useOffline();
  const { cart, total } = route.params;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerType, setCustomerType] = useState<
    'existing' | 'walkin' | 'new'
  >('walkin');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'mobile_money' | 'card' | 'credit'
  >('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [processing, setProcessing] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [editableCart, setEditableCart] = useState(cart);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers({});
      const customersData = Array.isArray(response.data)
        ? response.data
        : (response as any)?.data?.customers || [];
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const calculateTotal = () => {
    return editableCart.reduce((sum, item) => {
      const itemSubtotal = parseFloat(String(item.subtotal)) || 0;
      return sum + itemSubtotal;
    }, 0);
  };

  const calculateChange = () => {
    const tendered = parseFloat(amountTendered) || 0;
    return tendered - calculateTotal();
  };

  const updateItemPrice = (productId: number) => {
    const newPrice = parseFloat(tempPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    setEditableCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? {
              ...item,
              unitPrice: newPrice,
              subtotal: newPrice * item.quantity,
            }
          : item,
      ),
    );

    setEditingPriceId(null);
    setTempPrice('');
  };

  const confirmSale = async () => {
    if (paymentMethod === 'cash') {
      const change = calculateChange();
      if (change < 0) {
        Alert.alert(
          'Insufficient Payment',
          'Amount tendered is less than total',
        );
        return;
      }
    }

    if (customerType === 'existing' && !selectedCustomer) {
      Alert.alert('Customer Required', 'Please select a customer');
      return;
    }

    try {
      setProcessing(true);
      const saleData = {
        businessId: user?.businessId || 1,
        customer_id: selectedCustomer?.id,
        customerName:
          customerType === 'existing'
            ? selectedCustomer?.name
            : customerName.trim() || null,
        customerPhone:
          customerType === 'new' ? customerPhone.trim() || null : null,
        items: editableCart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        total: calculateTotal(),
      };

      const result = await offlineSalesService.createSale(saleData);

      if (result.success) {
        // Refresh sync status to update pending count
        await refreshSyncStatus();

        const successMessage = result.isOffline
          ? 'Sale saved offline. Will sync when connected.'
          : 'Sale completed successfully';

        Alert.alert('Success', successMessage, [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'MainTabs',
                    state: {
                      routes: [{ name: 'POS', params: { clearCart: true } }],
                    },
                  },
                ],
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to complete sale');
      }
    } catch (error) {
      console.error('Sale error:', error);
      Alert.alert('Error', 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const filteredCustomers = customers
    .filter(
      c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone && c.phone.includes(customerSearch)),
    )
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        {/* Items List */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {editableCart.map((item, index) => (
            <View key={item.product.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <View style={styles.itemPriceSection}>
                {editingPriceId === item.product.id ? (
                  <View style={styles.priceEditContainer}>
                    <Input
                      value={tempPrice}
                      onChangeText={setTempPrice}
                      keyboardType="decimal-pad"
                      style={styles.priceEditInput}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => updateItemPrice(item.product.id)}
                      style={styles.priceEditButton}
                    >
                      <Text style={styles.priceEditButtonText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingPriceId(item.product.id);
                      setTempPrice(String(item.unitPrice));
                    }}
                  >
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                    <Text style={styles.itemUnitPrice}>
                      @ {formatCurrency(item.unitPrice)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(calculateTotal())}
            </Text>
          </View>
        </Card>

        {/* Customer Selection */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>

          <View style={styles.customerTypeContainer}>
            <TouchableOpacity
              style={[
                styles.customerTypeButton,
                customerType === 'walkin' && styles.customerTypeButtonActive,
              ]}
              onPress={() => {
                setCustomerType('walkin');
                setSelectedCustomer(null);
                setCustomerName('');
                setCustomerPhone('');
                setCustomerSearch('');
              }}
            >
              <Text
                style={[
                  styles.customerTypeButtonText,
                  customerType === 'walkin' &&
                    styles.customerTypeButtonTextActive,
                ]}
              >
                Walk-in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.customerTypeButton,
                customerType === 'existing' && styles.customerTypeButtonActive,
              ]}
              onPress={() => {
                setCustomerType('existing');
                setSelectedCustomer(null);
                setCustomerSearch('');
              }}
            >
              <Text
                style={[
                  styles.customerTypeButtonText,
                  customerType === 'existing' &&
                    styles.customerTypeButtonTextActive,
                ]}
              >
                Existing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.customerTypeButton,
                customerType === 'new' && styles.customerTypeButtonActive,
              ]}
              onPress={() => {
                setCustomerType('new');
                setSelectedCustomer(null);
                setCustomerSearch('');
              }}
            >
              <Text
                style={[
                  styles.customerTypeButtonText,
                  customerType === 'new' && styles.customerTypeButtonTextActive,
                ]}
              >
                New
              </Text>
            </TouchableOpacity>
          </View>

          {/* Existing Customer Search */}
          {customerType === 'existing' && !selectedCustomer && (
            <View style={styles.customerSearchContainer}>
              <Input
                label="Search Customer"
                value={customerSearch}
                onChangeText={text => {
                  setCustomerSearch(text);
                  setShowCustomerDropdown(text.length > 0);
                }}
                placeholder="Type name or phone..."
                onFocus={() =>
                  setShowCustomerDropdown(customerSearch.length > 0)
                }
              />

              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <View style={styles.customerDropdown}>
                  <ScrollView
                    style={styles.customerDropdownScroll}
                    nestedScrollEnabled
                  >
                    {filteredCustomers.map(customer => (
                      <TouchableOpacity
                        key={customer.id}
                        style={styles.customerDropdownItem}
                        onPress={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch('');
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <View>
                          <Text style={styles.customerDropdownName}>
                            {customer.name}
                          </Text>
                          {customer.phone && (
                            <Text style={styles.customerDropdownPhone}>
                              {customer.phone}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Selected Customer */}
          {customerType === 'existing' && selectedCustomer && (
            <View style={styles.selectedCustomer}>
              <View>
                <Text style={styles.selectedCustomerName}>
                  {selectedCustomer.name}
                </Text>
                {selectedCustomer.phone && (
                  <Text style={styles.selectedCustomerPhone}>
                    {selectedCustomer.phone}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                }}
              >
                <Text style={styles.changeButton}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* New Customer Form */}
          {customerType === 'new' && (
            <View>
              <Input
                label="Customer Name"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter name"
              />
              <Input
                label="Phone Number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Enter phone"
                keyboardType="phone-pad"
              />
            </View>
          )}
        </Card>

        {/* Payment Method */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {(['cash', 'mobile_money', 'card'] as const).map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethod,
                  paymentMethod === method && styles.paymentMethodActive,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === method && styles.paymentMethodTextActive,
                  ]}
                >
                  {method === 'mobile_money'
                    ? 'Mobile Money'
                    : method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod === 'cash' && (
            <View style={styles.cashSection}>
              <Input
                label="Amount Tendered"
                value={amountTendered}
                onChangeText={setAmountTendered}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              {amountTendered && (
                <View style={styles.changeSection}>
                  <Text style={styles.changeLabel}>Change:</Text>
                  <Text
                    style={[
                      styles.changeAmount,
                      calculateChange() < 0 && styles.negativeChange,
                    ]}
                  >
                    {formatCurrency(calculateChange())}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title={processing ? 'Processing...' : 'Complete Sale'}
          onPress={confirmSale}
          disabled={processing}
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemQty: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  itemPriceSection: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemUnitPrice: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceEditInput: {
    width: 80,
    marginBottom: 0,
  },
  priceEditButton: {
    backgroundColor: COLORS.success,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceEditButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerTypeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  customerTypeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
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
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerTypeButtonTextActive: {
    color: COLORS.white,
  },
  customerSearchContainer: {
    position: 'relative',
    zIndex: 1000,
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
  selectedCustomer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  selectedCustomerName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedCustomerPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  changeButton: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  paymentMethod: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  paymentMethodActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  paymentMethodTextActive: {
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
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
  },
});

export default CheckoutScreen;
