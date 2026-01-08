import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card, Loading, Button } from '../components';
import expenseService, { Expense } from '../services/expenseService';
import { formatCurrency } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type ExpensesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Expenses'
>;

interface Props {
  navigation: ExpensesScreenNavigationProp;
}

const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Supplies',
  'Marketing',
  'Transportation',
  'Maintenance',
  'Insurance',
  'Taxes',
  'Other',
];

const ExpensesScreen: React.FC<Props> = ({ navigation }) => {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ marginRight: 16 }}
        >
          <Text
            style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18 }}
          >
            + Add
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<{
    description: string;
    amount: string;
    category: string;
    expenseDate: string;
    paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'cheque';
    paymentReference: string;
    notes: string;
  }>({
    description: '',
    amount: '',
    category: 'Other',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    paymentReference: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expenseService.getExpenses();
      const expensesData = Array.isArray(response.data)
        ? response.data
        : response?.data?.expenses || [];
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleSaveExpense = async () => {
    if (!form.description || !form.amount || !form.category) {
      Alert.alert(
        'Validation',
        'Description, amount, and category are required',
      );
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount');
      return;
    }

    try {
      setCreating(true);

      if (editingExpense) {
        // Update existing expense
        const updatedExpense = await expenseService.updateExpense(
          editingExpense.id,
          {
            description: form.description,
            amount: amount,
            category: form.category,
            expenseDate: form.expenseDate,
            paymentMethod: form.paymentMethod,
            paymentReference: form.paymentReference || undefined,
            notes: form.notes || undefined,
          },
        );

        setExpenses(prev =>
          prev.map(exp =>
            exp.id === editingExpense.id ? updatedExpense : exp,
          ),
        );
        Alert.alert('Success', 'Expense updated successfully');
      } else {
        // Create new expense
        const newExpense = await expenseService.createExpense({
          description: form.description,
          amount: amount,
          category: form.category,
          expenseDate: form.expenseDate,
          paymentMethod: form.paymentMethod,
          paymentReference: form.paymentReference || undefined,
          notes: form.notes || undefined,
        });

        setExpenses(prev => [newExpense, ...prev]);
        Alert.alert('Success', 'Expense recorded successfully');
      }

      setShowModal(false);
      setEditingExpense(null);
      setForm({
        description: '',
        amount: '',
        category: 'Other',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        paymentReference: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert(
        'Error',
        `Failed to ${editingExpense ? 'update' : 'record'} expense`,
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      expenseDate: expense.expense_date.split('T')[0],
      paymentMethod: expense.payment_method,
      paymentReference: expense.payment_reference || '',
      notes: expense.notes || '',
    });
    setShowModal(true);
  };

  const handleDeleteExpense = (id: number) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.deleteExpense(id);
              setExpenses(prev => prev.filter(e => e.id !== id));
              Alert.alert('Success', 'Expense deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ],
    );
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + parseFloat(String(expense.amount)),
    0,
  );

  const renderExpense = ({ item }: { item: Expense }) => (
    <Card style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          <Text style={styles.expenseDate}>
            {new Date(item.expense_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.paymentMethod}>
            {item.payment_method.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.notes && (
        <Text style={styles.expenseNotes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
      <View style={styles.expenseActions}>
        <TouchableOpacity
          onPress={() => handleEditExpense(item)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteExpense(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalExpenses)}</Text>
        <Text style={styles.summaryCount}>{expenses.length} expenses</Text>
      </Card>

      {loading ? (
        <Loading message="Loading expenses..." />
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No expenses recorded</Text>
          }
        />
      )}

      {/* Add Expense Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </Text>

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rent payment"
                value={form.description}
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
              />

              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={form.amount}
                onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.category}
                  onValueChange={v => setForm(f => ({ ...f, category: v }))}
                  style={styles.picker}
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {new Date(form.expenseDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date(form.expenseDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setForm(f => ({
                        ...f,
                        expenseDate: selectedDate.toISOString().split('T')[0],
                      }));
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.paymentMethod}
                  onValueChange={v =>
                    setForm(f => ({ ...f, paymentMethod: v }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Mobile Money" value="mobile_money" />
                  <Picker.Item label="Bank Transfer" value="bank_transfer" />
                  <Picker.Item label="Cheque" value="cheque" />
                </Picker>
              </View>

              <Text style={styles.label}>Reference Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Transaction reference"
                value={form.paymentReference}
                onChangeText={v =>
                  setForm(f => ({ ...f, paymentReference: v }))
                }
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes"
                value={form.notes}
                onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowModal(false);
                    setEditingExpense(null);
                    setForm({
                      description: '',
                      amount: '',
                      category: 'Other',
                      expenseDate: new Date().toISOString().split('T')[0],
                      paymentMethod: 'cash',
                      paymentReference: '',
                      notes: '',
                    });
                  }}
                  disabled={creating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveExpense}
                  disabled={creating}
                >
                  <Text style={styles.saveButtonText}>
                    {creating
                      ? 'Saving...'
                      : editingExpense
                      ? 'Update'
                      : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summaryCard: {
    margin: SPACING.md,
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.error + '10',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  summaryCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  list: {
    padding: SPACING.md,
  },
  expenseCard: {
    marginBottom: SPACING.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  expenseCategory: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  expenseNotes: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  expenseActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  picker: {
    height: 50,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
});

export default ExpensesScreen;
