// import Cookies from "js-cookie";
import { apiClient } from './apiClient';
import type {
  UserProfile,
  LoginResult,
  RegisterRequest,
  // RegistrationResult,
  LoginRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/types';

export const usersApi = {
  register: async (request: RegisterRequest) => {
    await apiClient.post<void, RegisterRequest>('/users/register', request);
  },
  login: async (email: string, password: string) => {
    const res = await apiClient.post<LoginResult, LoginRequest>(
      '/users/login',
      {
        email,
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
    // localStorage.setItem("profile", JSON.stringify(profile)); // Профиль можно в localStorage
    return profile;
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    return await apiClient.update<UserProfile, UpdateProfileRequest>(
      `/users/${data.userId}`,
      data
    );
  },
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post<void>(`/users/password`, data);
  },
};
