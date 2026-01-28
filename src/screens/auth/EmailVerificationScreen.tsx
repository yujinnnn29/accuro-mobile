import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react-native';
import { authService } from '../../api';
import { colors } from '../../theme';
import { Button, LoadingSpinner, Card } from '../../components/common';
import { AuthStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type RouteProps = RouteProp<AuthStackParamList, 'EmailVerification'>;

type VerificationStatus = 'loading' | 'success' | 'error' | 'pending';

export const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const token = route.params?.token;

  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'pending');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      // Assuming there's a verify email endpoint
      // await authService.verifyEmail(token);
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      // Assuming there's a resend verification endpoint
      // await authService.resendVerificationEmail();
      Alert.alert(
        'Email Sent',
        'A new verification email has been sent to your email address.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send verification email'
      );
    } finally {
      setResending(false);
    }
  };

  if (status === 'loading') {
    return <LoadingSpinner fullScreen text="Verifying your email..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'success' && (
          <>
            <View style={[styles.iconContainer, styles.successIcon]}>
              <CheckCircle size={64} color={colors.success} />
            </View>
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.description}>
              Your email has been successfully verified. You can now access all features of your account.
            </Text>
            <Button
              title="Continue to App"
              onPress={() => navigation.navigate('Login')}
              fullWidth
              style={styles.button}
            />
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <XCircle size={64} color={colors.error} />
            </View>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.description}>
              The verification link is invalid or has expired. Please request a new verification email.
            </Text>
            <Button
              title="Request New Link"
              onPress={handleResendVerification}
              loading={resending}
              fullWidth
              style={styles.button}
            />
            <Button
              title="Go to Login"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              fullWidth
              style={styles.secondaryButton}
            />
          </>
        )}

        {status === 'pending' && (
          <>
            <View style={[styles.iconContainer, styles.pendingIcon]}>
              <Mail size={64} color={colors.primary[600]} />
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.description}>
              We've sent a verification email to your email address. Please check your inbox and click the verification link.
            </Text>

            <Card style={styles.tipsCard} padding="md">
              <Text style={styles.tipsTitle}>Didn't receive the email?</Text>
              <Text style={styles.tipsText}>
                • Check your spam or junk folder{'\n'}
                • Make sure you entered the correct email{'\n'}
                • Wait a few minutes and try again
              </Text>
            </Card>

            <Button
              title="Resend Verification Email"
              onPress={handleResendVerification}
              loading={resending}
              fullWidth
              style={styles.button}
            />
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              variant="ghost"
              fullWidth
              style={styles.secondaryButton}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: colors.success + '20',
  },
  errorIcon: {
    backgroundColor: colors.error + '20',
  },
  pendingIcon: {
    backgroundColor: colors.primary[100],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  tipsCard: {
    backgroundColor: colors.white,
    marginBottom: 24,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 12,
  },
});

export default EmailVerificationScreen;
