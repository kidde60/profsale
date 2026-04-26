import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};
  const role = user?.role || 'owner';
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
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
      hasSubmenu: true,
      subItems: [
        {
          title: 'Profit & Loss',
          onPress: () => navigation.navigate('Reports'),
          show: canAccess('reports'),
        },
        {
          title: 'Restock Report',
          onPress: () => navigation.navigate('RestockReport'),
          show: canAccess('reports'),
        },
        {
          title: 'Stock Records',
          onPress: () => navigation.navigate('StockRecords'),
          show: canAccess('reports'),
        },
      ],
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
          <Text style={styles.userRole}>{role}</Text>
          <Text style={styles.businessName}>{user?.businessName}</Text>
        </Card>

        {/* Menu Items */}
        <Card>
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  if (item.hasSubmenu) {
                    setExpandedMenu(
                      expandedMenu === item.title ? null : item.title,
                    );
                  } else {
                    item.onPress?.();
                  }
                }}
              >
                <Text style={styles.menuText}>{item.title}</Text>
                <Text
                  style={[
                    styles.menuArrow,
                    item.hasSubmenu &&
                      expandedMenu === item.title &&
                      styles.menuArrowRotated,
                  ]}
                >
                  {item.hasSubmenu
                    ? expandedMenu === item.title
                      ? '▼'
                      : '▶'
                    : '›'}
                </Text>
              </TouchableOpacity>
              {item.hasSubmenu &&
                expandedMenu === item.title &&
                item.subItems && (
                  <View style={styles.submenu}>
                    {item.subItems
                      .filter(subItem => subItem.show)
                      .map((subItem, subIndex) => (
                        <TouchableOpacity
                          key={subIndex}
                          style={styles.submenuItem}
                          onPress={subItem.onPress}
                        >
                          <Text style={styles.submenuText}>
                            {subItem.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
            </View>
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
  menuArrowRotated: {
    transform: [{ rotate: '90deg' }],
  },
  submenu: {
    backgroundColor: COLORS.background,
    paddingLeft: SPACING.lg,
  },
  submenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  submenuText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
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
});

export default SettingsScreen;
