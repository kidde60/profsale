import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Loading } from '../components';
import { salesService } from '../services/salesService';
import { Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { handleError } from '../utils/errorHandler';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type SalesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Back'
>;

interface Props {
  navigation: SalesScreenNavigationProp;
}

const SalesScreen: React.FC<Props> = ({ navigation }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSales();
  }, []);

  // Refresh sales data whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, []),
  );

  useEffect(() => {
    filterSales();
  }, [sales, searchQuery, statusFilter]);

  const filterSales = () => {
    let filtered = sales;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        sale =>
          sale.customer_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          sale.sale_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sale.id.toString().includes(searchQuery),
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    // Sort by date descending (latest first)
    filtered = filtered.sort((a, b) => {
      const dateA = a.sale_date ? new Date(a.sale_date).getTime() : 0;
      const dateB = b.sale_date ? new Date(b.sale_date).getTime() : 0;
      return dateB - dateA;
    });

    setFilteredSales(filtered);
  };

  const fetchSales = async () => {
    try {
      const response = await salesService.getSales();
      const salesData = (response as any)?.data?.sales || response.data || [];
      setSales(salesData);
    } catch (error) {
      handleError(error, 'Failed to load sales');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const renderSale = ({ item }: { item: Sale }) => {
    const isCredit = item.payment_method === 'credit';
    const balanceDue = item.total_amount - (item.amount_paid || 0);
    const isRefunded =
      item.status === 'refunded' || item.status === 'cancelled';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('SaleDetail', { saleId: item.id })}
      >
        <Card>
          <View style={styles.saleCard}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleId}>
                Sale #{item.sale_number || item.id}
              </Text>
              <Text style={styles.customerName}>
                {item.customer_name ||
                  item.customer?.name ||
                  'Walk-in Customer'}
              </Text>
              <Text style={styles.saleDate}>{formatDate(item.sale_date)}</Text>
            </View>
            <View style={styles.saleAmount}>
              <View style={styles.paymentMethodBadge}>
                <Text style={styles.paymentMethodText}>
                  {isCredit ? 'Credit' : item.payment_method.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.amountValue}>
                {formatCurrency(item.total_amount)}
              </Text>
              {isCredit && item.amount_paid && item.amount_paid > 0 && (
                <Text style={styles.amountPaid}>
                  Paid: {formatCurrency(item.amount_paid)}
                </Text>
              )}
              {isCredit && balanceDue > 0 && (
                <Text style={styles.balanceDue}>
                  Due: {formatCurrency(balanceDue)}
                </Text>
              )}
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'completed' && styles.statusCompleted,
                  item.status === 'cancelled' && styles.statusCancelled,
                  item.status === 'refunded' && styles.statusRefunded,
                  item.status === 'pending' && styles.statusPending,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading message="Loading sales..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer or sale #"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {['all', 'completed', 'pending', 'refunded', 'cancelled'].map(
            status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>
      <FlatList
        data={filteredSales}
        renderItem={renderSale}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales found</Text>
        }
        style={{ flex: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchContainer: {
    marginBottom: SPACING.sm,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  list: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  saleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  saleDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  paymentMethodBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  amountPaid: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    marginBottom: 2,
  },
  balanceDue: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statuspaid: {
    backgroundColor: COLORS.success,
  },
  statuspending: {
    backgroundColor: COLORS.warning,
  },
  statusrefunded: {
    backgroundColor: COLORS.error,
  },
  statusRefunded: {
    backgroundColor: COLORS.error,
  },
  statusCompleted: {
    backgroundColor: COLORS.success,
  },
  statusCancelled: {
    backgroundColor: COLORS.error,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.xl,
  },
});

export default SalesScreen;
