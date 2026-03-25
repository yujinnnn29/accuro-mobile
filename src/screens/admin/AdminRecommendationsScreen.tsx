import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  TrendingUp,
  Users,
  MousePointer,
  ShoppingCart,
  Eye,
  Calendar,
  BarChart2,
  RefreshCcw,
} from 'lucide-react-native';
import { colors } from '../../theme';
import { recommendationService } from '../../api';
import api from '../../api/api';

interface RecommendationStats {
  totalInteractions: number;
  uniqueUsers: number;
  topProducts: { productId: string; name?: string; count: number }[];
  interactionsByType: { type: string; count: number }[];
  interactionsByCategory: { category: string; count: number }[];
}

interface Interaction {
  _id: string;
  userId: string;
  productId: string;
  interactionType: string;
  createdAt: string;
  productName?: string;
}

const interactionColors: Record<string, string> = {
  view: colors.primary[500],
  booking: colors.success,
  inquiry: '#F59E0B',
  purchase: '#8B5CF6',
};

const interactionIcons: Record<string, any> = {
  view: Eye,
  booking: Calendar,
  inquiry: MousePointer,
  purchase: ShoppingCart,
};

export const AdminRecommendationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, interactionsRes] = await Promise.all([
        api.get('/recommendations/stats').catch(() => ({ data: null })),
        api.get('/recommendations/interactions?limit=20').catch(() => ({ data: null })),
      ]);

      if (statsRes.data) {
        setStats(statsRes.data.data || statsRes.data);
      }
      if (interactionsRes.data) {
        const data = interactionsRes.data.data || interactionsRes.data;
        setRecentInteractions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError('Failed to load recommendation data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const totalInteractions = stats?.totalInteractions ?? 0;
  const uniqueUsers = stats?.uniqueUsers ?? 0;
  const topProducts = stats?.topProducts ?? [];
  const byType = stats?.interactionsByType ?? [];
  const byCategory = stats?.interactionsByCategory?.slice(0, 6) ?? [];

  const maxCategoryCount = Math.max(...byCategory.map(c => c.count), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommendations Monitor</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <RefreshCcw size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading recommendation data...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.primary[600] }]}>
              <MousePointer size={22} color={colors.white} />
              <Text style={styles.statValue}>{totalInteractions.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Interactions</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#16A34A' }]}>
              <Users size={22} color={colors.white} />
              <Text style={styles.statValue}>{uniqueUsers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Unique Users</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#9333EA' }]}>
              <TrendingUp size={22} color={colors.white} />
              <Text style={styles.statValue}>{topProducts.length}</Text>
              <Text style={styles.statLabel}>Tracked Products</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#EA580C' }]}>
              <BarChart2 size={22} color={colors.white} />
              <Text style={styles.statValue}>{byType.length}</Text>
              <Text style={styles.statLabel}>Interaction Types</Text>
            </View>
          </View>

          {/* Interaction Types */}
          {byType.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interactions by Type</Text>
              <View style={styles.typeGrid}>
                {byType.map((item, i) => {
                  const Icon = interactionIcons[item.type] ?? Eye;
                  const color = interactionColors[item.type] ?? colors.gray[500];
                  const pct = totalInteractions > 0 ? Math.round((item.count / totalInteractions) * 100) : 0;
                  return (
                    <View key={i} style={styles.typeCard}>
                      <View style={[styles.typeIconWrap, { backgroundColor: color + '20' }]}>
                        <Icon size={18} color={color} />
                      </View>
                      <Text style={styles.typeValue}>{item.count}</Text>
                      <Text style={styles.typeLabel}>{item.type}</Text>
                      <Text style={[styles.typePct, { color }]}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* By Category (bar chart) */}
          {byCategory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Categories</Text>
              <View style={styles.barChartContainer}>
                {byCategory.map((item, i) => {
                  const barWidth = `${Math.round((item.count / maxCategoryCount) * 100)}%`;
                  return (
                    <View key={i} style={styles.barRow}>
                      <Text style={styles.barLabel} numberOfLines={1}>{item.category}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: barWidth as any }]} />
                      </View>
                      <Text style={styles.barValue}>{item.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Products by Engagement</Text>
              {topProducts.slice(0, 10).map((p, i) => (
                <View key={i} style={styles.productRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{i + 1}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>
                    {p.name || p.productId}
                  </Text>
                  <View style={styles.productCountBadge}>
                    <Text style={styles.productCountText}>{p.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recent Interactions */}
          {recentInteractions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Interactions</Text>
              {recentInteractions.map((interaction, i) => {
                const Icon = interactionIcons[interaction.interactionType] ?? Eye;
                const color = interactionColors[interaction.interactionType] ?? colors.gray[500];
                return (
                  <View key={i} style={styles.interactionRow}>
                    <View style={[styles.interactionIcon, { backgroundColor: color + '20' }]}>
                      <Icon size={14} color={color} />
                    </View>
                    <View style={styles.interactionContent}>
                      <Text style={styles.interactionProduct} numberOfLines={1}>
                        {interaction.productName || interaction.productId}
                      </Text>
                      <Text style={styles.interactionMeta}>
                        {interaction.interactionType} · {new Date(interaction.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {!stats && !error && (
            <View style={styles.emptyState}>
              <TrendingUp size={48} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>No Data Yet</Text>
              <Text style={styles.emptyText}>Recommendation interactions will appear here once users start browsing products.</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary[600], paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, flex: 1, textAlign: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.gray[500] },
  errorBanner: { margin: 16, backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12 },
  errorText: { fontSize: 14, color: '#DC2626' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard: {
    flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  statValue: { fontSize: 26, fontWeight: 'bold', color: colors.white, marginTop: 6 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: 10, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  typeIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  typeValue: { fontSize: 20, fontWeight: 'bold', color: colors.gray[900] },
  typeLabel: { fontSize: 12, color: colors.gray[500], textTransform: 'capitalize', marginTop: 2 },
  typePct: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  barChartContainer: { backgroundColor: colors.white, borderRadius: 12, padding: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 90, fontSize: 12, color: colors.gray[700], marginRight: 8 },
  barTrack: { flex: 1, height: 12, backgroundColor: colors.gray[100], borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary[500], borderRadius: 6 },
  barValue: { width: 32, fontSize: 12, color: colors.gray[700], textAlign: 'right', marginLeft: 6 },
  productRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: 10, padding: 12, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankText: { fontSize: 12, fontWeight: '700', color: colors.primary[700] },
  productName: { flex: 1, fontSize: 14, color: colors.gray[800], fontWeight: '500' },
  productCountBadge: { backgroundColor: colors.primary[50], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  productCountText: { fontSize: 13, fontWeight: '700', color: colors.primary[600] },
  interactionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  interactionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  interactionContent: { flex: 1 },
  interactionProduct: { fontSize: 14, fontWeight: '500', color: colors.gray[900] },
  interactionMeta: { fontSize: 12, color: colors.gray[500], marginTop: 2, textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.gray[700], marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.gray[500], textAlign: 'center', lineHeight: 20 },
});

export default AdminRecommendationsScreen;
