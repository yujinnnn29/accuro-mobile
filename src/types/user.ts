export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  company?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  loginCount?: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  data: User & { token: string };
}

export interface UserResponse {
  success: boolean;
  data: User;
}
