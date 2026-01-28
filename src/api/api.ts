import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

// Event emitter for auth events (to be subscribed by navigation)
type AuthEventCallback = () => void;
let onUnauthorizedCallback: AuthEventCallback | null = null;

export const setOnUnauthorized = (callback: AuthEventCallback) => {
  onUnauthorizedCallback = callback;
};

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getString(STORAGE_KEYS.TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      try {
        await storage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        // Trigger navigation to login screen
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      } catch (storageError) {
        console.error('Error clearing storage on 401:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
