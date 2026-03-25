import React, { useState, useMemo } from 'react';
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
import { Mail, Lock, User, Phone, Building } from 'lucide-react-native';
import { useAuth } from '../../contexts';
import { Button, Input } from '../../components/common';
import { isValidEmail, isValidPhone, validatePassword } from '../../utils/validation';
import { colors } from '../../theme';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordValidation = useMemo(
    () => validatePassword(formData.password),
    [formData.password]
  );

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    const fullName = [
      formData.firstName.trim(),
      formData.middleName.trim(),
      formData.lastName.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    setLoading(true);
    try {
      await register({
        name: fullName,
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
      });
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      const data = error.response?.data;
      const topMessage = data?.message || data?.error || data?.msg;
      const fieldErrors: string[] = Array.isArray(data?.errors)
        ? data.errors.map((e: any) => e.msg || e.message || e.field).filter(Boolean)
        : [];
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      const isNetwork = !error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK');
      const message =
        (topMessage && fieldErrors.length > 0 ? `${topMessage}:\n• ${fieldErrors.join('\n• ')}` : null) ||
        topMessage ||
        fieldErrors.join(', ') ||
        (isTimeout ? 'Request timed out. Please try again.' : null) ||
        (isNetwork ? 'Network error. Please check your connection and try again.' : null) ||
        error.message ||
        'Registration failed. Please try again.';
      Alert.alert('Registration Error', message);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordValidation.strength) {
      case 'strong': return colors.success;
      case 'medium': return colors.warning;
      default: return colors.error;
    }
  };

  const getStrengthWidth = () => {
    switch (passwordValidation.strength) {
      case 'strong': return '100%';
      case 'medium': return '66%';
      default: return '33%';
    }
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          {/* First Name */}
          <Input
            label="First Name *"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChangeText={(value) => updateField('firstName', value)}
            autoCapitalize="words"
            error={errors.firstName}
            leftIcon={<User size={20} color={colors.gray[400]} />}
          />

          {/* Middle Name */}
          <Input
            label="Middle Name (Optional)"
            placeholder="Enter your middle name"
            value={formData.middleName}
            onChangeText={(value) => updateField('middleName', value)}
            autoCapitalize="words"
            leftIcon={<User size={20} color={colors.gray[400]} />}
          />

          {/* Last Name */}
          <Input
            label="Last Name *"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChangeText={(value) => updateField('lastName', value)}
            autoCapitalize="words"
            error={errors.lastName}
            leftIcon={<User size={20} color={colors.gray[400]} />}
          />

          {/* Email Address */}
          <Input
            label="Email Address *"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            leftIcon={<Mail size={20} color={colors.gray[400]} />}
          />

          {/* Phone Number */}
          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            error={errors.phone}
            leftIcon={<Phone size={20} color={colors.gray[400]} />}
          />

          {/* Company Name */}
          <Input
            label="Company Name"
            placeholder="Enter your company name"
            value={formData.company}
            onChangeText={(value) => updateField('company', value)}
            leftIcon={<Building size={20} color={colors.gray[400]} />}
          />

          {/* Password */}
          <Input
            label="Password *"
            placeholder="Create a password"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            isPassword
            error={errors.password}
            leftIcon={<Lock size={20} color={colors.gray[400]} />}
          />

          {/* Password strength & requirements */}
          {formData.password.length > 0 && (
            <View style={styles.passwordStrengthBlock}>
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: getStrengthWidth(), backgroundColor: getStrengthColor() },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                  {passwordValidation.strength.charAt(0).toUpperCase() +
                    passwordValidation.strength.slice(1)}
                </Text>
              </View>
              <View style={styles.requirementsList}>
                {[
                  { label: 'At least 8 characters', met: formData.password.length >= 8 },
                  { label: 'At least one uppercase letter', met: /[A-Z]/.test(formData.password) },
                  { label: 'At least one lowercase letter', met: /[a-z]/.test(formData.password) },
                  { label: 'At least one number', met: /[0-9]/.test(formData.password) },
                  { label: 'At least one special character (!@#$%^&*)', met: /[!@#$%^&*]/.test(formData.password) },
                ].map((req, i) => (
                  <Text
                    key={i}
                    style={[styles.requirementItem, { color: req.met ? colors.success : colors.gray[400] }]}
                  >
                    {req.met ? '✓' : '○'} {req.label}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Confirm Password */}
          <Input
            label="Confirm Password *"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            isPassword
            error={errors.confirmPassword}
            leftIcon={<Lock size={20} color={colors.gray[400]} />}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            fullWidth
            style={styles.signupButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[600],
    marginBottom: 16,
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
  passwordStrengthBlock: {
    marginTop: -12,
    marginBottom: 16,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginRight: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requirementsList: {
    gap: 4,
  },
  requirementItem: {
    fontSize: 12,
  },
  signupButton: {
    marginTop: 8,
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
  loginLink: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
});

export default SignupScreen;
