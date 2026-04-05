export type UserRole = 'user' | 'technician' | 'admin' | 'superadmin';

export interface User {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  role: UserRole;
  phone?: string;
  company?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  loginCount?: number;
  lastLoginAt?: string;
  technicianNumber?: number;
  specialization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  middleName?: string;
  name?: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  profilePicture?: string;
  specialization?: string;
}

export interface AuthResponse {
  success: boolean;
  data: User & { token: string };
}

export interface UserResponse {
  success: boolean;
  data: User;
}
