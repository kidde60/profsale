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

type RestockReportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Back'
>;

interface Props {
  navigation: RestockReportScreenNavigationProp;
}

interface RestockSummary {
  total_restock_events: number;
  products_restocked: number;
  total_quantity_restocked: number;
  avg_restock_quantity: number;
}

interface RestockProduct {
  product_id: number;
  product_name: string;
  restock_count: number;
  total_quantity_restocked: number;
  last_restocked_at: string;
}

const RestockReportScreen: React.FC<Props> = ({ navigation }) => {
  const [summary, setSummary] = useState<RestockSummary | null>(null);
  const [mostRestocked, setMostRestocked] = useState<RestockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await productService.getRestockReport();
      setSummary(data.summary);
      setMostRestocked(data.mostRestocked || []);
    } catch (error) {
      console.error('Error fetching restock report:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const renderSummaryCard = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.cardTitle}>Restock Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {summary?.total_restock_events || 0}
          </Text>
          <Text style={styles.summaryLabel}>Restock Events</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {summary?.products_restocked || 0}
          </Text>
          <Text style={styles.summaryLabel}>Products Restocked</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Number(summary?.total_quantity_restocked ?? 0).toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>Total Quantity</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Number(summary?.avg_restock_quantity ?? 0).toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>Avg. Quantity</Text>
        </View>
      </View>
    </Card>
  );

  const renderProduct = ({
    item,
    index,
  }: {
    item: RestockProduct;
    index: number;
  }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.lastRestocked}>
            Last restocked: {formatDate(item.last_restocked_at)}
          </Text>
        </View>
      </View>
      <View style={styles.productStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.restock_count}</Text>
          <Text style={styles.statLabel}>Restocks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Number(item.total_quantity_restocked ?? 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Qty</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {(
              Number(item.total_quantity_restocked ?? 0) / item.restock_count
            ).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Avg/Restock</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Loading message="Loading restock report..." />
        ) : (
          <>
            {summary && renderSummaryCard()}

            <Card style={styles.headerCard}>
              <Text style={styles.cardTitle}>Most Restocked Products</Text>
              <Text style={styles.cardSubtitle}>
                Products that sell fast require frequent restocking
              </Text>
            </Card>

            {mostRestocked.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No restock data available</Text>
              </View>
            ) : (
              <FlatList
                data={mostRestocked}
                renderItem={renderProduct}
                keyExtractor={item => item.product_id.toString()}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
              />
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
  scrollContainer: {
    flex: 1,
  },
  summaryCard: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerCard: {
    margin: SPACING.md,
    marginTop: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
  },
  summaryItem: {
    width: '50%',
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  productCard: {
    marginBottom: SPACING.md,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  lastRestocked: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
});

export default RestockReportScreen;
