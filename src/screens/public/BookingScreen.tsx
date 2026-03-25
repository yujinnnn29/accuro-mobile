import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Clock, MapPin, User, Mail, Phone, Building, FileText, Check, XCircle, CheckCircle, Info, CalendarCheck, Share2, ArrowLeft } from 'lucide-react-native';
import { useAuth, useTheme } from '../../contexts';
import { bookingService, recommendationService } from '../../api';
import { BOOKING_PURPOSES, BOOKING_LOCATIONS, QUOTATION_SERVICES } from '../../utils/constants';
import { formatDateForAPI } from '../../utils/dateUtils';
import { colors } from '../../theme';
import { Button, Input } from '../../components/common';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

const SelectField: React.FC<{
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
}> = ({ label, options, value, onSelect }) => {
  const [showOptions, setShowOptions] = useState(false);
  const { theme } = useTheme();

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={[styles.selectText, { color: value ? theme.text : colors.gray[400] }]}>
          {value || `Select ${label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>
      {showOptions && (
        <View style={[styles.optionsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionItem,
                { borderBottomColor: theme.border },
                value === option && styles.optionItemSelected,
              ]}
              onPress={() => {
                onSelect(option);
                setShowOptions(false);
              }}
            >
              <Text style={[styles.optionText, { color: theme.textSecondary }, value === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export const BookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    company: user?.company || '',
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    purpose: '',
    location: '',
    product: '',
    additionalInfo: '',
  });
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDetails, setSubmittedDetails] = useState<{
    date: string; time: string; purpose: string; location: string; contactName: string;
  } | null>(null);

  // Pre-fill additional notes if coming from cart with quotation request
  useEffect(() => {
    const params = route.params as { cartProducts?: string } | undefined;
    if (params?.cartProducts) {
      setFormData(function(prev) {
        return { ...prev, additionalInfo: params.cartProducts || '' };
      });
    }
  }, [route.params]);

  // Fetch time slot availability when a date is selected
  useEffect(() => {
    if (!selectedDate) {
      setAvailability({});
      return;
    }

    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      setSelectedTime('');
      try {
        const results = await Promise.allSettled(
          TIME_SLOTS.map(async (time) => {
            const result = await bookingService.checkAvailability(selectedDate, time);
            return { time, available: result.isAvailable };
          })
        );
        const availMap: Record<string, boolean> = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            availMap[result.value.time] = result.value.available;
          }
        });
        setAvailability(availMap);
      } catch (error) {
        setAvailability({});
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [selectedDate]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const validateForm = () => {
    if (!selectedDate) {
      Alert.alert('Validation Error', 'Please select a date');
      return false;
    }
    if (!selectedTime) {
      Alert.alert('Validation Error', 'Please select a time');
      return false;
    }
    if (!formData.company.trim()) {
      Alert.alert('Validation Error', 'Please enter your company name');
      return false;
    }
    if (!formData.contactName.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }
    if (!formData.contactEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }
    if (!formData.purpose) {
      Alert.alert('Validation Error', 'Please select a purpose');
      return false;
    }
    if (!formData.location) {
      Alert.alert('Validation Error', 'Please select a location');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setFormData({
      company: user?.company || '',
      contactName: user?.name || '',
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
      purpose: '',
      location: '',
      product: '',
      additionalInfo: '',
    });
    setAvailability({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const details = {
      date: selectedDate,
      time: selectedTime,
      purpose: formData.purpose,
      location: formData.location,
      contactName: formData.contactName,
    };

    try {
      await bookingService.create({
        date: selectedDate,
        time: selectedTime,
        ...formData,
      });
      // Track booking interaction for recommendations engine
      if (formData.product) {
        recommendationService.recordInteraction('booking', formData.product, '').catch(() => {});
      }
      resetForm();
      setSubmittedDetails(details);
      setSubmitted(true);
    } catch (error: any) {
      // Timeout means booking was created (takes ~2-3s) but email sending is still in progress (~120s)
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network Error');

      if (isTimeout) {
        resetForm();
        setSubmittedDetails(details);
        setSubmitted(true);
      } else if (error.response) {
        const message = error.response.data?.message || 'Failed to submit booking. Please try again.';
        Alert.alert('Error', message);
      } else {
        // Generic network errors - booking likely went through
        resetForm();
        setSubmittedDetails(details);
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!submittedDetails) return;
    const formattedDate = new Date(submittedDetails.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    await Share.share({
      message:
        `📅 Meeting Request — Accuro\n\n` +
        `Name: ${submittedDetails.contactName}\n` +
        `Date: ${formattedDate}\n` +
        `Time: ${submittedDetails.time}\n` +
        `Purpose: ${submittedDetails.purpose}\n` +
        `Location: ${submittedDetails.location}\n\n` +
        `A confirmation email will be sent to you shortly.\n` +
        `For inquiries: info@accuro.com.ph`,
    });
  };

  if (submitted && submittedDetails) {
    const formattedDate = new Date(submittedDetails.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.successContainer, { backgroundColor: theme.background }]}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.successBack} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.successIconWrap}>
          <CalendarCheck size={48} color={colors.white} />
        </View>

        <Text style={[styles.successTitle, { color: theme.text }]}>Meeting Request{'\n'}Successfully Submitted</Text>
        <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
          Thank you, {submittedDetails.contactName}. We'll review your request and send a confirmation to your email within 24 hours.
        </Text>

        {/* Summary card */}
        <View style={[styles.successCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.successCardTitle, { color: theme.text }]}>Booking Summary</Text>

          <View style={styles.successRow}>
            <View style={styles.successRowIcon}><CalendarCheck size={16} color={colors.primary[600]} /></View>
            <View style={styles.successRowContent}>
              <Text style={[styles.successRowLabel, { color: theme.textSecondary }]}>Date & Time</Text>
              <Text style={[styles.successRowValue, { color: theme.text }]}>{formattedDate} at {submittedDetails.time}</Text>
            </View>
          </View>

          <View style={styles.successRow}>
            <View style={styles.successRowIcon}><FileText size={16} color={colors.primary[600]} /></View>
            <View style={styles.successRowContent}>
              <Text style={[styles.successRowLabel, { color: theme.textSecondary }]}>Purpose</Text>
              <Text style={[styles.successRowValue, { color: theme.text }]}>{submittedDetails.purpose}</Text>
            </View>
          </View>

          <View style={styles.successRow}>
            <View style={styles.successRowIcon}><MapPin size={16} color={colors.primary[600]} /></View>
            <View style={styles.successRowContent}>
              <Text style={[styles.successRowLabel, { color: theme.textSecondary }]}>Location</Text>
              <Text style={[styles.successRowValue, { color: theme.text }]}>{submittedDetails.location}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.surface }]} onPress={handleShare}>
          <Share2 size={20} color={colors.primary[600]} />
          <Text style={styles.shareButtonText}>Share Booking Details</Text>
        </TouchableOpacity>

        <Button
          title="View My Bookings"
          onPress={() => navigation.getParent()?.navigate('BookingsTab' as never)}
          fullWidth
          style={styles.successActionButton}
        />

        <TouchableOpacity
          onPress={() => setSubmitted(false)}
          style={styles.bookAnotherLink}
        >
          <Text style={[styles.bookAnotherText, { color: theme.textSecondary }]}>Book Another Meeting</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.loginPrompt, { backgroundColor: theme.background }]}>
        <Text style={[styles.loginTitle, { color: theme.text }]}>Sign In Required</Text>
        <Text style={[styles.loginText, { color: theme.textSecondary }]}>
          Please sign in to schedule a booking with us.
        </Text>
        <Button
          title="Sign In"
          onPress={() => navigation.navigate('Auth' as never)}
        />
      </View>
    );
  }

  const today = new Date();
  const minDate = formatDateForAPI(today);
  const maxDate = formatDateForAPI(new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule a Meeting</Text>
          <Text style={styles.subtitle}>Book a consultation or product demonstration</Text>
        </View>

        {/* Calendar */}
        <View style={[styles.section, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Date</Text>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: colors.primary[600] },
            }}
            minDate={minDate}
            maxDate={maxDate}
            theme={{
              todayTextColor: colors.primary[600],
              selectedDayBackgroundColor: colors.primary[600],
              arrowColor: colors.primary[600],
              backgroundColor: theme.surface,
              calendarBackground: theme.surface,
              dayTextColor: theme.text,
              textDisabledColor: theme.textSecondary,
              monthTextColor: theme.text,
            }}
          />
        </View>

        {/* Time Slots */}
        <View style={[styles.section, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Time</Text>
          {loadingAvailability ? (
            <View style={styles.availabilityLoading}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={[styles.availabilityLoadingText, { color: theme.textSecondary }]}>Checking availability...</Text>
            </View>
          ) : (
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((time) => {
                const hasData = !!selectedDate && Object.keys(availability).length > 0;
                const isBooked = hasData && availability[time] === false;
                const isAvailable = hasData && availability[time] !== false;
                const isSelected = selectedTime === time;

                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      { backgroundColor: isDark ? theme.border : colors.gray[100] },
                      isSelected && styles.timeSlotSelected,
                      hasData && isAvailable && !isSelected && styles.timeSlotAvailable,
                      isBooked && styles.timeSlotBooked,
                    ]}
                    onPress={() => { if (!isBooked) setSelectedTime(time); }}
                    disabled={isBooked}
                    activeOpacity={isBooked ? 1 : 0.7}
                  >
                    {hasData ? (
                      isBooked ? (
                        <XCircle size={14} color="#b91c1c" />
                      ) : isSelected ? (
                        <Check size={14} color={colors.white} />
                      ) : (
                        <Check size={14} color="#15803d" />
                      )
                    ) : (
                      <Clock size={14} color={isSelected ? colors.white : colors.gray[500]} />
                    )}
                    <Text style={[
                      styles.timeText,
                      { color: isDark ? theme.textSecondary : colors.gray[700] },
                      isSelected && styles.timeTextSelected,
                      hasData && isAvailable && !isSelected && styles.timeTextAvailable,
                      isBooked && styles.timeTextBooked,
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Booking Summary */}
        {selectedDate && selectedTime ? (
          <View style={[styles.bookingSummary, { backgroundColor: isDark ? theme.surface : '#eff6ff', borderTopColor: isDark ? theme.border : '#bfdbfe' }]}>
            <Text style={[styles.bookingSummaryText, { color: isDark ? theme.text : '#1e3a5f' }]}>
              Your meeting is scheduled for{' '}
              <Text style={styles.bookingSummaryBold}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              {' '}at{' '}
              <Text style={styles.bookingSummaryBold}>{selectedTime}</Text>
            </Text>
          </View>
        ) : null}

        {/* Contact Info */}
        <View style={[styles.section, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Building size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Company Name *"
              placeholderTextColor={colors.gray[400]}
              value={formData.company}
              onChangeText={(v) => updateField('company', v)}
            />
          </View>

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <User size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Your Name *"
              placeholderTextColor={colors.gray[400]}
              value={formData.contactName}
              onChangeText={(v) => updateField('contactName', v)}
            />
          </View>

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Mail size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email Address *"
              placeholderTextColor={colors.gray[400]}
              value={formData.contactEmail}
              onChangeText={(v) => updateField('contactEmail', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Phone size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Phone Number"
              placeholderTextColor={colors.gray[400]}
              value={formData.contactPhone}
              onChangeText={(v) => updateField('contactPhone', v)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Meeting Details */}
        <View style={[styles.section, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Meeting Details</Text>

          <SelectField
            label="Purpose *"
            options={BOOKING_PURPOSES}
            value={formData.purpose}
            onSelect={(v) => updateField('purpose', v)}
          />

          <SelectField
            label="Location *"
            options={BOOKING_LOCATIONS}
            value={formData.location}
            onSelect={(v) => updateField('location', v)}
          />

          <SelectField
            label="Product/Service of Interest *"
            options={QUOTATION_SERVICES}
            value={formData.product}
            onSelect={(v) => updateField('product', v)}
          />

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Additional Notes</Text>
            <TextInput
              style={[styles.textArea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
              placeholder="Any additional information..."
              placeholderTextColor={colors.gray[400]}
              value={formData.additionalInfo}
              onChangeText={(v) => updateField('additionalInfo', v)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Status Note */}
        <View style={[styles.infoNote, { backgroundColor: isDark ? theme.surface : '#eff6ff', borderColor: isDark ? theme.border : '#bfdbfe' }]}>
          <Text style={[styles.infoNoteText, { color: isDark ? theme.text : '#1e40af' }]}>
            <Text style={{ fontWeight: '600' }}>Note:</Text> Meeting requests are subject to confirmation. You will receive a confirmation email with the meeting status within 24 hours.
          </Text>
        </View>

        <View style={styles.submitSection}>
          <Button
            title="Submit Meeting Request"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />
        </View>

        {/* What to Expect */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>What to Expect</Text>
          <View style={styles.infoCardItem}>
            <Clock size={18} color={colors.primary[600]} style={styles.infoCardIcon} />
            <Text style={[styles.infoCardText, { color: theme.textSecondary }]}>
              Meetings typically last 30-60 minutes depending on the complexity of your requirements
            </Text>
          </View>
          <View style={styles.infoCardItem}>
            <CheckCircle size={18} color={colors.primary[600]} style={styles.infoCardIcon} />
            <Text style={[styles.infoCardText, { color: theme.textSecondary }]}>
              Our team will prepare a personalized demonstration of relevant products
            </Text>
          </View>
          <View style={styles.infoCardItem}>
            <FileText size={18} color={colors.primary[600]} style={styles.infoCardIcon} />
            <Text style={[styles.infoCardText, { color: theme.textSecondary }]}>
              We'll provide a detailed quote following the meeting based on your needs
            </Text>
          </View>
        </View>

        {/* Need Immediate Assistance */}
        <View style={[styles.contactCard, { backgroundColor: isDark ? theme.surface : '#eff6ff', borderColor: isDark ? theme.border : '#bfdbfe' }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>Need Immediate Assistance?</Text>
          <Text style={[styles.contactIntro, { color: theme.textSecondary }]}>
            If you have urgent requirements or questions, please don't hesitate to contact us directly:
          </Text>
          <View style={styles.contactItem}>
            <Phone size={18} color={colors.primary[600]} />
            <Text style={[styles.contactText, { color: theme.text }]}>+63 9171507737</Text>
          </View>
          <View style={styles.contactItem}>
            <Mail size={18} color={colors.primary[600]} />
            <Text style={[styles.contactText, { color: theme.text }]}>info@accuro.com.ph</Text>
          </View>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.primary[100],
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    margin: 4,
  },
  timeSlotSelected: {
    backgroundColor: colors.primary[600],
  },
  timeSlotAvailable: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  timeSlotBooked: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    opacity: 0.7,
  },
  timeText: {
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: 6,
  },
  timeTextSelected: {
    color: colors.white,
  },
  timeTextAvailable: {
    color: '#15803d',
    fontWeight: '500',
  },
  timeTextBooked: {
    color: '#b91c1c',
  },
  availabilityLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  availabilityLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray[500],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: {
    fontSize: 16,
    color: colors.gray[900],
  },
  placeholderText: {
    color: colors.gray[400],
  },
  optionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  optionItemSelected: {
    backgroundColor: colors.primary[50],
  },
  optionText: {
    fontSize: 15,
    color: colors.gray[700],
  },
  optionTextSelected: {
    color: colors.primary[600],
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.gray[900],
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitSection: {
    padding: 20,
  },
  successContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: colors.gray[50],
  },
  successBack: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 4,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  successCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  successRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successRowContent: {
    flex: 1,
  },
  successRowLabel: {
    fontSize: 12,
    color: colors.gray[400],
    marginBottom: 2,
  },
  successRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary[600],
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
    marginLeft: 8,
  },
  successActionButton: {
    marginBottom: 16,
  },
  bookAnotherLink: {
    paddingVertical: 8,
  },
  bookAnotherText: {
    fontSize: 14,
    color: colors.gray[500],
    textDecorationLine: 'underline',
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  loginText: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  bookingSummary: {
    backgroundColor: '#eff6ff',
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  bookingSummaryText: {
    fontSize: 14,
    color: '#1e3a5f',
  },
  bookingSummaryBold: {
    fontWeight: '700',
  },
  infoNote: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 14,
  },
  infoNoteText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 14,
  },
  infoCardItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoCardIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  contactCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
  },
  contactIntro: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginLeft: 10,
  },
});

export default BookingScreen;
