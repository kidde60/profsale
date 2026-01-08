import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Loading } from '../components';
import { salesService } from '../services/salesService';
import { Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type SalesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

interface Props {
  navigation: SalesScreenNavigationProp;
}

const SalesScreen: React.FC<Props> = ({ navigation }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await salesService.getSales();
      // Backend returns nested structure: { data: { sales: [...], pagination: {...}, summary: {...} } }
      const salesData = (response as any)?.data?.sales || response.data || [];
      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const renderSale = ({ item }: { item: Sale }) => (
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
              {item.customer_name || item.customer?.name || 'Walk-in Customer'}
            </Text>
            <Text style={styles.saleDate}>{formatDate(item.sale_date)}</Text>
          </View>
          <View style={styles.saleAmount}>
            <Text style={styles.amountValue}>
              {formatCurrency(item.total_amount)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                styles[`status${item.payment_status}`],
              ]}
            >
              <Text style={styles.statusText}>{item.payment_status}</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading message="Loading sales..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales found</Text>
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
  list: {
    padding: SPACING.md,
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
