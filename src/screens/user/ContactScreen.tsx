import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Send,
  ExternalLink,
} from 'lucide-react-native';
import { useAuth, useTheme } from '../../contexts';
import { contactService } from '../../api';
import { colors } from '../../theme';
import { Card, Button, Input } from '../../components/common';

export const ContactScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await contactService.submitContact(formData);
      Alert.alert(
        'Message Sent',
        'Thank you for contacting us! We\'ll get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                email: user?.email || '',
                phone: user?.phone || '',
                company: user?.company || '',
                subject: '',
                message: '',
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+639171234567');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:info@accuro.ph');
  };

  const handleMap = () => {
    const address = 'Makati City, Metro Manila, Philippines';
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Us</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Contact Info Cards */}
          <View style={styles.contactCards}>
            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: theme.surface }]}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.success + '20' }]}>
                <Phone size={20} color={colors.success} />
              </View>
              <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>Call Us</Text>
              <Text style={[styles.contactValue, { color: theme.text }]}>+63 917 123 4567</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: theme.surface }]}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.primary[100] }]}>
                <Mail size={20} color={colors.primary[600]} />
              </View>
              <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>Email Us</Text>
              <Text style={[styles.contactValue, { color: theme.text }]}>info@accuro.ph</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: theme.surface }]}
              onPress={handleMap}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.warning + '20' }]}>
                <MapPin size={20} color={colors.warning} />
              </View>
              <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>Visit Us</Text>
              <Text style={[styles.contactValue, { color: theme.text }]}>Makati City</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          <Card style={styles.formCard} padding="lg">
            <Text style={[styles.formTitle, { color: theme.text }]}>Send us a Message</Text>
            <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
              Have a question or inquiry? Fill out the form below and we'll get back to you.
            </Text>

            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  error={errors.firstName}
                />
              </View>
              <View style={styles.nameField}>
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  error={errors.lastName}
                />
              </View>
            </View>

            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Phone (Optional)"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Company (Optional)"
              value={formData.company}
              onChangeText={(value) => handleInputChange('company', value)}
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Subject"
              value={formData.subject}
              onChangeText={(value) => handleInputChange('subject', value)}
              error={errors.subject}
              containerStyle={styles.inputSpacing}
            />

            <Input
              label="Message"
              value={formData.message}
              onChangeText={(value) => handleInputChange('message', value)}
              multiline
              numberOfLines={4}
              error={errors.message}
              containerStyle={styles.inputSpacing}
            />

            <Button
              title="Send Message"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />
          </Card>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerRight: {
    width: 32,
  },
  contactCards: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  inputSpacing: {
    marginTop: 12,
  },
  submitButton: {
    marginTop: 20,
  },
  bottomPadding: {
    height: 24,
  },
});

export default ContactScreen;
