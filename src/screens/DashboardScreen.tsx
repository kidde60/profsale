import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Loading, OfflineBanner } from '../components';
import { dashboardService } from '../services/dashboardService';
import subscriptionService, {
  Subscription,
} from '../services/subscriptionService';
import { DashboardStats } from '../types';
import { formatCurrency, formatNumber } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  RootStackParamList,
  MainTabParamList,
} from '../navigation/AppNavigator';
import { useOffline } from '../context/OfflineContext';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { isOfflineMode, triggerSync } = useOffline();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchSubscription();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardService.getOverview();

      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const sub = await subscriptionService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    fetchSubscription();
    // Try to sync when refreshing
    if (!isOfflineMode) {
      triggerSync();
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Subscription Status */}
          {subscription && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Subscription')}
            >
              <Card
                style={[
                  styles.subscriptionCard,
                  subscription.status === 'trial'
                    ? styles.subscriptionTrial
                    : styles.subscriptionActive,
                ]}
              >
                <View style={styles.subscriptionHeader}>
                  <View>
                    <Text style={styles.subscriptionLabel}>
                      {subscription.status === 'trial'
                        ? 'Trial Plan'
                        : 'Current Plan'}
                    </Text>
                    <Text style={styles.subscriptionPlan}>
                      {subscription.plan_name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => navigation.navigate('Subscription')}
                  >
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.subscriptionDetails}>
                  <View style={styles.subscriptionItem}>
                    <Text style={styles.subscriptionItemLabel}>
                      Products Limit
                    </Text>
                    <Text style={styles.subscriptionItemValue}>
                      {subscription.max_products}
                    </Text>
                  </View>
                  {subscription.status === 'trial' && (
                    <View style={styles.subscriptionItem}>
                      <Text style={styles.subscriptionItemLabel}>
                        Trial Ends
                      </Text>
                      <Text style={styles.subscriptionItemValue}>
                        {new Date(
                          subscription.current_period_end,
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('POS')}
            >
              <Card style={styles.statCardInner}>
                <Text style={styles.statLabel}>Today's Sales</Text>
                <Text style={[styles.statValue, styles.primaryText]}>
                  {formatCurrency((stats as any)?.today?.total_revenue || 0)}
                </Text>
                <Text style={styles.statSubtext}>
                  {formatNumber((stats as any)?.today?.total_transactions || 0)}{' '}
                  transactions
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Sales')}
            >
              <Card style={styles.statCardInner}>
                <Text style={styles.statLabel}>This Week</Text>
                <Text style={[styles.statValue, styles.successText]}>
                  {formatCurrency((stats as any)?.week?.total_revenue || 0)}
                </Text>
                <Text style={styles.statSubtext}>
                  {formatNumber((stats as any)?.week?.total_transactions || 0)}{' '}
                  sales
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Reports')}
            >
              <Card style={styles.statCardInner}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.statValue}>
                  {formatCurrency((stats as any)?.month?.total_revenue || 0)}
                </Text>
                <Text style={styles.statSubtext}>
                  {formatNumber((stats as any)?.month?.total_transactions || 0)}{' '}
                  orders
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Products')}
            >
              <Card style={styles.statCardInner}>
                <Text style={styles.statLabel}>Low Stock</Text>
                <Text
                  style={[
                    styles.statValue,
                    (stats as any)?.inventory?.low_stock > 0
                      ? styles.warningText
                      : styles.successText,
                  ]}
                >
                  {(stats as any)?.inventory?.low_stock || 0}
                </Text>
                <Text style={styles.statSubtext}>
                  {formatNumber((stats as any)?.inventory?.total_products || 0)}{' '}
                  total products
                </Text>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('POS')}
              >
                <View style={[styles.actionIcon, styles.primaryBg]}>
                  <Text style={styles.actionIconText}>💰</Text>
                </View>
                <Text style={styles.actionText}>New Sale</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Expenses')}
              >
                <View style={[styles.actionIcon, styles.errorBg]}>
                  <Text style={styles.actionIconText}>📊</Text>
                </View>
                <Text style={styles.actionText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <View style={[styles.actionIcon, styles.successBg]}>
                  <Text style={styles.actionIconText}>📦</Text>
                </View>
                <Text style={styles.actionText}>Add Product</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Reports')}
              >
                <View style={[styles.actionIcon, styles.infoBg]}>
                  <Text style={styles.actionIconText}>📈</Text>
                </View>
                <Text style={styles.actionText}>View Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Business Insights */}
          <Card style={styles.insightsCard}>
            <Text style={styles.sectionTitle}>Business Insights</Text>

            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Total Customers</Text>
                <Text style={styles.insightValue}>
                  {formatNumber(
                    (stats as any)?.customers?.total_customers || 0,
                  )}
                </Text>
                <Text style={styles.insightSubtext}>
                  {(stats as any)?.customers?.active_customers || 0} active
                </Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Avg Sale Value</Text>
                <Text style={styles.insightValue}>
                  {formatCurrency(
                    (stats as any)?.month?.total_transactions > 0
                      ? (stats as any)?.month?.total_revenue /
                          (stats as any)?.month?.total_transactions
                      : 0,
                  )}
                </Text>
                <Text style={styles.insightSubtext}>this month</Text>
              </View>
            </View>
          </Card>

          {/* Top Products */}
          <Card>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Selling Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {(stats as any)?.today?.topProducts &&
            (stats as any).today.topProducts.length > 0 ? (
              (stats as any).today.topProducts
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <View key={index} style={styles.productItem}>
                    <View style={styles.productRank}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {item.product_name}
                      </Text>
                      <Text style={styles.productSubtext}>
                        {formatNumber(item.total_sold)} units sold today
                      </Text>
                    </View>
                    <Text style={styles.productRevenue}>
                      {formatCurrency(item.revenue)}
                    </Text>
                  </View>
                ))
            ) : (
              <Text style={styles.emptyText}>No sales data yet</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
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
  subscriptionCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  subscriptionTrial: {
    backgroundColor: COLORS.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  subscriptionActive: {
    backgroundColor: COLORS.success + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  subscriptionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  subscriptionPlan: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  manageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 6,
  },
  manageButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  subscriptionDetails: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  subscriptionItem: {
    flex: 1,
  },
  subscriptionItemLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  subscriptionItemValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
  },
  statCardInner: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  primaryText: {
    color: COLORS.primary,
  },
  successText: {
    color: COLORS.success,
  },
  warningText: {
    color: COLORS.warning,
  },
  statSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  primaryBg: {
    backgroundColor: COLORS.primary + '20',
  },
  errorBg: {
    backgroundColor: COLORS.error + '20',
  },
  successBg: {
    backgroundColor: COLORS.success + '20',
  },
  infoBg: {
    backgroundColor: '#3b82f6' + '20',
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  insightsCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  insightLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  insightValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  rankText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  saleInfo: {
    flex: 1,
  },
  saleName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: '500',
  },
  saleDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saleAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: '500',
  },
  productSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    paddingVertical: SPACING.lg,
  },
});

export default DashboardScreen;
