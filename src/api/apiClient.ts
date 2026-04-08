import axios from 'axios';

const BASE_URL = '/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Заменяет credentials: "include"
  headers: {
    'Content-Type': 'application/json',
  },
});

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

  download: (url: string) => {
    return axiosInstance
      .get<Blob>(url, { responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
      }));
  },
};
