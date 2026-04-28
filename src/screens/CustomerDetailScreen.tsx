import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  Alert,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Loading } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { customerService } from '../services/customerService';
import { salesService } from '../services/salesService';
import { Customer } from '../types';

type CustomerDetailRouteProp = RouteProp<RootStackParamList, 'CustomerDetail'>;

const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<CustomerDetailRouteProp>();
  const navigation = useNavigation();
  const { customerId } = route.params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    notes: '',
  });
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [items, setItems] = useState<
    Array<{
      product_id: number;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>
  >([]);
  const [tempItem, setTempItem] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    unit_price: '',
  });
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomer();
    fetchPendingSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomer(customerId);
      setCustomer(data);
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      });
    } catch (_error) {
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSales = async () => {
    try {
      const response = await salesService.getSales({
        customer_id: customerId,
        status: 'pending',
      } as any);
      setPendingSales(response.data || []);
    } catch (_error) {
      // Ignore error for now
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const updated = await customerService.updateCustomer(customerId, form);
      setCustomer(updated);
      setEditing(false);
      Alert.alert('Success', 'Customer updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const productId = parseInt(tempItem.product_id);
    const quantity = parseFloat(tempItem.quantity);
    const unitPrice = parseFloat(tempItem.unit_price);

    if (!productId || !quantity || !unitPrice || !tempItem.product_name) {
      Alert.alert('Error', 'Please fill all item fields');
      return;
    }

    const total_price = quantity * unitPrice;
    setItems([
      ...items,
      {
        product_id: productId,
        product_name: tempItem.product_name,
        quantity,
        unit_price: unitPrice,
        total_price,
      },
    ]);
    setTempItem({
      product_id: '',
      product_name: '',
      quantity: '',
      unit_price: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleRecordOpeningBalance = async () => {
    const amount = parseFloat(openingBalanceForm.amount);

    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      await customerService.recordOpeningBalance(customerId, {
        amount,
        description: openingBalanceForm.description,
        date: openingBalanceForm.date,
        items,
      });
      Alert.alert('Success', 'Opening balance recorded successfully');
      setShowOpeningBalanceModal(false);
      setOpeningBalanceForm({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setItems([]);
      fetchPendingSales();
    } catch (error) {
      Alert.alert('Error', 'Failed to record opening balance');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentForm.amount);

    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedSale) {
      Alert.alert('Error', 'No sale selected');
      return;
    }

    try {
      setLoading(true);
      await salesService.recordPayment(selectedSale.id, {
        amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
      });
      Alert.alert('Success', 'Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_method: 'cash', notes: '' });
      setSelectedSale(null);
      fetchPendingSales();
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading customer..." />;
  if (!customer)
    return <Text style={styles.subtitle}>Customer not found.</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card>
          <Text style={styles.title}>Customer Details</Text>
          {editing ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={form.phone}
                onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={form.email}
                onChangeText={v => setForm(f => ({ ...f, email: v }))}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={form.address}
                onChangeText={v => setForm(f => ({ ...f, address: v }))}
              />
              <Button title="Save" onPress={handleUpdate} />
              <Button
                title="Cancel"
                onPress={() => setEditing(false)}
                color={COLORS.textSecondary}
              />
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>Name: {customer.name}</Text>
              <Text style={styles.subtitle}>Phone: {customer.phone}</Text>
              <Text style={styles.subtitle}>Email: {customer.email}</Text>
              <Text style={styles.subtitle}>Address: {customer.address}</Text>
              <Text style={styles.subtitle}>
                Type: {customer.customer_type}
              </Text>
              <Text style={styles.subtitle}>
                Total Purchases: {customer.total_purchases}
              </Text>
              <Text style={styles.subtitle}>
                Total Orders: {customer.total_orders}
              </Text>
              <Text style={styles.subtitle}>
                Loyalty Points: {customer.loyalty_points}
              </Text>
              <Button title="Edit" onPress={() => setEditing(true)} />
              <Button
                title="Record Opening Balance"
                onPress={() => setShowOpeningBalanceModal(true)}
                color={COLORS.primary}
              />
            </>
          )}
        </Card>

        {pendingSales.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.title}>Pending Credit Sales</Text>
            {pendingSales.map(sale => (
              <View key={sale.id} style={styles.saleRow}>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleDate}>
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.saleAmount}>
                    Total: {sale.total_amount} | Paid: {sale.amount_paid} | Due:{' '}
                    {(sale.total_amount - sale.amount_paid).toFixed(2)}
                  </Text>
                  {sale.is_opening_balance && (
                    <Text style={styles.openingBadge}>Opening Balance</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => {
                    setSelectedSale(sale);
                    setShowPaymentModal(true);
                  }}
                >
                  <Text style={styles.payButtonText}>Record Payment</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}
      </View>

      <Modal
        visible={showOpeningBalanceModal}
        animationType="slide"
        onRequestClose={() => setShowOpeningBalanceModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Opening Balance</Text>
            <ScrollView>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={openingBalanceForm.amount}
                onChangeText={v =>
                  setOpeningBalanceForm(f => ({ ...f, amount: v }))
                }
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter description"
                value={openingBalanceForm.description}
                onChangeText={v =>
                  setOpeningBalanceForm(f => ({ ...f, description: v }))
                }
              />

              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={openingBalanceForm.date}
                onChangeText={v =>
                  setOpeningBalanceForm(f => ({ ...f, date: v }))
                }
              />

              <Text style={styles.sectionHeader}>Items</Text>

              <Text style={styles.label}>Product ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Product ID"
                value={tempItem.product_id}
                onChangeText={v => setTempItem(f => ({ ...f, product_id: v }))}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={tempItem.product_name}
                onChangeText={v =>
                  setTempItem(f => ({ ...f, product_name: v }))
                }
              />

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="Quantity"
                value={tempItem.quantity}
                onChangeText={v => setTempItem(f => ({ ...f, quantity: v }))}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Unit Price</Text>
              <TextInput
                style={styles.input}
                placeholder="Unit Price"
                value={tempItem.unit_price}
                onChangeText={v => setTempItem(f => ({ ...f, unit_price: v }))}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddItem}
              >
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>

              <Text style={styles.sectionHeader}>Added Items</Text>
              {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemText}>{item.product_name}</Text>
                    <Text style={styles.itemSubtext}>
                      Qty: {item.quantity} × {item.unit_price} ={' '}
                      {item.total_price}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowOpeningBalanceModal(false)}
                color={COLORS.textSecondary}
              />
              <Button
                title="Record Balance"
                onPress={handleRecordOpeningBalance}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            {selectedSale && (
              <View style={styles.saleSummary}>
                <Text style={styles.saleSummaryText}>
                  Sale Amount: {selectedSale.total_amount}
                </Text>
                <Text style={styles.saleSummaryText}>
                  Amount Paid: {selectedSale.amount_paid}
                </Text>
                <Text style={styles.saleSummaryText}>
                  Balance Due:{' '}
                  {(
                    selectedSale.total_amount - selectedSale.amount_paid
                  ).toFixed(2)}
                </Text>
              </View>
            )}
            <Text style={styles.label}>Payment Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter payment amount"
              value={paymentForm.amount}
              onChangeText={v => setPaymentForm(f => ({ ...f, amount: v }))}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Payment Method</Text>
            <TextInput
              style={styles.input}
              placeholder="cash, mobile_money, card, bank_transfer"
              value={paymentForm.payment_method}
              onChangeText={v =>
                setPaymentForm(f => ({ ...f, payment_method: v }))
              }
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter notes (optional)"
              value={paymentForm.notes}
              onChangeText={v => setPaymentForm(f => ({ ...f, notes: v }))}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowPaymentModal(false)}
                color={COLORS.textSecondary}
              />
              <Button title="Record Payment" onPress={handleRecordPayment} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginTop: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    marginBottom: SPACING.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  removeButton: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    marginBottom: SPACING.xs,
  },
  saleInfo: {
    flex: 1,
  },
  saleDate: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  saleAmount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  openingBadge: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: 6,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  saleSummary: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  saleSummaryText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
});

export default CustomerDetailScreen;
