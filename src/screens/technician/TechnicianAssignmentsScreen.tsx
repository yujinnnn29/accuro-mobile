import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  PanResponder,
  Image,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Package,
  Play,
  ClipboardList,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  FileText,
  Paperclip,
  X,
  ChevronRight,
} from 'lucide-react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TechnicianDrawerParamList } from '../../navigation/types';
import { bookingService } from '../../api/bookingService';
import { Booking } from '../../types';
import { useTheme } from '../../contexts';

const CACHE_KEY = 'technician_assignments_cache';
import { colors } from '../../theme';

type FilterTab = 'today' | 'upcoming' | 'pending_completion' | 'pending_review' | 'completed' | 'all';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending_completion', label: 'Pending' },
  { key: 'pending_review', label: 'In Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  confirmed:      { bg: '#dbeafe', text: '#1d4ed8', label: 'Confirmed' },
  in_progress:    { bg: '#fef9c3', text: '#b45309', label: 'In Progress' },
  pending_review: { bg: '#ede9fe', text: '#7c3aed', label: 'Pending Review' },
  completed:      { bg: '#dcfce7', text: '#15803d', label: 'Completed' },
  cancelled:      { bg: '#fee2e2', text: '#dc2626', label: 'Cancelled' },
  pending:        { bg: '#f3f4f6', text: '#374151', label: 'Pending' },
};

const EMPTY_MESSAGES: Record<FilterTab, { title: string; subtitle: string }> = {
  today:              { title: 'No assignments for today', subtitle: 'Check your upcoming assignments' },
  upcoming:           { title: 'No upcoming assignments', subtitle: 'No scheduled assignments this week' },
  pending_completion: { title: 'No pending assignments', subtitle: 'All assignments are up to date' },
  pending_review:     { title: 'No reports pending review', subtitle: 'All submitted reports have been reviewed' },
  completed:          { title: 'No completed assignments', subtitle: 'Completed assignments will appear here' },
  all:                { title: 'No assignments found', subtitle: 'You have not been assigned any bookings yet' },
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface ServiceReport {
  workPerformed: string;
  equipmentUsed: string;
  issuesFound: string;
  recommendations: string;
}

interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface SignatureInfo {
  paths: { x: number; y: number }[][];
  signedBy: string;
}

interface CompletionReportData {
  serviceReport: ServiceReport;
  attachments: AttachmentFile[];
  signature: SignatureInfo;
}

interface CompletionReportModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSubmit: (data: CompletionReportData) => void;
  submitting: boolean;
}

// ─── Signature Pad ───────────────────────────────────────────────────────────

