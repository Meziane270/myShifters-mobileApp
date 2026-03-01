import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shiftsAPI } from '../../src/services/api';
import { formatDate, formatCurrency } from '../../src/utils/helpers';
import { theme, SERVICE_TYPES, getServiceLabel } from '../../src/theme';
import ShiftCard from '../../src/components/ShiftCard';
import LoadingScreen from '../../src/components/LoadingScreen';
import EmptyState from '../../src/components/EmptyState';

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'applications'>('available');

  const loadData = useCallback(async () => {
    try {
      const [shiftsRes, appsRes] = await Promise.all([
        shiftsAPI.getAvailableShifts(selectedType || undefined),
        shiftsAPI.getMyApplications().catch(() => ({ data: [] })),
      ]);
      setShifts(shiftsRes.data || []);
      setApplications(appsRes.data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const isApplied = (shiftId: string) => {
    return applications.some((app) => app.shift_id === shiftId);
  };

  const handleApply = async () => {
    if (!selectedShift) return;
    
    setApplying(true);
    try {
      await shiftsAPI.applyToShift(selectedShift.id, message);
      Alert.alert('Succès', 'Votre candidature a été envoyée !');
      setModalVisible(false);
      setMessage('');
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Erreur lors de la candidature';
      Alert.alert('Erreur', errorMsg);
    } finally {
      setApplying(false);
    }
  };

  const openShiftDetails = (shift: any) => {
    setSelectedShift(shift);
    setModalVisible(true);
  };

  if (loading) {
    return <LoadingScreen message="Chargement des missions..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Missions</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'available' ? `${shifts.length} mission(s) disponible(s)` : `${applications.length} candidature(s)`}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Ionicons name="briefcase" size={18} color={activeTab === 'available' ? '#FFFFFF' : theme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>Disponibles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'applications' && styles.tabActive]}
          onPress={() => setActiveTab('applications')}
        >
          <Ionicons name="document-text" size={18} color={activeTab === 'applications' ? '#FFFFFF' : theme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>Candidatures</Text>
          {applications.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{applications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters - Only for available tab */}
      {activeTab === 'available' && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === '' && styles.filterChipActive]}
              onPress={() => setSelectedType('')}
            >
              <Text style={[styles.filterText, selectedType === '' && styles.filterTextActive]}>Tous</Text>
            </TouchableOpacity>
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.filterChip, selectedType === type.id && styles.filterChipActive]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text style={[styles.filterText, selectedType === type.id && styles.filterTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* List */}
      {activeTab === 'available' ? (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShiftCard
              shift={item}
              onPress={() => openShiftDetails(item)}
              applied={isApplied(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="Aucune mission disponible"
              message="Aucune mission ne correspond à vos critères pour le moment."
            />
          }
        />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.applicationCard}>
              <View style={styles.appHeader}>
                <View style={styles.appInfo}>
                  <Text style={styles.appTitle}>{item.shift_title || 'Mission'}</Text>
                  <Text style={styles.appHotel}>{item.hotel_name}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status).bg }
                ]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status).text }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.appDetails}>
                <View style={styles.appDetailRow}>
                  <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.appDetailText}>{formatDate(item.shift_date || item.created_at)}</Text>
                </View>
                {item.hourly_rate && (
                  <View style={styles.appDetailRow}>
                    <Ionicons name="cash-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.appDetailText}>{formatCurrency(item.hourly_rate)}/h</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="Aucune candidature"
              message="Vous n'avez pas encore postulé à une mission."
            />
          }
        />
      )}

      {/* Shift Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails de la mission</Text>
            <View style={{ width: 44 }} />
          </View>

          {selectedShift && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.shiftTitle}>{selectedShift.title}</Text>
              <Text style={styles.hotelName}>{selectedShift.hotel_name}</Text>

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.textMuted} />
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{getServiceLabel(selectedShift.service_type)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedShift.dates?.map((d: string) => formatDate(d)).join(', ')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.textMuted} />
                  <Text style={styles.detailLabel}>Horaires:</Text>
                  <Text style={styles.detailValue}>
                    {selectedShift.start_time} - {selectedShift.end_time}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color={theme.colors.textMuted} />
                  <Text style={styles.detailLabel}>Lieu:</Text>
                  <Text style={styles.detailValue}>{selectedShift.hotel_city || 'Non précisé'}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Ionicons name="cash-outline" size={20} color={theme.colors.textMuted} />
                  <Text style={styles.detailLabel}>Taux:</Text>
                  <Text style={[styles.detailValue, styles.rateValue]}>
                    {formatCurrency(selectedShift.hourly_rate)}/h
                  </Text>
                </View>
              </View>

              {selectedShift.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{selectedShift.description}</Text>
                </View>
              )}

              {!isApplied(selectedShift.id) ? (
                <View style={styles.applySection}>
                  <Text style={styles.sectionTitle}>Message (optionnel)</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Présentez-vous brièvement..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    style={[styles.applyButton, applying && styles.buttonDisabled]}
                    onPress={handleApply}
                    disabled={applying}
                  >
                    {applying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#FFFFFF" />
                        <Text style={styles.applyButtonText}>POSTULER</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.appliedBanner}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                  <Text style={styles.appliedText}>Vous avez déjà postulé à cette mission</Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: theme.colors.warningLight, text: theme.colors.warning },
    accepted: { bg: theme.colors.successLight, text: theme.colors.success },
    rejected: { bg: theme.colors.errorLight, text: theme.colors.error },
    completed: { bg: theme.colors.infoLight, text: theme.colors.info },
  };
  return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    completed: 'Terminée',
  };
  return labels[status] || status;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  filtersContainer: {
    paddingBottom: 12,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  applicationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appInfo: {
    flex: 1,
    marginRight: 12,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  appHotel: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  appDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appDetailText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  shiftTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  hotelName: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    width: 70,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rateValue: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  applySection: {
    marginBottom: 40,
  },
  messageInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: theme.colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  applyButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...theme.shadows.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 40,
  },
  appliedText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
    flex: 1,
  },
});
