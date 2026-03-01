import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '../../src/store/authStore';
import { theme, SERVICE_TYPES } from '../../src/theme';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', phone: '',
    date_of_birth: '', address: '', city: '', postal_code: '',
    skills: [] as string[], is_auto_entrepreneur: false,
  });
  const [cvFile, setCvFile] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const updateField = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleSkill = (skillId: string) => {
    const updated = formData.skills.includes(skillId)
      ? formData.skills.filter((s) => s !== skillId)
      : [...formData.skills, skillId];
    updateField('skills', updated);
  };

  const validateStep1 = () => {
    const { email, password, confirmPassword, first_name, last_name, phone, date_of_birth, address, city, postal_code } = formData;
    if (!first_name.trim() || !last_name.trim()) { Alert.alert('Erreur', 'Veuillez renseigner votre prénom et nom'); return false; }
    if (!email.trim()) { Alert.alert('Erreur', 'Veuillez renseigner votre email'); return false; }
    if (!phone.trim()) { Alert.alert('Erreur', 'Veuillez renseigner votre téléphone'); return false; }
    if (!password.trim() || password.length < 6) { Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères'); return false; }
    if (password !== confirmPassword) { Alert.alert('Erreur', 'Les mots de passe ne correspondent pas'); return false; }
    if (!date_of_birth.trim()) { Alert.alert('Erreur', 'Veuillez renseigner votre date de naissance'); return false; }
    if (!address.trim() || !city.trim() || !postal_code.trim()) { Alert.alert('Erreur', 'Veuillez renseigner votre adresse complète'); return false; }
    return true;
  };

  const pickCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) setCvFile(result.assets[0]);
    } catch { Alert.alert('Erreur', 'Impossible de sélectionner le fichier'); }
  };

  const handleRegister = async () => {
    if (formData.skills.length === 0) { Alert.alert('Erreur', 'Veuillez sélectionner au moins une compétence'); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;
      await register(dataToSend);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || error.message || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  const skillEmoji: Record<string, string> = { reception: '🛎️', housekeeping: '🧹', maintenance: '🛠️', restaurant: '🍽️' };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            {step === 2 ? (
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </Link>
            )}
            <Image source={require('../../assets/images/logo.webp')} style={styles.logoSmall} resizeMode="contain" />
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
            </View>
            <Text style={styles.stepText}>Étape {step}/2 — {step === 1 ? 'Informations personnelles' : 'Compétences & statut'}</Text>
          </View>

          {/* STEP 1 */}
          {step === 1 && (
            <View style={styles.form}>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>Rejoignez la communauté MyShifters</Text>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput style={styles.input} placeholder="Prénom *" placeholderTextColor={theme.colors.textMuted} value={formData.first_name} onChangeText={(v) => updateField('first_name', v)} />
                </View>
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <TextInput style={styles.input} placeholder="Nom *" placeholderTextColor={theme.colors.textMuted} value={formData.last_name} onChangeText={(v) => updateField('last_name', v)} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email *" placeholderTextColor={theme.colors.textMuted} value={formData.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Téléphone * (ex: +33612345678)" placeholderTextColor={theme.colors.textMuted} value={formData.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Mot de passe * (min. 6 caractères)" placeholderTextColor={theme.colors.textMuted} value={formData.password} onChangeText={(v) => updateField('password', v)} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Confirmer le mot de passe *" placeholderTextColor={theme.colors.textMuted} value={formData.confirmPassword} onChangeText={(v) => updateField('confirmPassword', v)} secureTextEntry={!showConfirmPassword} />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Date de naissance * (JJ/MM/AAAA)" placeholderTextColor={theme.colors.textMuted} value={formData.date_of_birth} onChangeText={(v) => updateField('date_of_birth', v)} keyboardType="numeric" />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Adresse *" placeholderTextColor={theme.colors.textMuted} value={formData.address} onChangeText={(v) => updateField('address', v)} />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 2 }]}>
                  <TextInput style={styles.input} placeholder="Ville *" placeholderTextColor={theme.colors.textMuted} value={formData.city} onChangeText={(v) => updateField('city', v)} />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput style={styles.input} placeholder="Code postal *" placeholderTextColor={theme.colors.textMuted} value={formData.postal_code} onChangeText={(v) => updateField('postal_code', v)} keyboardType="numeric" />
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => validateStep1() && setStep(2)}>
                <Text style={styles.primaryButtonText}>Suivant</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.form}>
              <Text style={styles.title}>Mes compétences</Text>
              <Text style={styles.subtitle}>Sélectionnez au moins une compétence</Text>

              <View style={styles.skillsGrid}>
                {SERVICE_TYPES.map((skill) => {
                  const isSelected = formData.skills.includes(skill.id);
                  return (
                    <TouchableOpacity key={skill.id} style={[styles.skillCard, isSelected && styles.skillCardActive]} onPress={() => toggleSkill(skill.id)}>
                      <Text style={styles.skillEmoji}>{skillEmoji[skill.id] || '⭐'}</Text>
                      <Text style={[styles.skillLabel, isSelected && styles.skillLabelActive]}>{skill.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.aeCard}>
                <View style={styles.aeInfo}>
                  <Text style={styles.aeTitle}>Statut Auto-Entrepreneur</Text>
                  <Text style={styles.aeSubtitle}>Êtes-vous micro-entrepreneur (AE) ?</Text>
                </View>
                <Switch
                  value={formData.is_auto_entrepreneur}
                  onValueChange={(v) => updateField('is_auto_entrepreneur', v)}
                  trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primaryBg }}
                  thumbColor={formData.is_auto_entrepreneur ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>

              <TouchableOpacity style={styles.uploadButton} onPress={pickCV}>
                <View style={styles.uploadIcon}>
                  <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.uploadInfo}>
                  <Text style={styles.uploadTitle}>CV (PDF) — Optionnel</Text>
                  <Text style={styles.uploadSubtitle}>{cvFile ? cvFile.name : 'Appuyez pour sélectionner un PDF'}</Text>
                </View>
                {cvFile && <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                  <><Text style={styles.primaryButtonText}>Créer mon compte</Text><Ionicons name="checkmark" size={18} color="#FFFFFF" /></>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={styles.loginLink}>Se connecter</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.surfaceBorder },
  logoSmall: { width: 48, height: 48 },
  progressContainer: { marginBottom: 24 },
  progressBar: { height: 6, backgroundColor: theme.colors.surfaceBorder, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  stepText: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 0.5 },
  form: { backgroundColor: theme.colors.surface, borderRadius: 32, padding: 28, borderWidth: 1, borderColor: theme.colors.surfaceBorder, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 16, marginBottom: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.surfaceBorder },
  halfInput: { flex: 1 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 54, fontSize: 15, color: theme.colors.textPrimary },
  eyeButton: { padding: 4 },
  primaryButton: { backgroundColor: theme.colors.primary, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8, flexDirection: 'row', gap: 8, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  skillCard: { width: '47%', backgroundColor: theme.colors.background, borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: theme.colors.surfaceBorder },
  skillCardActive: { backgroundColor: theme.colors.primaryBgLight, borderColor: theme.colors.primary },
  skillEmoji: { fontSize: 32, marginBottom: 10 },
  skillLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, textAlign: 'center' },
  skillLabelActive: { color: theme.colors.primary },
  aeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.surfaceBorder, marginBottom: 14 },
  aeInfo: { flex: 1, marginRight: 12 },
  aeTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
  aeSubtitle: { fontSize: 12, color: theme.colors.textSecondary },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.colors.surfaceBorder, marginBottom: 20, gap: 14 },
  uploadIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.primaryBgLight, justifyContent: 'center', alignItems: 'center' },
  uploadInfo: { flex: 1 },
  uploadTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 2 },
  uploadSubtitle: { fontSize: 12, color: theme.colors.textSecondary },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  loginText: { fontSize: 14, color: theme.colors.textSecondary, marginRight: 4 },
  loginLink: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
});
