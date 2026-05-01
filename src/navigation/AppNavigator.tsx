import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components';
import { OfflineStatus } from '../components/OfflineStatus';
import { COLORS } from '../constants/theme';

// Import screens (we'll create these)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import POSScreen from '../screens/POSScreen';
import SalesScreen from '../screens/SalesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SaleDetailScreen from '../screens/SaleDetailScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import CustomersScreen from '../screens/CustomersScreen';
import AddProductScreen from '../screens/AddProductScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import StaffScreen from '../screens/StaffScreen';
import AddStaffScreen from '../screens/AddStaffScreen';
import RestockReportScreen from '../screens/RestockReportScreen';
import StockRecordsScreen from '../screens/StockRecordsScreen';

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { contact: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  POS: { clearCart?: boolean } | undefined;
  Sales: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Back: { screen?: keyof MainTabParamList } | undefined;
  ProductDetail: { productId: number };
  SaleDetail: { saleId: number };
  CustomerDetail: { customerId: number };
  Customers: undefined;
  Settings: undefined;
  AddProduct: undefined;
  Checkout: {
    cart: Array<{
      product: any;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    total: number;
  };
  Expenses: undefined;
  Reports: undefined;
  Subscription: undefined;
  Staff: undefined;
  AddStaff: { staffId?: number } | undefined;
  EditStaff: { staffId: number };
  RestockReport: undefined;
  StockRecords: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { user } = useAuth();
  const permissions = user?.permissions || {
    canViewReports: false,
    canManageInventory: false,
    canManageEmployees: false,
    canManageSettings: false,
  };
  const role = user?.role || '';

  console.log('User in MainTabNavigator:', {
    role: user?.role,
    permissions: user?.permissions,
  });

  // Helper function to check if user can access a feature
  const canAccess = (permission: string) => {
    // Owners have all permissions
    if (role === 'owner') {
      console.log(`${permission}: true (owner)`);
      return true;
    }

    const permissionMap: { [key: string]: boolean } = {
      dashboard: permissions?.canViewReports || false,
      products: permissions?.canManageInventory || false,
      pos: permissions?.canManageInventory || false,
      sales: permissions?.canViewReports || false,
      reports: permissions?.canViewReports || false,
      expenses: permissions?.canViewReports || false,
      customers: permissions?.canViewReports || false,
      staff: permissions?.canManageEmployees || false,
      settings: permissions?.canManageSettings || false,
    };

    const hasAccess = permissionMap[permission] || false;
    console.log(`${permission}: ${hasAccess}`, permissions);
    return hasAccess;
  };

  return (
    <View style={{ flex: 1 }}>
      <OfflineStatus />
      <MainTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          headerShown: false,
        }}
      >
        {canAccess('dashboard') && (
          <MainTab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 24 }}>📊</Text>
              ),
            }}
          />
        )}
        {canAccess('products') && (
          <MainTab.Screen
            name="Products"
            component={ProductsScreen}
            options={{
              title: 'Products',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 24 }}>📦</Text>
              ),
            }}
          />
        )}
        {canAccess('pos') && (
          <MainTab.Screen
            name="POS"
            component={POSScreen}
            options={{
              title: 'Point of Sale',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 24 }}>🛒</Text>
              ),
            }}
          />
        )}
        {canAccess('sales') && (
          <MainTab.Screen
            name="Sales"
            component={SalesScreen}
            options={{
              title: 'Sales',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 24 }}>💰</Text>
              ),
            }}
          />
        )}
        <MainTab.Screen
          name="More"
          component={SettingsScreen}
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚙️</Text>,
          }}
        />
      </MainTab.Navigator>
    </View>
  );
}

// Root Stack Navigator
function RootNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Back"
        component={MainTabNavigator}
        options={{ headerShown: false, title: 'Back' }}
      />
      <RootStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
      <RootStack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{ title: 'Sale Details' }}
      />
      <RootStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ title: 'Customer Details' }}
      />
      <RootStack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ title: 'Customers', headerShown: true }}
      />
      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <RootStack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Add Product' }}
      />
      <RootStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <RootStack.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: 'Expenses' }}
      />
      <RootStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Profit & Loss Report' }}
      />
      <RootStack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Subscription' }}
      />
      <RootStack.Screen
        name="Staff"
        component={StaffScreen}
        options={{ title: 'Staff Management' }}
      />
      <RootStack.Screen
        name="AddStaff"
        component={AddStaffScreen}
        options={{ title: 'Add Staff Member' }}
      />
      <RootStack.Screen
        name="EditStaff"
        component={AddStaffScreen as any}
        options={{ title: 'Edit Staff Member' }}
      />
      <RootStack.Screen
        name="RestockReport"
        component={RestockReportScreen}
        options={{ title: 'Restock Report' }}
      />
      <RootStack.Screen
        name="StockRecords"
        component={StockRecordsScreen}
        options={{ title: 'Stock Records' }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  safeAreaWrapper: {
    flex: 1,
    backgroundColor: COLORS.background || '#fff',
  },
});

// Wrapper component to add top safe area padding
const SafeAreaWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safeAreaWrapper, { paddingTop: insets.top }]}>
      {children}
    </View>
  );
};

// Main App Navigator
export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaWrapper>
        <NavigationContainer>
          {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaWrapper>
    </SafeAreaProvider>
  );
}
