import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { X, Calendar as CalendarIcon, ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme';
import { DateRange, DateRangePreset, DATE_RANGE_PRESETS } from '../../types';
import { Button } from '../common';

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (range: DateRange, preset?: DateRangePreset) => void;
  selectedRange?: DateRange;
  selectedPreset?: DateRangePreset;
}

const getPresetDateRange = (preset: DateRangePreset): DateRange => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return { startDate: yesterdayStr, endDate: yesterdayStr };
    }
    case 'last7days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { startDate: start.toISOString().split('T')[0], endDate: today };
    }
    case 'last14days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 13);
      return { startDate: start.toISOString().split('T')[0], endDate: today };
    }
    case 'last30days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { startDate: start.toISOString().split('T')[0], endDate: today };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString().split('T')[0], endDate: today };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'thisQuarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      return { startDate: start.toISOString().split('T')[0], endDate: today };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString().split('T')[0], endDate: today };
    }
    default:
      return { startDate: today, endDate: today };
  }
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  visible,
  onClose,
  onSelect,
  selectedRange,
  selectedPreset,
}) => {
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');
  const [startDate, setStartDate] = useState<string | null>(selectedRange?.startDate || null);
  const [endDate, setEndDate] = useState<string | null>(selectedRange?.endDate || null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setMode('custom');
      return;
    }

    const range = getPresetDateRange(preset);
    onSelect(range, preset);
    onClose();
  };

  const handleDayPress = (day: { dateString: string }) => {
    if (!selectingEnd || !startDate) {
      setStartDate(day.dateString);
      setEndDate(null);
      setSelectingEnd(true);
    } else {
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
        setEndDate(startDate);
      } else {
        setEndDate(day.dateString);
      }
      setSelectingEnd(false);
    }
  };

  const handleConfirmCustomRange = () => {
    if (startDate && endDate) {
      onSelect({ startDate, endDate }, 'custom');
      onClose();
    }
  };

  const getMarkedDates = () => {
    const marked: Record<string, any> = {};

    if (startDate) {
      marked[startDate] = {
        startingDay: true,
        color: colors.primary[600],
        textColor: colors.white,
      };

      if (endDate) {
        marked[endDate] = {
          endingDay: true,
          color: colors.primary[600],
          textColor: colors.white,
        };

        // Mark dates in between
        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);
        current.setDate(current.getDate() + 1);

        while (current < end) {
          const dateStr = current.toISOString().split('T')[0];
          marked[dateStr] = {
            color: colors.primary[100],
            textColor: colors.primary[800],
          };
          current.setDate(current.getDate() + 1);
        }
      }
    }

    return marked;
  };

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>Select Date Range</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'presets' && styles.modeButtonActive]}
            onPress={() => setMode('presets')}
          >
            <Text
              style={[styles.modeButtonText, mode === 'presets' && styles.modeButtonTextActive]}
            >
              Presets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'custom' && styles.modeButtonActive]}
            onPress={() => setMode('custom')}
          >
            <Text
              style={[styles.modeButtonText, mode === 'custom' && styles.modeButtonTextActive]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'presets' ? (
          <ScrollView style={styles.content}>
            {DATE_RANGE_PRESETS.filter((p) => p.key !== 'custom').map((preset) => (
              <TouchableOpacity
                key={preset.key}
                style={[
                  styles.presetOption,
                  selectedPreset === preset.key && styles.presetOptionSelected,
                ]}
                onPress={() => handlePresetSelect(preset.key)}
              >
                <CalendarIcon
                  size={20}
                  color={selectedPreset === preset.key ? colors.primary[600] : colors.gray[500]}
                />
                <Text
                  style={[
                    styles.presetLabel,
                    selectedPreset === preset.key && styles.presetLabelSelected,
                  ]}
                >
                  {preset.label}
                </Text>
                <ChevronRight size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.content}>
            {/* Selected Range Display */}
            <View style={styles.selectedDisplay}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>
                  {startDate ? formatDisplayDate(startDate) : 'Select'}
                </Text>
              </View>
              <Text style={styles.dateSeparator}>to</Text>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>
                  {endDate ? formatDisplayDate(endDate) : 'Select'}
                </Text>
              </View>
            </View>

            <Text style={styles.calendarHint}>
              {selectingEnd ? 'Select end date' : 'Select start date'}
            </Text>

            <Calendar
              onDayPress={handleDayPress}
              markingType="period"
              markedDates={getMarkedDates()}
              maxDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: colors.white,
                calendarBackground: colors.white,
                textSectionTitleColor: colors.gray[500],
                selectedDayBackgroundColor: colors.primary[600],
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary[600],
                dayTextColor: colors.gray[900],
                textDisabledColor: colors.gray[300],
                arrowColor: colors.primary[600],
                monthTextColor: colors.gray[900],
                textMonthFontWeight: '600',
                textDayFontSize: 14,
                textMonthFontSize: 16,
              }}
            />
          </View>
        )}

        {mode === 'custom' && (
          <View style={styles.footer}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.footerButton}
            />
            <Button
              title="Apply"
              onPress={handleConfirmCustomRange}
              disabled={!startDate || !endDate}
              style={styles.footerButton}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  placeholder: {
    width: 32,
  },
  modeToggle: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary[600],
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  modeButtonTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.gray[50],
    gap: 12,
  },
  presetOptionSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  presetLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  presetLabelSelected: {
    color: colors.primary[700],
    fontWeight: '500',
  },
  selectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dateBox: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
  },
  dateSeparator: {
    fontSize: 14,
    color: colors.gray[400],
  },
  calendarHint: {
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});

export default DateRangePicker;
