import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { workerAPI } from '../../src/services/api';
import { formatCurrency, formatDate } from '../../src/utils/helpers';
import { theme } from '../../src/theme';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function MoreScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [earningsRes, invoicesRes, ratingsRes] = await Promise.all([
        workerAPI.getEarnings().catch(() => ({ data: null })),
        workerAPI.getInvoices().catch(() => ({ data: [] })),
        workerAPI.getProfile().catch(() => ({ data: null })),
      ]);
      setEarnings(earningsRes.data);
      setInvoices(invoicesRes.data || []);
      setRatings(ratingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Chargement..." />;
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
          <Text style={styles.title}>Plus</Text>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>TOTAL</Text>
              <Text style={styles.earningsValue}>{formatCurrency(earnings?.total || 0)}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>PAYÉ</Text>
              <Text style={[styles.earningsValue, styles.paidValue]}>
                {formatCurrency(earnings?.paid || 0)}
              </Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>EN ATTENTE</Text>
              <Text style={[styles.earningsValue, styles.pendingValue]}>
                {formatCurrency(earnings?.pending || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Card */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingIcon}>
            <Ionicons name="star" size={24} color="#F59E0B" />
          </View>
          <View style={styles.ratingInfo}>
            <Text style={styles.ratingLabel}>NOTE MOYENNE</Text>
            <Text style={styles.ratingValue}>{(ratings?.rating || user?.rating || 5.0).toFixed(1)} / 5</Text>
          </View>
          <Text style={styles.ratingSubtext}>Réputation</Text>
        </View>

        {/* Payment History */}
        {earnings?.details && earnings.details.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique des paiements</Text>
            <View style={styles.card}>
              {earnings.details.slice(0, 5).map((payment: any, index: number) => (
                <View
                  key={payment.shift_id + index}
                  style={[
                    styles.paymentRow,
                    index === Math.min(4, earnings.details.length - 1) && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>{payment.title || 'Mission'}</Text>
                    <Text style={styles.paymentHotel}>{payment.hotel_name}</Text>
                    <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={styles.paymentValue}>{formatCurrency(payment.earned)}</Text>
                    <Text style={styles.paymentHours}>{payment.duration}h</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Invoices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Factures ({invoices.length})</Text>
          {invoices.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>Aucune facture</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {invoices.slice(0, 5).map((invoice, index) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={[
                    styles.invoiceRow,
                    index === Math.min(4, invoices.length - 1) && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => invoice.url && Linking.openURL(invoice.url)}
                >
                  <View style={styles.invoiceIcon}>
                    <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceTitle}>{invoice.filename || 'Facture'}</Text>
                    <Text style={styles.invoiceDate}>{formatDate(invoice.created_at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/support')}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.successLight }]}>
                <Ionicons name="headset" size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.menuText}>Contacter le support</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('https://myshifters-web.netlify.app/cgu')}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.warningLight }]}>
                <Ionicons name="document-text" size={20} color={theme.colors.warning} />
              </View>
              <Text style={styles.menuText}>Conditions d'utilisation</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('https://myshifters-web.netlify.app/politique-de-confidentialite')}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.infoLight }]}>
                <Ionicons name="shield-checkmark" size={20} color={theme.colors.info} />
              </View>
              <Text style={styles.menuText}>Politique de confidentialité</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.errorLight }]}>
                <Ionicons name="log-out" size={20} color={theme.colors.error} />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>Déconnexion</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>MyShifters v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 MyShifters</Text>
        </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  earningsCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    ...theme.shadows.primary,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  earningsItem: {
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paidValue: {
    color: '#86EFAC',
  },
  pendingValue: {
    color: '#FCD34D',
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  ratingIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  ratingValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  ratingSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  paymentHotel: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.success,
  },
  paymentHours: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  invoiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  invoiceDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: theme.colors.error,
  },
  versionSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  copyrightText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },
});
