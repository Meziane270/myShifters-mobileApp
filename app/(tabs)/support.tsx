import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supportAPI } from '../../src/services/api';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import LoadingScreen from '../../src/components/LoadingScreen';
import EmptyState from '../../src/components/EmptyState';

export default function SupportScreen() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadThreads = useCallback(async () => {
    try {
      const response = await supportAPI.getThreads();
      setThreads(response.data || []);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadThreads();
  }, [loadThreads]);

  const loadMessages = async (thread: any) => {
    setLoadingMessages(true);
    setSelectedThread(thread);
    setShowNewTicket(false);
    try {
      const response = await supportAPI.getThreadMessages(thread.id);
      setMessages(response.data || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setSending(true);
    try {
      await supportAPI.createThread(newSubject.trim(), newMessage.trim());
      Alert.alert('Succès', 'Ticket créé avec succès');
      setNewSubject('');
      setNewMessage('');
      setShowNewTicket(false);
      loadThreads();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le ticket');
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedThread) return;

    setSending(true);
    try {
      await supportAPI.sendMessage(selectedThread.id, reply.trim());
      setReply('');
      const response = await supportAPI.getThreadMessages(selectedThread.id);
      setMessages(response.data || []);
      loadThreads();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Connexion au support..." />;
  }

  // Thread list view
  if (!selectedThread && !showNewTicket) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Support</Text>
            <Text style={styles.subtitle}>Une question ? Notre équipe est là pour vous aider.</Text>
          </View>
          <TouchableOpacity style={styles.newButton} onPress={() => setShowNewTicket(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newButtonText}>Nouvelle demande</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.threadCard}
              onPress={() => loadMessages(item)}
            >
              <View style={styles.threadHeader}>
                <Text style={styles.threadDate}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.status === 'closed' ? '#F3F4F6' : theme.colors.successLight }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: item.status === 'closed' ? '#6B7280' : theme.colors.success }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: item.status === 'closed' ? '#6B7280' : theme.colors.success }
                  ]}>
                    {item.status === 'closed' ? 'FERMÉ' : 'OUVERT'}
                  </Text>
                </View>
              </View>
              <Text style={styles.threadSubject} numberOfLines={2}>{item.subject}</Text>
              <View style={styles.threadFooter}>
                <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textMuted} />
                <Text style={styles.threadFooterText}>Voir la conversation</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="Aucune conversation"
              message="Créez une nouvelle demande pour discuter avec notre équipe de support."
            />
          }
        />
      </SafeAreaView>
    );
  }

  // New ticket form
  if (showNewTicket) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowNewTicket(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatTitle}>Nouvelle demande</Text>
              <Text style={styles.chatSubtitle}>Expliquez-nous votre problème</Text>
            </View>
          </View>

          <View style={styles.newTicketForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sujet</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Problème de paiement, Question sur une mission..."
                placeholderTextColor={theme.colors.textMuted}
                value={newSubject}
                onChangeText={setNewSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Décrivez votre situation..."
                placeholderTextColor={theme.colors.textMuted}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, sending && styles.buttonDisabled]}
              onPress={handleCreateTicket}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>ENVOYER MA DEMANDE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Chat view
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedThread(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatTitle} numberOfLines={1}>{selectedThread?.subject}</Text>
            <Text style={styles.chatSubtitle}>Ticket #{selectedThread?.id?.slice(-6)}</Text>
          </View>
          <View style={[
            styles.statusBadgeSmall,
            { backgroundColor: selectedThread?.status === 'closed' ? '#F3F4F6' : theme.colors.successLight }
          ]}>
            <Text style={[
              styles.statusTextSmall,
              { color: selectedThread?.status === 'closed' ? '#6B7280' : theme.colors.success }
            ]}>
              {selectedThread?.status === 'closed' ? 'Fermé' : 'Ouvert'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            renderItem={({ item }) => {
              const isAdmin = item.sender_role === 'admin' || item.is_admin;
              return (
                <View style={[styles.messageRow, isAdmin ? styles.messageRowLeft : styles.messageRowRight]}>
                  <View style={styles.messageMeta}>
                    <View style={[styles.messageAvatar, isAdmin ? styles.adminAvatar : styles.userAvatar]}>
                      <Text style={styles.messageAvatarText}>
                        {isAdmin ? 'A' : user?.first_name?.charAt(0) || 'M'}
                      </Text>
                    </View>
                    <Text style={styles.messageSender}>
                      {isAdmin ? 'Support MyShifters' : 'Moi'}
                    </Text>
                  </View>
                  <View style={[
                    styles.messageBubble,
                    isAdmin ? styles.adminBubble : styles.userBubble
                  ]}>
                    <Text style={[styles.messageText, isAdmin ? styles.adminText : styles.userText]}>
                      {item.body}
                    </Text>
                  </View>
                  <Text style={[styles.messageTime, isAdmin ? styles.timeLeft : styles.timeRight]}>
                    {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {/* Reply Input */}
        {selectedThread?.status !== 'closed' && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Écrivez votre réponse..."
              placeholderTextColor={theme.colors.textMuted}
              value={reply}
              onChangeText={setReply}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!reply.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendReply}
              disabled={!reply.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    ...theme.shadows.primary,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  threadCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  threadDate: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  threadSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  threadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  threadFooterText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chatSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContent: {
    padding: 20,
  },
  messageRow: {
    marginBottom: 20,
  },
  messageRowLeft: {
    alignItems: 'flex-start',
  },
  messageRowRight: {
    alignItems: 'flex-end',
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatar: {
    backgroundColor: theme.colors.primary,
  },
  userAvatar: {
    backgroundColor: theme.colors.primary,
  },
  messageAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageSender: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  adminBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  adminText: {
    color: theme.colors.textPrimary,
  },
  userText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  timeLeft: {
    textAlign: 'left',
  },
  timeRight: {
    textAlign: 'right',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    gap: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 14,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
  newTicketForm: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 14,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    ...theme.shadows.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
