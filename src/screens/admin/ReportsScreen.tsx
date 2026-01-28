import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  FileText,
  Users,
  Mail,
  Activity,
  Package,
  Star,
  Download,
  ChevronRight,
  Loader,
} from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';
import { reportService, bookingService, userService, quotationService } from '../../api';
import { colors } from '../../theme';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { DateRangePicker, ReportTable } from '../../components/admin';
import {
  ReportType,
  DateRange,
  ReportData,
  REPORT_TYPE_CONFIGS,
  DateRangePreset,
} from '../../types';

interface ReportTypeOption {
  type: ReportType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const reportTypeOptions: ReportTypeOption[] = [
  {
    type: 'bookings',
    label: 'Bookings',
    description: 'Booking records and status',
    icon: Calendar,
    color: colors.primary[600],
  },
  {
    type: 'users',
    label: 'Users',
    description: 'User registration data',
    icon: Users,
    color: colors.success,
  },
  {
    type: 'quotes',
    label: 'Quotations',
    description: 'Quote requests and approvals',
    icon: FileText,
    color: colors.info,
  },
  {
    type: 'contacts',
    label: 'Contacts',
    description: 'Contact form submissions',
    icon: Mail,
    color: colors.warning,
  },
  {
    type: 'activity',
    label: 'Activity Logs',
    description: 'System activity audit',
    icon: Activity,
    color: colors.error,
  },
  {
    type: 'products',
    label: 'Products',
    description: 'Product inventory status',
    icon: Package,
    color: colors.primary[500],
  },
  {
    type: 'reviews',
    label: 'Reviews',
    description: 'Customer reviews data',
    icon: Star,
    color: colors.warning,
  },
];

export const ReportsScreen: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last30days');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleSelectType = (type: ReportType) => {
    setSelectedType(type);
    setReportData(null);
  };

  const handleDateSelect = (range: DateRange, preset?: DateRangePreset) => {
    setDateRange(range);
    if (preset) setDatePreset(preset);
    setReportData(null);
  };

  const formatDateRange = () => {
    if (!dateRange) {
      // Set default date range
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return `${formatDate(start.toISOString().split('T')[0])} - ${formatDate(now.toISOString().split('T')[0])}`;
    }
    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const generateReport = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a report type');
      return;
    }

    setLoading(true);
    try {
      // Set default date range if not selected
      const range = dateRange || {
        startDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      };

      // Try to use the report service
      const response = await reportService.generateReport(selectedType, range).catch(() => null);

      if (response?.data?.data) {
        setReportData(response.data.data);
      } else {
        // Fallback: Generate mock report data based on type
        const mockData = await generateMockReportData(selectedType, range);
        setReportData(mockData);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockReportData = async (type: ReportType, range: DateRange): Promise<ReportData> => {
    const config = REPORT_TYPE_CONFIGS.find((c) => c.type === type);

    // Fetch real data based on type
    let rows: Record<string, any>[] = [];

    try {
      switch (type) {
        case 'bookings': {
          const res = await bookingService.getAll({
            startDate: range.startDate,
            endDate: range.endDate,
          });
          rows = (res.data || []).map((b: any) => ({
            date: b.date,
            company: b.company,
            product: b.product || 'N/A',
            status: b.status,
          }));
          break;
        }
        case 'users': {
          const res = await userService.getUsers();
          rows = (res.data || []).map((u: any) => ({
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
          }));
          break;
        }
        case 'quotes': {
          const res = await quotationService.getAllQuotations();
          rows = (res.data || []).map((q: any) => ({
            createdAt: q.createdAt,
            company: q.company || 'N/A',
            totalAmount: q.totalAmount || 0,
            status: q.status,
          }));
          break;
        }
        default:
          rows = [];
      }
    } catch (error) {
      console.error('Error fetching data for report:', error);
    }

    return {
      columns: config?.defaultColumns || [],
      rows,
      summary: {
        totalRecords: rows.length,
      },
    };
  };

  const handleExport = async () => {
    if (!reportData) return;

    setExporting(true);
    try {
      // Convert data to CSV format for sharing
      const headers = reportData.columns.map((c) => c.label).join(',');
      const rows = reportData.rows
        .map((row) =>
          reportData.columns.map((c) => {
            const val = row[c.key];
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
          }).join(',')
        )
        .join('\n');

      const csv = `${headers}\n${rows}`;

      await Share.share({
        message: csv,
        title: `${selectedType}_report.csv`,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const getSelectedTypeInfo = () => {
    return reportTypeOptions.find((o) => o.type === selectedType);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Report Type</Text>
          <View style={styles.typeGrid}>
            {reportTypeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedType === option.type;

              return (
                <TouchableOpacity
                  key={option.type}
                  style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                  onPress={() => handleSelectType(option.type)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: option.color + '20' },
                      isSelected && { backgroundColor: option.color },
                    ]}
                  >
                    <Icon size={20} color={isSelected ? colors.white : option.color} />
                  </View>
                  <Text
                    style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date Range Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.primary[600]} />
            <View style={styles.dateSelectorContent}>
              <Text style={styles.dateSelectorLabel}>{datePreset}</Text>
              <Text style={styles.dateSelectorValue}>{formatDateRange()}</Text>
            </View>
            <ChevronRight size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* Generate Button */}
        <View style={styles.section}>
          <Button
            title={loading ? 'Generating...' : 'Generate Report'}
            onPress={generateReport}
            loading={loading}
            disabled={!selectedType || loading}
            fullWidth
          />
        </View>

        {/* Report Preview */}
        {reportData && (
          <View style={styles.section}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.sectionTitle}>Report Preview</Text>
                <Text style={styles.previewSubtitle}>
                  {getSelectedTypeInfo()?.label} Report - {formatDateRange()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader size={18} color={colors.primary[600]} />
                ) : (
                  <Download size={18} color={colors.primary[600]} />
                )}
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
            </View>

            <ReportTable data={reportData} maxRows={20} />
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Date Range Picker Modal */}
      <DateRangePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
        selectedRange={dateRange || undefined}
        selectedPreset={datePreset}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[100],
  },
  typeCardSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[700],
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.primary[700],
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 12,
  },
  dateSelectorContent: {
    flex: 1,
  },
  dateSelectorLabel: {
    fontSize: 12,
    color: colors.gray[500],
    textTransform: 'capitalize',
  },
  dateSelectorValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
    marginTop: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previewSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[600],
  },
  bottomPadding: {
    height: 24,
  },
});

export default ReportsScreen;
