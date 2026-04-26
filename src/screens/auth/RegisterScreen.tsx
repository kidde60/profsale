import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  TextInput,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { isValidEmail } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

const BUSINESS_TYPES = [
  'Retail',
  'Wholesale',
  'Service',
  'Restaurant',
  'Manufacturing',
  'E-commerce',
  'Healthcare',
  'Education',
  'Other',
];

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail');
  const [loading, setLoading] = useState(false);
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredBusinessTypes = BUSINESS_TYPES.filter(type =>
    type.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleRegister = async () => {
    // Validation - matching backend requirements
    if (!firstName || !lastName || !phone || !businessName || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (email && !isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        phone,
        password,
        businessName,
        businessType: businessType.toLowerCase(),
      });
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Failed to register',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Text style={styles.logoEmoji}>🚀</Text>
              </View>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start managing your business today
            </Text>
            <View style={styles.featuresContainer}>
              <Text style={styles.featureItem}>✓ Free to Start</Text>
              <Text style={styles.featureItem}>✓ Easy Setup</Text>
              <Text style={styles.featureItem}>✓ Powerful Features</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name *"
                  style={styles.input}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name *"
                  style={styles.input}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone *"
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email (optional)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🏢</Text>
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Business Name *"
                  style={styles.input}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowBusinessTypeModal(true)}
              >
                <Text style={styles.inputIcon}>📋</Text>
                <Text
                  style={[
                    styles.input,
                    { color: businessType ? COLORS.text : COLORS.textLight },
                  ]}
                >
                  {businessType || 'Business Type *'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password * (min 6 characters)"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>ProfSale v1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Business Type Modal */}
      <Modal
        visible={showBusinessTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBusinessTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Business Type</Text>
              <TouchableOpacity onPress={() => setShowBusinessTypeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search business types..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <FlatList
              data={filteredBusinessTypes}
              keyExtractor={item => item}
              style={styles.optionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setBusinessType(item);
                    setShowBusinessTypeModal(false);
                    setSearchText('');
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      businessType === item && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {businessType === item && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  featureItem: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  form: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border || '#E0E0E0',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: SPACING.sm,
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text || '#333333',
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: SPACING.md,
    borderRadius: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loginText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: height * 0.6,
    borderWidth: 1,
    borderColor: COLORS.border || '#E0E0E0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 8,
  },
  optionsList: {
    flexGrow: 0,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },
});

export default RegisterScreen;
