import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card, Loading } from '../components';
import reportsService, { ProfitLossReport } from '../services/reportsService';
import { salesService } from '../services/salesService';
import { formatCurrency, formatDate } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const ReportsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'custom'>(
    'month',
  );
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'profit' | 'refunds'>('profit');
  const [refundReports, setRefundReports] = useState<any>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'profit') {
      fetchReport();
    } else {
      fetchRefundReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStartDate, customEndDate, activeTab]);

  const fetchRefundReports = async () => {
    try {
      setRefundLoading(true);
      let startDate = customStartDate.toISOString().split('T')[0];
      let endDate = customEndDate.toISOString().split('T')[0];

      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      } else if (period === 'year') {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
      }

      const data = await salesService.getRefundReports({ startDate, endDate });
      setRefundReports(data);
    } catch (error) {
      console.error('Error fetching refund reports:', error);
      Alert.alert('Error', 'Failed to load refund reports');
    } finally {
      setRefundLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      let endDate = new Date();
      let startDate = new Date();

      if (period === 'custom') {
        startDate = customStartDate;
        endDate = customEndDate;
      } else if (period === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const reportData = await reportsService.getProfitLoss(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      );
      setReport(reportData);
    } catch (error) {
      console.error('Error fetching report:', error);
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Generating report..." />;
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load report</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'week' && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'week' && styles.periodButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'month' && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'month' && styles.periodButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'year' && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod('year')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'year' && styles.periodButtonTextActive,
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'custom' && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod('custom')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'custom' && styles.periodButtonTextActive,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Date Range Picker */}
        {period === 'custom' && (
          <Card style={styles.dateRangeCard}>
            <Text style={styles.dateRangeLabel}>Select Date Range</Text>
            <View style={styles.dateRangeRow}>
              <View style={styles.datePickerGroup}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {customStartDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerGroup}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {customEndDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Tab Navigation */}
        <Card style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profit' && styles.tabActive]}
            onPress={() => setActiveTab('profit')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'profit' && styles.tabTextActive,
              ]}
            >
              Profit & Loss
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'refunds' && styles.tabActive]}
            onPress={() => setActiveTab('refunds')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'refunds' && styles.tabTextActive,
              ]}
            >
              Refunds
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Profit & Loss Report */}
        {activeTab === 'profit' && (
          <>
            {loading || !report ? (
              <Loading message="Loading report..." />
            ) : (
              <>
                {/* Net Profit Card */}
                <Card
                  style={[
                    styles.netProfitCard,
                    report.profit.netProfit >= 0
                      ? styles.profitPositive
                      : styles.profitNegative,
                  ]}
                >
                  <Text style={styles.netProfitLabel}>Net Profit</Text>
                  <Text style={styles.netProfitValue}>
                    {formatCurrency(report.profit.netProfit)}
                  </Text>
                  <Text style={styles.netProfitMargin}>
                    {report.profit.netProfitMargin.toFixed(2)}% margin
                  </Text>
                </Card>

                {/* Revenue Section */}
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Revenue</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Sales</Text>
                    <Text style={styles.value}>
                      {formatCurrency(report.revenue.totalRevenue)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Transactions</Text>
                    <Text style={styles.value}>
                      {report.revenue.totalTransactions}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Tax Collected</Text>
                    <Text style={styles.value}>
                      {formatCurrency(report.revenue.totalTax)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Discounts Given</Text>
                    <Text style={[styles.value, styles.discount]}>
                      -{formatCurrency(report.revenue.totalDiscounts)}
                    </Text>
                  </View>
                  <View style={[styles.row, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Net Revenue</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(report.revenue.netRevenue)}
                    </Text>
                  </View>
                </Card>

                {/* Expenses Section */}
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Expenses</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Expenses</Text>
                    <Text style={styles.value}>
                      {formatCurrency(report.costs.totalExpenses)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Cost of Goods Sold</Text>
                    <Text style={styles.value}>
                      {formatCurrency(report.costs.costOfGoodsSold)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Expense Count</Text>
                    <Text style={styles.value}>
                      {report.costs.expenseCount}
                    </Text>
                  </View>
                </Card>

                {/* Profit Section */}
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Profit Analysis</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Gross Profit</Text>
                    <Text style={styles.value}>
                      {formatCurrency(report.profit.grossProfit)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Net Profit</Text>
                    <Text style={styles.value}>
                      {formatCurrency(report.profit.netProfit)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Gross Profit Margin</Text>
                    <Text style={styles.value}>
                      {report.profit.grossProfitMargin.toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Net Profit Margin</Text>
                    <Text style={styles.value}>
                      {report.profit.netProfitMargin.toFixed(2)}%
                    </Text>
                  </View>
                </Card>
              </>
            )}
          </>
        )}

        {/* Refund Reports */}
        {activeTab === 'refunds' && (
          <>
            {refundLoading || !refundReports ? (
              <Loading message="Loading refund reports..." />
            ) : (
              <>
                {/* Refund Summary Card */}
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Refund Summary</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Refunds</Text>
                    <Text style={styles.value}>
                      {refundReports.summary?.total_refunds || 0}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Refund Amount</Text>
                    <Text style={[styles.value, styles.discount]}>
                      {formatCurrency(
                        refundReports.summary?.total_refund_amount || 0,
                      )}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Refund Methods Used</Text>
                    <Text style={styles.value}>
                      {refundReports.summary?.refund_methods_used || 0}
                    </Text>
                  </View>
                </Card>

                {/* Refund List */}
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Refund History</Text>
                  {refundReports.refunds?.length > 0 ? (
                    <FlatList
                      data={refundReports.refunds}
                      keyExtractor={(item: any) => item.id.toString()}
                      renderItem={({ item }: { item: any }) => (
                        <View style={styles.refundItem}>
                          <View style={styles.refundHeader}>
                            <Text style={styles.refundNumber}>
                              {item.refund_number}
                            </Text>
                            <Text style={styles.refundDate}>
                              {formatDate(item.refund_date)}
                            </Text>
                          </View>
                          <View style={styles.refundDetails}>
                            <Text style={styles.label}>
                              Sale: {item.sale_number}
                            </Text>
                            <Text style={styles.label}>
                              Customer: {item.customer_name || 'N/A'}
                            </Text>
                            <Text style={styles.label}>
                              Reason: {item.refund_reason}
                            </Text>
                            <Text style={[styles.value, styles.discount]}>
                              Amount: {formatCurrency(item.refund_amount)}
                            </Text>
                            <Text style={styles.label}>
                              Refunded by: {item.refunded_by_first_name}{' '}
                              {item.refunded_by_last_name}
                            </Text>
                          </View>
                        </View>
                      )}
                    />
                  ) : (
                    <Text style={styles.emptyText}>
                      No refunds found for this period
                    </Text>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  dateRangeCard: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
  },
  dateRangeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  datePickerGroup: {
    flex: 1,
  },
  dateLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  dateButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    textAlign: 'center',
  },
  netProfitCard: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  profitPositive: {
    backgroundColor: COLORS.success + '10',
  },
  profitNegative: {
    backgroundColor: COLORS.error + '10',
  },
  netProfitLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  netProfitValue: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  netProfitMargin: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  section: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  labelSmall: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  cost: {
    color: COLORS.error,
  },
  discount: {
    color: COLORS.error,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  profitText: {
    color: COLORS.success,
  },
  lossText: {
    color: COLORS.error,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.xl,
  },
  refundItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  refundNumber: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  refundDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  refundDetails: {
    marginLeft: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.xl,
  },
});

export default ReportsScreen;
