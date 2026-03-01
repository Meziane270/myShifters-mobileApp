import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateString;
  }
};

export const formatTime = (time: string): string => {
  return time || '--:--';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const getStatusColor = (status: string): { bg: string; text: string } => {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    accepted: { bg: '#D1FAE5', text: '#059669' },
    rejected: { bg: '#FEE2E2', text: '#DC2626' },
    completed: { bg: '#DBEAFE', text: '#2563EB' },
    open: { bg: '#E0E7FF', text: '#4F46E5' },
    filled: { bg: '#D1FAE5', text: '#059669' },
    cancelled: { bg: '#F3F4F6', text: '#6B7280' },
    verified: { bg: '#D1FAE5', text: '#059669' },
  };
  return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    completed: 'Terminée',
    open: 'Ouvert',
    filled: 'Pourvu',
    cancelled: 'Annulé',
    verified: 'Vérifié',
  };
  return labels[status] || status;
};

export const getServiceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    reception: 'Réception',
    housekeeping: 'Housekeeping',
    restaurant: 'Restauration',
    maintenance: 'Maintenance',
  };
  return labels[type] || type;
};

export const getServiceTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    reception: 'business',
    housekeeping: 'bed',
    restaurant: 'restaurant',
    maintenance: 'build',
  };
  return icons[type] || 'briefcase';
};
