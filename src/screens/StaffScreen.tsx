import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Loading, Button } from '../components';
import staffService, { StaffMember } from '../services/staffService';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type StaffScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Staff'
>;

interface Props {
  navigation: StaffScreenNavigationProp;
}

const StaffScreen: React.FC<Props> = ({ navigation }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  // Refresh staff list when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchStaff();
    }, []),
  );

  const fetchStaff = async () => {
    try {
      const data = await staffService.getStaff();
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Failed to load staff members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const handleAddStaff = () => {
    navigation.navigate('AddStaff');
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    navigation.navigate('EditStaff', { staffId: staffMember.id });
  };

  const handleDeleteStaff = (staffMember: StaffMember) => {
    Alert.alert(
      'Deactivate Staff Member',
      `Are you sure you want to deactivate ${staffMember.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await staffService.deleteStaff(staffMember.id);
              Alert.alert('Success', 'Staff member deactivated');
              fetchStaff();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate staff member');
            }
          },
        },
      ],
    );
  };

  const handleActivateStaff = (staffMember: StaffMember) => {
    Alert.alert(
      'Activate Staff Member',
      `Are you sure you want to activate ${staffMember.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              await staffService.activateStaff(staffMember.id);
              Alert.alert('Success', 'Staff member activated');
              fetchStaff();
            } catch (error) {
              Alert.alert('Error', 'Failed to activate staff member');
            }
          },
        },
      ],
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return COLORS.primary;
      case 'manager':
        return COLORS.secondary;
      case 'cashier':
        return COLORS.success;
      case 'inventory_clerk':
        return COLORS.warning;
      case 'accountant':
        return '#3b82f6';
      default:
        return COLORS.textSecondary;
    }
  };

  const renderStaffMember = ({ item }: { item: StaffMember }) => (
    <TouchableOpacity onPress={() => handleEditStaff(item)}>
      <Card style={styles.staffCard}>
        <View style={styles.staffHeader}>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{item.name}</Text>
            <Text style={styles.staffEmail}>{item.email}</Text>
            {item.phone_number && (
              <Text style={styles.staffPhone}>{item.phone_number}</Text>
            )}
          </View>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleBadgeColor(item.role) + '20' },
            ]}
          >
            <Text
              style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}
            >
              {item.role.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.staffDetails}>
          <Text style={styles.permissionsLabel}>
            Permissions: {item.permissions.length}
          </Text>
          {!item.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Inactive</Text>
            </View>
          )}
        </View>

        {item.role !== 'owner' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditStaff(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            {item.is_active ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteStaff(item)}
              >
                <Text style={styles.deleteButtonText}>Deactivate</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.activateButton}
                onPress={() => handleActivateStaff(item)}
              >
                <Text style={styles.activateButtonText}>Activate</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading message="Loading staff..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="+ Add Staff Member"
          onPress={handleAddStaff}
          style={styles.addButton}
        />
      </View>

      <FlatList
        data={staff}
        renderItem={renderStaffMember}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No staff members yet</Text>
            <Text style={styles.emptySubtext}>
              Add staff members to help manage your business
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  list: {
    padding: SPACING.md,
  },
  staffCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
  staffDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  permissionsLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  inactiveBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary + '20',
    padding: SPACING.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error + '20',
    padding: SPACING.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  activateButton: {
    flex: 1,
    backgroundColor: COLORS.success + '20',
    padding: SPACING.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  activateButtonText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default StaffScreen;
