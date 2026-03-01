import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface StatusBadgeProps {
  status: string;
  small?: boolean;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: theme.colors.warningLight, text: theme.colors.warning, label: 'En attente' },
    accepted: { bg: theme.colors.successLight, text: theme.colors.success, label: 'Acceptée' },
    rejected: { bg: theme.colors.errorLight, text: theme.colors.error, label: 'Refusée' },
    completed: { bg: theme.colors.infoLight, text: theme.colors.info, label: 'Terminée' },
    open: { bg: theme.colors.primaryBg, text: theme.colors.primary, label: 'Ouvert' },
    filled: { bg: theme.colors.successLight, text: theme.colors.success, label: 'Pourvu' },
    cancelled: { bg: '#F3F4F6', text: '#6B7280', label: 'Annulé' },
    verified: { bg: theme.colors.successLight, text: theme.colors.success, label: 'Vérifié' },
    closed: { bg: '#F3F4F6', text: '#6B7280', label: 'Fermé' },
  };
  return configs[status] || { bg: '#F3F4F6', text: '#6B7280', label: status };
};

export default function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }, small && styles.smallText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 9,
  },
});
