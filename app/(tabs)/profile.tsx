import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { workerAPI } from '../../src/services/api';
import { theme, SERVICE_TYPES } from '../../src/theme';
import LoadingScreen from '../../src/components/LoadingScreen';
import StatusBadge from '../../src/components/StatusBadge';

const TABS = [
  { id: 'personal', label: 'Infos', icon: 'person' },
  { id: 'experiences', label: 'Expériences', icon: 'briefcase' },
  { id: 'payment', label: 'Paiement', icon: 'card' },
  { id: 'documents', label: 'Documents', icon: 'document-text' },
];

export default function ProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [payoutAccount, setPayoutAccount] = useState<any>({});
  const [aeInfo, setAeInfo] = useState<any>({});

  const loadData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        workerAPI.getProfile(),
        workerAPI.getDocuments().catch(() => ({ data: [] })),
        workerAPI.getExperiences().catch(() => ({ data: [] })),
        workerAPI.getPayoutAccount().catch(() => ({ data: {} })),
        workerAPI.getBusiness().catch(() => ({ data: {} })),
      ]);
      
      if (results[0].status === 'fulfilled') setProfile(results[0].value.data);
      if (results[1].status === 'fulfilled') setDocuments(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setExperiences(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setPayoutAccount(results[3].value.data || {});
      if (results[4].status === 'fulfilled') setAeInfo(results[4].value.data || {});
    } catch (error) {
      console.error('Error loading profile:', error);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await workerAPI.updateProfile(profile);
      updateUser(profile);
      setEditMode(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    } finally {
      setSaving(false);
    }
  };

  const getCompletionPercent = () => {
    const steps = [
      !!profile?.phone && !!profile?.address,
      experiences.length > 0,
      !!payoutAccount?.iban,
      !!aeInfo?.siret,
    ];
    return Math.round((steps.filter(Boolean).length / steps.length) * 100);
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfile({ ...profile, avatar_url: result.assets[0].uri });
    }
  };

  if (loading) {
    return <LoadingScreen message="Chargement de votre profil..." />;
  }

  const completionPercent = getCompletionPercent();

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
            <Text style={styles.title}>Mon Profil</Text>
            <Text style={styles.subtitle}>Gérez vos informations et votre statut.</Text>
          </View>
          <View style={styles.completionCard}>
            <View style={styles.completionCircle}>
              <Text style={styles.completionPercent}>{completionPercent}%</Text>
            </View>
            <View>
              <Text style={styles.completionLabel}>COMPLÉTION</Text>
              <Text style={styles.completionStatus}>
                {completionPercent === 100 ? 'Complet' : 'À compléter'}
              </Text>
            </View>
          </View>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={editMode ? pickAvatar : undefined}>
            <View style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')}
                  </Text>
                </View>
              )}
              {editMode && (
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
          <StatusBadge status={profile.verification_status || 'pending'} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.id ? '#FFFFFF' : theme.colors.textSecondary}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Edit Button */}
        {activeTab === 'personal' && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => editMode ? handleSave() : setEditMode(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons name={editMode ? 'checkmark' : 'create-outline'} size={18} color={theme.colors.primary} />
                <Text style={styles.editButtonText}>{editMode ? 'Sauvegarder' : 'Modifier'}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <FieldRow
                label="Prénom"
                value={profile.first_name}
                editable={editMode}
                onChange={(v) => setProfile({ ...profile, first_name: v })}
              />
              <FieldRow
                label="Nom"
                value={profile.last_name}
                editable={editMode}
                onChange={(v) => setProfile({ ...profile, last_name: v })}
              />
              <FieldRow label="Email" value={profile.email} editable={false} />
              <FieldRow
                label="Téléphone"
                value={profile.phone}
                editable={editMode}
                onChange={(v) => setProfile({ ...profile, phone: v })}
                keyboardType="phone-pad"
              />
              <FieldRow
                label="Ville"
                value={profile.city}
                editable={editMode}
                onChange={(v) => setProfile({ ...profile, city: v })}
              />
              <FieldRow
                label="Code postal"
                value={profile.postal_code}
                editable={editMode}
                onChange={(v) => setProfile({ ...profile, postal_code: v })}
                keyboardType="numeric"
                isLast
              />
            </View>

            {/* Skills */}
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.skillsGrid}>
              {SERVICE_TYPES.map((skill) => {
                const isSelected = (profile.skills || []).includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[styles.skillChip, isSelected && styles.skillChipActive]}
                    onPress={() => {
                      if (!editMode) return;
                      const current = profile.skills || [];
                      const updated = isSelected
                        ? current.filter((s: string) => s !== skill.id)
                        : [...current, skill.id];
                      setProfile({ ...profile, skills: updated });
                    }}
                    disabled={!editMode}
                  >
                    <Ionicons
                      name={skill.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
                    />
                    <Text style={[styles.skillText, isSelected && styles.skillTextActive]}>
                      {skill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'experiences' && (
          <View style={styles.section}>
            {experiences.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="briefcase-outline" size={40} color={theme.colors.textLight} />
                <Text style={styles.emptyText}>Aucune expérience ajoutée</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {experiences.map((exp, index) => (
                  <View key={exp.id} style={[styles.expRow, index === experiences.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.expTitle}>{exp.title || exp.role_title || exp.position}</Text>
                    <Text style={styles.expCompany}>{exp.company || exp.hotel_name}</Text>
                    <Text style={styles.expPeriod}>
                      {exp.start_date} - {exp.end_date || 'Présent'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'payment' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.paymentRow}>
                <Ionicons name="card-outline" size={20} color={theme.colors.textMuted} />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>IBAN</Text>
                  <Text style={styles.paymentValue}>
                    {payoutAccount?.iban ? `****${payoutAccount.iban.slice(-4)}` : 'Non configuré'}
                  </Text>
                </View>
              </View>
              <View style={[styles.paymentRow, { borderBottomWidth: 0 }]}>
                <Ionicons name="business-outline" size={20} color={theme.colors.textMuted} />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>SIRET</Text>
                  <Text style={styles.paymentValue}>
                    {aeInfo?.siret || 'Non configuré'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'documents' && (
          <View style={styles.section}>
            {documents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={40} color={theme.colors.textLight} />
                <Text style={styles.emptyText}>Aucun document ajouté</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {documents.map((doc, index) => (
                  <View key={doc.id} style={[styles.docRow, index === documents.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.docIcon}>
                      <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docType}>{doc.type || 'Document'}</Text>
                      <StatusBadge status={doc.status} small />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldRow({
  label,
  value,
  editable,
  onChange,
  keyboardType = 'default',
  isLast = false,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange?: (v: string) => void;
  keyboardType?: any;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable && onChange ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          placeholderTextColor={theme.colors.textMuted}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || '-'}</Text>
      )}
    </View>
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
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
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
  completionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  completionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryBgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionPercent: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  completionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  completionStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: theme.colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabs: {
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primaryBgLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    marginTop: 16,
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
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  fieldLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  fieldInput: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: 8,
  },
  skillChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  skillTextActive: {
    color: '#FFFFFF',
  },
  expRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  expTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  expCompany: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  expPeriod: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  paymentInfo: {
    marginLeft: 16,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textTransform: 'capitalize',
  },
});
