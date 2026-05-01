import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input } from '../components';
import { salesService } from '../services/salesService';
import { customerService } from '../services/customerService';
import { Customer } from '../types';
import { formatCurrency } from '../utils/helpers';
import {
  handleError,
  handleSuccess,
  handleWarning,
} from '../utils/errorHandler';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Checkout'
>;
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface Props {
  navigation: CheckoutScreenNavigationProp;
  route: CheckoutScreenRouteProp;
}

// ─── reusable inline-edit field ───────────────────────────────────────────────
interface EditFieldProps {
  label: string;
  displayValue: string;
  isEditing: boolean;
  tempValue: string;
  onTap: () => void;
  onChangeText: (v: string) => void;
  onConfirm: () => void;
  pillStyle?: object;
  pillTextStyle?: object;
}

const EditField: React.FC<EditFieldProps> = ({
  label,
  displayValue,
  isEditing,
  tempValue,
  onTap,
  onChangeText,
  onConfirm,
  pillStyle,
  pillTextStyle,
}) => (
  <View style={fieldStyles.group}>
    <Text style={fieldStyles.label}>{label}</Text>
    {isEditing ? (
      <View style={fieldStyles.editRow}>
        <TextInput
          value={tempValue}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          style={fieldStyles.input}
          autoFocus
          selectTextOnFocus
          onSubmitEditing={onConfirm}
        />
        <TouchableOpacity onPress={onConfirm} style={fieldStyles.confirmBtn}>
          <Text style={fieldStyles.confirmBtnText}>✓</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity
        style={[fieldStyles.pill, pillStyle]}
        onPress={onTap}
        activeOpacity={0.7}
      >
        <Text style={[fieldStyles.pillValue, pillTextStyle]} numberOfLines={1}>
          {displayValue}
        </Text>
        <Text style={fieldStyles.pillIcon}>✎</Text>
      </TouchableOpacity>
    )}
  </View>
);

const fieldStyles = StyleSheet.create({
  group: {
    marginTop: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
    gap: 4,
  },
  pillValue: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  pillIcon: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  confirmBtn: {
    backgroundColor: COLORS.success,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
  },
});
// ──────────────────────────────────────────────────────────────────────────────

const CheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { cart } = route.params;

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
  const [discountAmount, setDiscountAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // editing state — tracks which item + which field is active
  const [editingQtyId, setEditingQtyId] = useState<number | null>(null);
  const [tempQty, setTempQty] = useState('');
  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [tempRate, setTempRate] = useState('');
  const [editingSubtotalId, setEditingSubtotalId] = useState<number | null>(
    null,
  );
  const [tempSubtotal, setTempSubtotal] = useState('');

  // Round to nearest 100 shillings (since 50 shillings no longer exists)
  const roundToNearest100 = (value: number): number => {
    return Math.round(value / 100) * 100;
  };

  const [editableCart, setEditableCart] = useState(
    cart.map(item => ({
      ...item,
      subtotal: roundToNearest100(item.subtotal),
    })),
  );

  useEffect(() => {
    fetchCustomers();
  }, []);

  const closeAllEdits = () => {
    setEditingQtyId(null);
    setEditingRateId(null);
    setEditingSubtotalId(null);
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers({});
      const data = Array.isArray(response.data)
        ? response.data
        : (response as any)?.data?.customers || [];
      setCustomers(data);
    } catch (e) {
      console.error('Error fetching customers:', e);
    }
  };

  const calculateTotal = () =>
    roundToNearest100(
      editableCart.reduce(
        (sum, item) => sum + (parseFloat(String(item.subtotal)) || 0),
        0,
      ) - (parseFloat(discountAmount) || 0),
    );

  const calculateActualTotal = () =>
    editableCart.reduce(
      (sum, item) => sum + (parseFloat(String(item.subtotal)) || 0),
      0,
    ) - (parseFloat(discountAmount) || 0);

  const calculateSubtotal = () =>
    roundToNearest100(
      editableCart.reduce(
        (sum, item) => sum + (parseFloat(String(item.subtotal)) || 0),
        0,
      ),
    );

  const calculateChange = () =>
    (parseFloat(amountTendered) || 0) - calculateTotal();

  const updateQty = (productId: number) => {
    const qty = parseFloat(tempQty);
    if (isNaN(qty) || qty <= 0) {
      handleWarning('Please enter a valid quantity');
      return;
    }

    const item = editableCart.find(i => i.product.id === productId);
    if (item) {
      const availableStock =
        item.product.current_stock || item.product.quantity_in_stock || 0;
      if (qty > availableStock) {
        handleWarning(
          `Only ${availableStock} units available. Please reduce the quantity.`,
        );
        return;
      }
    }

    setEditableCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const subtotal = roundToNearest100(item.unitPrice * qty);
          return { ...item, quantity: qty, subtotal };
        }
        return item;
      }),
    );
    setEditingQtyId(null);
    setTempQty('');
  };

  const updateRate = (productId: number) => {
    const rate = parseFloat(tempRate);
    if (isNaN(rate) || rate <= 0) {
      handleWarning('Please enter a valid price');
      return;
    }
    setEditableCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const subtotal = roundToNearest100(rate * item.quantity);
          return { ...item, unitPrice: rate, subtotal };
        }
        return item;
      }),
    );
    setEditingRateId(null);
    setTempRate('');
  };

  const updateSubtotal = (productId: number) => {
    const sub = parseFloat(tempSubtotal);
    if (isNaN(sub) || sub <= 0) {
      handleWarning('Please enter a valid subtotal');
      return;
    }
    const roundedSubtotal = roundToNearest100(sub);
    setEditableCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            subtotal: roundedSubtotal,
            unitPrice:
              item.quantity > 0
                ? roundToNearest100(roundedSubtotal / item.quantity)
                : item.unitPrice,
          };
        }
        return item;
      }),
    );
    setEditingSubtotalId(null);
    setTempSubtotal('');
  };

  const confirmSale = async () => {
    if (paymentMethod === 'cash' && calculateChange() < 0) {
      handleWarning('Amount tendered is less than total');
      return;
    }
    if (paymentMethod === 'credit') {
      if (customerType === 'existing' && !selectedCustomer) {
        handleWarning('Credit sales must be linked to a customer');
        return;
      }
      if (customerType === 'new' && !customerName.trim()) {
        handleWarning('Please enter customer name for credit sales');
        return;
      }
    }
    if (customerType === 'existing' && !selectedCustomer) {
      handleWarning('Please select a customer');
      return;
    }

    let customerId = selectedCustomer?.id || null;
    if (customerType === 'new' && customerName.trim()) {
      try {
        const newCustomer = await customerService.createCustomer({
          name: customerName.trim(),
          phone: customerPhone.trim() || undefined,
          email: undefined,
          address: undefined,
          business_id: user?.businessId || 1,
        });
        customerId = newCustomer.id;
      } catch (e) {
        handleError(e, 'Failed to create customer. Please try again.');
        return;
      }
    }

    // For credit sales, ensure customer_id is set
    if (paymentMethod === 'credit' && !customerId) {
      handleWarning('Credit sales must be linked to a customer');
      return;
    }

    try {
      setProcessing(true);
      await salesService.createSale({
        businessId: user?.businessId || 1,
        customer_id: customerId || undefined,
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
        discountAmount: parseFloat(discountAmount) || 0,
        amountPaid:
          paymentMethod === 'credit' && amountTendered
            ? parseFloat(amountTendered)
            : undefined,
      });
      handleSuccess('Sale completed successfully');
      setTimeout(() => {
        navigation.navigate('Back', { screen: 'Sales' });
      }, 500);
    } catch (e) {
      handleError(e, 'Failed to complete sale');
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
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* ── Order Items ── */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>

          <View style={styles.itemGrid}>
            {editableCart.map(item => (
              <View key={item.product.id} style={styles.itemCard}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product.name}
                </Text>

                <View style={styles.fieldsRow}>
                  <View style={styles.fieldColumn}>
                    <EditField
                      label="QTY"
                      displayValue={String(item.quantity)}
                      isEditing={editingQtyId === item.product.id}
                      tempValue={tempQty}
                      onTap={() => {
                        closeAllEdits();
                        setEditingQtyId(item.product.id);
                        setTempQty(String(item.quantity));
                      }}
                      onChangeText={setTempQty}
                      onConfirm={() => updateQty(item.product.id)}
                    />
                  </View>

                  <View style={styles.fieldColumn}>
                    <EditField
                      label="RATE"
                      displayValue={formatCurrency(item.unitPrice)}
                      isEditing={editingRateId === item.product.id}
                      tempValue={tempRate}
                      onTap={() => {
                        closeAllEdits();
                        setEditingRateId(item.product.id);
                        setTempRate(String(item.unitPrice));
                      }}
                      onChangeText={setTempRate}
                      onConfirm={() => updateRate(item.product.id)}
                    />
                  </View>
                </View>

                <View style={styles.subtotalRow}>
                  <EditField
                    label="SUBTOTAL"
                    displayValue={formatCurrency(item.subtotal)}
                    isEditing={editingSubtotalId === item.product.id}
                    tempValue={tempSubtotal}
                    onTap={() => {
                      closeAllEdits();
                      setEditingSubtotalId(item.product.id);
                      setTempSubtotal(
                        parseFloat(String(item.subtotal)).toFixed(2),
                      );
                    }}
                    onChangeText={setTempSubtotal}
                    onConfirm={() => updateSubtotal(item.product.id)}
                    pillStyle={styles.subtotalPill}
                    pillTextStyle={styles.subtotalPillText}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Discount field */}
          <View style={styles.discountRow}>
            <Text style={styles.discountLabel}>Discount</Text>
            <TextInput
              style={styles.discountInput}
              value={discountAmount}
              onChangeText={setDiscountAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(calculateSubtotal())}
            </Text>
          </View>

          {parseFloat(discountAmount) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountText]}>
                Discount
              </Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -{formatCurrency(parseFloat(discountAmount) || 0)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(calculateTotal())}
            </Text>
          </View>
        </Card>

        {/* ── Customer ── */}
        <Card style={[styles.section, styles.customerCard]}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.segmentedControl}>
            {(['walkin', 'existing', 'new'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.segmentBtn,
                  customerType === type && styles.segmentBtnActive,
                ]}
                onPress={() => {
                  setCustomerType(type);
                  setSelectedCustomer(null);
                  setCustomerName('');
                  setCustomerPhone('');
                  setCustomerSearch('');
                }}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    customerType === type && styles.segmentBtnTextActive,
                  ]}
                >
                  {type === 'walkin'
                    ? 'Walk-in'
                    : type === 'existing'
                    ? 'Existing'
                    : 'New'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {customerType === 'existing' && (
            <View style={styles.customerSearchContainer}>
              <Input
                label="Search Customer"
                value={customerSearch || selectedCustomer?.name || ''}
                onChangeText={text => {
                  setCustomerSearch(text);
                  setShowCustomerDropdown(true);
                }}
                placeholder="Type name or phone..."
                onFocus={() => setShowCustomerDropdown(true)}
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
                          setCustomerSearch(customer.name);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <Text style={styles.customerDropdownName}>
                          {customer.name}
                        </Text>
                        {customer.phone && (
                          <Text style={styles.customerDropdownPhone}>
                            {customer.phone}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {selectedCustomer && !showCustomerDropdown && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                    setShowCustomerDropdown(true);
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear Selection</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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

        {/* ── Payment ── */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {(['cash', 'credit'] as const).map(method => (
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
                  {method === 'credit' ? 'Credit' : 'Cash'}
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
              {amountTendered ? (
                <View style={styles.changeSection}>
                  <Text style={styles.changeLabel}>Change</Text>
                  <Text
                    style={[
                      styles.changeAmount,
                      calculateChange() < 0 && styles.negativeChange,
                    ]}
                  >
                    {formatCurrency(calculateChange())}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {paymentMethod === 'credit' && (
            <View style={styles.cashSection}>
              <Input
                label="Amount Paid (Optional)"
                value={amountTendered}
                onChangeText={setAmountTendered}
                keyboardType="decimal-pad"
                placeholder="Leave empty for full credit"
              />
              {amountTendered && parseFloat(amountTendered) > 0 ? (
                <View style={styles.changeSection}>
                  <Text style={styles.changeLabel}>Balance Due</Text>
                  <Text style={styles.changeAmount}>
                    {formatCurrency(
                      calculateTotal() - parseFloat(amountTendered),
                    )}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </Card>
      </ScrollView>

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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  section: { margin: SPACING.md },
  customerCard: {
    zIndex: 9999,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // ── 2-column item grid ────────────────────────────────────
  itemGrid: {
    flexDirection: 'column',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  itemCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  fieldColumn: {
    flex: 1,
  },
  subtotalRow: {
    marginTop: SPACING.xs,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    minHeight: 36,
  },

  // subtotal pill overrides
  subtotalPill: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  subtotalPillText: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ── Discount ────────────────────────────────────────────────
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  discountLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  discountInput: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  discountText: {
    color: COLORS.error,
  },

  // ── Total ─────────────────────────────────────────────────
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
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

  // ── Customer ──────────────────────────────────────────────
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 3,
    marginBottom: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  segmentBtnTextActive: { color: COLORS.white },
  customerSearchContainer: {
    position: 'relative',
    zIndex: 9999,
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
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 9999,
  },
  customerDropdownScroll: { maxHeight: 200 },
  customerDropdownItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customerDropdownName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
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
    marginBottom: 2,
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
  clearButton: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ── Payment ───────────────────────────────────────────────
  paymentMethods: {
    flexDirection: 'row',
    gap: SPACING['2xl'],
    marginBottom: SPACING.md,
  },
  paymentMethod: {
    flex: 1,
    paddingVertical: SPACING.sm,
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
  paymentMethodTextActive: { color: COLORS.white },
  cashSection: { gap: SPACING.sm },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
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
  negativeChange: { color: COLORS.error },

  // ── Bottom actions ────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: { flex: 1 },
});

export default CheckoutScreen;
