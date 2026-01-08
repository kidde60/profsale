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
import staffService, { Permission } from '../services/staffService';
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
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchPermissions();
    if (isEdit) {
      fetchStaffMember();
    }
  }, []);

  const fetchPermissions = async () => {
    try {
      const perms = await staffService.getAvailablePermissions();
      setAvailablePermissions(perms);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      Alert.alert('Error', 'Failed to load permissions');
    }
  };

  const fetchStaffMember = async () => {
    try {
      const member = await staffService.getStaffMember(staffId);
      setName(member.name);
      setEmail(member.email);
      setPhoneNumber(member.phone_number || '');
      setRole(member.role);
      setSelectedPermissions(member.permissions);
    } catch (error) {
      console.error('Error fetching staff member:', error);
      Alert.alert('Error', 'Failed to load staff member');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionName)) {
        return prev.filter(p => p !== permissionName);
      } else {
        return [...prev, permissionName];
      }
    });
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
        permissions: selectedPermissions,
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

  const groupPermissionsByCategory = () => {
    const grouped: { [key: string]: Permission[] } = {};
    availablePermissions.forEach(perm => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });
    return grouped;
  };

  if (loading) {
    return <Loading message="Loading..." />;
  }

  const groupedPermissions = groupPermissionsByCategory();

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
                <Picker.Item label="Inventory Clerk" value="inventory_clerk" />
                <Picker.Item label="Accountant" value="accountant" />
                <Picker.Item label="Custom" value="custom" />
              </Picker>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.sectionSubtitle}>
            Select what this staff member can do
          </Text>

          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <View key={category} style={styles.permissionCategory}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {permissions.map(permission => (
                <TouchableOpacity
                  key={permission.name}
                  style={styles.permissionItem}
                  onPress={() => togglePermission(permission.name)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedPermissions.includes(permission.name) &&
                        styles.checkboxChecked,
                    ]}
                  >
                    {selectedPermissions.includes(permission.name) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.permissionLabel}>{permission.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
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
  submitButton: {
    marginBottom: SPACING.xl,
  },
});

export default AddStaffScreen;
