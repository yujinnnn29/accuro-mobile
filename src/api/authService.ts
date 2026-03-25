import api from './api';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import {
  User,
  LoginData,
  RegisterData,
  AuthResponse,
  UserResponse,
} from '../types';

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data, { adapter: 'xhr', timeout: 45000 });
    if (response.data.success && response.data.data?.token) {
      await storage.setString(STORAGE_KEYS.TOKEN, response.data.data.token);
      await storage.set(STORAGE_KEYS.USER, response.data.data);
    }
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data, { timeout: 180000 });
    if (response.data.success && response.data.data.token) {
      await storage.setString(STORAGE_KEYS.TOKEN, response.data.data.token);
      await storage.set(STORAGE_KEYS.USER, response.data.data);
    }
    return response.data;
  }

  async getMe(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  }

  async updateDetails(data: Partial<RegisterData>): Promise<UserResponse> {
    const response = await api.put<UserResponse>('/auth/updatedetails', data);
    if (response.data.success) {
      const currentUser = await storage.get<User>(STORAGE_KEYS.USER);
      if (currentUser) {
        await storage.set(STORAGE_KEYS.USER, { ...currentUser, ...response.data.data });
      }
    }
    return response.data;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const response = await api.put<AuthResponse>('/auth/updatepassword', {
      currentPassword,
      newPassword,
    });
    if (response.data.success && response.data.data.token) {
      await storage.setString(STORAGE_KEYS.TOKEN, response.data.data.token);
    }
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/forgotpassword', {
      email,
    });
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const response = await api.put<AuthResponse>(`/auth/resetpassword/${token}`, {
      password,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await storage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
  }

  async getCurrentUser(): Promise<User | null> {
    return storage.get<User>(STORAGE_KEYS.USER);
  }

  async getToken(): Promise<string | null> {
    return storage.getString(STORAGE_KEYS.TOKEN);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null && (user.role === 'admin' || user.role === 'superadmin');
  }

  // Silently ping the backend to wake it up (Render.com free tier cold start)
  async warmup(): Promise<void> {
    try {
      await api.get('/auth/me', { timeout: 30000 });
    } catch {
      // Ignore all errors — this is just to warm up the server
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.get<{ success: boolean; message: string }>(`/auth/verify-email/${token}`);
    return response.data;
  }

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/resend-verification', { email });
    return response.data;
  }
}

export const authService = new AuthService();
export default authService;
