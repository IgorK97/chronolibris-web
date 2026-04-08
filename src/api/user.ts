import { apiClient } from './apiClient';
import type {
  UserProfile,
  LoginResult,
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  RegistrationResult,
} from '../types';

export const usersApi = {
  register: async (request: RegisterRequest) => {
    await apiClient.post<void, RegisterRequest>('/users/register', request);
  },
  login: async (userName: string, password: string) => {
    const res = await apiClient.post<LoginResult, LoginRequest>(
      '/users/login',
      {
        userName,
        password,
      }
    );
    return res;
  },
  logout: async () => {
    await apiClient.post('/users/logout');
  },

  getProfile: async () => {
    const profile = await apiClient.get<UserProfile>('/users/me');
    // localStorage.setItem("profile", JSON.stringify(profile));
    return profile;
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    return await apiClient.put<UserProfile, UpdateProfileRequest>(
      `/users`,
      data
    );
  },
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post<void>(`/users/password`, data);
  },
  registerStaff: async (data: {
    userName: string;
    lastName: string;
    firstName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: 'moderator' | 'admin';
  }) => {
    await apiClient.post<RegistrationResult, typeof data>('/users/staff', data);
  },
};
