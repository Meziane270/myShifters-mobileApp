import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { statsAPI, shiftsAPI, workerAPI } from '../../src/services/api';
import { formatCurrency } from '../../src/utils/helpers';
import { theme } from '../../src/theme';
import ShiftCard from '../../src/components/ShiftCard';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [recentShifts, setRecentShifts] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, earningsRes, shiftsRes] = await Promise.all([
        statsAPI.getWorkerStats().catch(() => ({ data: null })),
        workerAPI.getEarnings().catch(() => ({ data: null })),
        shiftsAPI.getAvailableShifts().catch(() => ({ data: [] })),
      ]);
      
      setStats(statsRes.data);
      setEarnings(earningsRes.data);
      setRecentShifts((shiftsRes.data || []).slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingScreen message="Préparation de votre espace..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, <Text style={styles.greetingName}>{user?.first_name || 'Shifter'}</Text> 👋</Text>
            <Text style={styles.subtitle}>Voici l'état de votre activité MyShifters.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/shifts')} style={styles.findButton}>
            <Text style={styles.findButtonText}>Trouver une mission</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryStatCard]}>
            <View style={styles.statIcon}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.statLabel}>GAINS TOTAUX</Text>
            <Text style={styles.statValue}>{formatCurrency(earnings?.total || 0)}</Text>
            <Text style={styles.statSubtext}>Revenus validés</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconSmall, { backgroundColor: theme.colors.primaryBg }]}>
              <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statLabelSmall}>CE MOIS-CI</Text>
            <Text style={styles.statValueSmall}>{formatCurrency(earnings?.monthly_earnings || 0)}</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconSmall, { backgroundColor: theme.colors.primaryBg }]}>
              <Ionicons name="briefcase" size={20} color={theme.colors.primaryLight} />
            </View>
            <Text style={styles.statLabelSmall}>MISSIONS</Text>
            <Text style={styles.statValueSmall}>{earnings?.completed_missions || stats?.completed || 0}</Text>
          </View>
          
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/more')}>
            <View style={[styles.statIconSmall, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statLabelSmall}>NOTE</Text>
            <Text style={styles.statValueSmall}>{(user?.rating || 5.0).toFixed(1)} / 5</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/shifts')}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryBgLight }]}>
                <Ionicons name="search" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionText}>Trouver une mission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/profile')}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.successLight }]}>
                <Ionicons name="person" size={24} color={theme.colors.success} />
              </View>
              <Text style={styles.actionText}>Mon profil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/support')}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.infoLight }]}>
                <Ionicons name="chatbubbles" size={24} color={theme.colors.info} />
              </View>
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/more')}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warningLight }]}>
                <Ionicons name="receipt" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.actionText}>Factures</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Card */}
        <TouchableOpacity style={styles.promoCard} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="trending-up" size={32} color="rgba(255,255,255,0.5)" style={styles.promoIcon} />
          <Text style={styles.promoTitle}>Boostez votre profil MyShifters</Text>
          <Text style={styles.promoText}>Complétez votre profil à 100% pour attirer plus d'établissements.</Text>
          <View style={styles.promoLink}>
            <Text style={styles.promoLinkText}>COMPLÉTER MON PROFIL</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Recent Shifts */}
        {recentShifts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Missions disponibles</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/shifts')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {recentShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onPress={() => router.push(`/(tabs)/shifts?shiftId=${shift.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  greetingName: {
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    ...theme.shadows.primary,
  },
  findButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  primaryStatCard: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
    width: '100%',
    flex: undefined,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  statLabelSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValueSmall: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  promoCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    padding: 28,
    marginBottom: 28,
    ...theme.shadows.primary,
  },
  promoIcon: {
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  promoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 20,
  },
  promoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoLinkText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
