import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { Card, Button } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { offlineStorage } from '../services/offline/OfflineStorageSQLite';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

interface DbStats {
  products: number;
  customers: number;
  pendingSales: number;
  cachedSales: number;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, isOfflineLogin } = useAuth();
  const {
    isOfflineMode,
    isSyncing,
    pendingSalesCount,
    lastSyncTime,
    triggerSync,
  } = useOffline();
  const permissions = user?.permissions || {};
  const role = user?.role || 'owner';
  const [dbStats, setDbStats] = useState<DbStats | null>(null);

  useEffect(() => {
    loadDbStats();
  }, [pendingSalesCount]);

  const loadDbStats = async () => {
    try {
      const stats = await offlineStorage.getStats();
      setDbStats(stats);
    } catch (error) {
      console.error('Error loading db stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSync = async () => {
    if (isOfflineMode) {
      Alert.alert(
        'Offline',
        'Cannot sync while offline. Please connect to the internet.',
      );
      return;
    }

    const result = await triggerSync();
    if (result.success) {
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.synced} sale(s).`,
      );
    } else if (result.errors.length > 0) {
      Alert.alert(
        'Sync Issues',
        `Synced ${result.synced}, Failed: ${
          result.failed
        }\n${result.errors.join('\n')}`,
      );
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Helper function to check permissions
  const canAccess = (feature: string) => {
    if (role === 'owner') return true;

    const accessMap: { [key: string]: boolean } = {
      customers: permissions.canViewReports || permissions.canManageInventory,
      expenses: permissions.canViewReports || permissions.canManageInventory,
      reports: permissions.canViewReports,
      subscription: permissions.canManageSettings,
      staff: permissions.canManageEmployees,
      business: permissions.canManageSettings,
    };

    return accessMap[feature] || false;
  };

  const menuItems = [
    {
      title: 'Customers',
      onPress: () => navigation.navigate('Customers'),
      show: canAccess('customers'),
    },
    {
      title: 'Expenses',
      onPress: () => navigation.navigate('Expenses'),
      show: canAccess('expenses'),
    },
    {
      title: 'Reports',
      onPress: () => navigation.navigate('Reports'),
      show: canAccess('reports'),
    },
    {
      title: 'Subscription',
      onPress: () => navigation.navigate('Subscription'),
      show: canAccess('subscription'),
    },
    {
      title: 'Staff Management',
      onPress: () => navigation.navigate('Staff'),
      show: canAccess('staff'),
    },
    {
      title: 'Business Settings',
      onPress: () =>
        Alert.alert('Coming Soon', 'Business settings will be available soon'),
      show: canAccess('business'),
    },
    {
      title: 'Help & Support',
      onPress: () =>
        Alert.alert('Help', 'Contact support@profsale.com for assistance'),
      show: true, // Always show
    },
  ].filter(item => item.show);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* User Profile */}
        <Card>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>
            {role}
            {isOfflineLogin ? ' (Offline)' : ''}
          </Text>
          <Text style={styles.businessName}>{user?.businessName}</Text>
        </Card>

        {/* Sync Status Card */}
        <Card style={styles.syncCard}>
          <View style={styles.syncHeader}>
            <Text style={styles.syncTitle}>Sync Status</Text>
            <View
              style={[
                styles.statusDot,
                isOfflineMode ? styles.statusOffline : styles.statusOnline,
              ]}
            />
          </View>

          <View style={styles.syncInfo}>
            <Text style={styles.syncLabel}>Status:</Text>
            <Text style={styles.syncValue}>
              {isOfflineMode ? 'Offline' : 'Online'}
            </Text>
          </View>

          <View style={styles.syncInfo}>
            <Text style={styles.syncLabel}>Pending Sales:</Text>
            <Text
              style={[
                styles.syncValue,
                pendingSalesCount > 0 && styles.pendingHighlight,
              ]}
            >
              {pendingSalesCount}
            </Text>
          </View>

          <View style={styles.syncInfo}>
            <Text style={styles.syncLabel}>Last Sync:</Text>
            <Text style={styles.syncValue}>{formatLastSync(lastSyncTime)}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.syncButton,
              (isOfflineMode || isSyncing) && styles.syncButtonDisabled,
            ]}
            onPress={handleSync}
            disabled={isOfflineMode || isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.syncButtonText}>
                {pendingSalesCount > 0
                  ? `Sync ${pendingSalesCount} Sale(s)`
                  : 'Sync Now'}
              </Text>
            )}
          </TouchableOpacity>
        </Card>

        {/* Database Stats Card */}
        {dbStats && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>📊 Cached Data (SQLite)</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dbStats.products}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dbStats.customers}</Text>
                <Text style={styles.statLabel}>Customers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dbStats.pendingSales}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dbStats.cachedSales}</Text>
                <Text style={styles.statLabel}>Cached Sales</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Menu Items */}
        <Card>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Text style={styles.menuText}>{item.title}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />

        {/* App Info */}
        <Text style={styles.appVersion}>ProfSale v1.0.0</Text>
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
  userName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  userRole: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  businessName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  menuArrow: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textLight,
  },
  logoutButton: {
    marginTop: SPACING.lg,
  },
  appVersion: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xl,
  },
  syncCard: {
    marginBottom: SPACING.md,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  syncTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOnline: {
    backgroundColor: COLORS.success,
  },
  statusOffline: {
    backgroundColor: COLORS.error,
  },
  syncInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  syncLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  syncValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  pendingHighlight: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  syncButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  syncButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  syncButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  statsCard: {
    marginBottom: SPACING.md,
  },
  statsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default SettingsScreen;
