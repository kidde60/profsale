import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { Card, Loading, Button } from '../components';
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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSaleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the refund');
      return;
    }

    Alert.alert(
      'Confirm Refund',
      `Are you sure you want to refund this sale for ${formatCurrency(
        sale?.total_amount || 0,
      )}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await salesService.refundSale(saleId, {
                refundReason: refundReason.trim(),
                refundMethod: 'cash',
                notes: refundNotes.trim() || undefined,
              });
              Alert.alert('Success', 'Sale refunded successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowRefundModal(false);
                    setRefundReason('');
                    setRefundNotes('');
                    fetchSaleDetails();
                  },
                },
              ]);
            } catch (error) {
              console.error('Error refunding sale:', error);
              Alert.alert('Error', 'Failed to refund sale');
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
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
                sale.status === 'refunded' && styles.statusRefunded,
              ]}
            >
              <Text style={styles.statusText}>
                {sale.status?.toUpperCase() ||
                  sale.payment_status?.toUpperCase()}
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

          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment Method:</Text>
            <View
              style={[
                styles.paymentMethodBadge,
                sale.payment_method === 'credit' && styles.creditBadge,
              ]}
            >
              <Text
                style={[
                  styles.paymentMethodText,
                  sale.payment_method === 'credit' && styles.creditText,
                ]}
              >
                {sale.payment_method
                  ? sale.payment_method === 'credit'
                    ? 'Credit'
                    : sale.payment_method.replace('_', ' ').toUpperCase()
                  : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment Status:</Text>
            <View
              style={[
                styles.statusBadge,
                sale.payment_status === 'paid' && styles.statusPaid,
                sale.payment_status === 'pending' && styles.statusPending,
                sale.payment_status === 'refunded' && styles.statusRefunded,
              ]}
            >
              <Text style={styles.statusText}>
                {sale.payment_status?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

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

          {sale.payment_method === 'credit' && (
            <>
              <View style={styles.divider} />
              {sale.amount_paid && sale.amount_paid > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Paid:</Text>
                  <Text style={[styles.summaryValue, styles.paidText]}>
                    {formatCurrency(sale.amount_paid)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Balance Due:</Text>
                <Text style={[styles.summaryValue, styles.dueText]}>
                  {formatCurrency(sale.total_amount - (sale.amount_paid || 0))}
                </Text>
              </View>
            </>
          )}

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

        {/* Refund Button */}
        {sale.status !== 'refunded' && sale.status !== 'cancelled' && (
          <Button
            title="Refund Sale"
            onPress={() => setShowRefundModal(true)}
            variant="outline"
            style={styles.refundButton}
          />
        )}
      </View>

      {/* Refund Modal */}
      <Modal
        visible={showRefundModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRefundModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Refund Sale</Text>
            <Text style={styles.modalAmount}>
              Refund Amount: {formatCurrency(sale?.total_amount || 0)}
            </Text>

            <Text style={styles.modalLabel}>Reason *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason for refund"
              value={refundReason}
              onChangeText={setRefundReason}
              multiline
            />

            <Text style={styles.modalLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Additional notes"
              value={refundNotes}
              onChangeText={setRefundNotes}
              multiline
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                  setRefundNotes('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Refund"
                onPress={handleRefund}
                loading={processing}
                disabled={processing}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  statusPaid: {
    backgroundColor: COLORS.success,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
  },
  statusRefunded: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  paymentMethodBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '20',
  },
  creditBadge: {
    backgroundColor: COLORS.warning + '30',
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  creditText: {
    color: COLORS.warning,
  },
  paidText: {
    color: COLORS.success,
  },
  dueText: {
    color: COLORS.error,
    fontWeight: '700',
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
  refundButton: {
    marginTop: SPACING.md,
    borderColor: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  modalLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
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
