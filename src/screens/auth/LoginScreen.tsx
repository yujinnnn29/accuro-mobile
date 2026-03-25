import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, Lock } from 'lucide-react-native';
import { useAuth } from '../../contexts';
import { Button, Input } from '../../components/common';
import { isValidEmail } from '../../utils/validation';
import { colors } from '../../theme';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    if (loading) {
      slowTimer.current = setTimeout(() => setSlowHint(true), 8000);
    } else {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setSlowHint(false);
      setRetrying(false);
    }
    return () => { if (slowTimer.current) clearTimeout(slowTimer.current); };
  }, [loading]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const attemptLogin = useCallback(async (email: string, password: string): Promise<void> => {
    await login({ email: email.trim(), password });
  }, [login]);

  const handleLogin = async () => {
    if (!validateForm()) return;

    retryCount.current = 0;
    setLoading(true);

    const tryLogin = async (): Promise<void> => {
      try {
        await attemptLogin(email, password);
        // Navigation handled by AppNavigator based on auth state
      } catch (error: any) {
        const hasResponse = !!error.response;
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.name === 'AbortError';
        const isNetworkError = !hasResponse && !isTimeout;
        const isTransient = isTimeout || isNetworkError;

        // Auto-retry once on transient failures (timeout or no network response)
        if (isTransient && retryCount.current < 1) {
          retryCount.current += 1;
          setRetrying(true);
          await new Promise(resolve => setTimeout(resolve, 5000));
          setRetrying(false);
          return tryLogin();
        }

        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          (isTransient ? 'The server is taking too long to respond. Please check your connection and try again.' : null) ||
          error.message ||
          'Login failed. Please try again.';
        Alert.alert('Login Error', message);
        setLoading(false);
      }
    };

    await tryLogin();
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Accuro</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            leftIcon={<Mail size={20} color={colors.gray[400]} />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
            leftIcon={<Lock size={20} color={colors.gray[400]} />}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={styles.loginButton}
          />
          {slowHint && (
            <Text style={styles.slowHint}>
              {retrying
                ? 'Server is waking up, retrying…'
                : 'The server is starting up — this can take up to 2 minutes. Please wait…'}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[600],
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
  },
  slowHint: {
    marginTop: 12,
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  signupLink: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
});

export default LoginScreen;
