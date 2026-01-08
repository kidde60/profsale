import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Loading } from '../components';
import subscriptionService, {
  Subscription,
  SubscriptionPlan,
  SubscriptionPayment,
} from '../services/subscriptionService';
import { formatCurrency } from '../utils/helpers';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type SubscriptionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Subscription'
>;

interface Props {
  navigation: SubscriptionScreenNavigationProp;
}

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<SubscriptionPayment[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [mobileNumber, setMobileNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<
    number | null
  >(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subscription, plansData, historyData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getPlans(),
        subscriptionService.getHistory(),
      ]);
      setCurrentSubscription(subscription);
      setPlans(plansData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(false);
    setShowPaymentModal(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !mobileNumber) {
      Alert.alert('Validation', 'Please enter your mobile money number');
      return;
    }

    try {
      setSubscribing(true);
      const result = await subscriptionService.subscribe(
        selectedPlan.id,
        mobileNumber,
      );
      setPendingSubscriptionId(result.data.subscriptionId);
      Alert.alert('Payment Instructions', result.message);
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingSubscriptionId || !transactionRef) {
      Alert.alert('Validation', 'Please enter the transaction reference');
      return;
    }

    try {
      setSubscribing(true);
      await subscriptionService.confirmPayment(
        pendingSubscriptionId,
        transactionRef,
      );
      Alert.alert(
        'Success',
        'Payment confirmed! Your subscription is now active',
      );
      setShowPaymentModal(false);
      setMobileNumber('');
      setTransactionRef('');
      setPendingSubscriptionId(null);
      setSelectedPlan(null);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm payment');
    } finally {
      setSubscribing(false);
    }
  };

  const getDaysRemaining = () => {
    if (!currentSubscription) return 0;
    const endDate = new Date(currentSubscription.current_period_end);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const renderHistoryItem = ({ item }: { item: SubscriptionPayment }) => (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyPlan}>{item.plan_name}</Text>
        <Text
          style={[
            styles.historyStatus,
            item.status === 'completed'
              ? styles.statusCompleted
              : item.status === 'pending'
              ? styles.statusPending
              : styles.statusFailed,
          ]}
        >
          {item.status.toUpperCase()}
        </Text>
      </View>
      <View style={styles.historyRow}>
        <Text style={styles.historyLabel}>Amount:</Text>
        <Text style={styles.historyValue}>
          {item.currency} {item.amount.toLocaleString()}
        </Text>
      </View>
      <View style={styles.historyRow}>
        <Text style={styles.historyLabel}>Mobile:</Text>
        <Text style={styles.historyValue}>{item.mobile_number}</Text>
      </View>
      {item.transaction_reference && (
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Reference:</Text>
          <Text style={styles.historyValue}>{item.transaction_reference}</Text>
        </View>
      )}
      <Text style={styles.historyDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </Card>
  );

  if (loading) {
    return <Loading message="Loading subscription..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Subscription */}
        {currentSubscription ? (
          <Card style={styles.currentCard}>
            <Text style={styles.currentLabel}>Current Plan</Text>
            <Text style={styles.currentPlan}>
              {currentSubscription.plan_name}
            </Text>
            <Text style={styles.currentPrice}>
              {currentSubscription.currency}{' '}
              {currentSubscription.price.toLocaleString()}/month
            </Text>
            <View style={styles.limitsContainer}>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Products Limit</Text>
                <Text style={styles.limitValue}>
                  {currentSubscription.max_products}
                </Text>
              </View>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Status</Text>
                <Text
                  style={[
                    styles.limitValue,
                    currentSubscription.status === 'trial'
                      ? styles.statusTrial
                      : styles.statusActive,
                  ]}
                >
                  {currentSubscription.status.toUpperCase()}
                </Text>
              </View>
            </View>
            {currentSubscription.status === 'trial' && (
              <Text style={styles.trialInfo}>
                Trial ends in {getDaysRemaining()} days
              </Text>
            )}
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowUpgradeModal(true)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card style={styles.currentCard}>
            <Text style={styles.noSubscriptionText}>
              No active subscription
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowUpgradeModal(true)}
            >
              <Text style={styles.upgradeButtonText}>Choose a Plan</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {history.length > 0 ? (
            history.map((item, index) => (
              <View key={index}>{renderHistoryItem({ item })}</View>
            ))
          ) : (
            <Text style={styles.emptyText}>No payment history</Text>
          )}
        </View>
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal visible={showUpgradeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Your Plan</Text>
            <ScrollView style={styles.plansContainer}>
              {plans.map(plan => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    currentSubscription?.plan_id === plan.id &&
                      styles.planCardCurrent,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {plan.currency} {plan.price.toLocaleString()}
                    <Text style={styles.planCycle}>/{plan.billing_cycle}</Text>
                  </Text>
                  <Text style={styles.planFeature}>
                    • Up to {plan.max_products} products
                  </Text>
                  <Text style={styles.planFeature}>
                    • {plan.features.max_users} user
                    {plan.features.max_users > 1 ? 's' : ''}
                  </Text>
                  {plan.features.reports && (
                    <Text style={styles.planFeature}>• Advanced Reports</Text>
                  )}
                  {plan.features.expenses && (
                    <Text style={styles.planFeature}>• Expense Tracking</Text>
                  )}
                  {currentSubscription?.plan_id === plan.id && (
                    <Text style={styles.currentPlanBadge}>CURRENT PLAN</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            {selectedPlan && (
              <>
                <Card style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Plan</Text>
                  <Text style={styles.paymentValue}>{selectedPlan.name}</Text>
                  <Text style={styles.paymentLabel}>Amount</Text>
                  <Text style={styles.paymentAmount}>
                    {selectedPlan.currency}{' '}
                    {selectedPlan.price.toLocaleString()}
                  </Text>
                </Card>

                {!pendingSubscriptionId ? (
                  <>
                    <Text style={styles.inputLabel}>Mobile Money Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 0700123456"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="phone-pad"
                    />
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={handleSubscribe}
                      disabled={subscribing}
                    >
                      <Text style={styles.payButtonText}>
                        {subscribing ? 'Processing...' : 'Continue'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.instructionText}>
                      Send {selectedPlan.currency}{' '}
                      {selectedPlan.price.toLocaleString()} to {mobileNumber}{' '}
                      via Mobile Money and enter the transaction reference below
                    </Text>
                    <Text style={styles.inputLabel}>
                      Transaction Reference *
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter transaction ID"
                      value={transactionRef}
                      onChangeText={setTransactionRef}
                    />
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={handleConfirmPayment}
                      disabled={subscribing}
                    >
                      <Text style={styles.payButtonText}>
                        {subscribing ? 'Confirming...' : 'Confirm Payment'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowPaymentModal(false);
                setMobileNumber('');
                setTransactionRef('');
                setPendingSubscriptionId(null);
                setSelectedPlan(null);
              }}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  currentCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  currentPlan: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  currentPrice: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  limitsContainer: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginVertical: SPACING.md,
  },
  limitItem: {
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  limitValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusTrial: {
    color: COLORS.warning,
  },
  statusActive: {
    color: COLORS.success,
  },
  trialInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.warning,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  upgradeButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  noSubscriptionText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  historyCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  historyPlan: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: COLORS.success + '20',
    color: COLORS.success,
  },
  statusPending: {
    backgroundColor: COLORS.warning + '20',
    color: COLORS.warning,
  },
  statusFailed: {
    backgroundColor: COLORS.error + '20',
    color: COLORS.error,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  historyLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  historyValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginTop: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  plansContainer: {
    maxHeight: 400,
  },
  planCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  planCardCurrent: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  planName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  planPrice: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  planCycle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '400',
  },
  planFeature: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  currentPlanBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  paymentInfo: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  paymentLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  paymentAmount: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  instructionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
    backgroundColor: COLORS.warning + '10',
    padding: SPACING.md,
    borderRadius: 8,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING.md,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCloseButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
  },
});

export default SubscriptionScreen;
