import axios from 'axios';

const BASE_URL = '/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Заменяет credentials: "include"
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  console.group(`➡️ REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
  console.log('Params:', config.params);
  console.log('Body:', config.data);
  console.log('Headers:', config.headers);
  console.groupEnd();
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    console.group(`✅ RESPONSE: ${response.status} ${response.config.url}`);
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.groupEnd();
    return response;
  },
  (error) => {
    console.group(`❌ ERROR: ${error.response?.status} ${error.config?.url}`);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Error Message:', error.message);
    console.groupEnd();
    return Promise.reject(error);
  }
);

export const apiClient = {
  // P - тип параметров запроса (Query Params)
  get: <T, P extends object = object>(url: string, params?: P) =>
    axiosInstance.get<T>(url, { params }).then((res) => res.data),

  // D - тип тела запроса (Request Body)
  post: <T, D extends object = object>(url: string, body?: D) =>
    axiosInstance.post<T>(url, body).then((res) => res.data),

  put: <T, D extends object = object>(url: string, body?: D) =>
    axiosInstance.put<T>(url, body).then((res) => res.data),

  delete: <T>(url: string) =>
    axiosInstance.delete<T>(url).then((res) => res.data),

  // D - тип тела для обновления
  update: <T, D extends object = object>(url: string, body?: D) =>
    axiosInstance.put<T>(url, body).then((res) => res.data),
};
