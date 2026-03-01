import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

// Helper to handle storage cross-platform
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  verification_status?: string;
  avatar_url?: string;
  skills?: string[];
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { token, user } = response.data;
    
    if (user.role !== 'worker') {
      throw new Error('Cette application est réservée aux workers');
    }
    
    await storage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (data: any) => {
    const response = await authAPI.register({ ...data, role: 'worker' });
    const { token, user } = response.data;
    await storage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await storage.deleteItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await storage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      
      const response = await authAPI.getMe();
      const user = response.data;
      
      if (user.role !== 'worker') {
        await storage.deleteItem('token');
        set({ isLoading: false });
        return;
      }
      
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      await storage.deleteItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...data } });
    }
  },
}));
