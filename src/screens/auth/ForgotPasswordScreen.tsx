import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { authService } from '../../services/authService';

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
      await authService.forgotPassword(emailOrPhone);
      Alert.alert(
        'Success',
        'A password reset code has been sent to your email/phone. Please check and enter the code on the next screen.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('ResetPassword', { contact: emailOrPhone }),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send reset code',
      );
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
        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email or phone number and we'll send you a code to reset
            your password
          </Text>

          <View style={styles.form}>
            <Input
              label="Email or Phone"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="Enter your email or phone"
              autoCapitalize="none"
            />

            <Button
              title="Send Reset Code"
              onPress={handleForgotPassword}
              loading={loading}
              style={styles.submitButton}
            />

            <View style={styles.backContainer}>
              <Button
                title="Back to Login"
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                size="small"
              />
            </View>
          </View>
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
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  form: {
    marginTop: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
});

export default ForgotPasswordScreen;
