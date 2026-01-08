import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card, Loading } from '../components';
import reportsService, { ProfitLossReport } from '../services/reportsService';
import { formatCurrency } from '../utils/helpers';
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

  useEffect(() => {
    fetchReport();
  }, [period, customStartDate, customEndDate]);

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

        {showStartDatePicker && (
          <DateTimePicker
            value={customStartDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setCustomStartDate(selectedDate);
              }
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={customEndDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setCustomEndDate(selectedDate);
              }
            }}
          />
        )}

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
            <Text style={styles.value}>{report.revenue.totalTransactions}</Text>
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

        {/* Costs Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Costs</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cost of Goods Sold</Text>
            <Text style={[styles.value, styles.cost]}>
              {formatCurrency(report.costs.costOfGoodsSold)}
            </Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Gross Profit</Text>
            <Text
              style={[
                styles.totalValue,
                report.profit.grossProfit >= 0
                  ? styles.profitText
                  : styles.lossText,
              ]}
            >
              {formatCurrency(report.profit.grossProfit)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Operating Expenses</Text>
            <Text style={[styles.value, styles.cost]}>
              {formatCurrency(report.costs.totalExpenses)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelSmall}>
              ({report.costs.expenseCount} expenses)
            </Text>
          </View>
        </Card>

        {/* Expenses Breakdown */}
        {report.expensesByCategory.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Expenses by Category</Text>
            {report.expensesByCategory.map((cat, index) => (
              <View key={index} style={styles.row}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.label}>{cat.category}</Text>
                  <Text style={styles.labelSmall}>({cat.count} items)</Text>
                </View>
                <Text style={[styles.value, styles.cost]}>
                  {formatCurrency(cat.total)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Profit Margins */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Profit Margins</Text>
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
});

export default ReportsScreen;
