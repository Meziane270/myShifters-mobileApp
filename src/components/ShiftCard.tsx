import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, getServiceLabel, getServiceIcon } from '../theme';
import { formatDate, formatCurrency } from '../utils/helpers';

interface Shift {
  id: string;
  title: string;
  hotel_name: string;
  hotel_city?: string;
  service_type: string;
  dates: string[];
  start_time: string;
  end_time: string;
  hourly_rate: number;
  positions_available: number;
  status: string;
  description?: string;
}

interface ShiftCardProps {
  shift: Shift;
  onPress: () => void;
  applied?: boolean;
}

export default function ShiftCard({ shift, onPress, applied = false }: ShiftCardProps) {
  const iconName = getServiceIcon(shift.service_type) as any;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{shift.title}</Text>
          <Text style={styles.hotel}>{shift.hotel_name}</Text>
        </View>
        {applied && (
          <View style={styles.appliedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <Text style={styles.appliedText}>Postulé</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={15} color={theme.colors.textMuted} />
          <Text style={styles.detailText}>
            {shift.dates && shift.dates.length > 0 ? formatDate(shift.dates[0]) : 'Date à confirmer'}
            {shift.dates && shift.dates.length > 1 && ` (+${shift.dates.length - 1})`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={15} color={theme.colors.textMuted} />
          <Text style={styles.detailText}>{shift.start_time} - {shift.end_time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={15} color={theme.colors.textMuted} />
          <Text style={styles.detailText}>{shift.hotel_city || 'Localisation non précisée'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.serviceType}>
          <Text style={styles.serviceTypeText}>{getServiceLabel(shift.service_type)}</Text>
        </View>
        <Text style={styles.rate}>{formatCurrency(shift.hourly_rate)}/h</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 3,
  },
  hotel: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  appliedText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '700',
  },
  details: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  serviceType: {
    backgroundColor: theme.colors.primaryBgLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  serviceTypeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rate: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