const SignaturePad: React.FC<{
  paths: { x: number; y: number }[][];
  onPathsChange: (paths: { x: number; y: number }[][]) => void;
}> = ({ paths, onPathsChange }) => {
  const pathsRef = useRef(paths);
  const onChangeRef = useRef(onPathsChange);
  const currentPath = useRef<{ x: number; y: number }[]>([]);
  const [size, setSize] = useState({ width: 300, height: 150 });

  useEffect(() => { pathsRef.current = paths; }, [paths]);
  useEffect(() => { onChangeRef.current = onPathsChange; }, [onPathsChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = [{ x: locationX, y: locationY }];
        onChangeRef.current([...pathsRef.current, [...currentPath.current]]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current.push({ x: locationX, y: locationY });
        onChangeRef.current([...pathsRef.current.slice(0, -1), [...currentPath.current]]);
      },
    })
  ).current;

  const buildPathD = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    return `M${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L${p.x} ${p.y}`).join(' ');
  };

  return (
    <View
      style={sigStyles.canvas}
      onLayout={e => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      {...panResponder.panHandlers}
    >
      <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
        {paths.map((path, i) => {
          const d = buildPathD(path);
          return d ? (
            <SvgPath key={i} d={d} stroke="#1e293b" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null;
        })}
      </Svg>
      {paths.length === 0 && (
        <Text style={sigStyles.placeholder}>Sign here...</Text>
      )}
    </View>
  );
};

// ─── Completion Report Modal (4-step) ────────────────────────────────────────

const STEP_LABELS = ['Service\nReport', 'Attachments', 'Signature', 'Review &\nSubmit'];

const CompletionReportModal: React.FC<CompletionReportModalProps> = ({
  visible, booking, onClose, onSubmit, submitting,
}) => {
  const [step, setStep] = useState(0);
  const [serviceReport, setServiceReport] = useState<ServiceReport>({
    workPerformed: '', equipmentUsed: '', issuesFound: '', recommendations: '',
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [sigPaths, setSigPaths] = useState<{ x: number; y: number }[][]>([]);
  const [signedBy, setSignedBy] = useState('');

  useEffect(() => {
    if (visible) {
      setStep(0);
      setServiceReport({ workPerformed: '', equipmentUsed: '', issuesFound: '', recommendations: '' });
      setAttachments([]);
      setSigPaths([]);
      setSignedBy('');
    }
  }, [visible]);

  const handleNext = () => {
    if (step === 0 && !serviceReport.workPerformed.trim()) {
      Alert.alert('Required', 'Please describe the work performed.');
      return;
    }
    setStep(s => s + 1);
  };

  const handlePickImage = () => {
    if (attachments.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 attachments allowed.');
      return;
    }
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, selectionLimit: 5 - attachments.length },
      (response) => {
        if (response.assets) {
          const newFiles: AttachmentFile[] = response.assets.map(asset => ({
            uri: asset.uri!,
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize || 0,
          }));
          setAttachments(prev => [...prev, ...newFiles].slice(0, 5));
        }
      }
    );
  };

  const handleSubmit = () => {
    onSubmit({ serviceReport, attachments, signature: { paths: sigPaths, signedBy } });
  };

  // Step indicator
  const renderStepIndicator = () => (
    <View style={mStyles.stepRow}>
      {STEP_LABELS.map((label, i) => (
        <React.Fragment key={i}>
          <View style={mStyles.stepItem}>
            <View style={[
              mStyles.stepCircle,
              i <= step && mStyles.stepCircleActive,
              i < step && mStyles.stepCircleDone,
            ]}>
              {i < step
                ? <CheckCircle size={13} color="#fff" />
                : <Text style={[mStyles.stepNum, i <= step && mStyles.stepNumActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[mStyles.stepLabel, i === step && mStyles.stepLabelActive]} numberOfLines={2}>
              {label}
            </Text>
          </View>
          {i < STEP_LABELS.length - 1 && (
            <View style={[mStyles.stepLine, i < step && mStyles.stepLineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // Step 1: Service Report
  const renderStep0 = () => (
    <ScrollView style={mStyles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={mStyles.label}>Work Performed <Text style={mStyles.required}>*</Text></Text>
      <TextInput
        style={[mStyles.input, mStyles.textarea]}
        value={serviceReport.workPerformed}
        onChangeText={t => setServiceReport(r => ({ ...r, workPerformed: t }))}
        placeholder="Describe the work performed..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
      />
      <Text style={mStyles.label}>Equipment Used</Text>
      <TextInput
        style={[mStyles.input, mStyles.textarea]}
        value={serviceReport.equipmentUsed}
        onChangeText={t => setServiceReport(r => ({ ...r, equipmentUsed: t }))}
        placeholder="List equipment used..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={3}
      />
      <Text style={mStyles.label}>Issues Found</Text>
      <TextInput
        style={[mStyles.input, mStyles.textarea]}
        value={serviceReport.issuesFound}
        onChangeText={t => setServiceReport(r => ({ ...r, issuesFound: t }))}
        placeholder="Any issues found..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={3}
      />
      <Text style={mStyles.label}>Recommendations</Text>
      <TextInput
        style={[mStyles.input, mStyles.textarea]}
        value={serviceReport.recommendations}
        onChangeText={t => setServiceReport(r => ({ ...r, recommendations: t }))}
        placeholder="Recommendations for follow-up..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={3}
      />
    </ScrollView>
  );

  // Step 2: Attachments
  const renderStep1 = () => (
    <ScrollView style={mStyles.scroll}>
      <TouchableOpacity style={mStyles.uploadBtn} onPress={handlePickImage}>
        <Paperclip size={18} color="#2563eb" />
        <Text style={mStyles.uploadBtnText}>Add Photos</Text>
        <Text style={mStyles.uploadLimit}>{attachments.length}/5</Text>
      </TouchableOpacity>
      <Text style={mStyles.uploadHint}>Max 5 photos · Optional</Text>
      {attachments.map((file, i) => (
        <View key={i} style={mStyles.attachItem}>
          <Image source={{ uri: file.uri }} style={mStyles.attachThumb} />
          <Text style={mStyles.attachName} numberOfLines={1}>{file.name}</Text>
          <TouchableOpacity onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} style={mStyles.attachRemove}>
            <X size={14} color="#dc2626" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  // Step 3: Signature
  const renderStep2 = () => (
    <ScrollView style={mStyles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={mStyles.label}>Signed By</Text>
      <TextInput
        style={mStyles.input}
        value={signedBy}
        onChangeText={setSignedBy}
        placeholder="Customer name (optional)..."
        placeholderTextColor="#9ca3af"
      />
      <View style={mStyles.sigHeader}>
        <Text style={mStyles.label}>Signature <Text style={mStyles.optionalLabel}>(optional)</Text></Text>
        {sigPaths.length > 0 && (
          <TouchableOpacity onPress={() => setSigPaths([])}>
            <Text style={mStyles.clearSig}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <SignaturePad paths={sigPaths} onPathsChange={setSigPaths} />
    </ScrollView>
  );

  // Step 4: Review & Submit
  const renderStep3 = () => (
    <ScrollView style={mStyles.scroll}>
      {booking && (
        <View style={mStyles.reviewSection}>
          <Text style={mStyles.reviewSectionTitle}>Booking Info</Text>
          <Text style={mStyles.reviewItem}><Text style={mStyles.reviewKey}>Company: </Text>{booking.company}</Text>
          <Text style={mStyles.reviewItem}><Text style={mStyles.reviewKey}>Contact: </Text>{booking.contactName}</Text>
          <Text style={mStyles.reviewItem}>
            <Text style={mStyles.reviewKey}>Date: </Text>
            {formatDate(booking.date)} at {formatTime(booking.time)}
          </Text>
        </View>
      )}
      <View style={mStyles.reviewSection}>
        <Text style={mStyles.reviewSectionTitle}>Service Report</Text>
        <Text style={mStyles.reviewItem}>
          <Text style={mStyles.reviewKey}>Work Performed: </Text>
          {serviceReport.workPerformed || '—'}
        </Text>
        {!!serviceReport.equipmentUsed && (
          <Text style={mStyles.reviewItem}>
            <Text style={mStyles.reviewKey}>Equipment Used: </Text>
            {serviceReport.equipmentUsed}
          </Text>
        )}
        {!!serviceReport.issuesFound && (
          <Text style={mStyles.reviewItem}>
            <Text style={mStyles.reviewKey}>Issues Found: </Text>
            {serviceReport.issuesFound}
          </Text>
        )}
        {!!serviceReport.recommendations && (
          <Text style={mStyles.reviewItem}>
            <Text style={mStyles.reviewKey}>Recommendations: </Text>
            {serviceReport.recommendations}
          </Text>
        )}
      </View>
      <View style={mStyles.reviewSection}>
        <Text style={mStyles.reviewSectionTitle}>Attachments</Text>
        <Text style={mStyles.reviewItem}>
          {attachments.length > 0 ? `${attachments.length} photo(s) attached` : 'No attachments'}
        </Text>
      </View>
      <View style={mStyles.reviewSection}>
        <Text style={mStyles.reviewSectionTitle}>Signature</Text>
        <Text style={mStyles.reviewItem}>
          {sigPaths.length > 0
            ? `Signature captured${signedBy ? ` — signed by ${signedBy}` : ''}`
            : 'No signature captured'}
        </Text>
      </View>
    </ScrollView>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={mStyles.overlay}>
        <View style={mStyles.container}>
          <Text style={mStyles.title}>Completion Report</Text>
          {booking && (
            <Text style={mStyles.subtitle}>{booking.company} — {booking.contactName}</Text>
          )}

          {renderStepIndicator()}

          {stepContent[step]()}

          <View style={mStyles.navRow}>
            <TouchableOpacity
              style={mStyles.cancelBtn}
              onPress={step === 0 ? onClose : () => setStep(s => s - 1)}
              disabled={submitting}
            >
              <Text style={mStyles.cancelBtnText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
            </TouchableOpacity>
            {step < 3 ? (
              <TouchableOpacity style={mStyles.nextBtn} onPress={handleNext}>
                <Text style={mStyles.nextBtnText}>Next</Text>
                <ChevronRight size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={mStyles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                <Send size={14} color="#fff" />
                <Text style={mStyles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const TechnicianAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TechnicianDrawerParamList, 'TechnicianAssignments'>>();
  const submitBookingId = route.params?.submitBookingId;
  const { theme } = useTheme();

  const [assignments, setAssignments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [reportModalBooking, setReportModalBooking] = useState<Booking | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await bookingService.getMyAssignments();
      const data = response.data || [];
      setAssignments(data);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then(cached => {
      if (cached) {
        setAssignments(JSON.parse(cached));
        setLoading(false);
      }
    }).catch(() => {});
    fetchAssignments();
    const unsubscribe = (navigation as any).addListener('focus', () => {
      fetchAssignments();
    });
    return unsubscribe;
  }, [fetchAssignments, navigation]);

  useEffect(() => {
    if (submitBookingId && assignments.length > 0) {
      const booking = assignments.find(a => a._id === submitBookingId);
      if (booking && booking.status === 'in_progress') {
        setReportModalBooking(booking);
        setActiveTab('pending_completion');
      }
    }
  }, [submitBookingId, assignments]);

  const handleRefresh = () => { setRefreshing(true); fetchAssignments(); };

  const handleStartBooking = async (id: string) => {
    try {
      setActionLoading(id);
      await bookingService.startBooking(id);
      setShowSuccessModal(true);
      fetchAssignments();
    } catch (error: any) {
      const msg: string = error.response?.data?.message || '';
      if (msg.toLowerCase().includes('in_progress') || msg.toLowerCase().includes('already')) {
        fetchAssignments();
      } else {
        Alert.alert('Error', msg || 'Failed to start meeting');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReport = async (data: CompletionReportData) => {
    if (!reportModalBooking) return;
    try {
      setSubmittingReport(true);
      const api = (await import('../../api/api')).default;

      // Build signature data URL from drawn paths if present
      let signatureData: string | undefined;
      if (data.signature.paths.length > 0) {
        const svgPaths = data.signature.paths
          .map(path => {
            if (path.length < 2) return '';
            const d = `M${path[0].x} ${path[0].y} ` + path.slice(1).map(p => `L${p.x} ${p.y}`).join(' ');
            return `<path d="${d}" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
          })
          .filter(Boolean)
          .join('');
        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" style="background:white">${svgPaths}</svg>`;
        // encode SVG as base64 — btoa is available as a global in React Native's Hermes/JSC
        signatureData = `data:image/svg+xml;base64,${(globalThis as any).btoa(svgStr)}`;
      }

      if (data.attachments.length > 0) {
        const formData = new FormData();
        formData.append('bookingId', reportModalBooking._id);
        formData.append('serviceReport', JSON.stringify(data.serviceReport));
        if (signatureData) {
          formData.append('signatureData', signatureData);
          formData.append('signedBy', data.signature.signedBy);
        }
        data.attachments.forEach(file => {
          (formData as any).append('attachments', { uri: file.uri, name: file.name, type: file.type });
        });
        await api.post('/completion-proofs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          adapter: 'xhr',
        });
      } else {
        const body: any = {
          bookingId: reportModalBooking._id,
          serviceReport: data.serviceReport,
        };
        if (signatureData) {
          body.signatureData = signatureData;
          body.signedBy = data.signature.signedBy;
        }
        await api.post('/completion-proofs', body, { adapter: 'xhr' });
      }

      Alert.alert('Success', 'Completion report submitted successfully');
      setReportModalBooking(null);
      fetchAssignments();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };
  const isUpcoming = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d > today;
  };

  const filteredAssignments = assignments.filter(a => {
    switch (activeTab) {
      case 'today':              return isToday(a.date);
      case 'upcoming':           return isUpcoming(a.date) && ['confirmed', 'in_progress'].includes(a.status);
      case 'pending_completion': return a.status === 'confirmed' || a.status === 'in_progress';
      case 'pending_review':     return a.status === 'pending_review';
      case 'completed':          return a.status === 'completed';
      default:                   return true;
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todayCount = assignments.filter(a => isToday(a.date)).length;
  const upcomingCount = assignments.filter(a => isUpcoming(a.date) && ['confirmed', 'in_progress'].includes(a.status)).length;
  const pendingCount = assignments.filter(a => a.status === 'confirmed' || a.status === 'in_progress').length;
  const reviewCount = assignments.filter(a => a.status === 'pending_review').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const allCount = assignments.length;

  const TAB_BADGE_COLORS: Record<string, string> = {
    today: '#2563eb',
    upcoming: '#0891b2',
    pending_completion: '#f97316',
    pending_review: '#7c3aed',
    completed: '#15803d',
    all: '#6b7280',
  };

  const getTabCount = (key: string): number => {
    switch (key) {
      case 'today': return todayCount;
      case 'upcoming': return upcomingCount;
      case 'pending_completion': return pendingCount;
      case 'pending_review': return reviewCount;
      case 'completed': return completedCount;
      case 'all': return allCount;
      default: return 0;
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = STATUS_COLORS[status] || { bg: colors.gray[100], text: colors.gray[600], label: status };
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerSub}>Manage your bookings and service reports</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loading || refreshing}
            style={styles.refreshBtn}
          >
            <RefreshCw size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]} contentContainerStyle={styles.tabsContent}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, { backgroundColor: theme.background, borderColor: theme.border }, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
            {getTabCount(tab.key) > 0 && (
              <View style={[
                styles.tabBadge,
                { backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.3)' : TAB_BADGE_COLORS[tab.key] },
              ]}>
                <Text style={styles.tabBadgeText}>{getTabCount(tab.key)}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Assignments List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading assignments...</Text>
        ) : filteredAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.gray[300]} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>{EMPTY_MESSAGES[activeTab].title}</Text>
            <Text style={[styles.emptySub, { color: colors.gray[400] }]}>{EMPTY_MESSAGES[activeTab].subtitle}</Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {filteredAssignments.map(booking => {
              const isExpanded = expandedBooking === booking._id;
              return (
                <View key={booking._id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {/* Card Top */}
                  <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardName, { color: theme.text }]}>{booking.contactName}</Text>
                        {renderStatusBadge(booking.status)}
                      </View>
                      <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                        {formatDate(booking.date)} at {formatTime(booking.time)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setExpandedBooking(isExpanded ? null : booking._id)}
                      style={styles.expandBtn}
                    >
                      {isExpanded
                        ? <ChevronUp size={18} color={theme.textSecondary} />
                        : <ChevronDown size={18} color={theme.textSecondary} />
                      }
                    </TouchableOpacity>
                  </View>

                  {/* Quick Details */}
                  <View style={styles.quickDetails}>
                    {!!booking.company && <View style={styles.detailItem}><Building size={12} color={colors.gray[400]} /><Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>{booking.company}</Text></View>}
                    {!!booking.location && <View style={styles.detailItem}><MapPin size={12} color={colors.gray[400]} /><Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>{booking.location}</Text></View>}
                    {!!booking.product && <View style={styles.detailItem}><Package size={12} color={colors.gray[400]} /><Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>{booking.product}</Text></View>}
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={[styles.expandedDetails, { borderTopColor: theme.border }]}>
                      <View style={styles.expandedItem}>
                        <FileText size={12} color={colors.gray[400]} />
                        <Text style={[styles.expandedLabel, { color: theme.text }]}>Purpose: </Text>
                        <Text style={[styles.expandedValue, { color: theme.textSecondary }]}>{booking.purpose}</Text>
                      </View>
                      {booking.additionalInfo ? (
                        <View style={styles.expandedItem}>
                          <Info size={12} color={colors.gray[400]} />
                          <Text style={[styles.expandedLabel, { color: theme.text }]}>Notes: </Text>
                          <Text style={[styles.expandedValue, { color: theme.textSecondary }]}>{booking.additionalInfo}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actions}>
                    {booking.status === 'confirmed' && (
                      <TouchableOpacity
                        style={[styles.btn, styles.startBtn]}
                        onPress={() => handleStartBooking(booking._id)}
                        disabled={actionLoading === booking._id}
                      >
                        <Play size={13} color="#fff" />
                        <Text style={styles.btnText}>{actionLoading === booking._id ? 'Starting...' : 'Start Meeting'}</Text>
                      </TouchableOpacity>
                    )}
                    {booking.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.btn, styles.submitBtn]}
                        onPress={() => setReportModalBooking(booking)}
                      >
                        <ClipboardList size={13} color="#fff" />
                        <Text style={styles.btnText}>Submit Report</Text>
                      </TouchableOpacity>
                    )}
                    {booking.status === 'pending_review' && (
                      <View style={[styles.btn, styles.reviewingBtn]}>
                        <Clock size={13} color="#7c3aed" />
                        <Text style={[styles.btnText, { color: '#7c3aed' }]}>Awaiting Review</Text>
                      </View>
                    )}
                    {booking.status === 'completed' && (
                      <View style={[styles.btn, styles.completedBtn]}>
                        <CheckCircle size={13} color="#15803d" />
                        <Text style={[styles.btnText, { color: '#15803d' }]}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Meeting Started Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={[styles.successModal, { backgroundColor: theme.surface }]}>
            <View style={styles.successIconWrap}>
              <CheckCircle size={48} color="#059669" />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Meeting Started!</Text>
            <Text style={[styles.successMessage, { color: theme.textSecondary }]}>
              The meeting is now in progress. Submit a report once you're done.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completion Report Modal */}
      <CompletionReportModal
        visible={!!reportModalBooking}
        booking={reportModalBooking}
        onClose={() => setReportModalBooking(null)}
        onSubmit={handleSubmitReport}
        submitting={submittingReport}
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: '#001F3F',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refreshBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  headerSub: { color: '#93c5fd', fontSize: 13, flex: 1 },
  tabsContainer: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 4,
  },
  activeTab: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  tabText: { fontSize: 12, fontWeight: '500', color: colors.gray[600] },
  activeTabText: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successModal: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  successMessage: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  list: { flex: 1 },
  listContent: { padding: 14, gap: 10 },
  loadingText: { textAlign: 'center', color: colors.gray[400], padding: 40 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[500], marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.gray[400], marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardTopLeft: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  cardDate: { fontSize: 12, color: colors.gray[500] },
  expandBtn: { padding: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  quickDetails: { flexDirection: 'column', gap: 4, marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: colors.gray[600], flex: 1, flexShrink: 1 },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 10,
    marginBottom: 10,
    gap: 6,
  },
  expandedItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  expandedLabel: { fontSize: 12, fontWeight: '600', color: colors.gray[700] },
  expandedValue: { fontSize: 12, color: colors.gray[600], flex: 1 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  startBtn: { backgroundColor: '#2563eb' },
  submitBtn: { backgroundColor: '#059669' },
  reviewingBtn: { backgroundColor: '#ede9fe', borderWidth: 1, borderColor: '#c4b5fd' },
  completedBtn: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  btnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 2 },
  subtitle: { fontSize: 13, color: colors.gray[500], marginBottom: 12 },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  stepItem: { alignItems: 'center', width: 56 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: colors.primary[600] },
  stepCircleDone: { backgroundColor: '#059669' },
  stepNum: { fontSize: 12, fontWeight: '700', color: colors.gray[500] },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 9, color: colors.gray[400], textAlign: 'center', lineHeight: 12 },
  stepLabelActive: { color: colors.primary[600], fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.gray[200], marginTop: 13 },
  stepLineDone: { backgroundColor: '#059669' },

  scroll: { maxHeight: 380 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 6, marginTop: 12 },
  required: { color: '#dc2626' },
  optionalLabel: { fontSize: 11, fontWeight: '400', color: colors.gray[400] },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.gray[900],
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  // Attachments
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    justifyContent: 'center',
  },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: '#2563eb', flex: 1, textAlign: 'center' },
  uploadLimit: { fontSize: 12, color: colors.gray[400] },
  uploadHint: { fontSize: 11, color: colors.gray[400], textAlign: 'center', marginTop: 6 },
  attachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginTop: 8,
  },
  attachThumb: { width: 40, height: 40, borderRadius: 6 },
  attachName: { flex: 1, fontSize: 12, color: colors.gray[700] },
  attachRemove: { padding: 4 },

  // Signature
  sigHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearSig: { fontSize: 13, color: '#dc2626', fontWeight: '500', marginTop: 12 },

  // Review
  reviewSection: {
    marginBottom: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  reviewSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewItem: { fontSize: 13, color: colors.gray[700], marginBottom: 3, lineHeight: 18 },
  reviewKey: { fontWeight: '600', color: colors.gray[800] },

  // Navigation
  navRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
  },
  nextBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

const sigStyles = StyleSheet.create({
  canvas: {
    height: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    position: 'absolute',
    color: colors.gray[400],
    fontSize: 13,
  },
});

export default TechnicianAssignmentsScreen;
