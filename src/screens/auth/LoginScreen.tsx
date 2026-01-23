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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/AppNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login({ login: emailOrPhone, password });
    } catch (error: any) {
      const message =
        error.message || error.response?.data?.message || 'Invalid credentials';
      Alert.alert('Login Failed', message);
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
          <Text style={styles.title}>Welcome to ProfSale</Text>
          <Text style={styles.subtitle}>Login to manage your business</Text>

          <View style={styles.form}>
            <Input
              label="Email or Phone"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="Enter your email or phone"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!isPasswordVisible}
              rightIcon={
                <TouchableOpacity onPress={togglePasswordVisibility}>
                  <Feather
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <View style={styles.forgotPasswordContainer}>
              <Button
                title="Forgot Password?"
                onPress={() => navigation.navigate('ForgotPassword')}
                variant="text"
                size="small"
              />
            </View>

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Button
                title="Register"
                onPress={() => navigation.navigate('Register')}
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
  },
  form: {
    marginTop: SPACING.md,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -SPACING.xs,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});

export default LoginScreen;
