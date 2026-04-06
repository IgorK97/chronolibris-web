// File: src/api/bookFiles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, axiosInstance } from './apiClient';
import type { BookFileDto } from '../types/types';

export interface UploadBookFileRequest {
  bookId: number;
  formatId: number;
  isReadable: boolean;
  file: File;
}

export interface UpdateBookFileRequest {
  bookId: number;
  formatId: number;
  isReadable: boolean;
  file: File;
}

export const bookFilesApi = {
  /**
   * Получает список всех файлов для книги
   */
  getBookFiles: (bookId: number): Promise<BookFileDto[]> =>
    apiClient.get<BookFileDto[]>(`/BookFiles/book/${bookId}`),

  /**
   * Получает файл по идентификатору
   */
  getBookFile: (id: number): Promise<BookFileDto> =>
    apiClient.get<BookFileDto>(`/BookFiles/${id}`),

  /**
   * Загружает новый файл для книги
   */
  uploadBookFile: async (data: UploadBookFileRequest): Promise<number> => {
    const formData = new FormData();
    formData.append('bookId', data.bookId.toString());
    formData.append('formatId', data.formatId.toString());
    formData.append('isReadable', data.isReadable.toString());
    formData.append('file', data.file);

    const response = await axiosInstance.post<number>('/BookFiles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Обновляет (перезаписывает) файл книги
   */
  updateBookFile: async (data: UpdateBookFileRequest): Promise<number> => {
    const formData = new FormData();
    formData.append('isReadable', data.isReadable.toString());
    formData.append('file', data.file);

    const response = await axiosInstance.put<number>(
      `/BookFiles/book/${data.bookId}/format/${data.formatId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Удаляет файл книги
   */
  deleteBookFile: (id: number): Promise<void> =>
    apiClient.delete(`/BookFiles/${id}`),

  /**
   * Скачивает файл книги
   */

  download: (bookFileId: number) =>
    apiClient.download(`/bookFiles/${bookFileId}/download`),
};

export const useBookFiles = (bookId: number | null) => {
  return useQuery({
    queryKey: ['bookFiles', bookId],
    queryFn: () => {
      if (bookId === null) throw new Error('ID книги не указан');
      return bookFilesApi.getBookFiles(bookId);
    },
    enabled: bookId !== null,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBookFile = (id: number | null) => {
  return useQuery({
    queryKey: ['bookFile', id],
    queryFn: () => {
      if (id === null) throw new Error('ID файла не указан');
      return bookFilesApi.getBookFile(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUploadBookFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookFilesApi.uploadBookFile,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookFiles', variables.bookId],
      });
    },
  });
};

export const useUpdateBookFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookFilesApi.updateBookFile,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookFiles', variables.bookId],
      });
    },
  });
};

export const useDeleteBookFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookFilesApi.deleteBookFile,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (data, variables) => {
      // variables - это id файла, но нам нужен bookId для инвалидации
      queryClient.invalidateQueries({ queryKey: ['bookFiles'] });
    },
  });
};

export const useDownloadBookFile = () => {
  return useMutation({
    mutationFn: bookFilesApi.downloadBookFile,
  });
};
