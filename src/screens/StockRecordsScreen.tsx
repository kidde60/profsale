import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Loading } from '../components';
import { productService } from '../services/productService';
import { formatDate } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type StockRecordsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Back'
>;

interface Props {
  navigation: StockRecordsScreenNavigationProp;
}

interface StockRecord {
  id: number;
  product_id: number;
  product_name: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  change_type: 'restock' | 'sale' | 'adjustment' | 'return';
  reason: string | null;
  performed_by_first_name: string;
  performed_by_last_name: string;
  created_at: string;
}

const StockRecordsScreen: React.FC<Props> = ({ navigation }) => {
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'restock' | 'sale' | 'adjustment' | 'return'
  >('all');

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.changeType = filter;
      }
      const data = await productService.getAllStockRecords(params);
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error fetching stock records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'restock':
        return COLORS.success;
      case 'sale':
        return COLORS.primary;
      case 'adjustment':
        return COLORS.warning;
      case 'return':
        return COLORS.primary;
      case 'damage':
        return COLORS.error;
      case 'expiry':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderRecord = ({ item }: { item: StockRecord }) => (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <View
          style={[
            styles.changeTypeBadge,
            { backgroundColor: getChangeTypeColor(item.change_type) + '20' },
          ]}
        >
          <Text
            style={[
              styles.changeTypeText,
              { color: getChangeTypeColor(item.change_type) },
            ]}
          >
            {item.change_type.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.recordDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Quantity Change:</Text>
          <Text
            style={[
              styles.value,
              item.quantity_change > 0 ? styles.positive : styles.negative,
            ]}
          >
            {item.quantity_change > 0 ? '+' : ''}
            {item.quantity_change}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Previous Stock:</Text>
          <Text style={styles.value}>{item.previous_quantity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>New Stock:</Text>
          <Text style={[styles.value, styles.newStock]}>
            {item.new_quantity}
          </Text>
        </View>
        {item.reason && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Reason:</Text>
            <Text style={styles.value}>{item.reason}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Performed By:</Text>
          <Text style={styles.value}>
            {item.performed_by_first_name} {item.performed_by_last_name}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterContainer}>
        {(['all', 'restock', 'sale', 'adjustment', 'return'] as const).map(
          type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                filter === type && styles.filterChipActive,
              ]}
              onPress={() => setFilter(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === type && styles.filterChipTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {loading ? (
        <Loading message="Loading stock records..." />
      ) : records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No stock records found</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  },
  recordCard: {
    marginBottom: SPACING.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  changeTypeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  changeTypeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
  },
  recordDetails: {
    gap: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  positive: {
    color: COLORS.success,
  },
  negative: {
    color: COLORS.error,
  },
  newStock: {
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
});

export default StockRecordsScreen;
