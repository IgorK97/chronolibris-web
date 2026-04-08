export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  userName: string;
  phoneNumber: string;
  role: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email?: string;
  userName: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userName: string;
  phoneNumber: string;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}

// export interface RegistrationResult {
//   success: boolean;
//   token: string;
//   refreshToken: string;
//   message?: string;
// }
