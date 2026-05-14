import axios from 'axios';

const BASE_URL = '/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 50000,
});

export const apiClient = {
  //тип результата и запроса, для запроса по умолчанию тип объект
  get: <T, P = object>(url: string, params?: P) =>
    axiosInstance.get<T>(url, { params: params }).then((res) => res.data),

  post: <T, D = object>(url: string, body?: D) =>
    axiosInstance.post<T>(url, body).then((res) => res.data),

  put: <T, D = object>(url: string, body?: D) =>
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
