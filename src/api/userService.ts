import api from './api';
import { User, UserResponse, UserRole } from '../types';

export interface UsersResponse {
  success: boolean;
  count: number;
  data: User[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  company?: string;
}

export type UpdateUserData = Partial<Omit<CreateUserData, 'password'>>;

class UserService {
  async getAllUsers(params?: { role?: UserRole; search?: string }): Promise<UsersResponse> {
    const response = await api.get<UsersResponse>('/users', { params });
    return response.data;
  }

  // Alias for getAllUsers
  async getUsers(params?: { role?: UserRole; search?: string }): Promise<UsersResponse> {
    return this.getAllUsers(params);
  }

  async getUser(id: string): Promise<UserResponse> {
    const response = await api.get<UserResponse>(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserData): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<UserResponse> {
    const response = await api.put<UserResponse>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/users/${id}`);
    return response.data;
  }

  async updateUserRole(id: string, role: UserRole): Promise<UserResponse> {
    const response = await api.put<UserResponse>(`/users/${id}/role`, { role });
    return response.data;
  }

  async getUserActivity(id: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get<{ success: boolean; data: any[] }>(`/users/${id}/activity`);
    return response.data;
  }
}

export const userService = new UserService();
export default userService;
