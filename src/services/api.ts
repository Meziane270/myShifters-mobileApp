import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://myshifterswebapp.onrender.com/api';

// Helper to handle storage cross-platform
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem('token');
  }
  return SecureStore.getItemAsync('token');
};

const deleteToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return AsyncStorage.removeItem('token');
  }
  return SecureStore.deleteItemAsync('token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      deleteToken();
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', { ...data, role: 'worker' }),
  registerWorker: (formData: FormData) =>
    api.post('/auth/register/worker', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMe: () => api.get('/auth/me'),
};

// Worker API
export const workerAPI = {
  getProfile: () => api.get('/worker/profile'),
  updateProfile: (data: any) => api.put('/worker/profile', data),
  getExperiences: () => api.get('/worker/experiences'),
  addExperience: (data: any) => api.post('/worker/experiences', data),
  deleteExperience: (id: string) => api.delete(`/worker/experiences/${id}`),
  getDocuments: () => api.get('/worker/documents'),
  uploadDocument: (formData: FormData) =>
    api.post('/worker/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteDocument: (id: string) => api.delete(`/worker/documents/${id}`),
  getPayoutAccount: () => api.get('/worker/payout-account'),
  updatePayoutAccount: (data: any) => api.post('/worker/payout-account', data),
  getBusiness: () => api.get('/worker/business'),
  updateBusiness: (data: any) => api.put('/worker/ae-billing', data),
  getEarnings: () => api.get('/worker/earnings'),
  getInvoices: () => api.get('/worker/invoices'),
  uploadInvoice: (formData: FormData) =>
    api.post('/worker/invoices', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Shifts API
export const shiftsAPI = {
  getAvailableShifts: (serviceType?: string) =>
    api.get('/shifts', { params: serviceType ? { service_type: serviceType } : {} }),
  applyToShift: (shiftId: string, message?: string) =>
    api.post('/applications', { shift_id: shiftId, message }),
  getMyApplications: () => api.get('/applications/worker'),
};

// Stats API
export const statsAPI = {
  getWorkerStats: () => api.get('/stats/worker'),
};

// Support API
export const supportAPI = {
  getThreads: () => api.get('/worker/support/threads'),
  createThread: (subject: string, message: string) =>
    api.post('/worker/support/threads', { subject, message }),
  getThreadMessages: (threadId: string) =>
    api.get(`/worker/support/threads/${threadId}`),
  sendMessage: (threadId: string, body: string) =>
    api.post(`/worker/support/threads/${threadId}/messages`, { body }),
};
