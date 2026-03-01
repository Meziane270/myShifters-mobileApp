// MyShifters App Theme - Violet theme matching web dashboard
export const theme = {
  colors: {
    // Primary violet palette
    primary: '#7C3AED',      // violet-600
    primaryLight: '#8B5CF6', // violet-500
    primaryDark: '#6D28D9',  // violet-700
    primaryBg: '#EDE9FE',    // violet-100
    primaryBgLight: '#F5F3FF', // violet-50
    
    // UI colors
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceBorder: '#F1F5F9',
    
    // Text colors
    textPrimary: '#0F172A',   // slate-900
    textSecondary: '#64748B', // slate-500
    textMuted: '#94A3B8',     // slate-400
    textLight: '#CBD5E1',     // slate-300
    
    // Accent colors
    success: '#10B981',   // emerald-500
    successLight: '#D1FAE5',
    warning: '#F59E0B',   // amber-500
    warningLight: '#FEF3C7',
    error: '#EF4444',     // red-500
    errorLight: '#FEE2E2',
    info: '#3B82F6',      // blue-500
    infoLight: '#DBEAFE',
    
    // Sidebar colors (for drawer)
    sidebarBg: '#4C1D95',     // violet-950 to violet-900 gradient
    sidebarText: '#FFFFFF',
    sidebarTextMuted: 'rgba(255,255,255,0.6)',
  },
  
  // Border radius values
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  // Shadow configurations
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    primary: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Typography
  typography: {
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
  },
};

// Service types for the app (4 services only)
export const SERVICE_TYPES = [
  { id: 'reception', label: 'Réception', icon: 'business' },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'bed' },
  { id: 'restaurant', label: 'Restauration & Salle', icon: 'restaurant' },
  { id: 'maintenance', label: 'Maintenance Technique', icon: 'build' },
];

export const getServiceLabel = (type: string): string => {
  const service = SERVICE_TYPES.find(s => s.id === type);
  return service?.label || type;
};

export const getServiceIcon = (type: string): string => {
  const service = SERVICE_TYPES.find(s => s.id === type);
  return service?.icon || 'briefcase';
};
