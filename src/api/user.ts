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
    // localStorage.setItem("profile", JSON.stringify(profile)); // Профиль можно в localStorage
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

interface RegistrationResult {
  /// <summary>
  /// Флаг, указывающий, была ли регистрация учетной записи успешной.
  /// </summary>
  success: boolean;

  /// <summary>
  /// Токен доступа (например, JWT), который может быть возвращен сразу после успешной регистрации
  /// (<see cref="Success"/> = <c>true</c>) для автоматического входа пользователя.
  /// </summary>
  token: string;
  refresh_token: string;

  /// <summary>
  /// Список сообщений об ошибках, возникших в процессе регистрации
  /// (например, "Пользователь с таким Email уже существует" или "Пароль слишком слабый").
  /// Если регистрация успешна, это свойство будет <c>null</c> или пустым.
  /// </summary>
  //public IEnumerable<string>? Errors { get; set; }
  message: string;
  userId: number;
}
