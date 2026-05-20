import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { authService } from '../../services/authService';

const { width, height } = Dimensions.get('window');

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!emailOrPhone) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    setLoading(true);
    try {
      // Request reset code from backend
      // Backend will verify if user exists and send code
      const response = await authService.forgotPassword(emailOrPhone);

      // If we get here (status 200), the user exists and reset code was sent
      Alert.alert(
        'Success',
        'A password reset code has been sent to your email. Please check and enter the code on the next screen.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('ResetPassword', { contact: emailOrPhone }),
          },
        ],
      );
    } catch (error: any) {
      // Handle errors - user doesn't exist or other error
      const statusCode = error.response?.status;
      const errorMessage =
        error.response?.data?.message || 'Failed to send reset code';

      if (statusCode === 404) {
        // User not found
        Alert.alert(
          'Account Not Found',
          'The email or phone number you entered is not associated with any account. Please check and try again.',
        );
      } else {
        // Other errors
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Icon */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Text style={styles.icon}>🔐</Text>
            </View>
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a code to reset your password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Input
              label="Email"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="Enter your email"
              autoCapitalize="none"
            />
          </View>

          <Button
            title="Send Reset Code"
            onPress={handleForgotPassword}
            loading={loading}
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ProfSale v1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
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
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.md,
    borderRadius: 12,
  },
  backButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
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
});

export default ForgotPasswordScreen;
