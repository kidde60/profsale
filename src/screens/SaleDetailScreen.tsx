import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { Card, Loading } from '../components';
import { salesService } from '../services/salesService';
import { Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type SaleDetailScreenRouteProp = RouteProp<RootStackParamList, 'SaleDetail'>;

interface Props {
  route: SaleDetailScreenRouteProp;
}

const SaleDetailScreen: React.FC<Props> = ({ route }) => {
  const { saleId } = route.params;
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaleDetails();
  }, [saleId]);

  const fetchSaleDetails = async () => {
    try {
      const data = await salesService.getSale(saleId);
      console.log('Sale data received:', data);
      setSale(data);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      Alert.alert('Error', 'Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading sale details..." />;
  }

  if (!sale) {
    return (
      <View style={styles.container}>
        <Card>
          <Text style={styles.errorText}>Sale not found</Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Sale Header */}
        <Card>
          <View style={styles.header}>
            <Text style={styles.saleNumber}>
              {sale.sale_number || `Sale #${sale.id}`}
            </Text>
            <View
              style={[
                styles.statusBadge,
                sale.status === 'completed' && styles.statusCompleted,
                sale.status === 'cancelled' && styles.statusCancelled,
              ]}
            >
              <Text style={styles.statusText}>
                {sale.status || sale.payment_status}
              </Text>
            </View>
          </View>
          <Text style={styles.saleDate}>
            {sale.sale_date ? formatDate(sale.sale_date) : 'N/A'}
          </Text>
        </Card>

        {/* Customer Information */}
        <Card>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {sale.customer_name || sale.customer?.name || 'Walk-in Customer'}
            </Text>
          </View>
          {sale.customer_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{sale.customer_phone}</Text>
            </View>
          )}
        </Card>

        {/* Sale Items */}
        <Card>
          <Text style={styles.sectionTitle}>Items</Text>
          {sale.items && sale.items.length > 0 ? (
            sale.items.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const discount = Number(item.discount) || 0;
              const itemTotal = quantity * unitPrice - discount;

              return (
                <View key={item.id || index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {(item as any).product_name ||
                        item.product?.name ||
                        `Product #${item.product_id}`}
                    </Text>
                    <Text style={styles.itemDetails}>
                      {quantity} x {formatCurrency(unitPrice)}
                      {discount > 0 && ` (-${formatCurrency(discount)})`}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtotal}>
                    {formatCurrency(itemTotal)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No items found</Text>
          )}
        </Card>

        {/* Payment Details */}
        <Card>
          <Text style={styles.sectionTitle}>Payment</Text>

          {sale.subtotal !== undefined && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(sale.subtotal)}
              </Text>
            </View>
          )}

          {sale.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -{formatCurrency(sale.discount_amount)}
              </Text>
            </View>
          )}

          {sale.tax_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(sale.tax_amount)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(sale.total_amount)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={[styles.value, styles.paymentMethod]}>
              {sale.payment_method
                ? sale.payment_method.replace('_', ' ').toUpperCase()
                : 'N/A'}
            </Text>
          </View>

          {sale.amount_paid !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Amount Paid:</Text>
              <Text style={styles.value}>
                {formatCurrency(sale.amount_paid)}
              </Text>
            </View>
          )}

          {sale.change_amount !== undefined && sale.change_amount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Change:</Text>
              <Text style={styles.value}>
                {formatCurrency(sale.change_amount)}
              </Text>
            </View>
          )}
        </Card>

        {/* Notes */}
        {sale.notes && (
          <Card>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{sale.notes}</Text>
          </Card>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  saleNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  saleDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  statusCompleted: {
    backgroundColor: COLORS.success,
  },
  statusCancelled: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: '500',
  },
  paymentMethod: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  itemSubtotal: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: '500',
  },
  discountText: {
    color: COLORS.error,
  },
  totalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  notesText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
    textAlign: 'center',
  },
});

export default SaleDetailScreen;
