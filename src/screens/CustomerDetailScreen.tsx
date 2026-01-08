import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  Alert,
} from 'react-native';
import { Card, Loading } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { customerService } from '../services/customerService';
import { Customer } from '../types';

type CustomerDetailRouteProp = RouteProp<RootStackParamList, 'CustomerDetail'>;

const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<CustomerDetailRouteProp>();
  const navigation = useNavigation();
  const { customerId } = route.params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomer();
  }, []);

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
    } catch (error) {
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
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
            </>
          )}
        </Card>
      </View>
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
    backgroundColor: COLORS.input,
  },
});

export default CustomerDetailScreen;
