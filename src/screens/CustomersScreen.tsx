import React, { useEffect, useState, useLayoutEffect } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Loading, Button } from '../components';
import { customerService } from '../services/customerService';
import { Customer } from '../types';
import { Picker } from '@react-native-picker/picker';
import { formatCurrency } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type CustomersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Customers'
>;

interface Props {
  navigation: CustomersScreenNavigationProp;
}

const CustomersScreen: React.FC<Props> = ({ navigation }) => {
  // Add header button for adding customer
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    customer_type: 'regular' | 'vip' | 'wholesale';
  }>({
    name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'regular',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers();
      const customersData = Array.isArray(response.data)
        ? response.data
        : (response as any)?.data?.customers || [];
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleCreateCustomer = async () => {
    if (!form.name) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    try {
      setCreating(true);
      const newCustomer = await customerService.createCustomer(form);
      setCustomers(prev =>
        Array.isArray(prev) ? [newCustomer, ...prev] : [newCustomer],
      );
      setShowModal(false);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        customer_type: 'regular',
      });
      Alert.alert('Success', 'Customer created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('CustomerDetail', { customerId: item.id })
      }
    >
      <Card>
        <View style={styles.customerCard}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.customerContact}>
              {item.phone || item.email}
            </Text>
            <Text style={styles.customerStats}>
              {item.total_orders} orders • {item.loyalty_points} points
            </Text>
          </View>
          <View style={styles.customerAmount}>
            <Text style={styles.amountLabel}>Total Spent</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(item.total_purchases)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Add Customer button moved to header */}
      {loading ? (
        <Loading message="Loading customers..." />
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomer}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No customers found</Text>
          }
        />
      )}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Add Customer</Text>
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
            <Text style={{ marginBottom: 4, color: COLORS.text }}>
              Customer Type
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 6,
                marginBottom: SPACING.sm,
                backgroundColor: COLORS.white,
              }}
            >
              <Picker
                selectedValue={form.customer_type}
                onValueChange={v => setForm(f => ({ ...f, customer_type: v }))}
                style={{ height: 50, width: '100%' }}
                itemStyle={{ fontSize: TYPOGRAPHY.fontSize.base }}
              >
                <Picker.Item label="Regular" value="regular" />
                <Picker.Item label="VIP" value="vip" />
                <Picker.Item label="Wholesale" value="wholesale" />
              </Picker>
            </View>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCreateCustomer}
                disabled={creating}
              >
                <Text style={styles.modalButtonText}>
                  {creating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
  },
  customerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  customerContact: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  customerStats: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  customerAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: SPACING.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.xl,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    margin: SPACING.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: SPACING.lg,
    borderRadius: 10,
    width: '90%',
    elevation: 5,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  modalButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: 6,
    margin: SPACING.xs,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: TYPOGRAPHY.fontSize.base,
  },
});

export default CustomersScreen;
