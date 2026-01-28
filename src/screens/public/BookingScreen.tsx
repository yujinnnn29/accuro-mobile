import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { Clock, MapPin, User, Mail, Phone, Building, FileText } from 'lucide-react-native';
import { useAuth } from '../../contexts';
import { bookingService } from '../../api';
import { BOOKING_PURPOSES, BOOKING_LOCATIONS } from '../../utils/constants';
import { formatDateForAPI } from '../../utils/dateUtils';
import { colors } from '../../theme';
import { Button, Input } from '../../components/common';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];

const SelectField: React.FC<{
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
}> = ({ label, options, value, onSelect }) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={[styles.selectText, !value && styles.placeholderText]}>
          {value || `Select ${label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>
      {showOptions && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionItem, value === option && styles.optionItemSelected]}
              onPress={() => {
                onSelect(option);
                setShowOptions(false);
              }}
            >
              <Text style={[styles.optionText, value === option && styles.optionTextSelected]}>
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
  const { user, isAuthenticated } = useAuth();

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await bookingService.create({
        date: selectedDate,
        time: selectedTime,
        ...formData,
      });
      Alert.alert(
        'Booking Submitted',
        'Your booking request has been submitted successfully. We will contact you shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit booking. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.loginPrompt}>
        <Text style={styles.loginTitle}>Sign In Required</Text>
        <Text style={styles.loginText}>
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule a Meeting</Text>
          <Text style={styles.subtitle}>Book a consultation or product demonstration</Text>
        </View>

        {/* Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
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
            }}
          />
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeSlot, selectedTime === time && styles.timeSlotSelected]}
                onPress={() => setSelectedTime(time)}
              >
                <Clock size={14} color={selectedTime === time ? colors.white : colors.gray[500]} />
                <Text style={[styles.timeText, selectedTime === time && styles.timeTextSelected]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputRow}>
            <Building size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Company Name *"
              placeholderTextColor={colors.gray[400]}
              value={formData.company}
              onChangeText={(v) => updateField('company', v)}
            />
          </View>

          <View style={styles.inputRow}>
            <User size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your Name *"
              placeholderTextColor={colors.gray[400]}
              value={formData.contactName}
              onChangeText={(v) => updateField('contactName', v)}
            />
          </View>

          <View style={styles.inputRow}>
            <Mail size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              placeholderTextColor={colors.gray[400]}
              value={formData.contactEmail}
              onChangeText={(v) => updateField('contactEmail', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputRow}>
            <Phone size={20} color={colors.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={colors.gray[400]}
              value={formData.contactPhone}
              onChangeText={(v) => updateField('contactPhone', v)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Meeting Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Details</Text>

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

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Product Interest</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Which products are you interested in?"
              placeholderTextColor={colors.gray[400]}
              value={formData.product}
              onChangeText={(v) => updateField('product', v)}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any additional information..."
              placeholderTextColor={colors.gray[400]}
              value={formData.additionalInfo}
              onChangeText={(v) => updateField('additionalInfo', v)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.submitSection}>
          <Button
            title="Submit Booking"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />
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
  timeText: {
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: 6,
  },
  timeTextSelected: {
    color: colors.white,
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
});

export default BookingScreen;
