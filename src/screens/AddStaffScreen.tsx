import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Card, Loading, Input, Button } from '../components';
import staffService from '../services/staffService';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';

type AddStaffScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddStaff'
>;

type AddStaffScreenRouteProp = RouteProp<RootStackParamList, 'AddStaff'>;

interface Props {
  navigation: AddStaffScreenNavigationProp;
  route: AddStaffScreenRouteProp;
}

const AddStaffScreen: React.FC<Props> = ({ navigation, route }) => {
  const staffId = (route.params as any)?.staffId;
  const isEdit = !!staffId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('cashier');

  useEffect(() => {
    if (isEdit && staffId) {
      fetchStaffMember();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, isEdit]);

  const fetchStaffMember = async () => {
    try {
      const member = await staffService.getStaffMember(staffId);
      setName(member.name);
      setEmail(member.email);
      setPhoneNumber(member.phone_number || '');
      setRole(member.role);
    } catch (error) {
      console.error('Error fetching staff member:', error);
      Alert.alert('Error', 'Failed to load staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!isEdit) {
      if (!password) {
        Alert.alert('Error', 'Password is required');
        return;
      }

      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    setSubmitting(true);
    try {
      const data: any = {
        name,
        email,
        phone_number: phoneNumber,
        role,
      };

      if (!isEdit) {
        data.password = password;
      }

      if (isEdit) {
        await staffService.updateStaff(staffId, data);
        Alert.alert('Success', 'Staff member updated successfully');
      } else {
        await staffService.createStaff(data);
        Alert.alert(
          'Success',
          'Staff member created successfully. Password has been sent to their email.',
        );
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save staff member',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getRolePermissions = () => {
    switch (role) {
      case 'cashier':
        return ['Can manage inventory (products, sales, customers, expenses)'];
      case 'manager':
        return [
          'Can manage inventory',
          'Can view reports',
          'Can manage employees',
        ];
      case 'admin':
        return [
          'Can manage inventory',
          'Can view reports',
          'Can manage employees',
          'Can manage settings',
          'Can use API',
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return <Loading message="Loading..." />;
  }

  const rolePermissions = getRolePermissions();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="Enter staff name"
          />

          <Input
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isEdit}
          />

          <Input
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          {!isEdit && (
            <>
              <Input
                label="Password *"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password (min 6 characters)"
                secureTextEntry
              />

              <Input
                label="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                secureTextEntry
              />
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={role}
                onValueChange={setRole}
                style={styles.picker}
              >
                <Picker.Item label="Cashier" value="cashier" />
                <Picker.Item label="Manager" value="manager" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.sectionSubtitle}>
            Permissions are automatically assigned based on role
          </Text>

          <View style={styles.permissionSummary}>
            <Text style={styles.summaryLabel}>
              {role.charAt(0).toUpperCase() + role.slice(1)} Role Permissions:
            </Text>
            {rolePermissions.map((permission, index) => (
              <View key={index} style={styles.permissionListItem}>
                <Text style={styles.permissionBullet}>•</Text>
                <Text style={styles.permissionText}>{permission}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Button
          title={isEdit ? 'Update Staff Member' : 'Create Staff Member'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />
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
  section: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
  permissionCategory: {
    marginBottom: SPACING.lg,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  permissionSummary: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  permissionListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  permissionBullet: {
    color: COLORS.primary,
    fontSize: 16,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  permissionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    flex: 1,
  },
  submitButton: {
    marginBottom: SPACING.xl,
  },
});

export default AddStaffScreen;
